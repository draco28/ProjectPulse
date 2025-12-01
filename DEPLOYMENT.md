# ProjectPulse Production Deployment Guide

**Version:** 2.0.0
**Last Updated:** 2025-11-29

This guide covers deploying ProjectPulse to production using Docker (Mac Mini) and Kubernetes.

---

## Deployment Options

| Option | Best For | Complexity |
|--------|----------|------------|
| **Mac Mini + Cloudflare Tunnel** | Solo/small team, low cost | Low |
| **Kubernetes** | Enterprise, high availability | High |

---

## Mac Mini Production (Recommended for SaaS MVP)

### Overview

Deploy to Mac Mini with:
- **Cloudflare Tunnel** for secure HTTPS (no port forwarding)
- **Separate port stacks** (prod: 8080/8081, dev: 3000/3001)
- **Redis** for persistent sessions
- **Zero infrastructure cost** (except domain if needed)

### Quick Start

```bash
# 1. Create environment file
cp .env.prod-local.example .env.prod-local
# Edit with strong passwords (openssl rand -base64 32)

# 2. Deploy
./scripts/prod-local-deploy.sh

# 3. Access
# Local: http://192.168.1.15:8080
# Internet: https://<your-tunnel>.trycloudflare.com
```

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        INTERNET (Cloudflare Edge)                        │
│   Users → Cloudflare Tunnel (HTTPS) → App Authentication                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Mac Mini (192.168.1.15)                           │
├────────────────────────────────┬────────────────────────────────────────┤
│  PRODUCTION STACK              │  DEV STACK (unchanged)                 │
│  docker-compose.prod-local.yml │  docker-compose.cloud.yml              │
│                                │                                        │
│  prod-nextjs    :8080          │  nextjs     :3000                      │
│  prod-mcp       :8081          │  mcp        :3001                      │
│  prod-postgres  :5433          │  postgres   :5432                      │
│  prod-redis     :6380          │                                        │
│  cloudflared    (tunnel)       │                                        │
│                                │                                        │
│  Network: pp-prod              │  Network: pp-cloud                     │
│  DB: projectpulse_prod         │  DB: projectpulse_dev                  │
└────────────────────────────────┴────────────────────────────────────────┘
```

### Setup Cloudflare Tunnel

1. Go to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com)
2. Access → Tunnels → Create a tunnel
3. Name: `projectpulse-prod`
4. Copy the tunnel token to `.env.prod-local`
5. Configure public hostnames:
   - `your-domain.com` → `http://prod-nextjs:3000`
   - `api.your-domain.com` → `http://prod-mcp:3001`

### Commands

```bash
# Start production
docker compose -f docker-compose.prod-local.yml up -d

# Stop production
docker compose -f docker-compose.prod-local.yml down

# View logs
docker compose -f docker-compose.prod-local.yml logs -f

# Check status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Deploy code changes
./scripts/prod-local-deploy.sh

# Health checks
curl http://192.168.1.15:8080/api/health
curl http://192.168.1.15:8081/health
```

### Deploy Code Updates

```bash
# No schema changes
git pull origin master
./scripts/prod-local-deploy.sh

# With schema changes
git pull origin master
DATABASE_URL="postgresql://projectpulse:<pwd>@192.168.1.15:5433/projectpulse_prod" \
  npx prisma migrate deploy
./scripts/prod-local-deploy.sh
```

### Rollback

```bash
# Stop production
docker compose -f docker-compose.prod-local.yml down

# Restore previous image (if tagged)
docker tag projectpulse/web:previous projectpulse/web:latest

# Restart
docker compose -f docker-compose.prod-local.yml up -d
```

---

## Quick Start (Docker Compose - Legacy)

### Local Production Testing (Docker Compose)

1. **Create environment file:**
```bash
cp .env.production.example .env.production
# Edit .env.production with your values
```

2. **Build and run:**
```bash
docker-compose -f docker-compose.production.yml up --build
```

3. **Access:**
- Web UI: http://localhost:3000
- MCP Server: http://localhost:3001
- Health Check: http://localhost:3000/api/health

### Kubernetes Deployment

1. **Update secrets:**
```bash
cp k8s/secrets.yaml.example k8s/secrets.yaml
# Edit k8s/secrets.yaml with production values
```

2. **Deploy:**
```bash
./scripts/k8s-deploy.sh
```

3. **Verify:**
```bash
kubectl get pods -n projectpulse
kubectl logs -f deployment/nextjs -n projectpulse
```

