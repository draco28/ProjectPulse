#!/bin/bash
# Manual MCP Tool Testing Script
# Tests Session 1 tools via HTTP transport

# Source infrastructure configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/scripts/lib/infra.sh"

# Use MCP URL from infra config with /mcp endpoint
MCP_URL="$PROJECTPULSE_MCP_URL/mcp"

echo "=== Test 1: Initialize MCP Session ==="
RESPONSE=$(curl -s -X POST "$MCP_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "manual-test", "version": "1.0.0"}
    }
  }')

echo "$RESPONSE" | jq .

# Extract session ID from headers (you'll need to add -i flag to see headers)
echo -e "\n=== Test 2: List All Tools ==="
SESSION_ID=$(echo "$RESPONSE" | jq -r '.result.sessionId // "test-session"')

curl -s -X POST "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }' | jq '.result.tools[] | select(.name | contains("onboarding"))'

echo -e "\n=== Test 3: Get Questions for Project 8, Phase 1 ==="
curl -s -X POST "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "projectpulse.onboarding.getQuestions",
      "arguments": {
        "projectId": 8,
        "phase": 1
      }
    }
  }' | jq .

echo -e "\n=== Test Complete ==="
