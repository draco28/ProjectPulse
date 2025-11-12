# MCP API Reference

**Version**: 1.0.0
**Protocol**: JSON-RPC 2.0 over HTTP
**Base URL**: `http://192.168.1.15:3000/api/mcp` (local), `https://api.projectpulse.com/mcp` (production - planned)

---

## Table of Contents

1. [Overview](#overview)
2. [JSON-RPC 2.0 Format](#json-rpc-20-format)
3. [Authentication](#authentication)
4. [Session Management](#session-management)
5. [Methods](#methods)
   - [tools/list](#toolslist)
   - [tools/call](#toolscall)
   - [resources/list](#resourceslist)
   - [resources/read](#resourcesread)
6. [Tools](#tools)
   - [knowledge.search](#knowledgesearch)
   - [knowledge.create](#knowledgecreate)
   - [knowledge.related](#knowledgerelated)
7. [Resources](#resources)
   - [knowledge://item/{id}](#knowledgeitemid)
8. [Error Codes](#error-codes)
9. [Examples](#examples)

---

## Overview

The ProjectPulse MCP Server implements the Model Context Protocol (MCP) using JSON-RPC 2.0 over HTTP. All requests use the POST method and return JSON-RPC 2.0 responses.

**Key Features**:
- **Tools**: Execute actions (search, create, modify knowledge)
- **Resources**: Read-only context injection (knowledge items, collections)
- **Session Management**: Stateful sessions via `Mcp-Session-Id` header
- **Error Handling**: Structured JSON-RPC 2.0 error codes

---

## JSON-RPC 2.0 Format

All requests and responses follow JSON-RPC 2.0 specification.

### Request Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "knowledge.search",
    "arguments": { "query": "PostgreSQL indexing" }
  }
}
```

**Required Fields**:
- `jsonrpc` (string): Must be `"2.0"`
- `method` (string): Method name (e.g., `"tools/call"`)
- `id` (number | string | null): Request identifier (used to match response)

**Optional Fields**:
- `params` (object): Method-specific parameters

### Success Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "results": [...],
    "count": 5
  }
}
```

**Fields**:
- `jsonrpc` (string): Always `"2.0"`
- `id` (number | string | null): Matches request ID
- `result` (any): Method-specific result data

### Error Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": { "field": "query", "issue": "too short" }
  }
}
```

**Fields**:
- `jsonrpc` (string): Always `"2.0"`
- `id` (number | string | null): Matches request ID (null if parse error)
- `error` (object):
  - `code` (number): JSON-RPC error code (see [Error Codes](#error-codes))
  - `message` (string): Human-readable error message
  - `data` (any, optional): Additional error context

---

## Authentication

### MVP (Local Network)

**Status**: No authentication required

MCP server runs on local network (192.168.1.15) with trusted clients.

### Production (Cloud Deployment - Planned)

**Status**: Planned for future sprint

**Planned Method**: OAuth 2.1 with client credentials grant

```http
POST /api/mcp
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

---

## Session Management

### Session Lifecycle

1. **First Request**: Client omits `Mcp-Session-Id` header
2. **Server Response**: Returns new UUID v4 in `Mcp-Session-Id` header
3. **Subsequent Requests**: Client includes `Mcp-Session-Id` header
4. **Session Expiration**: 1 hour of inactivity → session removed

### Headers

**Request Headers**:
- `Mcp-Session-Id` (string, optional): UUID v4 session identifier
- `Content-Type` (string, required): `application/json`

**Response Headers**:
- `Mcp-Session-Id` (string): Session identifier (new or existing)
- `X-Response-Time` (string): Response time in milliseconds (e.g., `"23ms"`)
- `Content-Type` (string): `application/json`

### Example

```bash
# First request (no session)
curl -X POST http://192.168.1.15:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  -i

# Response includes session ID
HTTP/1.1 200 OK
Mcp-Session-Id: 550e8400-e29b-41d4-a716-446655440000
X-Response-Time: 15ms
Content-Type: application/json

# Subsequent requests include session ID
curl -X POST http://192.168.1.15:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call",...}'
```

---

## Methods

### tools/list

List all available tools with input schemas.

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "knowledge.search",
        "description": "Search knowledge base using hybrid search",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": { "type": "string" },
            "mode": { "type": "string", "enum": ["semantic", "fulltext", "hybrid"] },
            "limit": { "type": "number", "minimum": 1, "maximum": 50 }
          },
          "required": ["query"]
        }
      }
    ]
  }
}
```

**Performance**: <5ms

---

### tools/call

Invoke a specific tool by name.

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "knowledge.search",
    "arguments": { "query": "PostgreSQL indexing", "limit": 5 }
  }
}
```

**Params**:
- `name` (string, required): Tool name (e.g., `"knowledge.search"`)
- `arguments` (object, optional): Tool-specific arguments

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "results": [...],
    "count": 5
  }
}
```

**Performance**: 20-35ms (depends on tool)

**Errors**:
- `-32601`: Tool not found
- `-32602`: Invalid arguments
- `-32603`: Tool execution failed

---

### resources/list

List available resources for context injection.

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/list"
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "resources": [
      {
        "uri": "knowledge://item/42",
        "name": "PostgreSQL Indexing Best Practices",
        "description": "Knowledge item: PostgreSQL Indexing Best Practices (Database)",
        "mimeType": "text/markdown"
      },
      {
        "uri": "knowledge://item/17",
        "name": "React Hooks Guide",
        "description": "Knowledge item: React Hooks Guide (Frontend)",
        "mimeType": "text/markdown"
      }
    ]
  }
}
```

**Performance**: <20ms

---

### resources/read

Read a specific resource by URI.

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "resources/read",
  "params": {
    "uri": "knowledge://item/42"
  }
}
```

**Params**:
- `uri` (string, required): Resource URI (e.g., `"knowledge://item/42"`)

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "contents": [{
      "uri": "knowledge://item/42",
      "mimeType": "text/markdown",
      "text": "# PostgreSQL Indexing Best Practices\n\n..."
    }]
  }
}
```

**Performance**: <15ms

**Errors**:
- `-32602`: Invalid URI format or item not found
- `-32603`: Database error

---

## Tools

### knowledge.search

Search knowledge base using hybrid (semantic + full-text) search.

**Tool Name**: `knowledge.search`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query (1-1000 characters)",
      "minLength": 1,
      "maxLength": 1000
    },
    "mode": {
      "type": "string",
      "enum": ["semantic", "fulltext", "hybrid"],
      "default": "hybrid",
      "description": "Search mode"
    },
    "limit": {
      "type": "number",
      "minimum": 1,
      "maximum": 50,
      "default": 5,
      "description": "Maximum results to return"
    },
    "category": {
      "type": "string",
      "description": "Filter by category (optional)"
    }
  },
  "required": ["query"]
}
```

**Output**:
```json
{
  "results": [
    {
      "id": 42,
      "title": "PostgreSQL Indexing Best Practices",
      "excerpt": "This guide covers indexing strategies for PostgreSQL, including B-tree, GIN, GiST, and HNSW indexes. Learn when to use each type and how to optimize query performance...",
      "category": "Database",
      "tags": ["postgresql", "indexing", "performance"],
      "score": 0.89,
      "matchType": "hybrid"
    }
  ],
  "query": "PostgreSQL indexing",
  "mode": "hybrid",
  "count": 5,
  "duration": 23
}
```

**Fields**:
- `results` (array): Matching knowledge items
  - `id` (number): Item ID
  - `title` (string): Item title
  - `excerpt` (string): First 200 characters of content
  - `category` (string): Item category
  - `tags` (string[]): Item tags
  - `score` (number): Relevance score (0-1)
  - `matchType` (string): How the item matched (`"semantic"`, `"fulltext"`, or `"hybrid"`)
- `query` (string): Search query (echoed)
- `mode` (string): Search mode used
- `count` (number): Number of results returned
- `duration` (number): Query execution time in milliseconds

**Search Modes**:

1. **Semantic** (`mode: "semantic"`):
   - Uses 768-dimensional vector embeddings (pgvector)
   - Finds conceptually similar items (synonym-aware)
   - Best for: Broad topic searches, concept matching
   - Example: "DB optimization" matches "PostgreSQL performance tuning"

2. **Full-text** (`mode: "fulltext"`):
   - Uses PostgreSQL tsvector with GIN index
   - Finds exact keyword matches with stemming
   - Best for: Precise terminology searches, code snippets
   - Example: "CREATE INDEX" matches exactly "CREATE INDEX"

3. **Hybrid** (`mode: "hybrid"`, default):
   - Combines semantic + full-text using Reciprocal Rank Fusion (RRF)
   - Balances conceptual and keyword matching
   - Best for: General searches (recommended default)

**Performance**: 20-35ms (including embedding generation)

**Example Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 10,
  "method": "tools/call",
  "params": {
    "name": "knowledge.search",
    "arguments": {
      "query": "PostgreSQL indexing best practices",
      "mode": "hybrid",
      "limit": 5
    }
  }
}
```

**Error Cases**:
- Query too short (<1 char) or too long (>1000 chars) → `-32602 Invalid params`
- Invalid mode → `-32602 Invalid params`
- Embedding generation failure → `-32603 Internal error`
- Database error → `-32603 Internal error`

---

### knowledge.create

Create a new knowledge item with automatic embedding generation.

**Tool Name**: `knowledge.create`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Item title (1-200 characters)",
      "minLength": 1,
      "maxLength": 200
    },
    "content": {
      "type": "string",
      "description": "Item content (10-50000 characters)",
      "minLength": 10,
      "maxLength": 50000
    },
    "category": {
      "type": "string",
      "description": "Item category (1-50 characters)",
      "minLength": 1,
      "maxLength": 50
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "maxItems": 20,
      "description": "Optional tags (max 20)"
    }
  },
  "required": ["title", "content", "category"]
}
```

**Output**:
```json
{
  "id": 123,
  "title": "PostgreSQL Indexing Best Practices",
  "content": "This guide covers indexing strategies...",
  "category": "Database",
  "tags": ["postgresql", "indexing", "performance"],
  "createdAt": "2025-11-13T10:30:00.000Z",
  "embeddingProvider": "ollama",
  "embeddingDuration": 450
}
```

**Fields**:
- `id` (number): New item ID
- `title` (string): Item title
- `content` (string): Full item content
- `category` (string): Item category
- `tags` (string[]): Item tags
- `createdAt` (string): ISO 8601 timestamp
- `embeddingProvider` (string): Embedding service used (`"ollama"` or `"openai"`)
- `embeddingDuration` (number): Embedding generation time (ms)

**Automatic Features**:
1. **Embedding Generation**: 768-dimensional vector generated automatically
2. **Full-text Indexing**: tsvector created for full-text search
3. **Graph Relationships**: Auto-discovered based on content similarity

**Performance**: 400-800ms (embedding generation dominates)

**Example Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 20,
  "method": "tools/call",
  "params": {
    "name": "knowledge.create",
    "arguments": {
      "title": "PostgreSQL B-tree Index Internals",
      "content": "B-tree indexes are the default index type in PostgreSQL...",
      "category": "Database",
      "tags": ["postgresql", "btree", "indexing"]
    }
  }
}
```

