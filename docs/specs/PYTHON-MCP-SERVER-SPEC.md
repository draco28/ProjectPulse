# Python MCP Server - Learning Project Specification

**Project**: ProjectPulse Python MCP Server (Dev/Learning)  
**Purpose**: Learn Python MCP development using real production patterns  
**Approach**: Pair Programming (You implement, Claude guides)  
**Target**: Interview prep for AI Agent Workflow Integration role

---

## 1. Learning Objectives

By the end of this project, you will understand:

### MCP Protocol Fundamentals
- [ ] What MCP is and why it exists (LLM tool integration standard)
- [ ] MCP transport types (stdio, streamable HTTP)
- [ ] JSON-RPC 2.0 message format
- [ ] Tool definitions, schemas, and execution flow

### Python MCP SDK
- [ ] FastMCP high-level API vs low-level Server API
- [ ] Tool decorators and type hints
- [ ] Pydantic for input/output validation
- [ ] Async/await patterns in Python
- [ ] Error handling and response formatting

### Production Patterns
- [ ] HTTP proxy architecture (MCP → API → Database)
- [ ] Bearer token authentication middleware
- [ ] Environment configuration
- [ ] Docker containerization
- [ ] Health checks and observability

### Interview-Ready Knowledge
- [ ] Explain MCP to a non-technical interviewer
- [ ] Compare TypeScript vs Python SDK approaches
- [ ] Discuss tool design decisions
- [ ] Walk through authentication flow
- [ ] Debug MCP client connection issues

---

## 2. What We're Building

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Agent (Claude Code)                    │
│                              │                                   │
│                    MCP Protocol (JSON-RPC)                       │
│                              │                                   │
│              ┌───────────────┴───────────────┐                   │
│              ▼                               ▼                   │
│   ┌─────────────────────┐       ┌─────────────────────┐         │
│   │ TypeScript MCP      │       │ Python MCP Server   │         │
│   │ (87 tools)          │       │ (10 tools - NEW)    │         │
│   │ Port 3001           │       │ Port 3002           │         │
│   └──────────┬──────────┘       └──────────┬──────────┘         │
│              │                              │                    │
│              └───────────────┬──────────────┘                   │
│                              ▼                                   │
│                    ┌─────────────────────┐                       │
│                    │ Next.js API         │                       │
│                    │ Port 3000           │                       │
│                    └──────────┬──────────┘                       │
│                               ▼                                  │
│                    ┌─────────────────────┐                       │
│                    │ PostgreSQL + Redis  │                       │
│                    └─────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Proxy Pattern**: Python MCP server calls Next.js API (same as TypeScript)
   - Why: Keeps business logic in one place, Python is just a thin layer
   
2. **Same Tool Names**: Use identical tool names as TypeScript
   - Why: Proves MCP is language-agnostic, tools are interchangeable

3. **Subset of Tools**: 10 tools vs 87
   - Why: Focused learning, covers all patterns without repetition

---

## 3. Technology Stack

| Component | Technology | Why |
|-----------|------------|-----|
| MCP SDK | `mcp` (official Python SDK) | Production-ready, maintained by Anthropic |
| HTTP Client | `httpx` | Modern async HTTP, similar to axios |
| Validation | `pydantic` | Type-safe, JSON schema generation |
| Web Framework | Built into FastMCP (Starlette) | MCP SDK handles HTTP transport |
| Package Manager | `uv` (preferred) or `pip` | Fast, modern Python tooling |

### Version Requirements
```
Python >= 3.11
mcp >= 1.7.1
httpx >= 0.27.0
pydantic >= 2.0
python-dotenv >= 1.0.0
```

---

## 4. Project Structure

```
apps/mcp-server-python/
├── pyproject.toml           # Project config (dependencies, metadata)
├── requirements.txt          # Pip fallback
├── .env.example              # Environment template
├── README.md                 # Setup instructions
│
├── src/
│   ├── __init__.py
│   ├── main.py               # Entry point - FastMCP server
│   ├── config.py             # Environment configuration
│   ├── http_client.py        # Async HTTP client with auth
│   ├── auth.py               # Bearer token middleware
│   │
│   └── tools/
│       ├── __init__.py       # Tool registry
│       ├── health.py         # Phase 1: healthCheck
│       ├── tickets.py        # Phase 2: search, create
│       ├── knowledge.py      # Phase 3: search
│       ├── context.py        # Phase 4: load (complex)
│       ├── wiki.py           # Phase 5: search
│       ├── personas.py       # Phase 5: list
│       ├── kanban.py         # Phase 6: getBoard
│       ├── sessions.py       # Phase 6: start
│       └── roadmap.py        # Phase 6: getCurrentPosition
│
├── tests/
│   ├── __init__.py
│   ├── test_health.py
│   ├── test_tickets.py
│   └── ...
│
└── Dockerfile                # Container for deployment
```

---

## 5. Implementation Phases

### Phase 1: Foundation (Session 1)
**Goal**: Get a working MCP server that responds to clients

