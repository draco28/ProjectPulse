# Python MCP Server V2 — Production Spec with Tool Profiles

**Project**: ProjectPulse Python MCP Server
**Version**: 2.0
**Status**: Canonical (supersedes PYTHON-MCP-SERVER-SPEC.md and PYTHON-MCP-SERVER-PRODUCTION-SPEC.md)
**Purpose**: Full-parity Python MCP server with smart tool profile system to eliminate context bloat
**Port**: 3002 (alongside TypeScript server on 3001)
**Tracking**: This spec is the single source of truth for work tracking (no ProjectPulse tickets)
**Branch**: `feature/python-mcp-server` — no pushes to remote until all phases complete
**Schema Changes**: None — Python server is a pure API proxy, no Prisma migrations needed

---

## Work Tracking

This spec doubles as the work tracker. Check off phases as completed:

- [x] Phase 1: Infrastructure Foundation
- [x] Phase 2: Profile System + Health Tool
- [x] Phase 3: Core Tools — Context & Sessions
- [x] Phase 4: Core Tools — Tickets & Kanban
- [x] Phase 5: Core Tools — Knowledge, Wiki, Resources
- [x] Phase 6: Core Tools — Roadmap, Sprint, Workflow, Backlog
- [x] Phase 7: Non-Core Profiles
- [x] Phase 8: Docker & Deployment
- [x] Phase 9: Testing & Polish
- [ ] All phases complete → push to remote + merge to master

---

## 1. Executive Summary

### The Problem

The TypeScript MCP server registers **86 tools** for every client connection, injecting ~15-20K tokens of tool schemas into every conversation. Onboarding tools (used once per project), batch tools, deprecated memory tools, and rare admin tools all load regardless of need.

### The Solution

A Python MCP server with **full tool parity** (79 tools, minus deprecated/legacy) and a **Tool Profile System** that:
- Loads only **~48 core tools** by default (daily work)
- Detects project state via `context_load` and **hints the LLM** to load additional profiles on demand
- Provides a `manage_profiles` meta-tool for **runtime dynamic loading/unloading**
- Sends `notifications/tools/list_changed` to refresh client tool lists

### Key Metrics

| Metric | TypeScript (current) | Python (planned) |
|--------|---------------------|------------------|
| Total tools | 86 (includes 8 deprecated/legacy) | 79 (clean, no legacy) |
| Default session tools | 86 (all) | ~48 (core profile) |
| Token cost of tools/list | ~15-20K | ~8-10K (**~50% reduction**) |
| Auth model | AsyncLocalStorage | contextvars (equivalent) |
| Schema validation | Zod + manual JSON Schema | Pydantic v2 (auto JSON Schema) |
| Transport | HTTP Streamable (port 3001) | HTTP Streamable (port 3002) |
| Dynamic tool loading | None | manage_profiles meta-tool |

---

## 2. Architecture

### 2a. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI Agent (Claude Code)                       │
│                              │                                   │
│                    MCP Protocol (JSON-RPC 2.0)                   │
│                              │                                   │
│              ┌───────────────┴───────────────┐                   │
│              ▼                               ▼                   │
│   ┌─────────────────────┐       ┌─────────────────────┐         │
│   │ TypeScript MCP      │       │ Python MCP Server   │         │
│   │ (86 tools - all)    │       │ (79 tools - profiled│         │
│   │ Port 3001           │       │  ~48 default)       │         │
│   │ Express + SDK       │       │ Port 3002           │         │
│   └──────────┬──────────┘       │ FastMCP + Starlette │         │
│              │                   └──────────┬──────────┘         │
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

### 2b. Internal Architecture

```
Request Flow:

  Client ──► Starlette App
               │
               ├─► CORS Middleware
               ├─► Accept Header Fix Middleware
               ├─► Bearer Auth Middleware
               │     └─► validates token via /api/agent-auth/validate
               │     └─► sets contextvars (AgentAuth)
               │
               ├─► Emergency Shutdown Check (5s TTL cache)
               ├─► Global Blocklist Check (5s TTL cache)
               │
               ▼
           ProfileAwareMCP (FastMCP subclass)
               │
               ├─► tools/list ──► filtered by active profiles + per-token blocklist
               ├─► tools/call ──► validate → execute → log (fire-and-forget)
               │
               ▼
           httpx AsyncClient
               └─► injects Authorization header from contextvars
               └─► calls Next.js API at localhost:3000/api
```

### 2c. Profile System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Master Tool Registry                    │
│  (Python dict: profile_name → list[ToolFunction])        │
│                                                          │
│  core:        [context_load, ticket_search, ...]  (48)   │
│  onboarding:  [getPhasedQuestions, savePhase, ...]  (13) │
│  admin:       [batch_createPersonas, ...]           (12) │
│  utility:     [traceability_generate, ...]           (4) │
│  observability: [logStep, completeSession]            (2)│
└─────────────────────┬────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────┐
│                   Profile Manager                         │
│                                                          │
│  active_profiles: {"core"}  ← default from env var       │
│                                                          │
│  activate("onboarding") → adds tools to FastMCP          │
│  deactivate("onboarding") → removes tools from FastMCP   │
│  → sends notifications/tools/list_changed                 │
└─────────────────────┬────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────┐
│              ProfileAwareMCP (FastMCP subclass)           │
│                                                          │
│  _tool_manager._tools: {active tools only}               │
│                                                          │
│  list_tools() → super().list_tools()                     │
│              → filter by per-token blocklist/allowlist    │
│              → return filtered list                       │
└──────────────────────────────────────────────────────────┘
```

**Smart Default Flow**:
1. Server starts with `TOOL_PROFILES=core` (env var, default)
2. Client connects → `tools/list` returns ~48 core tools
3. Client calls `context_load` → response includes project state
4. If onboarding incomplete → response includes: `"_profileHint": "Load 'onboarding' profile via manage_profiles to access onboarding tools"`
5. LLM calls `manage_profiles(action="load", profiles=["onboarding"])`
6. Server adds 13 onboarding tools, sends `tools/list_changed` notification
7. Client re-fetches `tools/list` → now 61 tools available
8. When onboarding completes → LLM calls `manage_profiles(action="unload", profiles=["onboarding"])`

---

## 3. Technology Stack

| Component | Technology | Why |
|-----------|------------|-----|
| MCP SDK | `mcp >= 1.7.1` (FastMCP) | Official Python SDK by Anthropic |
| HTTP Client | `httpx >= 0.27.0` | Modern async HTTP, connection pooling |
| Validation | `pydantic >= 2.0` | Auto JSON Schema from type hints |
| Settings | `pydantic-settings >= 2.0` | Env var loading with validation |
| Web Framework | Starlette (via FastMCP) | ASGI, middleware support |
| Logging | `structlog >= 24.0` | JSON structured logging |
| Package Manager | `uv` | Fast, lockfile support |
| Python | `>= 3.11` | contextvars, modern typing |

---

## 4. Project Structure

```
apps/mcp-server-python/
├── pyproject.toml                    # Dependencies, build config
├── uv.lock                          # Lockfile (exists)
├── .env.example                     # Environment template
├── .env                             # Local config (gitignored)
├── .python-version                  # 3.11 (exists)
├── Dockerfile                       # Multi-stage production build
├── README.md                        # Setup and usage
│
├── src/
│   ├── __init__.py
│   ├── main.py                      # Entry point: create app, register profiles, run
│   ├── config.py                    # Pydantic Settings (upgrade from existing TypedDict)
│   ├── logger.py                    # structlog JSON logging
│   ├── server.py                    # ProfileAwareMCP(FastMCP) subclass
│   │
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── context.py              # contextvars AgentAuth
│   │   └── middleware.py           # Bearer auth, CORS, Accept header fix
│   │
│   ├── http/
│   │   ├── __init__.py
│   │   └── client.py              # httpx AsyncClient with auth injection
│   │
│   ├── admin/
│   │   ├── __init__.py
│   │   └── controls.py            # Emergency shutdown, blocklist, tool logging
│   │
│   ├── profiles/
│   │   ├── __init__.py
│   │   ├── registry.py            # Master tool registry by profile
│   │   ├── manager.py             # Activate/deactivate profiles
│   │   └── meta_tool.py           # manage_profiles tool
│   │
│   └── tools/
│       ├── __init__.py
│       ├── _base.py               # Shared helpers
│       ├── health.py              # 1 tool
│       ├── context.py             # 3 tools
│       ├── sessions.py            # 4 tools
│       ├── tickets.py             # 9 tools
│       ├── kanban.py              # 2 tools
│       ├── knowledge.py           # 8 tools (4 core + 4 admin)
│       ├── wiki.py                # 6 tools (5 core + 1 utility)
│       ├── resources.py           # 6 tools
│       ├── roadmap.py             # 5 tools (2 core + 3 admin)
│       ├── sprint.py              # 3 tools (2 core + 1 admin)
│       ├── workflow.py            # 7 tools
│       ├── backlog.py             # 2 tools
│       ├── onboarding.py          # 13 tools
│       ├── batch.py               # 4 tools
│       ├── traceability.py        # 2 tools
│       ├── observability.py       # 2 tools
│       └── repo.py                # 1 tool
│
└── tests/
    ├── conftest.py                # Shared fixtures (mock httpx, auth context)
    ├── test_config.py
    ├── test_auth.py
    ├── test_profiles.py
    └── test_tools/
        ├── test_health.py
        ├── test_context.py
        ├── test_tickets.py
        └── ...