**Error Cases**:
- Title too short/long → `-32602 Invalid params`
- Content too short (<10 chars) or too long (>50K chars) → `-32602 Invalid params`
- Category missing → `-32602 Invalid params`
- Too many tags (>20) → `-32602 Invalid params`
- Embedding generation failed → `-32603 Internal error`
- Database constraint violation → `-32603 Internal error`

---

### knowledge.related

Find related knowledge items via graph traversal (1-2 hop relationships).

**Tool Name**: `knowledge.related`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "itemId": {
      "type": "number",
      "description": "Knowledge item ID"
    },
    "maxDepth": {
      "type": "number",
      "enum": [1, 2],
      "default": 2,
      "description": "Maximum graph traversal depth (1 or 2 hops)"
    },
    "limit": {
      "type": "number",
      "minimum": 1,
      "maximum": 50,
      "default": 10,
      "description": "Maximum results to return"
    },
    "minStrength": {
      "type": "number",
      "minimum": 0,
      "maximum": 1,
      "default": 0.5,
      "description": "Minimum relationship strength (0-1)"
    },
    "relationshipTypes": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Filter by relationship types (optional)"
    }
  },
  "required": ["itemId"]
}
```

**Output**:
```json
{
  "itemId": 42,
  "related": [
    {
      "id": 17,
      "title": "PostgreSQL Query Optimization",
      "excerpt": "Query optimization in PostgreSQL involves analyzing execution plans...",
      "category": "Database",
      "tags": ["postgresql", "optimization", "explain"],
      "relationshipType": "related_to",
      "strength": 0.87,
      "depth": 1
    },
    {
      "id": 99,
      "title": "HNSW Index Performance",
      "excerpt": "HNSW (Hierarchical Navigable Small World) indexes provide fast approximate nearest neighbor search...",
      "category": "Database",
      "tags": ["pgvector", "hnsw", "indexing"],
      "relationshipType": "prerequisite",
      "strength": 0.65,
      "depth": 2
    }
  ],
  "count": 2,
  "maxDepth": 2
}
```

**Fields**:
- `itemId` (number): Source item ID
- `related` (array): Related knowledge items
  - `id` (number): Related item ID
  - `title` (string): Item title
  - `excerpt` (string): First 200 characters
  - `category` (string): Item category
  - `tags` (string[]): Item tags
  - `relationshipType` (string): Relationship type (`"related_to"`, `"prerequisite"`, `"follows"`, `"contradicts"`)
  - `strength` (number): Relationship strength (0-1)
  - `depth` (number): Graph distance (1 or 2 hops)
- `count` (number): Number of results returned
- `maxDepth` (number): Maximum depth used

**Relationship Types**:
- `"related_to"`: General semantic relationship
- `"prerequisite"`: Source item requires target item knowledge
- `"follows"`: Source item builds on target item
- `"contradicts"`: Source item contradicts target item

**Graph Traversal**:
- **1-hop** (`maxDepth: 1`): Direct relationships only
- **2-hop** (`maxDepth: 2`): Direct + indirect relationships (friend-of-friend)

**Performance**: 15-40ms (depends on graph size and depth)

**Example Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 30,
  "method": "tools/call",
  "params": {
    "name": "knowledge.related",
    "arguments": {
      "itemId": 42,
      "maxDepth": 2,
      "limit": 10,
      "minStrength": 0.5
    }
  }
}
```