**You will learn**:
- Python project setup with uv/pyproject.toml
- FastMCP basic usage
- Environment configuration
- Running and testing MCP server

**Tasks**:
1. [ ] Create project structure
2. [ ] Set up pyproject.toml with dependencies
3. [ ] Create config.py with environment loading
4. [ ] Create main.py with minimal FastMCP server
5. [ ] Implement `projectpulse_health_check` tool
6. [ ] Test with MCP Inspector

**Success Criteria**:
- Server starts on port 3002
- `projectpulse_health_check` returns server status
- MCP Inspector can connect and list tools

---

### Phase 2: HTTP Client & First Real Tool (Session 2)
**Goal**: Call the Next.js API from Python

**You will learn**:
- Async HTTP with httpx
- Bearer token authentication
- Pydantic models for request/response
- Error handling patterns

**Tasks**:
1. [ ] Create http_client.py with async httpx client
2. [ ] Add bearer token injection
3. [ ] Implement `projectpulse_ticket_search` tool
4. [ ] Implement `projectpulse_ticket_create` tool
5. [ ] Add proper error handling

**Success Criteria**:
- Can search tickets from Python MCP server
- Can create tickets from Python MCP server
- Errors are handled gracefully

---

### Phase 3: Knowledge Search (Session 3)
**Goal**: Implement semantic/hybrid search tool

**You will learn**:
- Multiple search modes (semantic, fulltext, hybrid)
- Query parameter construction
- Response transformation

**Tasks**:
1. [ ] Implement `projectpulse_knowledge_search` tool
2. [ ] Handle search mode parameter
3. [ ] Format response with relevance scores
4. [ ] Add context hints (matching TypeScript behavior)

**Success Criteria**:
- Can search knowledge base with all three modes
- Response format matches TypeScript version

---

### Phase 4: Context Loading (Session 4)
**Goal**: Implement the most complex tool

**You will learn**:
- Multiple API calls aggregation
- Complex response building
- Session detection and hints

**Tasks**:
1. [ ] Implement `projectpulse_context_load` tool
2. [ ] Aggregate memory banks from multiple endpoints
3. [ ] Detect active sessions
4. [ ] Generate workflow hints

**Success Criteria**:
- Returns all 5 memory banks
- Detects active sessions
- Response matches TypeScript format

---

### Phase 5: Wiki & Personas (Session 5)
**Goal**: Complete the read-focused tools

**You will learn**:
- Simple list/get patterns
- Optional parameter handling
- Consistent response formatting

**Tasks**:
1. [ ] Implement `projectpulse_wiki_search` tool
2. [ ] Implement `projectpulse_persona_list` tool
3. [ ] Add optional filters

**Success Criteria**:
- Both tools work and match TypeScript responses

---

### Phase 6: Remaining Tools & Polish (Session 6)
**Goal**: Complete all 10 tools and add production features

**You will learn**:
- Stateful tool patterns (sessions)
- Hierarchy data (kanban)
- Docker containerization

**Tasks**:
1. [ ] Implement `projectpulse_kanban_getBoard` tool
2. [ ] Implement `projectpulse_agent_session_start` tool
3. [ ] Implement `projectpulse_roadmap_getCurrentPosition` tool
4. [ ] Add Dockerfile
5. [ ] Test all tools end-to-end

**Success Criteria**:
- All 10 tools working
- Docker container runs successfully
- Can switch between Python and TypeScript servers

---

## 6. Tool Specifications

### Tool 1: projectpulse_health_check

**Purpose**: Verify server and API connectivity

**Input Schema**:
```python
# No inputs required
```

**Output**:
```json
{
  "status": "healthy",
  "server": "projectpulse-mcp-python",
  "version": "0.1.0",
  "api_reachable": true,
  "timestamp": "2025-01-20T12:00:00Z"
}
```

**API Call**: `GET /api/health`

---

### Tool 2: projectpulse_ticket_search

**Purpose**: Search tickets with filters

**Input Schema**:
```python
class TicketSearchInput(BaseModel):
    kind: list[str] | None = None  # feature, task, bug, etc.
    status: list[str] | None = None
    priority: list[str] | None = None
    search: str | None = None
    page: int = 1
    pageSize: int = 20
```

**Output**: Paginated ticket list with summary fields

**API Call**: `GET /api/tickets?{params}`

---

### Tool 3: projectpulse_ticket_create

**Purpose**: Create a new ticket

**Input Schema**:
```python
class TicketCreateInput(BaseModel):
    title: str
    kind: Literal["feature", "task", "bug", "issue", "epic", "tech_debt"]
    description: str | None = None
    priority: Literal["low", "medium", "high", "critical"] = "medium"
    status: str = "backlog"
```

**Output**: Created ticket details

**API Call**: `POST /api/tickets`

---

### Tool 4: projectpulse_knowledge_search

**Purpose**: Search knowledge base

**Input Schema**:
```python
class KnowledgeSearchInput(BaseModel):
    projectId: int
    query: str
    mode: Literal["semantic", "fulltext", "hybrid"] = "hybrid"
    limit: int = 5
    category: str | None = None
```