```

---

## 5. Configuration

### URL Architecture

The Python MCP server must work in all environments:

| Environment | API Base URL (Python → Next.js) | Python MCP Endpoint | How Accessed |
|-------------|--------------------------------|---------------------|-------------|
| **Dev (local)** | `http://localhost:3000/api` | `http://localhost:3002` | Direct localhost |
| **Dev (Docker)** | `http://nextjs:3000/api` | `http://mcp-server-python:3002` | Docker network |
| **Prod (internal)** | `http://prod-nextjs:3000/api` | `http://prod-mcp-python:3002` | Docker network |
| **Prod (local)** | `http://localhost:8080/api` | `http://localhost:8082` | Mac mini localhost |
| **Prod (public)** | N/A (internal only) | `https://projectpulsemcp-py.dracodev.dev` | Cloudflare Tunnel |

**Key point**: `PROJECTPULSE_API_BASE_URL` is the URL the Python server uses to reach the Next.js API.
- In dev: `http://localhost:3000/api` (running locally) or `http://nextjs:3000/api` (Docker)
- In prod: `http://prod-nextjs:3000/api` (internal Docker network, never exposed to internet)

**Cloudflare Tunnel**: Production public access via `https://projectpulsemcp-py.dracodev.dev` will need a new route in the Cloudflare Zero Trust dashboard pointing to `http://prod-mcp-python:3002`. This is configured in the dashboard, not in code.

### Environment Variables

```env
# === API connection (configurable per environment) ===
PROJECTPULSE_API_BASE_URL=http://localhost:3000/api   # Dev local
# PROJECTPULSE_API_BASE_URL=http://nextjs:3000/api    # Dev Docker
# PROJECTPULSE_API_BASE_URL=http://prod-nextjs:3000/api  # Prod Docker
PROJECTPULSE_API_TOKEN=              # Required in production
MCP_SERVER_PORT=3002
NODE_ENV=development                 # development | production | test

# === Profile system ===
TOOL_PROFILES=core                    # Comma-separated: core,onboarding,admin,utility,observability

# === Security ===
MCP_INTERNAL_SECRET=                  # HMAC secret for admin API calls
ALLOWED_ORIGINS=                      # CORS origins (comma-separated)
# Dev: empty (allow all)
# Prod: https://projectpulse.dracodev.dev,https://projectpulsemcp-py.dracodev.dev

# === Logging ===
LOG_LEVEL=info                        # debug/info/warning/error
```

### Pydantic Settings Model (upgrade from TypedDict)

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class AppConfig(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Server identity
    server_name: str = "projectpulse-mcp-python"
    server_version: str = "1.0.0"

    # API connection
    projectpulse_api_base_url: str = "http://localhost:3000/api"
    projectpulse_api_token: str = ""
    mcp_server_port: int = 3002
    node_env: Literal["development", "production", "test"] = "development"

    # Profile system
    tool_profiles: str = "core"  # Comma-separated, parsed to list

    # Security
    mcp_internal_secret: str = ""
    allowed_origins: str = ""  # Comma-separated, parsed to list

    # Logging
    log_level: str = "info"

    @property
    def active_profiles(self) -> list[str]:
        return [p.strip() for p in self.tool_profiles.split(",") if p.strip()]

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]
```

---

## 6. Infrastructure Specifications

### 6a. Auth Context (contextvars)

```python
import contextvars
from dataclasses import dataclass

@dataclass(frozen=True)
class AgentAuth:
    project_id: int
    token_id: int
    token_name: str
    raw_token: str
    blocked_tools: list[str]
    allowed_tools: list[str]  # Empty = all allowed

_agent_auth: contextvars.ContextVar[AgentAuth | None] = contextvars.ContextVar(
    "agent_auth", default=None
)

def get_agent_auth() -> AgentAuth | None:
    return _agent_auth.get()

def set_agent_auth(auth: AgentAuth) -> contextvars.Token:
    return _agent_auth.set(auth)

def is_tool_allowed(tool_name: str) -> bool:
    auth = get_agent_auth()
    if not auth:
        return True  # No auth = dev mode, allow all
    if tool_name in auth.blocked_tools:
        return False
    if auth.allowed_tools and tool_name not in auth.allowed_tools:
        return False
    return True
```

### 6b. Bearer Auth Middleware

Validates token via `POST /api/agent-auth/validate`, sets `contextvars`, injects project context.

**Token validation endpoint**: `POST /api/agent-auth/validate`
- Request: `{ "token": "<bearer_token>" }`
- Response: `{ "valid": true, "projectId": 6, "tokenId": 1, "tokenName": "...", "blockedTools": [...], "allowedTools": [...] }`

### 6c. HTTP Client with Auth Injection

```python
import httpx
from src.auth.context import get_agent_auth

class ProjectPulseClient:
    def __init__(self, base_url: str):
        self._base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(timeout=30.0)

    async def get(self, path: str, params: dict | None = None) -> dict:
        response = await self._client.get(
            f"{self._base_url}{path}",
            params=params,
            headers=self._auth_headers(),
        )
        response.raise_for_status()
        return response.json()

    async def post(self, path: str, json: dict | None = None) -> dict:
        response = await self._client.post(
            f"{self._base_url}{path}",
            json=json,
            headers=self._auth_headers(),
        )
        response.raise_for_status()
        return response.json()

    async def patch(self, path: str, json: dict | None = None) -> dict:
        response = await self._client.patch(
            f"{self._base_url}{path}",
            json=json,
            headers=self._auth_headers(),
        )
        response.raise_for_status()
        return response.json()

    async def put(self, path: str, json: dict | None = None) -> dict:
        response = await self._client.put(
            f"{self._base_url}{path}",
            json=json,
            headers=self._auth_headers(),
        )
        response.raise_for_status()
        return response.json()

    async def delete(self, path: str) -> dict:
        response = await self._client.delete(
            f"{self._base_url}{path}",
            headers=self._auth_headers(),
        )
        response.raise_for_status()
        return response.json()

    def _auth_headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        auth = get_agent_auth()
        if auth:
            headers["Authorization"] = f"Bearer {auth.raw_token}"
            headers["X-Agent-Project-Id"] = str(auth.project_id)
        return headers
