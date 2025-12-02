#!/bin/bash
# ============================================
# ProjectPulse Production Smoke Tests
# Mac Mini Local Deployment
# ============================================
# Usage: ./scripts/prod-smoke-test.sh [--skip-build]
#
# This script validates a production Docker build by:
# 1. Building production images (unless --skip-build)
# 2. Starting the production stack
# 3. Running 5 critical smoke tests
# 4. Reporting results
#
# Run after any Dockerfile changes to catch build issues
# before they reach users.
# ============================================

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
WEB_PORT=8080
MCP_PORT=8081
MAX_WAIT_SECONDS=90

# Parse arguments
SKIP_BUILD=false
for arg in "$@"; do
  case $arg in
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
  esac
done

echo -e "${BLUE}"
echo "============================================"
echo " ProjectPulse Production Smoke Tests"
echo "============================================"
echo -e "${NC}"

# ============================================
# Step 0: Check Prerequisites
# ============================================
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Error: $ENV_FILE not found${NC}"
  echo "Copy .env.prod-local.example to .env.prod-local and fill in values"
  exit 1
fi

# ============================================
# Step 1: Build Production Images (optional)
# ============================================
if [ "$SKIP_BUILD" = false ]; then
  echo -e "${YELLOW}[1/5] Building production images...${NC}"
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build prod-nextjs prod-mcp 2>&1 | tail -20
  echo -e "${GREEN}     Build complete${NC}"
else
  echo -e "${YELLOW}[1/5] Skipping build (--skip-build)${NC}"
fi

# ============================================
# Step 2: Start Production Stack
# ============================================
echo -e "${YELLOW}[2/5] Starting production stack...${NC}"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d 2>&1 | grep -v "orphan"
echo -e "${GREEN}     Containers started${NC}"

# ============================================
# Step 3: Wait for Healthy Containers
# ============================================
echo -e "${YELLOW}[3/5] Waiting for containers to be healthy (max ${MAX_WAIT_SECONDS}s)...${NC}"

WAIT_INTERVAL=5
WAITED=0
while [ $WAITED -lt $MAX_WAIT_SECONDS ]; do
  UNHEALTHY=$(docker compose -f "$COMPOSE_FILE" ps 2>/dev/null | grep -c "unhealthy" || true)
  STARTING=$(docker compose -f "$COMPOSE_FILE" ps 2>/dev/null | grep -c "starting" || true)

  if [ "$UNHEALTHY" -eq 0 ] && [ "$STARTING" -eq 0 ]; then
    echo -e "${GREEN}     All containers healthy${NC}"
    break
  fi

  echo -n "."
  sleep $WAIT_INTERVAL
  WAITED=$((WAITED + WAIT_INTERVAL))
done

if [ $WAITED -ge $MAX_WAIT_SECONDS ]; then
  echo ""
  echo -e "${RED}     Timeout waiting for containers${NC}"
  docker compose -f "$COMPOSE_FILE" ps
fi

# Give services a moment to fully initialize
sleep 5

# ============================================
# Step 4: Run Smoke Tests
# ============================================
echo -e "${YELLOW}[4/5] Running smoke tests...${NC}"
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: Web app health endpoint
echo -n "     [Test 1] Web health endpoint: "
if curl -sf "http://localhost:${WEB_PORT}/api/health" > /dev/null 2>&1; then
  echo -e "${GREEN}PASS${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}FAIL${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 2: CSS file accessible (catches Dockerfile static asset bugs)
echo -n "     [Test 2] CSS static assets:   "
CSS_FILE=$(curl -s "http://localhost:${WEB_PORT}/login" 2>/dev/null | grep -o '/_next/static/css/[^"]*\.css' | head -1)
if [ -n "$CSS_FILE" ] && curl -sf "http://localhost:${WEB_PORT}${CSS_FILE}" > /dev/null 2>&1; then
  echo -e "${GREEN}PASS${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}FAIL${NC} (CSS file: ${CSS_FILE:-not found})"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 3: MCP health endpoint
echo -n "     [Test 3] MCP health endpoint: "
if curl -sf "http://localhost:${MCP_PORT}/health" > /dev/null 2>&1; then
  echo -e "${GREEN}PASS${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}FAIL${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 4: Database connectivity (via health API response)
echo -n "     [Test 4] Database connected:  "
HEALTH_RESPONSE=$(curl -sf "http://localhost:${WEB_PORT}/api/health" 2>/dev/null)
if echo "$HEALTH_RESPONSE" | grep -q '"database":"connected"'; then
  echo -e "${GREEN}PASS${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}FAIL${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 5: Redis connectivity
echo -n "     [Test 5] Redis connected:     "
if echo "$HEALTH_RESPONSE" | grep -q '"redis":true'; then
  echo -e "${GREEN}PASS${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}FAIL${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# ============================================
# Step 5: Report Results
# ============================================
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE} Smoke Test Results${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "     Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "     Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}All smoke tests passed!${NC}"
  echo ""
  echo -e "${BLUE}Production URLs:${NC}"
  echo "     Local Web: http://localhost:${WEB_PORT}"
  echo "     Local MCP: http://localhost:${MCP_PORT}"
  echo "     Public:    https://projectpulse.dracodev.dev (if tunnel active)"
  exit 0
else
  echo -e "${RED}Some smoke tests failed!${NC}"
  echo ""
  echo -e "${YELLOW}Debugging steps:${NC}"
  echo "     1. Check container logs:"
  echo "        docker compose -f $COMPOSE_FILE logs prod-nextjs"
  echo "        docker compose -f $COMPOSE_FILE logs prod-mcp"
  echo "     2. Check container status:"
  echo "        docker compose -f $COMPOSE_FILE ps"
  echo "     3. Check Dockerfile changes since last successful build"
  exit 1
fi
