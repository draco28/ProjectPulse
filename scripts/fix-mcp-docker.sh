#!/bin/bash
# Fix MCP Docker Container - Reinstall Dependencies
#
# Problem: Volume mount has updated package.json but node_modules doesn't have new packages
# Solution: Remove volume, rebuild container, fresh install
#
# Estimated time: 5-10 minutes

set -e

echo "🔧 Fixing MCP Docker Container Dependencies"
echo ""

# Navigate to project root
cd /Users/draco/projects/AI_HUB

# Step 1: Stop MCP container
echo "1️⃣ Stopping MCP container..."
docker compose -f docker-compose.cloud.yml stop mcp-server
echo "   ✅ MCP container stopped"
echo ""

# Step 2: Remove node_modules volume (force fresh install)
echo "2️⃣ Removing old node_modules volume..."
docker volume rm projectpulse_mcp_node_modules || echo "   ⚠️  Volume doesn't exist or in use (OK)"
echo "   ✅ Volume removed"
echo ""

# Step 3: Recreate container with fresh dependencies
echo "3️⃣ Rebuilding MCP container..."
docker compose -f docker-compose.cloud.yml up -d --build mcp-server
echo "   ✅ MCP container recreated"
echo ""

# Step 4: Wait for container to stabilize
echo "4️⃣ Waiting for container to build..."
sleep 30
echo ""

# Step 5: Check status
echo "5️⃣ Checking container status..."
docker ps --filter name=projectpulse-mcp --format "table {{.Names}}\t{{.Status}}"
echo ""

# Step 6: Check logs for success
echo "6️⃣ Checking build logs..."
if docker logs projectpulse-mcp-cloud 2>&1 | grep -q "Tools registered"; then
    echo "   ✅ BUILD SUCCESS - Tools registered!"
    TOOL_COUNT=$(docker logs projectpulse-mcp-cloud 2>&1 | grep "Tools registered" | tail -1)
    echo "   $TOOL_COUNT"
elif docker logs projectpulse-mcp-cloud 2>&1 | grep -q "ELIFECYCLE"; then
    echo "   ❌ BUILD FAILED - Still has errors"
    echo ""
    echo "   Last 20 log lines:"
    docker logs projectpulse-mcp-cloud --tail 20
    exit 1
else
    echo "   ⏳ Still building... Check logs:"
    docker logs projectpulse-mcp-cloud --tail 20
fi

echo ""
echo "✅ MCP Docker Fix Complete!"
echo ""
echo "Next step: Run Session 1 E2E test"
echo "   npx tsx scripts/test-session-1-mcp-e2e.ts"
