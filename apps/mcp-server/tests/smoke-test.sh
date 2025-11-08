#!/bin/bash
# MCP Server Smoke Test
# Tests the health-check tool via MCP Inspector

echo "=== MCP Server Smoke Test ==="
echo ""

# Check if server can be built
echo "Step 1: Building MCP server..."
cd "$(dirname "$0")/.."
pnpm build

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo "✅ Build successful"
echo ""

# Test with MCP Inspector CLI mode
echo "Step 2: Testing with MCP Inspector..."
echo "Running: npx @modelcontextprotocol/inspector --cli node build/index.js"
echo ""

# Note: Interactive test - manual verification required
echo "🔍 Manual Test Instructions:"
echo "1. Run: npx @modelcontextprotocol/inspector node build/index.js"
echo "2. Inspector UI will open at http://localhost:6274"
echo "3. Navigate to 'Tools' tab"
echo "4. Find 'projectpulse.health_check' tool"
echo "5. Click 'Test' or 'Execute'"
echo "6. Verify JSON response:"
echo "   Expected format:"
echo "   {"
echo "     \"status\": \"ok\","
echo "     \"timestamp\": \"<ISO-8601>\","
echo "     \"version\": \"1.0.0\","
echo "     \"server\": \"projectpulse-mcp\""
echo "   }"
echo ""
echo "✅ If response matches expected format, smoke test passes"
echo ""

# Alternative: CLI test (if inspector supports non-interactive mode)
echo "Step 3: Alternative - Direct stdio test"
echo "You can also test by running:"
echo "  node build/index.js"
echo ""
echo "Then send JSON-RPC message via stdin:"
echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "projectpulse.health_check",
    "arguments": {}
  }
}'
echo ""
echo "Expected: JSON-RPC response with tool result"