```

### 6d. Admin Controls (Emergency Shutdown + Blocklist)

- `check_emergency_shutdown()`: Cached 5s TTL, calls `/api/admin/mcp/emergency`
- `check_blocked_tool(name)`: Cached 5s TTL, checks global blocklist via `/api/admin/mcp/blocked-tools`
- `log_tool_call(data)`: Fire-and-forget async POST to `/api/admin/mcp/stats`
- **Fail-open**: If admin API is unreachable, allow tool execution (matching TypeScript behavior)

### 6e. ProfileAwareMCP Subclass

```python
from mcp.server.fastmcp import FastMCP

class ProfileAwareMCP(FastMCP):
    """FastMCP subclass that filters tools/list by active profiles and per-token permissions."""

    async def list_tools(self) -> list:
        tools = await super().list_tools()
        # Per-token filtering (on top of profile filtering)
        auth = get_agent_auth()
        if auth:
            tools = [t for t in tools if is_tool_allowed(t.name)]
        return tools
```

---

## 7. Tool Profile Definitions

### 7a. Profile: `core` (48 tools) — Default

These are the daily-driver tools needed in every work session.

#### Meta Tool (1)

| Tool | Description |
|------|-------------|
| `projectpulse_manage_profiles` | Load/unload/list/status tool profiles at runtime |

#### Health (1)

| Tool | Description |
|------|-------------|
| `projectpulse_health_check` | Verify server and API connectivity |

#### Context (3)

| Tool | Description |
|------|-------------|
| `projectpulse_context_load` | Load all 5 memory banks + active sessions + hints |
| `projectpulse_context_lookup` | Token-efficient single bank lookup |
| `projectpulse_context_update` | Update memory bank content |

#### Agent Sessions (4)

| Tool | Description |
|------|-------------|
| `projectpulse_agent_session_start` | Start work session with plan/todos, auto-claim tickets |
| `projectpulse_agent_session_update` | Checkpoint progress, update todos |
| `projectpulse_agent_session_end` | Complete session, auto-sync memory banks |
| `projectpulse_agent_session_resume` | Resume paused session with full context |

#### Tickets (9)

| Tool | Description |
|------|-------------|
| `projectpulse_ticket_create` | Create ticket with full metadata |
| `projectpulse_ticket_bulkCreate` | Atomic bulk creation (1-50 tickets) |
| `projectpulse_ticket_update` | Partial update of ticket fields |
| `projectpulse_ticket_search` | Advanced search with 20+ filters |
| `projectpulse_ticket_get` | Full ticket details |
| `projectpulse_ticket_getChildren` | Paginated children of feature ticket |
| `projectpulse_ticket_getHierarchy` | Complete hierarchy context |
| `projectpulse_ticket_setStatus` | Change workflow status |
| `projectpulse_ticket_addComment` | Add progress note |

#### Kanban (2)

| Tool | Description |
|------|-------------|
| `projectpulse_kanban_getBoard` | Get sprint kanban board with columns |
| `projectpulse_kanban_moveTicket` | Move ticket between columns, auto-cascade |

#### Knowledge (4 core)

| Tool | Description |
|------|-------------|
| `projectpulse_knowledge_search` | Semantic/fulltext/hybrid search |
| `projectpulse_knowledge_create` | Create item with auto-embedding |
| `projectpulse_knowledge_get` | Get full item by ID |
| `projectpulse_knowledge_related` | Graph traversal for related items |

#### Wiki (5 core)

| Tool | Description |
|------|-------------|
| `projectpulse_wiki_search` | Search pages by title/content |
| `projectpulse_wiki_get` | Get full page by path |
| `projectpulse_wiki_create` | Create new page |
| `projectpulse_wiki_update` | Update page with audit trail |
| `projectpulse_wiki_analytics_summary` | Top pages, trending tags |

#### Resources (6)

| Tool | Description |
|------|-------------|
| `projectpulse_persona_list` | List agent personas |
| `projectpulse_persona_get` | Get full persona with systemPrompt |
| `projectpulse_skill_list` | List skills (metadata) |
| `projectpulse_skill_get` | Get full skill content |
| `projectpulse_sop_list` | List SOPs (metadata) |
| `projectpulse_sop_get` | Get full SOP content |

#### Roadmap (2 core)

| Tool | Description |
|------|-------------|
| `projectpulse_sprint_getCurrentPosition` | Current position in hierarchy |
| `projectpulse_roadmap_getPhaseProgress` | Full phase tree with nested sprints |

#### Sprint (2 core)

| Tool | Description |
|------|-------------|
| `projectpulse_sprint_queryHierarchy` | Query hierarchy with filters |
| `projectpulse_sprint_updateProgress` | Update progress with auto-rollup |

#### Workflow (7)

| Tool | Description |
|------|-------------|
| `projectpulse_workflow_list` | List available templates |
| `projectpulse_workflow_start` | Start workflow from template |
| `projectpulse_workflow_executeStep` | Execute current step |
| `projectpulse_workflow_getStatus` | Get workflow run status |
| `projectpulse_workflow_pause` | Pause with checkpoint |
| `projectpulse_workflow_resume` | Resume from checkpoint |
| `projectpulse_workflow_complete` | Mark completed/failed |

#### Backlog (2)

| Tool | Description |
|------|-------------|
| `projectpulse_backlog_list` | List all backlog items |
| `projectpulse_backlog_getBySprint` | Get items for specific sprint |

---

### 7b. Profile: `onboarding` (13 tools)

Only needed during project onboarding (once per project).

| Tool | Session | Description |
|------|---------|-------------|
| `projectpulse_onboarding_getPrompt` | General | Get template for specific session |
| `projectpulse_onboarding_submitResponse` | General | Submit response, return next session |
| `projectpulse_onboarding_getPhasedQuestions` | S1 | Get phase questions with guidance |
| `projectpulse_onboarding_savePhase` | S1 | Save phase answers |
| `projectpulse_onboarding_getExecutiveSummaryPrompt` | S1 | Get prompt with all 96 answers |
| `projectpulse_onboarding_storeExecutiveSummary` | S1 | Store summary, complete Session 1 |
| `projectpulse_onboarding_finalizeSummary` | S1 | Generate summary from Q&As |
| `projectpulse_onboarding_checkTokenBudget` | S1 | Check 200K token budget |
| `projectpulse_onboarding_getDocBatchPrompt` | S2 | Get 4-5 doc prompts by batch |
| `projectpulse_onboarding_storeBatch` | S2 | Bulk store 1-5 documents |
| `projectpulse_onboarding_getBootstrapPrompt` | S3 | Get parsing prompt for Project Plan |
| `projectpulse_onboarding_syncSession3` | S3 | Sync Session 3 completion |
| `projectpulse_blueprint_get` | S3 | Get blueprint (context, roadmap, budget) |

---

### 7c. Profile: `admin` (12 tools)

Batch operations, data export/import, roadmap management.

| Tool | Description |
|------|-------------|
| `projectpulse_batch_createAgentPersonas` | Bulk create 1-10 personas |
| `projectpulse_batch_createSkills` | Bulk create 1-10 skills |
| `projectpulse_batch_createWorkflowTemplates` | Bulk create 1-10 workflow templates |
| `projectpulse_batch_createSOPs` | Bulk create 1-10 SOPs |
| `projectpulse_knowledge_export` | Export all items (JSON/Markdown) |
| `projectpulse_knowledge_import` | Bulk import with optional overwrite |
| `projectpulse_knowledge_archive` | Soft delete (archive/unarchive) |
| `projectpulse_knowledge_metrics` | Usage stats, popular queries |
| `projectpulse_roadmap_create` | Create roadmap with phases/sprints |
| `projectpulse_roadmap_materialize` | Materialize JSON to records |
| `projectpulse_roadmap_delete` | Cascade delete roadmap |
| `projectpulse_sprint_phase_create` | Create phase with auto-weeks |

---

### 7d. Profile: `utility` (4 tools)

Rare operations — traceability, wiki generation, repo tools.

| Tool | Description |
|------|-------------|
| `projectpulse_traceability_generate` | Generate coverage matrix |
| `projectpulse_traceability_validate_documents` | Validate PRD→SRS→Backlog→Plan |
| `projectpulse_wiki_generate` | Auto-generate from JSDoc/docstrings |
| `projectpulse_repo_writeMinimal` | Generate CLAUDE.md + AGENTS.md |

---

### 7e. Profile: `observability` (2 tools)

Agent action logging and session metrics.

| Tool | Description |
|------|-------------|
| `projectpulse_observability_logStep` | Log agent action with metadata |
| `projectpulse_observability_completeSession` | Mark session completed with report |

---

### 7f. Dropped Tools (NOT implemented)

| Tool | Reason |
|------|--------|
| `projectpulse_memory_sessionStart` | Deprecated → use `context_load` |
| `projectpulse_memory_patternLookup` | Deprecated → use `context_lookup` |
| `projectpulse_memory_contextRecovery` | Deprecated → use `context_load` with `banksToLoad: 'active-only'` |
| `projectpulse_onboarding_getQuestions` | Legacy → replaced by `getPhasedQuestions` |
| `projectpulse_onboarding_saveAnswers` | Legacy → replaced by `savePhase` |
| `projectpulse_onboarding_getDocumentPrompts` | Legacy → replaced by `getDocBatchPrompt` |
| `projectpulse_onboarding_storeDocument` | Legacy → replaced by `storeBatch` |
| `projectpulse_onboarding_listDocuments` | Legacy → replaced by checking session state |

---

## 8. Tool Input Schemas (Pydantic Models)

### 8a. Meta Tool

```python
class ManageProfilesInput(BaseModel):
    action: Literal["load", "unload", "list", "status"]
    profiles: list[str] | None = None  # Required for load/unload
