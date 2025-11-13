# ProjectPulse MCP Server - Quick Start Guide

**Sprint 5.5 - MCP Server Infrastructure**
**Created**: 2025-11-13
**For**: Developers using AI coding agents (Claude Code, Cursor AI, Codex)

---

## What is This?

ProjectPulse MCP Server enables AI coding agents to access your knowledge base, perform searches, and discover related knowledge items via the **Model Context Protocol (MCP)**.

**Target Users**: Developers using AI assistants (Claude Code, Cursor AI) to manage projects
**Use Case**: AI agents can search knowledge, create items, and explore relationships

---

## Prerequisites

1. ✅ **ProjectPulse running** at `http://192.168.1.15:3000` (Mac mini)
2. ✅ **Database seeded** with knowledge items (at least 10 items for testing)
3. ✅ **Claude Code installed** (or another MCP-compatible AI agent)
4. ✅ **Network access** to Mac mini (192.168.1.15) from your development machine

---

## Quick Setup (5 Minutes)

### Step 1: Verify ProjectPulse is Running

```bash
# Check health endpoint
curl http://192.168.1.15:3000/api/health

# Expected response:
# {"status":"healthy","database":"connected"}
```

### Step 2: Test MCP Endpoint

```bash
# Test tools/list method
curl -X POST 'http://192.168.1.15:3000/api/mcp' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Expected: JSON response with 3 tools (knowledge.search, knowledge.create, knowledge.related)
```

### Step 3: Add to Claude Code Configuration

**Location**:
- **Linux/Mac**: `~/.config/claude-code/mcp.json`
- **Windows**: `%APPDATA%/claude-code/mcp.json`

**Minimal Configuration** (copy this):

```json
{
  "mcpServers": {
    "projectpulse": {
      "transport": "http",
      "url": "http://192.168.1.15:3000/api/mcp",
      "description": "ProjectPulse knowledge base and tools",
      "timeout": 30000
    }
  }
}
```

**Full Configuration** (see `claude_code_config.json` in project root for detailed version)

### Step 4: Restart Claude Code

Restart Claude Code to load the new configuration.

### Step 5: Test in Claude Code

Ask Claude Code:

```
"List available MCP tools"
"Search ProjectPulse knowledge base for 'PostgreSQL indexing'"
"What resources are available in ProjectPulse?"
```

Claude Code should now have access to your knowledge base! 🎉

---

## Available Tools

### 1. knowledge.search
**Purpose**: Search knowledge base using hybrid (semantic + full-text) search

**Parameters**:
```json
{
  "query": "search text (required, 1-1000 chars)",
  "mode": "hybrid|semantic|fulltext (optional, default: hybrid)",
  "limit": 5,
  "category": "optional category filter"
}
```

**Example Usage**:
```
Claude Code: "Search for PostgreSQL indexing best practices"
→ Invokes: knowledge.search with query="PostgreSQL indexing"
→ Returns: Top 5 relevant knowledge items with scores
```

---

### 2. knowledge.create
**Purpose**: Create new knowledge item with automatic embeddings

**Parameters**:
```json
{
  "title": "Item title (required, 1-200 chars)",
  "content": "Item content (required, 10-50000 chars)",
  "category": "Category name (required, 1-50 chars)",
  "tags": ["tag1", "tag2"]
}
```

**Example Usage**:
```
Claude Code: "Save this Docker optimization guide to knowledge base"
→ Invokes: knowledge.create with title, content, category, tags
→ Returns: Created item ID, embedding metadata
```

---

### 3. knowledge.related
**Purpose**: Find related items via graph traversal (1-2 hops)

**Parameters**:
```json
{
  "itemId": 123,
  "maxDepth": 2,
  "limit": 10,
  "minStrength": 0.5
}
```

**Example Usage**:
```
Claude Code: "What knowledge items are related to item #42?"
→ Invokes: knowledge.related with itemId=42
→ Returns: Related items with relationship types and strengths
```

---

## Available Resources

Resources provide **read-only context injection** for AI agents.

### Resource URIs

**Pattern**: `knowledge://item/{id}`

**Example**: `knowledge://item/11`

### Discovery

1. **List all resources**:
   ```
   Method: resources/list
   Returns: Array of resource metadata with URIs
   ```

