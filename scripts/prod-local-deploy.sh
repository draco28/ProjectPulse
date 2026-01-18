#!/bin/bash
# ============================================
# ProjectPulse Production Deployment Script
# Mac Mini Local Deployment
# ============================================
# Usage: ./scripts/prod-local-deploy.sh
# 
# Prerequisites:
# - .env.prod-local file with all required variables
# - Docker and Docker Compose installed
# - Cloudflare tunnel configured (optional for first run)
# ============================================

set -e

# Source infrastructure configuration for prod-local environment
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PROJECTPULSE_ENV=prod-local
source "$SCRIPT_DIR/lib/infra.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "🚀 ProjectPulse Production Deployment (Mac Mini)"
echo "================================================"
echo -e "${NC}"

# ============================================
# Step 1: Check Prerequisites
# ============================================
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check environment file
if [ ! -f .env.prod-local ]; then
  echo -e "${RED}❌ Error: .env.prod-local not found${NC}"
  echo "   Copy .env.prod-local.example to .env.prod-local and fill in values"
  exit 1
fi

# Load environment variables
set -a
source .env.prod-local
set +a

# Validate required variables
REQUIRED_VARS=(
  "PROD_POSTGRES_PASSWORD"
  "PROD_REDIS_PASSWORD"
  "PROD_NEXTAUTH_SECRET"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
  echo -e "${RED}❌ Error: Missing required environment variables:${NC}"
  for var in "${MISSING_VARS[@]}"; do
    echo "   - $var"
  done
  exit 1
fi

# Check for placeholder values
if [[ "$PROD_POSTGRES_PASSWORD" == *"generate"* ]] || [[ "$PROD_POSTGRES_PASSWORD" == *"<"* ]]; then
  echo -e "${RED}❌ Error: PROD_POSTGRES_PASSWORD still has placeholder value${NC}"
  echo "   Generate a real password with: openssl rand -base64 32"
  exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# ============================================
# Step 2: Build Production Images
# ============================================
echo ""
echo -e "${YELLOW}📦 Building production images...${NC}"

echo "   Building Next.js web application..."
docker build -f apps/web/Dockerfile.production -t projectpulse/web:latest . || {
  echo -e "${RED}❌ Failed to build web image${NC}"
  exit 1
}

echo "   Building MCP server..."
docker build -f apps/mcp-server/Dockerfile.production -t projectpulse/mcp-server:latest . || {
  echo -e "${RED}❌ Failed to build MCP server image${NC}"
  exit 1
}

# Show image sizes
echo ""
echo -e "${BLUE}📊 Image sizes:${NC}"
docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}" | grep projectpulse

echo -e "${GREEN}✅ Images built successfully${NC}"

# ============================================
# Step 3: Start Database Services
# ============================================
echo ""
echo -e "${YELLOW}🗄️ Starting database services...${NC}"

docker compose -f docker-compose.prod-local.yml up -d prod-postgres prod-redis

echo "   Waiting for database to be healthy..."
sleep 5

# Wait for PostgreSQL
for i in {1..30}; do
  if docker exec projectpulse-prod-postgres pg_isready -U "${PROD_POSTGRES_USER:-projectpulse}" -d "${PROD_POSTGRES_DB:-projectpulse_prod}" &>/dev/null; then
    echo -e "${GREEN}   ✅ PostgreSQL is ready${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}❌ PostgreSQL failed to start${NC}"
    docker logs projectpulse-prod-postgres --tail 50
    exit 1
  fi
  sleep 2
done

# Wait for Redis
for i in {1..15}; do
  if docker exec projectpulse-prod-redis redis-cli -a "$PROD_REDIS_PASSWORD" ping &>/dev/null; then
    echo -e "${GREEN}   ✅ Redis is ready${NC}"
    break
  fi
  if [ $i -eq 15 ]; then
    echo -e "${RED}❌ Redis failed to start${NC}"
    docker logs projectpulse-prod-redis --tail 20
    exit 1
  fi
  sleep 1