```
- `status`: Returns active profiles, available profiles, tool count
- `list`: Returns all profiles with tool names and counts
- `load`: Activates profiles, sends `tools/list_changed`
- `unload`: Deactivates profiles, sends `tools/list_changed`

### 8b. Health

```python
# No input required
# API: GET /api/health
```

### 8c. Context Tools

```python
class ContextLoadInput(BaseModel):
    projectId: int = Field(gt=0)
    banksToLoad: Literal["all", "active-only"] = "all"
# API: GET /api/context/load?projectId={}&banksToLoad={}

class ContextLookupInput(BaseModel):
    projectId: int = Field(gt=0)
    bankType: Literal["PROJECT_BRIEF", "SYSTEM_PATTERNS", "TECH_CONTEXT", "ACTIVE_CONTEXT", "PROGRESS"]
# API: GET /api/memory/pattern-lookup?projectId={}&bankType={}

class ContextUpdateInput(BaseModel):
    projectId: int = Field(gt=0)
    bankType: Literal["PROJECT_BRIEF", "SYSTEM_PATTERNS", "TECH_CONTEXT", "ACTIVE_CONTEXT", "PROGRESS"]
    content: str = Field(min_length=1)
    mode: Literal["replace", "append"] = "replace"
# API: PUT /api/context/update  (JSON body)
```

### 8d. Agent Session Tools

```python
class TodoItem(BaseModel):
    content: str
    status: Literal["pending", "in_progress", "completed"]
    ticketId: int | None = None

class SessionStartInput(BaseModel):
    projectId: int | None = None  # Auto-fills from auth
    name: str | None = Field(None, min_length=1, max_length=255)
    plan: str | None = None
    todos: list[TodoItem] | None = None
    activeTicketIds: list[int] | None = None
    activeTicketNumbers: list[int] | None = None
# API: POST /api/agent-sessions

class SessionUpdateInput(BaseModel):
    sessionId: str = Field(min_length=1)
    name: str | None = None
    plan: str | None = None
    todos: list[TodoItem] | None = None
    progress: str | None = None
    appendProgress: bool = False
    activeTicketIds: list[int] | None = None
    status: Literal["IN_PROGRESS", "PAUSED"] | None = None
    tokenCount: int | None = Field(None, ge=0)
# API: PATCH /api/agent-sessions/{sessionId}

class SessionEndInput(BaseModel):
    sessionId: str = Field(min_length=1)
    progress: str | None = None
    tokenCount: int | None = Field(None, ge=0)
# API: POST /api/agent-sessions/{sessionId}/end

class SessionResumeInput(BaseModel):
    sessionId: str = Field(min_length=1)
# API: POST /api/agent-sessions/{sessionId}/resume
```

### 8e. Ticket Tools

```python
class TicketCreateInput(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(None, max_length=50000)
    kind: Literal["feature", "task", "epic", "issue", "bug", "scanner_finding", "tech_debt"]
    source: Literal["manual", "scanner", "agent", "onboarding"]
    status: str | None = None
    priority: str | None = None
    module: str | None = None
    assignee: str | None = None
    assigneeType: str | None = None
    assigneeId: str | None = None
    projectId: int | None = None  # Auto-fills
    labelIds: list[int] | None = Field(None, max_length=25)
    customFields: dict[str, Any] | None = None
    context: dict[str, Any] | None = None
    parentTicketId: int | None = None
    epicRef: str | None = Field(None, max_length=200)
    backlogRefs: list[str] | None = Field(None, max_length=50)
    sprintNumber: int | None = Field(None, ge=1, le=999)
    estimatedDays: int | None = Field(None, ge=1, le=365)
    displayOrder: int | None = Field(None, ge=0, le=10000)
# API: POST /api/tickets

class TicketBulkCreateInput(BaseModel):
    projectId: int | None = None
    tickets: list[TicketCreateInput] = Field(min_length=1, max_length=50)
# API: POST /api/tickets/bulk

class TicketSearchInput(BaseModel):
    kind: list[str] | None = None
    source: list[str] | None = None
    status: list[str] | None = None
    priority: list[str] | None = None
    module: list[str] | None = None
    assignee: list[str] | None = None
    tags: list[str] | None = None
    search: str | None = Field(None, max_length=200)
    createdFrom: str | None = None  # ISO datetime
    createdTo: str | None = None
    parentTicketId: int | None = None
    hasChildren: bool | None = None
    isTopLevel: bool | None = None
    epicRef: str | None = Field(None, max_length=200)
    sprintNumber: int | None = Field(None, ge=1, le=999)
    milestoneId: int | None = None
    dueDateFrom: str | None = None
    dueDateTo: str | None = None
    overdue: bool | None = None
    labelIds: list[int] | None = None
    includeRelations: bool | None = None
    sortBy: Literal["createdAt", "updatedAt", "priority", "sprintNumber", "kind", "dueDate"] | None = None
    sortDirection: Literal["asc", "desc"] | None = None
    page: int = Field(1, ge=1)
    pageSize: int = Field(20, ge=1, le=100)
# API: GET /api/tickets?{queryParams}

class TicketGetInput(BaseModel):
    ticketId: int | None = None
    ticketNumber: int | None = None
    projectId: int | None = None  # Auto-fills, required with ticketNumber
# API: GET /api/tickets/{ticketId} or GET /api/tickets/by-number/{projectId}/{ticketNumber}

class TicketUpdateInput(BaseModel):
    ticketId: int | None = None
    ticketNumber: int | None = None
    projectId: int | None = None
    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=50000)
    kind: str | None = None
    status: str | None = None
    priority: str | None = None
    module: str | None = None
    assignee: str | None = None
    assigneeType: str | None = None
    assigneeId: str | None = None
    labelIds: list[int] | None = None
    customFields: dict[str, Any] | None = None
    parentTicketId: int | None = None
    epicRef: str | None = None
    backlogRefs: list[str] | None = None
    sprintNumber: int | None = None
    estimatedDays: int | None = None
    displayOrder: int | None = None
    dueDate: str | None = None
    milestoneId: int | None = None