**Error Cases**:
- Invalid itemId (not a number) → `-32602 Invalid params`
- Item not found → `-32602 Invalid params` (404 status)
- Invalid maxDepth (not 1 or 2) → `-32602 Invalid params`
- Graph traversal error → `-32603 Internal error`

---

## Resources

### knowledge://item/{id}

Read a specific knowledge item by ID with full content and graph relationships.

**URI Pattern**: `knowledge://item/{id}`

**Example**: `knowledge://item/42`

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 40,
  "method": "resources/read",
  "params": {
    "uri": "knowledge://item/42"
  }
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 40,
  "result": {
    "contents": [{
      "uri": "knowledge://item/42",
      "mimeType": "text/markdown",
      "text": "# PostgreSQL Indexing Best Practices\n\n**Category:** Database\n**Tags:** postgresql, indexing, performance\n**ID:** 42\n**Created:** 2025-11-10T14:30:00.000Z\n**Updated:** 2025-11-12T09:15:00.000Z\n\n---\n\nThis guide covers indexing strategies for PostgreSQL...\n\n---\n\n## Related Knowledge\n\n**Links to:**\n- [Query Optimization](knowledge://item/17) (related_to, weight: 0.87)\n- [EXPLAIN ANALYZE Guide](knowledge://item/23) (prerequisite, weight: 0.72)\n\n**Linked from:**\n- [Database Performance Tuning](knowledge://item/99) (prerequisite, weight: 0.91)\n"
    }]
  }
}
```

**Content Format** (Markdown):
```markdown
# {title}