done

echo -e "${GREEN}✅ Database services started${NC}"

# ============================================
# Step 4: Run Database Migrations
# ============================================
echo ""
echo -e "${YELLOW}📊 Running database migrations...${NC}"

# Set DATABASE_URL for migration (uses PROJECTPULSE_DATABASE_URL from infra.sh if set, otherwise construct from env vars)
export DATABASE_URL="${PROJECTPULSE_DATABASE_URL:-postgresql://${PROD_POSTGRES_USER:-projectpulse}:${PROD_POSTGRES_PASSWORD}@localhost:5433/${PROD_POSTGRES_DB:-projectpulse_prod}}"

# Run migrations
cd apps/web
npx prisma migrate deploy || {
  echo -e "${RED}❌ Migration failed${NC}"
  exit 1
}
cd ../..

echo -e "${GREEN}✅ Migrations applied successfully${NC}"

# ============================================
# Step 5: Start Application Services
# ============================================
echo ""
echo -e "${YELLOW}🌐 Starting application services...${NC}"

docker compose -f docker-compose.prod-local.yml up -d

echo "   Waiting for services to be healthy..."
sleep 10

# Wait for Next.js
for i in {1..30}; do
  if curl -sf "$PROJECTPULSE_WEB_URL/api/health" &>/dev/null; then
    echo -e "${GREEN}   ✅ Next.js is healthy${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${YELLOW}⚠️ Next.js health check failed (may still be starting)${NC}"
  fi
  sleep 2
done

# Wait for MCP
for i in {1..20}; do
  if curl -sf "$PROJECTPULSE_MCP_URL/health" &>/dev/null; then
    echo -e "${GREEN}   ✅ MCP server is healthy${NC}"
    break
  fi
  if [ $i -eq 20 ]; then
    echo -e "${YELLOW}⚠️ MCP health check failed (may still be starting)${NC}"
  fi
  sleep 2
done

# ============================================
# Step 6: Verification
# ============================================
echo ""
echo -e "${YELLOW}✅ Verifying deployment...${NC}"

echo ""
echo -e "${BLUE}Service Status:${NC}"
docker compose -f docker-compose.prod-local.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo -e "${BLUE}Health Checks:${NC}"
curl -sf "$PROJECTPULSE_WEB_URL/api/health" && echo -e "   Web API:  ${GREEN}✅ Healthy${NC}" || echo -e "   Web API:  ${RED}❌ Unhealthy${NC}"
curl -sf "$PROJECTPULSE_MCP_URL/health" && echo -e "   MCP API:  ${GREEN}✅ Healthy${NC}" || echo -e "   MCP API:  ${RED}❌ Unhealthy${NC}"

# ============================================
# Done!
# ============================================
echo ""
echo -e "${GREEN}"
echo "🎉 Production deployment complete!"
echo "=================================="
echo -e "${NC}"
echo -e "${BLUE}Local URLs:${NC}"
echo "   Web:  $PROJECTPULSE_WEB_URL"
echo "   MCP:  $PROJECTPULSE_MCP_URL"
echo ""
echo -e "${BLUE}Cloudflare Tunnel:${NC}"
if [ -n "$CLOUDFLARE_TUNNEL_TOKEN" ] && [ "$CLOUDFLARE_TUNNEL_TOKEN" != "<your-tunnel-token>" ]; then
  echo "   Check Cloudflare dashboard for public URL"
else
  echo "   Not configured (set CLOUDFLARE_TUNNEL_TOKEN in .env.prod-local)"
fi
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "   View logs:  docker compose -f docker-compose.prod-local.yml logs -f"
echo "   Stop:       docker compose -f docker-compose.prod-local.yml down"
echo "   Restart:    docker compose -f docker-compose.prod-local.yml restart"
echo ""