# API: PATCH /api/tickets/{ticketId}

class TicketSetStatusInput(BaseModel):
    ticketId: int | None = None
    ticketNumber: int | None = None
    projectId: int | None = None
    status: str
# API: PATCH /api/tickets/{ticketId}/status

class TicketAddCommentInput(BaseModel):
    ticketId: int | None = None
    ticketNumber: int | None = None
    projectId: int | None = None
    content: str = Field(min_length=1, max_length=10000)
    author: str | None = Field(None, max_length=120)
# API: POST /api/tickets/{ticketId}/comments

class TicketGetChildrenInput(BaseModel):
    ticketId: int | None = None
    ticketNumber: int | None = None
    projectId: int | None = None
    status: str | None = None
    page: int = 1
    pageSize: int = Field(20, ge=1, le=100)
# API: GET /api/tickets/{ticketId}/children?{queryParams}

class TicketGetHierarchyInput(BaseModel):
    ticketId: int | None = None
    ticketNumber: int | None = None
    projectId: int | None = None
# API: GET /api/tickets/{ticketId}/hierarchy
```

### 8f. Kanban Tools

```python
class KanbanGetBoardInput(BaseModel):
    sprintId: str  # CUID
# API: GET /api/sprints/{sprintId}/kanban

class KanbanMoveTicketInput(BaseModel):
    ticketId: int | None = None
    ticketNumber: int | None = None
    projectId: int | None = None
    status: Literal["backlog", "todo", "in-progress", "in-review", "done"]
    displayOrder: int = Field(ge=0, le=10000)
# API: PATCH /api/tickets/{ticketId}/move
```

### 8g. Knowledge Tools

```python
class KnowledgeSearchInput(BaseModel):
    projectId: int = Field(gt=0)
    query: str = Field(min_length=1, max_length=1000)
    mode: Literal["semantic", "fulltext", "hybrid"] = "hybrid"
    limit: int = Field(5, ge=1, le=50)
    category: str | None = Field(None, max_length=50)
# API: GET /api/knowledge/search?{queryParams}

class KnowledgeCreateInput(BaseModel):
    projectId: int = Field(gt=0)
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=10, max_length=50000)
    category: str = Field(min_length=1, max_length=50)
    tags: list[str] = Field(default_factory=list, max_length=20)
# API: POST /api/knowledge

class KnowledgeGetInput(BaseModel):
    projectId: int = Field(gt=0)
    itemId: int = Field(gt=0)
# API: GET /api/knowledge/{itemId}?projectId={}

class KnowledgeRelatedInput(BaseModel):
    projectId: int = Field(gt=0)
    itemId: int = Field(gt=0)
    maxDepth: int = Field(2, ge=1, le=2)
    limit: int = Field(10, ge=1, le=50)
    minStrength: float = Field(0.5, ge=0, le=1)
# API: GET /api/knowledge/related?{queryParams}

# Admin profile tools:
class KnowledgeExportInput(BaseModel):
    projectId: int = Field(gt=0)
    format: Literal["json", "markdown"] = "json"
# API: GET /api/knowledge/export?{queryParams}

class KnowledgeImportInput(BaseModel):
    projectId: int = Field(gt=0)
    items: list[dict[str, Any]]
    overwrite: bool = False
# API: POST /api/knowledge/import

class KnowledgeArchiveInput(BaseModel):
    projectId: int = Field(gt=0)
    itemId: int = Field(gt=0)
    archive: bool = True  # True=archive, False=unarchive
# API: PATCH /api/knowledge/{itemId}/archive

class KnowledgeMetricsInput(BaseModel):
    projectId: int = Field(gt=0)
# API: GET /api/knowledge/metrics?projectId={}
```

### 8h. Wiki Tools

```python
class WikiCreateInput(BaseModel):
    title: str = Field(min_length=3, max_length=100)
    path: str = Field(min_length=3, max_length=100)  # lowercase/hyphens
    content: str = Field(min_length=10, max_length=50000)
    category: Literal["getting-started", "guides", "reference", "troubleshooting"]
    excerpt: str | None = Field(None, max_length=200)
    parentPath: str | None = None
    projectId: int | None = None
# API: POST /api/wiki

class WikiSearchInput(BaseModel):
    query: str = Field(min_length=1, max_length=200)
    category: Literal["getting-started", "guides", "reference", "troubleshooting"] | None = None
    limit: int = Field(10, ge=1, le=50)
    offset: int = 0
    projectId: int | None = None
# API: GET /api/wiki?{queryParams}

class WikiGetInput(BaseModel):
    path: str = Field(min_length=1, max_length=500)
    projectId: int | None = None
# API: GET /api/wiki/{path}

class WikiUpdateInput(BaseModel):
    path: str = Field(min_length=3, max_length=100)
    title: str | None = Field(None, min_length=3, max_length=100)
    content: str | None = Field(None, min_length=10, max_length=50000)
    category: Literal["getting-started", "guides", "reference", "troubleshooting"] | None = None
    excerpt: str | None = Field(None, max_length=200)
    parentPath: str | None = None
    changelog: str | None = Field(None, max_length=500)
    actorName: str | None = Field(None, min_length=1, max_length=100)
    actorType: Literal["human", "agent", "system"] | None = None
    projectId: int | None = None
# API: PATCH /api/wiki/{path}

class WikiAnalyticsSummaryInput(BaseModel):
    projectId: int | None = None
# API: GET /api/wiki/analytics/summary?projectId={}

# Utility profile:
class WikiGenerateInput(BaseModel):
    projectId: int | None = None
    sourcePath: str  # Path to source code directory
    targetCategory: Literal["getting-started", "guides", "reference", "troubleshooting"] = "reference"
# API: POST /api/wiki/generate
```

### 8i. Resource Tools

```python
class PersonaListInput(BaseModel):
    projectId: int = Field(gt=0)
    isActive: bool | None = None
# API: GET /api/personas?projectId={}&isActive={}

class PersonaGetInput(BaseModel):
    projectId: int = Field(gt=0)
    id: int | None = None
    slug: str | None = None
# API: GET /api/personas/{id} or /api/personas/by-slug/{slug}

class SkillListInput(BaseModel):
    projectId: int = Field(gt=0)
    category: str | None = None
    tags: str | None = None  # Comma-separated
    frameworks: str | None = None  # Comma-separated
    limit: int = Field(20, ge=1, le=50)
# API: GET /api/skills?{queryParams}

class SkillGetInput(BaseModel):
    projectId: int = Field(gt=0)
    slug: str
