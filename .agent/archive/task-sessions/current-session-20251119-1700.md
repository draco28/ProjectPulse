# Session: Critical MCP Connection Troubleshooting

**Date:** 2025-11-19
**Phase:** Sprint 8.6 (MCP Connection Fix)
**Goal:** Fix "Claude Code never connects" issue for external agents connecting to Mac mini MCP server.

## Context
- User is "Agent First" product.
- Sprint 8.6: Onboarding session feature complete.
- Issue: End user's agent (Claude Code) cannot connect to MCP server on Mac mini.
- Infrastructure: Mac mini (192.168.1.15) running Docker containers (Next.js :3000, MCP :3001).
- "Manual" testing works (internal?), but "End user's agent" (external?) fails.
- Tried HTTP streaming and SSE.

## Investigation Plan
1. **Analyze MCP Server Implementation**: Check `apps/mcp-server` source code for HTTP/SSE implementation details.
2. **Verify Network/Endpoint**: Check if endpoints are accessible from outside the container/host.
3. **Check Logs**: Look for connection attempts in MCP server logs.
4. **Test Connection**: Simulate an external agent connection.

## Current Status
- [ ] Initializing investigation
