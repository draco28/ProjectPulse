Production Deployment Plan: ProjectPulse on Mac Mini with Cloudflare Tunnel

 Status: Planning
 Created: 2025-11-27
 Target: Deploy production alongside existing dev environment

 ---
 Executive Summary

 Deploy ProjectPulse to production on Mac Mini (192.168.1.15) using:
 - Port-isolated Docker stacks (prod on 8080/8081, dev stays on 3000/3001)
 - Cloudflare Tunnel for secure internet exposure (no port forwarding)
 - App-level authentication only (no Cloudflare Access - simpler for SaaS)
 - Fresh production database (separate from dev)
 - Redis for persistent session storage

 Key Decision: Cloudflare Tunnel provides transport only. All authentication handled by
  your app:
 - Web UI: Your signup/login system
 - MCP API: Project-specific session tokens (existing architecture)

 Timeline: 2-3 days for initial deployment, ongoing refinement

 ---
 Architecture Overview

 ┌─────────────────────────────────────────────────────────────────────────┐
 │                        INTERNET (Cloudflare Edge)                        │
 │                                                                         │
 │   Users ──→ Cloudflare Tunnel (transport only) ──→ Your App Auth       │
 │                                                                         │
 │   *.trycloudflare.com (temporary) or custom domain (future)            │
 │   No Cloudflare Access - simpler single login via app                   │
 └─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                        Mac Mini (192.168.1.15)                          │
 ├─────────────────────────────────────────────────────────────────────────┤
 │                                                                         │
 │  ┌────────────────────────────┐    ┌────────────────────────────┐      │
 │  │  PRODUCTION STACK          │    │  DEV STACK (unchanged)     │      │
 │  │  docker-compose.prod-      │    │  docker-compose.cloud.yml  │      │
 │  │  local.yml                 │    │                            │      │
 │  │                            │    │                            │      │
 │  │  prod-nextjs    :8080 ◄────┼────┼──── Tunnel (web)           │      │
 │  │  prod-mcp       :8081 ◄────┼────┼──── Tunnel (api)           │      │
 │  │  prod-postgres  :5433      │    │  nextjs     :3000          │      │
 │  │  prod-redis     :6380      │    │  mcp        :3001          │      │
 │  │  cloudflared    (outbound) │    │  postgres   :5432          │      │
 │  │                            │    │                            │      │
 │  │  Network: pp-prod          │    │  Network: pp-cloud         │      │
 │  │  DB: projectpulse_prod     │    │  DB: projectpulse_dev      │      │
 │  └────────────────────────────┘    └────────────────────────────┘      │
 │                                                                         │
 └─────────────────────────────────────────────────────────────────────────┘

 ---
 Phase 1: Infrastructure Setup (Day 1)

 1.1 Create Production Docker Compose

 File: docker-compose.prod-local.yml

 # Production stack for Mac Mini (runs alongside dev)
 version: "3.8"

 services:
   prod-postgres:
     image: pgvector/pgvector:pg15
     container_name: projectpulse-prod-postgres
     environment:
       POSTGRES_USER: ${PROD_POSTGRES_USER:-projectpulse}
       POSTGRES_PASSWORD: ${PROD_POSTGRES_PASSWORD:?required}
       POSTGRES_DB: ${PROD_POSTGRES_DB:-projectpulse_prod}
     volumes:
       - prod_postgres_data:/var/lib/postgresql/data
       - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql:ro
     ports:
       - "5433:5432"  # Different host port
     networks:
       - pp-prod
     healthcheck:
       test: ["CMD-SHELL", "pg_isready -U ${PROD_POSTGRES_USER:-projectpulse}"]
       interval: 10s
       timeout: 5s
       retries: 5
     restart: unless-stopped

   prod-redis:
     image: redis:7-alpine
     container_name: projectpulse-prod-redis
     command: redis-server --requirepass ${PROD_REDIS_PASSWORD:?required}
     volumes:
       - prod_redis_data:/data
     ports:
       - "6380:6379"  # Different host port
     networks:
       - pp-prod
     healthcheck:
       test: ["CMD", "redis-cli", "-a", "${PROD_REDIS_PASSWORD}", "ping"]
       interval: 10s
       timeout: 5s
       retries: 5
     restart: unless-stopped

   prod-nextjs:
     build:
       context: .
       dockerfile: apps/web/Dockerfile.production
     image: projectpulse/web:latest
     container_name: projectpulse-prod-web
     environment:
       NODE_ENV: production
       DATABASE_URL: postgresql://${PROD_POSTGRES_USER:-projectpulse}:${PROD_POSTGRES_P
 ASSWORD}@prod-postgres:5432/${PROD_POSTGRES_DB:-projectpulse_prod}
       REDIS_URL: redis://:${PROD_REDIS_PASSWORD}@prod-redis:6379
       NEXT_PUBLIC_API_URL: ${PROD_PUBLIC_URL:-http://localhost:8080}
       DEFAULT_PROJECT_ID: 1
     ports:
       - "8080:3000"  # Different host port
     networks:
       - pp-prod
     depends_on:
       prod-postgres:
         condition: service_healthy
       prod-redis:
         condition: service_healthy
     healthcheck:
       test: ["CMD", "node", "-e", "fetch('http://localhost:3000/api/health').then(r =>
  process.exit(r.ok ? 0 : 1))"]
       interval: 30s
       timeout: 10s
       retries: 3
     restart: unless-stopped
     deploy:
       resources:
         limits:
           cpus: "2"
           memory: 2G

   prod-mcp:
     build:
       context: .
       dockerfile: apps/mcp-server/Dockerfile.production
     image: projectpulse/mcp-server:latest
     container_name: projectpulse-prod-mcp
     environment:
       NODE_ENV: production
       PROJECTPULSE_API_URL: http://prod-nextjs:3000
       MCP_PORT: 3001
       REDIS_URL: redis://:${PROD_REDIS_PASSWORD}@prod-redis:6379
     ports:
       - "8081:3001"  # Different host port
     networks:
       - pp-prod
     depends_on:
       prod-nextjs:
         condition: service_healthy
     healthcheck:
       test: ["CMD", "node", "-e", "fetch('http://localhost:3001/health').then(r => 
 process.exit(r.ok ? 0 : 1))"]
       interval: 30s
       timeout: 10s
       retries: 3
     restart: unless-stopped
     deploy:
       resources:
         limits:
           cpus: "1"
           memory: 512M

   cloudflared:
     image: cloudflare/cloudflared:latest
     container_name: projectpulse-cloudflared
     command: tunnel --no-autoupdate run
     environment:
       TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN:?required}
     networks:
       - pp-prod
     depends_on:
       - prod-nextjs
       - prod-mcp
     restart: unless-stopped

 networks:
   pp-prod:
     name: projectpulse-prod
     driver: bridge

 volumes:
   prod_postgres_data:
     name: projectpulse_prod_postgres_data
   prod_redis_data:
     name: projectpulse_prod_redis_data

 1.2 Create Production Environment File

 File: .env.prod-local

 # Production Environment (Mac Mini Local)
 # Copy to .env.prod-local and fill in values

 # Database (use strong passwords!)
 PROD_POSTGRES_USER=projectpulse
 PROD_POSTGRES_PASSWORD=<generate-strong-password>
 PROD_POSTGRES_DB=projectpulse_prod

 # Redis (use strong password!)
 PROD_REDIS_PASSWORD=<generate-strong-password>

 # Public URL (will be Cloudflare tunnel URL)
 PROD_PUBLIC_URL=https://<your-tunnel>.trycloudflare.com

 # Cloudflare Tunnel Token (from Cloudflare dashboard)
 CLOUDFLARE_TUNNEL_TOKEN=<your-tunnel-token>

 ---
 Phase 2: Cloudflare Tunnel Setup (Day 1-2)

 2.1 Create Cloudflare Tunnel

 Prerequisites: Cloudflare account (free tier works)

 Steps:
 1. Login to Cloudflare Dashboard → Zero Trust → Access → Tunnels
 2. Create new tunnel named projectpulse-prod
 3. Copy the tunnel token
 4. Configure public hostnames:

 | Public Hostname                | Service                 | Path |
 |--------------------------------|-------------------------|------|
 | <tunnel>.trycloudflare.com     | http://prod-nextjs:3000 | /    |
 | api-<tunnel>.trycloudflare.com | http://prod-mcp:3001    | /    |

 2.2 Auth Strategy (App-Level Only)

 Decision: Skip Cloudflare Access for SaaS MVP

 Why:
 - Cloudflare Access would require users to login TWICE (Cloudflare + App)
 - Your app already has user authentication (signup/login)
 - MCP has project-specific session tokens
 - Adding Cloudflare Access complicates the UX unnecessarily

 What Cloudflare Tunnel provides (without Access):
 - Secure transport (HTTPS automatically)
 - DDoS protection at edge
 - No port forwarding needed
 - Clean URLs (no IP:port)

 Future: Can add Cloudflare Access later for admin routes or rate limiting

 2.3 Tunnel Configuration (Alternative: Config File)

 File: cloudflare/config.yml (if not using dashboard)

 tunnel: projectpulse-prod
 credentials-file: /etc/cloudflared/credentials.json

 ingress:
   - hostname: <tunnel>.trycloudflare.com
     service: http://prod-nextjs:3000
     originRequest:
       noTLSVerify: true
   - hostname: api-<tunnel>.trycloudflare.com
     service: http://prod-mcp:3001
     originRequest:
       noTLSVerify: true
   - service: http_status:404

 ---
 Phase 3: Database Setup (Day 2)

 3.1 Initialize Production Database

 # Start only postgres first
 docker compose -f docker-compose.prod-local.yml up -d prod-postgres

 # Wait for healthy
 docker compose -f docker-compose.prod-local.yml ps

 # Run Prisma migrations against prod DB
 DATABASE_URL="postgresql://projectpulse:<password>@192.168.1.15:5433/projectpulse_prod
 " \
   npx prisma migrate deploy

 # Seed initial data (optional)
 DATABASE_URL="postgresql://projectpulse:<password>@192.168.1.15:5433/projectpulse_prod
 " \
   npx prisma db seed

 3.2 Database Separation Strategy

 | Environment | Host Port | Database Name     | Purpose            |
 |-------------|-----------|-------------------|--------------------|
 | Development | 5432      | projectpulse_dev  | Active development |
 | Production  | 5433      | projectpulse_prod | Live users         |

 ---
 Phase 4: Build & Deploy (Day 2)

 4.1 Build Production Images

 # Build Next.js production image
 docker build -f apps/web/Dockerfile.production -t projectpulse/web:latest .

 # Build MCP Server production image
 docker build -f apps/mcp-server/Dockerfile.production -t
 projectpulse/mcp-server:latest .

 # Verify image sizes
 docker images | grep projectpulse
 # Expected: web ~300MB, mcp ~200MB

 4.2 Start Production Stack

 # Load environment
 export $(cat .env.prod-local | xargs)

 # Start all services
 docker compose -f docker-compose.prod-local.yml up -d

 # Check status
 docker compose -f docker-compose.prod-local.yml ps

 # View logs
 docker compose -f docker-compose.prod-local.yml logs -f

 4.3 Verify Deployment

 # Local health checks
 curl http://192.168.1.15:8080/api/health
 curl http://192.168.1.15:8081/health

 # Cloudflare tunnel (after setup)
 curl https://<tunnel>.trycloudflare.com/api/health
 curl https://api-<tunnel>.trycloudflare.com/health

 ---
 Phase 5: Deployment Script (Day 2-3)

 5.1 Create Deployment Script

 File: scripts/prod-local-deploy.sh

 #!/bin/bash
 set -e

 echo "🚀 ProjectPulse Production Deployment (Mac Mini)"
 echo "================================================"

 # Check environment file
 if [ ! -f .env.prod-local ]; then
   echo "❌ Error: .env.prod-local not found"
   exit 1
 fi

 # Load environment
 export $(cat .env.prod-local | grep -v '^#' | xargs)

 # Validate required vars
 if [ -z "$PROD_POSTGRES_PASSWORD" ] || [ -z "$PROD_REDIS_PASSWORD" ] || [ -z
 "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
   echo "❌ Error: Missing required environment variables"
   exit 1
 fi

 echo "📦 Building production images..."
 docker build -f apps/web/Dockerfile.production -t projectpulse/web:latest .
 docker build -f apps/mcp-server/Dockerfile.production -t
 projectpulse/mcp-server:latest .

 echo "🗄️ Starting database services...
 docker compose -f docker-compose.prod-local.yml up -d prod-postgres prod-redis

 echo "⏳ Waiting for database health..."
 sleep 10

 echo "📊 Running database migrations..."
 DATABASE_URL="postgresql://${PROD_POSTGRES_USER}:${PROD_POSTGRES_PASSWORD}@192.168.1.1
 5:5433/${PROD_POSTGRES_DB}" \
   npx prisma migrate deploy

 echo "🌐 Starting application services..."
 docker compose -f docker-compose.prod-local.yml up -d

 echo "⏳ Waiting for services to be healthy..."
 sleep 15

 echo "✅ Verifying deployment..."
 curl -sf http://192.168.1.15:8080/api/health || echo "❌ Web health check failed"
 curl -sf http://192.168.1.15:8081/health || echo "❌ MCP health check failed"

 echo ""
 echo "🎉 Production deployment complete!"
 echo "   Web: http://192.168.1.15:8080"
 echo "   MCP: http://192.168.1.15:8081"
 echo "   Tunnel: Check Cloudflare dashboard for URL"

 ---
 Files to Create/Modify

 | File                          | Action | Purpose                         |
 |-------------------------------|--------|---------------------------------|
 | docker-compose.prod-local.yml | CREATE | Production stack for Mac Mini   |
 | .env.prod-local.example       | CREATE | Environment template            |
 | .env.prod-local               | CREATE | Actual credentials (gitignored) |
 | scripts/prod-local-deploy.sh  | CREATE | Deployment automation           |
 | .gitignore                    | MODIFY | Add .env.prod-local             |
 | DEPLOYMENT.md                 | MODIFY | Add Mac Mini production section |

 ---
 Parallel Operations Summary

 Can run simultaneously:
 - ✅ Dev stack (docker-compose.cloud.yml) on ports 3000/3001/5432
 - ✅ Prod stack (docker-compose.prod-local.yml) on ports 8080/8081/5433/6380

 Management commands:
 # Dev environment
 docker compose -f docker-compose.cloud.yml up -d
 docker compose -f docker-compose.cloud.yml logs -f

 # Prod environment
 docker compose -f docker-compose.prod-local.yml up -d
 docker compose -f docker-compose.prod-local.yml logs -f

 # Both running - check all
 docker ps

 ---
 Security Considerations

 Immediate (Phase 1-2)

 - Separate databases (dev/prod isolation)
 - Strong passwords (generated, not default)
 - Cloudflare Tunnel (HTTPS, DDoS protection)
 - App-level authentication (web + MCP)
 - Redis password required

 Authentication Architecture

 Web UI Flow:
   User → Cloudflare Tunnel → Next.js → App Login → Dashboard

 MCP API Flow:
   AI Agent → Cloudflare Tunnel → MCP Server → Session Validation → Tools

 Future Enhancements

 - Rate limiting at Cloudflare edge (WAF rules)
 - Cloudflare Access for admin routes only
 - Database backups (automated)
 - Monitoring/alerting (Prometheus/Grafana)
 - Log aggregation
 - Custom domain with SSL

 ---
 Rollback Procedure

 # Stop production stack
 docker compose -f docker-compose.prod-local.yml down

 # Remove production data (DANGER - only if needed)
 docker volume rm projectpulse_prod_postgres_data projectpulse_prod_redis_data

 # Dev continues unaffected
 docker compose -f docker-compose.cloud.yml ps

 ---
 Success Criteria

 - Production stack runs on ports 8080/8081/5433/6380
 - Dev stack continues on ports 3000/3001/5432
 - Cloudflare tunnel accessible from internet
 - App authentication working (signup/login)
 - MCP session validation working via tunnel
 - Health checks passing on both environments
 - No port conflicts between stacks
 - Fresh production database initialized

 ---
 Ongoing Deployment Workflow

 Deploying Code Changes (No Schema Changes)

 # 1. Pull latest code
 git pull origin master

 # 2. Rebuild and restart
 docker build -f apps/web/Dockerfile.production -t projectpulse/web:latest .
 docker build -f apps/mcp-server/Dockerfile.production -t
 projectpulse/mcp-server:latest .
 docker compose -f docker-compose.prod-local.yml up -d

 # Downtime: ~30-60 seconds
 # Data loss: NONE

 Deploying Schema Changes (New tables/columns)

 # 1. Pull latest code (includes new migrations)
 git pull origin master

 # 2. Apply migrations to prod database
 DATABASE_URL="postgresql://projectpulse:<pwd>@192.168.1.15:5433/projectpulse_prod" \
   npx prisma migrate deploy

 # 3. Rebuild and restart
 docker build -f apps/web/Dockerfile.production -t projectpulse/web:latest .
 docker compose -f docker-compose.prod-local.yml up -d

 # Downtime: ~30-60 seconds
 # Data loss: NONE (migrations are additive)

 Data Persistence Guarantee

 | Component            | Persists Across Rebuilds? | How to Delete (DON'T)
    |
 |----------------------|---------------------------|----------------------------------
 ---|
 | Database tables/rows | ✅ Yes (volume)            | docker volume rm 
 prod_postgres_data |
 | Redis sessions       | ✅ Yes (volume)            | docker volume rm prod_redis_data
     |
 | Application code     | ❌ No (rebuilt)            | Automatic on rebuild
     |

 Key Point: docker compose down does NOT delete volumes. Only docker volume rm does.

 ---
 Quick Reference

 Start Production:
 docker compose -f docker-compose.prod-local.yml up -d

 Start Development (unchanged):
 docker compose -f docker-compose.cloud.yml up -d

 Check Both Running:
 docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"

 Production URLs:
 - Local: http://192.168.1.15:8080 (web), ht
 - Tunnel: https://.trycloudflare.com (configured in Cloudflare)

 Development URLs (unchanged):
 - http://192.168.1.15
 - http://192.168.1.15