# API: GET /api/skills/{slug}?projectId={}

class SOPListInput(BaseModel):
    projectId: int = Field(gt=0)
    category: str | None = None
# API: GET /api/sops?projectId={}&category={}

class SOPGetInput(BaseModel):
    projectId: int = Field(gt=0)
    id: int | None = None
    slug: str | None = None
# API: GET /api/sops/{id} or /api/sops/by-slug/{slug}
```

### 8j. Roadmap Tools

```python
class GetCurrentPositionInput(BaseModel):
    projectId: int = Field(gt=0)
# API: GET /api/roadmap/overview?projectId={}

class GetPhaseProgressInput(BaseModel):
    phaseId: str  # UUID
    projectId: int = Field(gt=0)
# API: GET /api/phases/{phaseId}?projectId={}

# Admin profile:
class RoadmapCreateInput(BaseModel):
    projectId: int = Field(gt=0)
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(None, max_length=2000)
    startDate: str  # ISO 8601
    phases: list[PhaseInput]  # min 1 item
    materialize: bool = True

class PhaseInput(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(None, max_length=2000)
    duration: str | None = None
    sprints: list[SprintInput]  # min 1 item

class SprintInput(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    duration: str | None = None
    weeks: str | None = None
    goals: list[str] | None = None
    deliverables: list[str] | None = None
    storyPoints: int | None = Field(None, gt=0)
# API: POST /api/roadmap

class RoadmapMaterializeInput(BaseModel):
    roadmapId: str
    projectId: int = Field(gt=0)
# API: POST /api/roadmap/{roadmapId}/materialize

class RoadmapDeleteInput(BaseModel):
    roadmapId: str
    projectId: int = Field(gt=0)
# API: DELETE /api/roadmap/{roadmapId}
```

### 8k. Sprint Tools

```python
class SprintQueryHierarchyInput(BaseModel):
    level: Literal["phase", "sprint"]
    status: list[str] | None = None
    projectId: int | None = None
# API: GET /api/hierarchy?{queryParams}

class SprintUpdateProgressInput(BaseModel):
    entityType: Literal["sprint", "phase"]
    entityId: str  # CUID
    progress: int = Field(ge=0, le=100)
# API: PUT /api/{sprints|phases}/{entityId}/progress

# Admin profile:
class SprintPhaseCreateInput(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    startDate: str  # ISO 8601
    durationWeeks: int = Field(4, ge=1, le=52)
    goals: list[str] | None = None
    projectId: int | None = None
# API: POST /api/phases
```

### 8l. Workflow Tools

```python
class WorkflowListInput(BaseModel):
    category: Literal["development", "project-management", "knowledge"] | None = None
    isActive: bool | None = None
    projectId: int | None = None
# API: GET /api/workflows?{queryParams}

class WorkflowStartInput(BaseModel):
    templateId: int
    projectId: int | None = None
    initialContext: dict[str, Any] | None = None
# API: POST /api/workflows/run

class WorkflowExecuteStepInput(BaseModel):
    runId: int
    output: dict[str, Any] | None = None
# API: POST /api/workflows/run/{runId}/execute

class WorkflowGetStatusInput(BaseModel):
    runId: int
# API: GET /api/workflows/run/{runId}

class WorkflowPauseInput(BaseModel):
    runId: int
    checkpoint: dict[str, Any] | None = None
# API: POST /api/workflows/run/{runId}/pause

class WorkflowResumeInput(BaseModel):
    runId: int
# API: POST /api/workflows/run/{runId}/resume

class WorkflowCompleteInput(BaseModel):
    runId: int
    status: Literal["completed", "failed"]
    summary: str | None = None
# API: POST /api/workflows/run/{runId}/complete
```

### 8m. Backlog Tools

```python
class BacklogListInput(BaseModel):
    projectId: int = Field(gt=0)
    epicRef: str | None = None
# API: GET /api/backlog?projectId={}&epicRef={}

class BacklogGetBySprintInput(BaseModel):
    projectId: int = Field(gt=0)
    sprintNumber: int = Field(gt=0)
# API: GET /api/backlog?projectId={}&sprintNumber={}
```

### 8n. Onboarding Tools (onboarding profile)

```python
class OnboardingGetPromptInput(BaseModel):
    projectId: int = Field(gt=0)
    session: int = Field(ge=1, le=3)
# API: GET /api/onboarding/prompt?projectId={}&session={}

class OnboardingSubmitResponseInput(BaseModel):
    projectId: int = Field(gt=0)
    session: int
    response: str
# API: POST /api/onboarding/response

class OnboardingGetPhasedQuestionsInput(BaseModel):
    projectId: int = Field(gt=0)
    phase: int = Field(ge=1, le=10)
# API: GET /api/onboarding/questions?projectId={}&phase={}

class OnboardingSavePhaseInput(BaseModel):
    projectId: int = Field(gt=0)
    phase: int = Field(ge=1, le=10)
    answers: list[dict[str, Any]]
# API: POST /api/onboarding/phase

class OnboardingGetExecutiveSummaryPromptInput(BaseModel):
    projectId: int = Field(gt=0)
# API: GET /api/onboarding/executive-summary-prompt?projectId={}

class OnboardingStoreExecutiveSummaryInput(BaseModel):
    projectId: int = Field(gt=0)
    summary: str
# API: POST /api/onboarding/executive-summary

class OnboardingFinalizeSummaryInput(BaseModel):
    projectId: int = Field(gt=0)
# API: POST /api/onboarding/finalize-summary

class OnboardingCheckTokenBudgetInput(BaseModel):
    projectId: int = Field(gt=0)
    operation: str
    estimatedTokens: int | None = None
# API: GET /api/onboarding/token-budget?{queryParams}

class OnboardingGetDocBatchPromptInput(BaseModel):
    projectId: int = Field(gt=0)
    batch: Literal["planning", "architecture", "implementation", "operations"]
# API: GET /api/onboarding/doc-batch-prompt?projectId={}&batch={}

class OnboardingStoreBatchInput(BaseModel):
    projectId: int = Field(gt=0)
    documents: list[dict[str, Any]] = Field(min_length=1, max_length=5)
# API: POST /api/onboarding/documents/batch

class OnboardingGetBootstrapPromptInput(BaseModel):
    projectId: int = Field(gt=0)
# API: GET /api/onboarding/bootstrap-prompt?projectId={}

class OnboardingSyncSession3Input(BaseModel):
    projectId: int = Field(gt=0)
# API: POST /api/onboarding/sync-session3

class BlueprintGetInput(BaseModel):
    projectId: int = Field(gt=0)
# API: GET /api/onboarding/blueprint?projectId={}
```

### 8o. Batch Tools (admin profile)

```python
class PersonaItem(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=100)
    description: str | None = None
    systemPrompt: str = Field(min_length=10)
    skills: list[str] | None = None
    tools: list[str] | None = None
    rules: list[str] | None = None
    icon: str | None = None
    expertise: list[str] | None = None
    personality: str | None = None
    isActive: bool = True
    isBuiltIn: bool = False

class BatchCreatePersonasInput(BaseModel):
    projectId: int = Field(gt=0)
    personas: list[PersonaItem] = Field(min_length=1, max_length=10)
# API: POST /api/batch/agent-personas

class SkillItem(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=100)
    content: str = Field(min_length=10)
    category: str | None = None
    frameworks: list[str] | None = None
    tags: list[str] | None = None

class BatchCreateSkillsInput(BaseModel):
    projectId: int = Field(gt=0)
    skills: list[SkillItem] = Field(min_length=1, max_length=10)
# API: POST /api/batch/skills

class WorkflowStepItem(BaseModel):
    name: str
    description: str | None = None
    dependencies: list[str] | None = None

class WorkflowTemplateItem(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    category: Literal["development", "project-management", "knowledge"]
    steps: list[WorkflowStepItem] = Field(min_length=1)

class BatchCreateWorkflowTemplatesInput(BaseModel):
    projectId: int = Field(gt=0)
    templates: list[WorkflowTemplateItem] = Field(min_length=1, max_length=10)
# API: POST /api/batch/workflow-templates

class SOPItem(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=100)
    description: str | None = None
    content: str = Field(min_length=10)
    category: str | None = None
    tags: list[str] | None = None

class BatchCreateSOPsInput(BaseModel):
    projectId: int = Field(gt=0)
    sops: list[SOPItem] = Field(min_length=1, max_length=10)
# API: POST /api/batch/sops
```

### 8p. Traceability Tools (utility profile)

```python
class TraceabilityGenerateInput(BaseModel):
    projectId: int | None = None
    expectedRefs: list[str] | None = Field(None, max_length=500)
# API: POST /api/traceability/generate

class TraceabilityValidateDocumentsInput(BaseModel):
    projectId: int | None = None
    force: bool = False
    strict: bool = False
    strictNfr: bool = False
# API: POST /api/traceability/validate-documents
```

### 8q. Observability Tools (observability profile)

```python
class ObservabilityLogStepInput(BaseModel):
    sessionId: int
    stepName: str
    metadata: dict[str, Any] | None = None
# API: POST /api/observability/log-step

class ObservabilityCompleteSessionInput(BaseModel):
    sessionId: int
    validationReport: dict[str, Any] | None = None
# API: POST /api/observability/complete-session
```

### 8r. Repo Tool (utility profile)

```python
class RepoWriteMinimalInput(BaseModel):
    projectId: int = Field(gt=0)
    repoPath: str
# API: POST /api/repo/write-minimal (generates CLAUDE.md + AGENTS.md)
```

---

## 9. Implementation Phases

### Phase 1: Infrastructure Foundation (Days 1-2)

**Goal**: Working HTTP server with auth, logging, and HTTP client — no tools yet (except health_check).

**Files to create/modify**:
- `src/config.py` — Upgrade from TypedDict to Pydantic Settings, add `TOOL_PROFILES`, `ALLOWED_ORIGINS`, `LOG_LEVEL`
- `src/logger.py` — structlog with JSON output, request ID tracking
- `src/auth/__init__.py` + `context.py` — contextvars AgentAuth, get/set/is_tool_allowed
- `src/auth/middleware.py` — Bearer auth (POST /api/agent-auth/validate), CORS, Accept header fix
- `src/http/__init__.py` + `client.py` — httpx AsyncClient with auth injection
- `src/admin/__init__.py` + `controls.py` — Emergency shutdown, blocklist, logging (5s TTL cache, fail-open)
- `src/server.py` — ProfileAwareMCP(FastMCP) subclass
- `src/main.py` — Rewrite entry point with middleware chain

**Success Criteria**:
- Server starts on port 3002
- `GET /health` returns server status
- Unauthenticated MCP requests rejected with 401
- Auth context flows through to HTTP client

### Phase 2: Profile System + Health Tool (Days 2-3)

**Goal**: Tool registry, profile manager, and meta-tool operational.

**Files to create**:
- `src/profiles/__init__.py` + `registry.py` — Master registry: `PROFILES = {"core": [...], "onboarding": [...], ...}`
- `src/profiles/manager.py` — `ProfileManager` class: activate/deactivate, track state
- `src/profiles/meta_tool.py` — `manage_profiles` tool implementation
- `src/tools/__init__.py` + `_base.py` — Shared helpers (error/success builders, project ID resolution, ticket ID resolution)
- `src/tools/health.py` — Port health_check from existing code

**Success Criteria**:
- `TOOL_PROFILES=core` loads ~48 tools in `tools/list`
- `manage_profiles(action="load", profiles=["onboarding"])` adds 13 tools
- `manage_profiles(action="status")` shows correct counts
- `manage_profiles(action="unload", profiles=["onboarding"])` removes them

### Phase 3: Core Tools — Context & Sessions (Days 3-4)

**Files**: `src/tools/context.py`, `src/tools/sessions.py`

**Success Criteria**: Full cycle — `context_load` → `session_start` → `session_update` → `session_end` works via MCP Inspector.

### Phase 4: Core Tools — Tickets & Kanban (Days 4-5)

**Files**: `src/tools/tickets.py`, `src/tools/kanban.py`

**Success Criteria**: Create, search, get, update tickets. Get kanban board, move tickets.

### Phase 5: Core Tools — Knowledge, Wiki, Resources (Days 5-6)

**Files**: `src/tools/knowledge.py`, `src/tools/wiki.py`, `src/tools/resources.py`

**Success Criteria**: All core knowledge/wiki/resource operations work.

### Phase 6: Core Tools — Roadmap, Sprint, Workflow, Backlog (Days 6-7)

**Files**: `src/tools/roadmap.py`, `src/tools/sprint.py`, `src/tools/workflow.py`, `src/tools/backlog.py`

**Milestone**: Core profile complete (~48 tools). Daily work fully functional.

### Phase 7: Non-Core Profiles (Days 7-8)

**Files**: `src/tools/onboarding.py`, `src/tools/batch.py`, `src/tools/traceability.py`, `src/tools/observability.py`, `src/tools/repo.py`

**Milestone**: Full tool parity (~79 tools across all profiles).

### Phase 8: Docker & Dev Deployment (Day 9)

**Files**: `Dockerfile`, update `docker-compose.cloud.yml`

**Note**: During development, run locally with `uv run python -m src.main` or via Docker. No push to remote until all phases complete.

**Dockerfile** (multi-stage):
```dockerfile
# Build stage
FROM python:3.11-slim-bookworm AS builder
WORKDIR /app
RUN pip install uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Runtime stage
FROM python:3.11-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY src/ ./src/
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:3002/health || exit 1
CMD ["python", "-m", "src.main"]
```

### Phase 9: Testing & Polish (Days 9-10)

- Unit tests per tool module (pytest-httpx for mocking)
- Profile system integration tests
- Auth context + middleware tests
- README with setup/usage/configuration docs

---

## 10. Shared Tool Helpers (`_base.py`)

```python
from mcp.types import TextContent

def build_success(data: dict | str) -> list[TextContent]:
    """Format successful tool response."""
    text = json.dumps(data, indent=2) if isinstance(data, dict) else data
    return [TextContent(type="text", text=text)]

def build_error(message: str) -> list[TextContent]:
    """Format error tool response."""
    return [TextContent(type="text", text=json.dumps({"error": message}))]

async def resolve_ticket_id(client: ProjectPulseClient, input_data) -> int:
    """Resolve ticketNumber+projectId to ticketId, or return ticketId directly."""
    if hasattr(input_data, 'ticketId') and input_data.ticketId:
        return input_data.ticketId
    if hasattr(input_data, 'ticketNumber') and input_data.ticketNumber:
        project_id = input_data.projectId or get_agent_auth().project_id
        result = await client.get(f"/tickets/by-number/{project_id}/{input_data.ticketNumber}")
        return result["id"]
    raise ValueError("Either ticketId or ticketNumber is required")

def resolve_project_id(input_data) -> int:
    """Auto-fill projectId from auth context if not provided."""
    if hasattr(input_data, 'projectId') and input_data.projectId:
        return input_data.projectId
    auth = get_agent_auth()
    if auth:
        return auth.project_id
    raise ValueError("projectId is required (not authenticated)")
```

---

## 11. Testing Strategy

### Unit Tests (per tool module)

```python
# tests/test_tools/test_tickets.py
import pytest
from pytest_httpx import HTTPXMock

async def test_ticket_create(httpx_mock: HTTPXMock):
    httpx_mock.add_response(
        url="http://localhost:3000/api/tickets",
        method="POST",
        json={"id": 42, "title": "Test", "ticketNumber": 1},
    )
    result = await ticket_create_handler(TicketCreateInput(
        title="Test", kind="task", source="agent"
    ))
    assert "42" in result[0].text
```

### Profile System Tests

```python
async def test_default_profile_loads_core():
    manager = ProfileManager(registry, active=["core"])
    assert len(manager.active_tools) == 48

async def test_load_onboarding_profile():
    manager = ProfileManager(registry, active=["core"])
    added = manager.activate(["onboarding"])
    assert len(added) == 13
    assert len(manager.active_tools) == 61

async def test_unload_profile():
    manager = ProfileManager(registry, active=["core", "onboarding"])
    removed = manager.deactivate(["onboarding"])
    assert len(manager.active_tools) == 48
```

### Integration Tests

- Full auth → tool execution → API proxy cycle
- Profile switch triggers `tools/list_changed`
- Emergency shutdown blocks tool execution

---

## 12. Docker Deployment

### Development Environment (docker-compose.cloud.yml)

During development, the Python MCP server runs alongside existing services:

| Service | Port | Compose File |
|---------|------|-------------|
| PostgreSQL | 5432 | docker-compose.cloud.yml |
| Redis | 6379 | docker-compose.cloud.yml |
| Next.js (web) | 3000 | docker-compose.cloud.yml |
| TypeScript MCP | 3001 | docker-compose.cloud.yml |
| **Python MCP** | **3002** | **docker-compose.cloud.yml (new)** |

**No schema migration needed** — Python server calls the existing Next.js API, never touches the database directly.

**Dev workflow**: Run Python server locally with `uv run python -m src.main` or add to docker-compose.cloud.yml.

### docker-compose.cloud.yml Addition

```yaml
  mcp-server-python:
    build:
      context: ./apps/mcp-server-python
      dockerfile: Dockerfile
    container_name: projectpulse-mcp-python-cloud
    ports:
      - "3002:3002"
    environment:
      - PROJECTPULSE_API_BASE_URL=http://nextjs:3000/api
      - PROJECTPULSE_API_TOKEN=${MCP_AGENT_TOKEN}
      - MCP_SERVER_PORT=3002
      - NODE_ENV=development
      - TOOL_PROFILES=core
      - MCP_INTERNAL_SECRET=${MCP_INTERNAL_SECRET}
      - LOG_LEVEL=debug
    depends_on:
      nextjs:
        condition: service_healthy
    networks:
      - projectpulse
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    restart: unless-stopped
```

### Production Deployment (after all phases complete)

Production deployment uses `docker-compose.prod-local.yml` with different ports:

| Service | Dev Port | Prod Local Port | Prod Public URL |
|---------|----------|-----------------|-----------------|
| Next.js | 3000 | 8080 | `https://projectpulse.dracodev.dev` |
| TypeScript MCP | 3001 | 8081 | `https://projectpulsemcp.dracodev.dev` |
| **Python MCP** | **3002** | **8082** | **`https://projectpulsemcp-py.dracodev.dev`** |
| PostgreSQL | 5432 | 5433 | N/A (internal only) |

**docker-compose.prod-local.yml Addition**:
```yaml
  prod-mcp-python:
    build:
      context: ./apps/mcp-server-python
      dockerfile: Dockerfile
    image: projectpulse/mcp-python:latest
    container_name: projectpulse-prod-mcp-python
    environment:
      - PROJECTPULSE_API_BASE_URL=http://prod-nextjs:3000/api
      - PROJECTPULSE_API_TOKEN=${PROD_MCP_AGENT_TOKEN}
      - MCP_SERVER_PORT=3002
      - NODE_ENV=production
      - TOOL_PROFILES=core
      - MCP_INTERNAL_SECRET=${PROD_MCP_INTERNAL_SECRET}
      - ALLOWED_ORIGINS=https://projectpulse.dracodev.dev,https://projectpulsemcp-py.dracodev.dev
      - LOG_LEVEL=info
    ports:
      - "8082:3002"
    networks:
      - pp-prod
    depends_on:
      prod-nextjs:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

**Cloudflare Tunnel**: Add route in Cloudflare Zero Trust dashboard:
- Hostname: `projectpulsemcp-py.dracodev.dev`
- Service: `http://prod-mcp-python:3002`
- (Same pattern as existing `projectpulsemcp.dracodev.dev` → `http://prod-mcp:3001`)

**Update `cloudflared` depends_on** in `docker-compose.prod-local.yml`:
```yaml
  cloudflared:
    depends_on:
      prod-nextjs:
        condition: service_healthy
      prod-mcp:
        condition: service_healthy
      prod-mcp-python:          # Add this
        condition: service_healthy
```

**Infra-config update** (deferred to prod deployment):
Add `mcpPythonUrl` / `mcpPythonPort` to `packages/infra-config/src/environments.ts`:
```typescript
// Future: when Python MCP is production-ready
'prod-public': {
  mcpPythonUrl: 'https://projectpulsemcp-py.dracodev.dev',
  mcpPythonPort: 443,
}
```

**Deployment pipeline**: Normal (no schema changes)
1. Push `feature/python-mcp-server` to remote
2. Merge to master
3. `./scripts/deploy-prod.sh` builds and deploys
4. Add Cloudflare tunnel route in dashboard
5. No `prisma migrate deploy` step needed

### Migration Path

1. Both MCP servers run in Docker (TS on 8081, Python on 8082)
2. Both accessible via Cloudflare tunnels (`projectpulsemcp.dracodev.dev` and `projectpulsemcp-py.dracodev.dev`)
3. New agent tokens can be configured to point at Python server
4. Existing agents gradually migrate by changing MCP endpoint URL
5. Once validated, TypeScript server can be decommissioned

---

## 13. Security Model (3-Layer Defense)

| Layer | What It Does | Implementation |
|-------|-------------|----------------|
| **MCP Layer** | Profile filtering + per-token blocklist | `ProfileAwareMCP.list_tools()` |
| **HTTP Client** | Auth header injection | `ProjectPulseClient._auth_headers()` |
| **API Layer** | Token re-validation + project isolation | Next.js middleware (existing) |

### Emergency Shutdown

Admin can disable all tool execution via `POST /api/admin/mcp/emergency`. Python server checks this with 5s TTL cache before every tool call. If unreachable, fails open (same as TypeScript).

### Global Tool Blocklist

Admin can block specific tools globally via `POST /api/admin/mcp/blocked-tools`. Checked per tool call with 5s TTL cache.

---

## 14. Verification Checklist

- [ ] Server starts on port 3002 with `TOOL_PROFILES=core`
- [ ] `tools/list` returns ~48 tools (not 86)
- [ ] `manage_profiles(action="load", profiles=["onboarding"])` expands to ~61
- [ ] `context_load` returns `_profileHint` when project needs onboarding
- [ ] Auth middleware rejects unauthenticated requests
- [ ] Per-token blocklist filtering works
- [ ] Emergency shutdown blocks all tools
- [ ] Full session lifecycle: context_load → session_start → update → end
- [ ] Ticket CRUD with both ticketId and ticketNumber paths
- [ ] Docker container builds and runs
- [ ] Health check passes in Docker
- [ ] Token comparison: core profile ~50% fewer tokens than full