---

## Architecture Overview

### Docker Multi-Stage Builds

**Next.js (apps/web/Dockerfile.production):**
- Stage 1: Install dependencies
- Stage 2: Build shared packages
- Stage 3: Generate Prisma Client
- Stage 4: Build Next.js
- Stage 5: Production runtime (non-root user)

**MCP Server (apps/mcp-server/Dockerfile.production):**
- Stage 1: Install dependencies
- Stage 2: Build shared packages
- Stage 3: Generate Prisma Client
- Stage 4: Build MCP server
- Stage 5: Production runtime (non-root user)

**Benefits:**
- 60% smaller images (~300MB vs ~800MB)
- No development dependencies in production
- Secure: Non-root users (nextjs:1001, mcp:1001)
- Optimized layer caching

### Kubernetes Architecture

**Components:**
- **Namespace:** projectpulse
- **StatefulSets:** PostgreSQL, Redis (persistent storage)
- **Deployments:** Next.js (3 replicas), MCP Server (3 replicas)
- **Services:** Internal ClusterIP services
- **Ingress:** NGINX with TLS (Let's Encrypt)
- **HPA:** Auto-scaling 2-10 replicas (70% CPU threshold)

**Resource Limits:**
- Next.js: 512Mi-2Gi memory, 0.5-2 CPU
- MCP Server: 256Mi-512Mi memory, 0.25-1 CPU
- PostgreSQL: 512Mi-2Gi memory, 0.25-1 CPU
- Redis: 256Mi-512Mi memory, 0.1-0.5 CPU

---

## Pre-Deployment Checklist

### Required Tools
- [ ] Docker 20.10+
- [ ] Docker Compose 2.0+
- [ ] kubectl 1.24+
- [ ] Kubernetes cluster (minikube, kind, or cloud provider)

### Configuration
- [ ] Update `k8s/secrets.yaml` with production credentials
- [ ] Update `k8s/ingress.yaml` with your domain names
- [ ] Configure DNS records for your domains
- [ ] Install cert-manager for TLS certificates
- [ ] Install NGINX Ingress Controller

---

## Environment Variables

### Required (Must Set)
```bash
POSTGRES_PASSWORD=<secure-password>
REDIS_PASSWORD=<secure-password>
DATABASE_URL=postgresql://projectpulse:<password>@postgres:5432/projectpulse_prod
```

### Optional (With Defaults)
```bash
POSTGRES_USER=projectpulse
POSTGRES_DB=projectpulse_prod
DEFAULT_PROJECT_ID=1
NEXTJS_PORT=3000
MCP_PORT=3001
NODE_ENV=production
```

---

## Deployment Steps

### 1. Build Images

```bash
# Build Next.js
docker build -f apps/web/Dockerfile.production -t projectpulse/web:latest .

# Build MCP Server
docker build -f apps/mcp-server/Dockerfile.production -t projectpulse/mcp-server:latest .
```

### 2. Push to Registry (Optional)

```bash
# Tag for your registry
docker tag projectpulse/web:latest your-registry.com/projectpulse/web:latest
docker tag projectpulse/mcp-server:latest your-registry.com/projectpulse/mcp-server:latest

# Push
docker push your-registry.com/projectpulse/web:latest
docker push your-registry.com/projectpulse/mcp-server:latest
```

### 3. Deploy to Kubernetes

```bash
./scripts/k8s-deploy.sh
```

### 4. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n projectpulse

# Check services
kubectl get svc -n projectpulse

# Check ingress
kubectl get ingress -n projectpulse

# View logs
kubectl logs -f deployment/nextjs -n projectpulse
kubectl logs -f deployment/mcp-server -n projectpulse
```

---

## Health Checks

### Application Health
```bash
# Next.js health check
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-11-18T...",
  "database": "connected",
  "redis": true
}
```

### Kubernetes Health
```bash
# Check pod health
kubectl get pods -n projectpulse

# Check HPA status
kubectl get hpa -n projectpulse

# Check resource usage
kubectl top pods -n projectpulse
```

---

## Scaling

### Manual Scaling
```bash
# Scale Next.js to 5 replicas
kubectl scale deployment/nextjs -n projectpulse --replicas=5