**Output**: Knowledge items with relevance scores

**API Call**: `GET /api/knowledge/search?{params}`

---

### Tool 5: projectpulse_context_load

**Purpose**: Load full project context (entry point tool)

**Input Schema**:
```python
class ContextLoadInput(BaseModel):
    projectId: int
    banksToLoad: Literal["all", "active-only"] = "all"
```

**Output**: Memory banks, active sessions, workflow hints

**API Calls**: Multiple - aggregates from several endpoints

---

### Tool 6: projectpulse_wiki_search

**Purpose**: Search wiki pages

**Input Schema**:
```python
class WikiSearchInput(BaseModel):
    projectId: int
    query: str
    limit: int = 10
```

**Output**: Wiki page summaries with relevance

**API Call**: `GET /api/wiki/search?{params}`

---

### Tool 7: projectpulse_persona_list

**Purpose**: List available agent personas

**Input Schema**:
```python
class PersonaListInput(BaseModel):
    projectId: int
    includeBuiltIn: bool = True
```

**Output**: List of personas with skills and tools

**API Call**: `GET /api/personas?{params}`

---

### Tool 8: projectpulse_kanban_getBoard

**Purpose**: Get kanban board with swimlanes

**Input Schema**:
```python
class KanbanGetBoardInput(BaseModel):
    projectId: int
    sprintNumber: int | None = None
```

**Output**: Board with columns and cards

**API Call**: `GET /api/kanban/board?{params}`

---

### Tool 9: projectpulse_agent_session_start

**Purpose**: Start a new agent work session

**Input Schema**:
```python
class SessionStartInput(BaseModel):
    projectId: int
    name: str
    plan: str | None = None
    activeTicketIds: list[int] | None = None
```

**Output**: Session ID and initial state

**API Call**: `POST /api/agent-sessions`

---

### Tool 10: projectpulse_roadmap_getCurrentPosition

**Purpose**: Get current position in project roadmap

**Input Schema**:
```python
class RoadmapPositionInput(BaseModel):
    projectId: int
```

**Output**: Current phase, sprint, week, day

**API Call**: `GET /api/roadmap/current-position?{params}`

---

## 7. How We'll Work Together

### Pair Programming Format

1. **I explain the concept** (5 min)
   - What we're building and why
   - Key patterns to understand
   - Common pitfalls to avoid

2. **You implement** (15-30 min)
   - Write the code yourself
   - Ask questions when stuck
   - Make mistakes - that's how you learn

3. **I review and guide** (5-10 min)
   - Point out improvements
   - Explain alternatives
   - Connect to interview topics

4. **You test and iterate** (5-10 min)
   - Run the code
   - Fix issues
   - Verify it works

### When You're Stuck

Ask me:
- "What's the Python equivalent of [TypeScript pattern]?"
- "Why is this error happening?"
- "Is there a better way to do this?"
- "How would I explain this in an interview?"

### Quality Expectations

- **Don't just copy-paste** - understand what you write
- **Type hints everywhere** - Python 3.11+ style
- **Docstrings on functions** - explain what they do
- **Test as you go** - use MCP Inspector frequently

---

## 8. Prerequisites Before Starting

### You Need

1. **Python 3.11+** installed
   ```bash
   python3 --version  # Should be 3.11+
   ```

2. **uv** package manager (recommended)
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

3. **MCP Inspector** for testing
   ```bash
   npx @modelcontextprotocol/inspector
   ```

4. **ProjectPulse running** (Docker)
   ```bash
   docker compose -f docker-compose.cloud.yml up -d
   curl http://localhost:3000/api/health  # Should return healthy
   ```

5. **Agent token** for authentication
   - Get from ProjectPulse UI: Settings → Agent Tokens
   - Or use existing token from TypeScript MCP config

---

## 9. Success Metrics

### Technical
- [ ] All 10 tools implemented and working
- [ ] Matches TypeScript server response formats
- [ ] Docker container runs successfully
- [ ] No type errors (mypy clean)

### Learning
- [ ] Can explain MCP protocol without notes
- [ ] Can compare Python vs TypeScript SDK
- [ ] Can debug connection issues independently
- [ ] Can extend with new tools on your own

### Interview Ready
- [ ] Can whiteboard the architecture
- [ ] Can walk through code explaining decisions
- [ ] Can discuss trade-offs and alternatives
- [ ] Can answer "why Python?" questions

---

## 10. Resources

### Official Documentation
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Pydantic v2 Docs](https://docs.pydantic.dev/)
- [httpx Docs](https://www.python-httpx.org/)

### Your TypeScript Reference
- `apps/mcp-server/src/tools/` - See how tools are structured
- `apps/mcp-server/src/index-http.ts` - Server setup
- `apps/mcp-server/src/httpClient.ts` - HTTP client patterns

---

## Ready to Start?

Review this spec and let me know:

1. **Does the scope feel right?** (10 tools, 6 sessions)
2. **Any tools you want to add/remove?**
3. **Any concepts you want to prioritize?**
4. **When do you want to start Phase 1?**

Once you approve, we'll create the project structure and begin!