2. **Read specific resource**:
   ```
   Method: resources/read
   Params: { "uri": "knowledge://item/11" }
   Returns: Full Markdown document with metadata + relationships
   ```

**Resource Format** (Markdown):
```markdown
# Item Title

**Category:** Database
**Tags:** postgresql, indexing, performance
**ID:** 42
**Created:** 2025-11-12T14:15:14.896Z
**Updated:** 2025-11-12T14:15:14.896Z

---

[Full content here...]

---

## Related Knowledge

**Links to:**
- [Related Item 1](knowledge://item/3) (RELATES_TO, weight: 0.70)
- [Related Item 2](knowledge://item/5) (DEPENDS_ON, weight: 0.85)
```

---

## Architecture

### Transport
**Type**: HTTP (Streamable HTTP 2025-03-26 spec)
**Endpoint**: `http://192.168.1.15:3000/api/mcp`
**Protocol**: JSON-RPC 2.0

### Session Management
- **Header**: `Mcp-Session-Id` (UUID v4)
- **TTL**: 1 hour
- **Auto-generated** on first request if not provided

### Authentication
- **Development**: None (local network only)
- **Production**: OAuth 2.1 (planned for cloud deployment)

### Error Handling
- **Format**: JSON-RPC 2.0 error codes
- **Details**: Error data includes original backend error codes
- **Validation**: Input validation with descriptive error messages

---

## Troubleshooting

### Issue: "Connection refused"
**Solution**:
```bash
# Check Mac mini is accessible
ping 192.168.1.15

# Check Next.js is running
curl http://192.168.1.15:3000/api/health
```

### Issue: "No tools found"
**Solution**:
```bash
# Test MCP endpoint directly
curl -X POST 'http://192.168.1.15:3000/api/mcp' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Should return 3 tools
```

### Issue: "Search returns no results"
**Solution**:
```bash
# Check database has knowledge items
# SSH to Mac mini or run locally:
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" \
  npx prisma studio

# Navigate to KnowledgeItem table, should see 10+ items
```

### Issue: "Session expired"
**Solution**: Sessions expire after 1 hour. This is normal - a new session will be created automatically on the next request.

---

## Testing Examples

### Test 1: Tool Discovery
```bash
curl -X POST 'http://192.168.1.15:3000/api/mcp' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

**Expected**: JSON array with 3 tools and their schemas

---

### Test 2: Search Tool
```bash
curl -X POST 'http://192.168.1.15:3000/api/mcp' \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"knowledge.search",
      "arguments":{
        "query":"PostgreSQL",
        "mode":"hybrid",
        "limit":3
      }
    }
  }'
```

**Expected**: JSON result with top 3 search results, scores 0-1

---

### Test 3: Resource List
```bash
curl -X POST 'http://192.168.1.15:3000/api/mcp' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":3,"method":"resources/list","params":{}}'
```

**Expected**: JSON array of resource metadata with URIs

---

### Test 4: Resource Read
```bash
curl -X POST 'http://192.168.1.15:3000/api/mcp' \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc":"2.0",
    "id":4,
    "method":"resources/read",
    "params":{
      "uri":"knowledge://item/1"
    }
  }'
```

**Expected**: JSON result with full Markdown document

---

## Performance

**Expected Performance**:
- Tool calls: <200ms (without semantic search)
- Semantic search: 1000-2000ms (includes embedding generation)
- Resource reads: <100ms (database query only)
- Session validation: <1ms (in-memory Map)

**Optimization Tips**:
- Use `fulltext` mode for faster searches (no embedding generation)
- Limit results to reduce response size
- Use resources for bulk context (read once, use multiple times)

---

## Next Steps

1. ✅ **Test all 3 tools** from Claude Code
2. ✅ **Explore resources** via resources/list and resources/read
3. ✅ **Create knowledge items** using knowledge.create
4. ✅ **Follow graph relationships** using knowledge.related
5. ⏳ **Extend with custom tools** (issues, workflows) if needed

---

## Support

**Documentation**:
- Full API Reference: `docs/MCP_API_REFERENCE.md` (coming in Day 5)
- Architecture Details: `docs/MCP_ARCHITECTURE.md` (coming in Day 5)
- Implementation History: Available via `GET /api/sessions?sprint=5.5` (database query)

**Issues**: Report via GitHub Issues or contact project maintainer

---

**Ready to use ProjectPulse with Claude Code!** 🚀