# Scale MCP Server to 5 replicas
kubectl scale deployment/mcp-server -n projectpulse --replicas=5
```

### Auto-Scaling (HPA)
HPA automatically scales between 2-10 replicas based on:
- CPU usage: 70% threshold
- Memory usage: 80% threshold

View HPA status:
```bash
kubectl get hpa -n projectpulse
```

---

## Database Management

### Run Migrations
```bash
# Option 1: Via kubectl (if pods running)
kubectl exec -it deployment/nextjs -n projectpulse -- sh -c "cd apps/web && npx prisma migrate deploy"

# Option 2: Via migration job
kubectl run prisma-migrate --rm -i --restart=Never \
  --image=projectpulse/web:latest \
  --namespace=projectpulse \
  --env="DATABASE_URL=<your-db-url>" \
  --command -- sh -c "cd apps/web && npx prisma migrate deploy"
```

### Backup Database
```bash
# From PostgreSQL pod
kubectl exec -it postgres-0 -n projectpulse -- pg_dump -U projectpulse projectpulse_prod > backup.sql
```

---

## Rollback

### Kubernetes Rollback
```bash
# Use rollback script
./scripts/k8s-rollback.sh

# Or manual rollback
kubectl rollout undo deployment/nextjs -n projectpulse
kubectl rollout undo deployment/mcp-server -n projectpulse
```

### Check Rollout History
```bash
kubectl rollout history deployment/nextjs -n projectpulse
kubectl rollout history deployment/mcp-server -n projectpulse
```

---

## Monitoring

### View Logs
```bash
# Real-time logs
kubectl logs -f deployment/nextjs -n projectpulse
kubectl logs -f deployment/mcp-server -n projectpulse

# Last 100 lines
kubectl logs --tail=100 deployment/nextjs -n projectpulse

# All pods in deployment
kubectl logs -l app=nextjs -n projectpulse
```

### Resource Usage
```bash
# Pod resource usage
kubectl top pods -n projectpulse

# Node resource usage
kubectl top nodes
```

---

## Troubleshooting

### Pods Not Starting
```bash
# Check pod events
kubectl describe pod <pod-name> -n projectpulse

# Check pod logs
kubectl logs <pod-name> -n projectpulse

# Check image pull
kubectl get events -n projectpulse --sort-by='.lastTimestamp'
```

### Database Connection Issues
```bash
# Test database connectivity
kubectl exec -it postgres-0 -n projectpulse -- psql -U projectpulse -d projectpulse_prod -c "SELECT 1;"

# Check database secret
kubectl get secret projectpulse-secrets -n projectpulse -o jsonpath='{.data.DATABASE_URL}' | base64 -d
```

### Redis Connection Issues
```bash
# Test Redis connectivity
kubectl exec -it redis-0 -n projectpulse -- redis-cli ping

# Check Redis with password
kubectl exec -it redis-0 -n projectpulse -- redis-cli -a <password> ping
```

---

## Security Best Practices

### 1. Secrets Management
- Never commit `k8s/secrets.yaml` to git
- Use external secret management (e.g., Sealed Secrets, Vault)
- Rotate passwords regularly

### 2. Network Policies
```bash
# Apply network policies (TODO: Create policies)
kubectl apply -f k8s/network-policies.yaml
```

### 3. RBAC
- Use least-privilege service accounts
- Limit pod permissions

### 4. Image Security
- Scan images for vulnerabilities
- Use specific image tags (not `latest` in production)
- Sign images with Cosign

---

## Performance Optimization

### 1. Resource Tuning
- Monitor actual usage with `kubectl top`
- Adjust requests/limits based on real data
- Set appropriate HPA thresholds

### 2. Database Optimization
- Enable connection pooling
- Add appropriate indexes
- Regular VACUUM and ANALYZE

### 3. Caching
- Redis for session storage
- CDN for static assets
- HTTP caching headers

---

## Disaster Recovery

### Backup Strategy
1. **Database**: Daily automated backups
2. **Redis**: Snapshots every 6 hours
3. **Configuration**: Git-backed manifests

### Recovery Procedures
1. Restore database from backup
2. Redeploy application (images are immutable)
3. Verify health checks pass

---

## Support

**Documentation:**
- Architecture: [docs/03-Architecture.md](docs/03-Architecture.md)
- MCP Specification: [docs/03-MCP-SPECIFICATION.md](docs/03-MCP-SPECIFICATION.md)
- API Reference: [docs/MCP_API_REFERENCE.md](docs/MCP_API_REFERENCE.md)

**Health Checks:**
- Web: http://your-domain.com/api/health
- MCP: http://api.your-domain.com/health

---

**Last Updated:** 2025-11-18
**Next Review:** After first production deployment
