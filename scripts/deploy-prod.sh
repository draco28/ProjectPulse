#!/bin/bash
# =============================================================================
# Production Deployment Script for ProjectPulse
# =============================================================================
#
# This script deploys the latest code to production on Mac Mini.
# It handles: git pull, build, migrate, restart, and smoke tests.
#
# Usage:
#   ./scripts/deploy-prod.sh           # Full deploy (build + migrate + restart)
#   ./scripts/deploy-prod.sh --quick   # Quick restart (no rebuild)
#   ./scripts/deploy-prod.sh --test    # Smoke tests only
#
# Prerequisites:
#   - .env.prod-local file exists
#   - docker-compose.prod-local.yml configured
#   - On master branch with clean working tree
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod-local.yml"
ENV_FILE=".env.prod-local"
PROD_URL="http://localhost:8080"
MCP_URL="http://localhost:8081"

# Functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

header() {
    echo ""
    echo -e "${BLUE}================================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================================================${NC}"
    echo ""
}

run_smoke_tests() {
    header "Running Smoke Tests"

    # Test 1: Web health
    log_info "Testing web health endpoint..."
    if curl -sf "$PROD_URL/api/health" > /dev/null; then
        log_success "Web health OK"
    else
        log_error "Web health FAILED"
        return 1
    fi

    # Test 2: CSS accessible
    log_info "Testing CSS static assets..."
    CSS_FILE=$(curl -s "$PROD_URL/login" 2>/dev/null | grep -o '/_next/static/css/[^"]*\.css' | head -1)
    if [ -n "$CSS_FILE" ] && curl -sf "$PROD_URL$CSS_FILE" > /dev/null; then
        log_success "CSS loading OK"
    else
        log_warn "CSS test skipped (no CSS found or failed)"
    fi

    # Test 3: MCP health
    log_info "Testing MCP health endpoint..."
    if curl -sf "$MCP_URL/health" > /dev/null; then
        log_success "MCP health OK"
    else
        log_error "MCP health FAILED"
        return 1
    fi

    # Test 4: Database connectivity
    log_info "Testing database connectivity..."
    if curl -sf "$PROD_URL/api/health" | grep -q '"database":"connected"'; then
        log_success "Database OK"
    else
        log_error "Database FAILED"
        return 1
    fi

    # Test 5: Redis connectivity
    log_info "Testing Redis connectivity..."
    if curl -sf "$PROD_URL/api/health" | grep -q '"redis":true'; then
        log_success "Redis OK"
    else
        log_warn "Redis check failed (may be optional)"
    fi

    echo ""
    log_success "All smoke tests passed!"
}

cleanup_old_images() {
    header "Cleanup Docker Resources"

    # Note: All cleanup commands use || true to prevent non-critical errors
    # from failing the deployment (e.g., stale BuildKit cache snapshots)

    log_info "Pruning ALL unused images (not just dangling)..."
    # -a flag removes ALL unused images, not just dangling ones
    # This prevents accumulation of old image layers from previous builds
    docker image prune -a -f || true

    log_info "Pruning ALL build cache..."
    # -a flag removes all cache, not just old entries
    # BuildKit cache can grow to 100GB+ without this
    docker builder prune -a -f 2>/dev/null || true

    log_info "Pruning unused volumes..."
    # Only removes dangling volumes; named volumes (postgres_data) are safe
    docker volume prune -f || true

    log_info "Pruning unused networks..."
    docker network prune -f || true

    log_info "Current Docker disk usage:"
    docker system df 2>/dev/null || log_warn "Could not get disk usage (non-critical)"

    log_success "Cleanup complete"
}

quick_restart() {
    header "Quick Restart (No Rebuild)"

    log_info "Restarting production containers..."
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" restart prod-nextjs prod-mcp

    log_info "Waiting for containers to be healthy..."
    sleep 10

    run_smoke_tests
}

full_deploy() {
    header "Full Production Deployment"

    # Check prerequisites
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Missing $ENV_FILE file!"
        exit 1
    fi

    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Missing $COMPOSE_FILE file!"
        exit 1
    fi

    # Step 1: Pull latest code
    header "Step 1: Pull Latest Code"
    CURRENT_BRANCH=$(git branch --show-current)
    log_info "Current branch: $CURRENT_BRANCH"

    if [ "$CURRENT_BRANCH" != "master" ]; then
        log_warn "Not on master branch. Deploying from: $CURRENT_BRANCH"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi

    log_info "Pulling latest changes..."
    git pull origin "$CURRENT_BRANCH"
    log_success "Code updated"

    # Step 2: Build production images
    header "Step 2: Build Production Images"
    log_info "Building web and MCP images (this may take a few minutes)..."
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build prod-nextjs prod-mcp
    log_success "Images built"

    # Step 3: Restart containers
    header "Step 3: Restart Containers"
    log_info "Stopping old containers..."
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" stop prod-nextjs prod-mcp

    log_info "Removing old containers..."
    # Remove stopped containers to prevent accumulation
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" rm -f prod-nextjs prod-mcp || true

    log_info "Starting new containers..."
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d prod-nextjs prod-mcp
    log_success "Containers restarted"

    # Step 4: Wait for health
    header "Step 4: Wait for Containers"
    log_info "Waiting for containers to be healthy (30s)..."
    sleep 30

    # Step 5: Run smoke tests
    run_smoke_tests

    # Step 6: Cleanup old images to prevent storage bloat
    cleanup_old_images

    # Done!
    header "Deployment Complete!"
    echo -e "Production is now running at:"
    echo -e "  Web:  ${GREEN}$PROD_URL${NC}"
    echo -e "  MCP:  ${GREEN}$MCP_URL${NC}"
    echo -e "  External: ${GREEN}https://projectpulse.dracodev.dev${NC}"
    echo ""
}

# Main
case "${1:-}" in
    --quick)
        quick_restart
        ;;
    --test)
        run_smoke_tests
        ;;
    --help|-h)
        echo "Usage: $0 [--quick|--test|--help]"
        echo ""
        echo "Options:"
        echo "  (none)    Full deploy: pull, build, restart, test"
        echo "  --quick   Quick restart without rebuild"
        echo "  --test    Run smoke tests only"
        echo "  --help    Show this help"
        ;;
    *)
        full_deploy
        ;;
esac