**Category:** {category}
**Tags:** {tag1, tag2, ...}
**ID:** {id}
**Created:** {ISO 8601 timestamp}
**Updated:** {ISO 8601 timestamp}

---

{full content}

---

## Related Knowledge

**Links to:**
- [{related_title}](knowledge://item/{id}) ({relationship_type}, weight: {0.XX})

**Linked from:**
- [{related_title}](knowledge://item/{id}) ({relationship_type}, weight: {0.XX})
```

**Performance**: <15ms

**Use Cases**:
- Agent needs full context for specific knowledge item
- Agent wants to understand graph relationships before making decisions
- Agent needs metadata (tags, category, timestamps)

**Error Cases**:
- Invalid URI format → `-32602 Invalid params`
- Item not found → `-32602 Invalid params` (404 status)
- Database error → `-32603 Internal error`

---

## Error Codes

ProjectPulse MCP Server uses standard JSON-RPC 2.0 error codes.

| Code | Name | HTTP Status | Description | Example |
|------|------|-------------|-------------|---------|
| `-32700` | Parse error | 400 | Invalid JSON | Malformed request body |
| `-32600` | Invalid Request | 400 | Invalid JSON-RPC 2.0 format | Missing `jsonrpc: "2.0"` |
| `-32601` | Method not found | 404 | Unknown method or tool | `"method": "tools/unknown"` |
| `-32602` | Invalid params | 400 | Invalid method parameters | Query too short, invalid limit |
| `-32603` | Internal error | 500 | Server-side error | Database error, embedding failure |

### Error Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid query length: must be 1-1000 characters",
    "data": {
      "field": "query",
      "minLength": 1,
      "maxLength": 1000,
      "actualLength": 1200
    }
  }
}
```

**Error Data Field**:
The optional `data` field provides additional context:
- `field`: Parameter name that caused the error
- `minLength` / `maxLength`: Validation constraints
- `availableTools`: List of valid tools (for `-32601`)
- `originalCode`: Original error code from backend service

---

## Examples

### Example 1: Search Knowledge Base

```bash
curl -X POST http://192.168.1.15:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "knowledge.search",
      "arguments": {
        "query": "PostgreSQL indexing best practices",
        "mode": "hybrid",
        "limit": 3
      }
    }
  }'
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "results": [
      {
        "id": 42,
        "title": "PostgreSQL Indexing Best Practices",
        "excerpt": "This guide covers indexing strategies for PostgreSQL, including B-tree, GIN, GiST, and HNSW indexes...",
        "category": "Database",
        "tags": ["postgresql", "indexing", "performance"],
        "score": 0.92,
        "matchType": "hybrid"
      },
      {
        "id": 17,
        "title": "Query Optimization with EXPLAIN",
        "excerpt": "Understanding EXPLAIN output is crucial for query optimization...",
        "category": "Database",
        "tags": ["postgresql", "explain", "optimization"],
        "score": 0.78,
        "matchType": "semantic"
      },
      {
        "id": 99,
        "title": "HNSW Index Performance Tuning",
        "excerpt": "HNSW indexes provide fast approximate nearest neighbor search for vector data...",
        "category": "Database",
        "tags": ["pgvector", "hnsw", "indexing"],
        "score": 0.65,
        "matchType": "fulltext"
      }
    ],
    "query": "PostgreSQL indexing best practices",
    "mode": "hybrid",
    "count": 3,
    "duration": 28
  }
}
```

---

### Example 2: Create Knowledge Item

```bash
curl -X POST http://192.168.1.15:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "knowledge.create",
      "arguments": {
        "title": "Docker Multi-Stage Builds",
        "content": "Multi-stage builds in Docker allow you to optimize image size by separating build-time dependencies from runtime dependencies...",
        "category": "DevOps",
        "tags": ["docker", "containers", "optimization"]
      }
    }
  }'
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "id": 150,
    "title": "Docker Multi-Stage Builds",
    "content": "Multi-stage builds in Docker allow you to optimize image size...",
    "category": "DevOps",
    "tags": ["docker", "containers", "optimization"],
    "createdAt": "2025-11-13T10:45:23.456Z",
    "embeddingProvider": "ollama",
    "embeddingDuration": 520
  }
}
```

---

### Example 3: Find Related Items

```bash
curl -X POST http://192.168.1.15:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "knowledge.related",
      "arguments": {
        "itemId": 42,
        "maxDepth": 2,
        "limit": 5,
        "minStrength": 0.6
      }
    }
  }'
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "itemId": 42,
    "related": [
      {
        "id": 17,
        "title": "Query Optimization with EXPLAIN",
        "excerpt": "Understanding EXPLAIN output is crucial for query optimization...",
        "category": "Database",
        "tags": ["postgresql", "explain", "optimization"],
        "relationshipType": "related_to",
        "strength": 0.87,
        "depth": 1
      },
      {
        "id": 99,
        "title": "HNSW Index Performance",
        "excerpt": "HNSW indexes provide fast approximate nearest neighbor search...",
        "category": "Database",
        "tags": ["pgvector", "hnsw", "indexing"],
        "relationshipType": "prerequisite",
        "strength": 0.72,
        "depth": 2
      }
    ],
    "count": 2,
    "maxDepth": 2
  }
}
```

---

### Example 4: Read Resource

```bash
curl -X POST http://192.168.1.15:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "resources/read",
    "params": {
      "uri": "knowledge://item/42"
    }
  }'
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "contents": [{
      "uri": "knowledge://item/42",
      "mimeType": "text/markdown",
      "text": "# PostgreSQL Indexing Best Practices\n\n**Category:** Database\n**Tags:** postgresql, indexing, performance\n**ID:** 42\n**Created:** 2025-11-10T14:30:00.000Z\n**Updated:** 2025-11-12T09:15:00.000Z\n\n---\n\nThis guide covers indexing strategies for PostgreSQL, including:\n\n1. B-tree indexes (default, most common)\n2. GIN indexes (full-text search)\n3. GiST indexes (geometric data)\n4. HNSW indexes (vector similarity with pgvector)\n\n## B-tree Indexes\n\nB-tree is the default index type in PostgreSQL...\n\n---\n\n## Related Knowledge\n\n**Links to:**\n- [Query Optimization with EXPLAIN](knowledge://item/17) (related_to, weight: 0.87)\n- [EXPLAIN ANALYZE Deep Dive](knowledge://item/23) (prerequisite, weight: 0.72)\n\n**Linked from:**\n- [Database Performance Tuning Overview](knowledge://item/99) (prerequisite, weight: 0.91)\n"
    }]
  }
}
```

---

### Example 5: List Available Resources

```bash
curl -X POST http://192.168.1.15:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "resources/list"
  }'
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "resources": [
      {
        "uri": "knowledge://item/150",
        "name": "Docker Multi-Stage Builds",
        "description": "Knowledge item: Docker Multi-Stage Builds (DevOps)",
        "mimeType": "text/markdown"
      },
      {
        "uri": "knowledge://item/42",
        "name": "PostgreSQL Indexing Best Practices",
        "description": "Knowledge item: PostgreSQL Indexing Best Practices (Database)",
        "mimeType": "text/markdown"
      },
      {
        "uri": "knowledge://item/17",
        "name": "Query Optimization with EXPLAIN",
        "description": "Knowledge item: Query Optimization with EXPLAIN (Database)",
        "mimeType": "text/markdown"
      }
    ]
  }
}
```

---

### Example 6: Error - Invalid Query Length

```bash
curl -X POST http://192.168.1.15:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 6,
    "method": "tools/call",
    "params": {
      "name": "knowledge.search",
      "arguments": {
        "query": ""
      }
    }
  }'
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "error": {
    "code": -32602,
    "message": "Invalid query length: must be 1-1000 characters",
    "data": {
      "field": "query",
      "minLength": 1,
      "maxLength": 1000,
      "actualLength": 0
    }
  }
}
```

---

### Example 7: Error - Tool Not Found

```bash
curl -X POST http://192.168.1.15:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 7,
    "method": "tools/call",
    "params": {
      "name": "knowledge.delete",
      "arguments": {}
    }
  }'
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "error": {
    "code": -32601,
    "message": "Unknown tool: knowledge.delete",
    "data": {
      "availableTools": [
        "knowledge.search",
        "knowledge.create",
        "knowledge.related"
      ]
    }
  }
}
```

---

## Performance Summary

| Operation | Target | Actual (Days 1-4 Testing) |
|-----------|--------|---------------------------|
| Session validation | <5ms | 1-2ms ✅ |
| JSON-RPC parsing | <5ms | 2-3ms ✅ |
| tools/list | <10ms | 3-5ms ✅ |
| knowledge.search (hybrid) | <50ms | 20-35ms ✅ |
| knowledge.create | <1000ms | 400-800ms ✅ |
| knowledge.related (2-hop) | <50ms | 15-40ms ✅ |
| resources/list | <30ms | 10-20ms ✅ |
| resources/read | <20ms | 8-15ms ✅ |

---

## Rate Limits

### MVP (Local Network)

**Status**: No rate limits

Local network deployment with trusted clients.

### Production (Planned)

**Status**: Planned for future sprint

**Planned Limits**:
- 100 requests/minute per client
- 1000 requests/hour per client
- Rate limit headers in response:
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 95`
  - `X-RateLimit-Reset: 1699999999`

---

## Client Configuration

See [MCP_QUICK_START.md](./MCP_QUICK_START.md) for complete client setup instructions.

**Quick Example** (Claude Code):
```json
{
  "mcpServers": {
    "projectpulse": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-http"],
      "env": {
        "MCP_HTTP_URL": "http://192.168.1.15:3000/api/mcp"
      }
    }
  }
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-13 | Initial API reference (Sprint 5.5 Day 5) |

---

## Related Documentation

- [MCP Architecture](./MCP_ARCHITECTURE.md) - System design and component overview
- [MCP Quick Start Guide](./MCP_QUICK_START.md) - Client setup instructions
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/docs)

---

**Document Status**: ✅ Complete (Task 18/21)
**Next**: Run quality gates (TypeScript + build validation - Task 19/21)
