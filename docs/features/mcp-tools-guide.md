# MCP Tools Guide

**Last Updated**: 2025-11-09
**Purpose**: Reference guide for all MCP (Model Context Protocol) tools available to Claude Code
**Status**: Core tools configured + ProjectPulse tools active (Sprint 1 Week 2 Days 10-13 complete)

---

## Quick Index

**Memory & Knowledge**:

- [memory](#memory) - Knowledge graph and memory management

**File Operations**:

- [filesystem](#filesystem) - File and directory operations

**Version Control**:

- [git](#git) - Git operations
- [gitkraken](#gitkraken) - GitKraken integration (issues, PRs, repos)

**Database**:

- [postgres](#postgres) - PostgreSQL database queries

**Browser Automation**:

- [playwright](#playwright) - Web browser automation and testing

**Development Tools**:

- [docker-devhub](#docker-devhub) - Docker container management
- [sequential-thinking](#sequential-thinking) - Complex problem solving

**ProjectPulse Tools**:

- [projectpulse](#projectpulse-mcp-server) - Sprint management, onboarding, wiki, issues, workflows, kanban (42 tools active)

---

## Memory

**Server**: `byterover` (memory/knowledge retrieval)
**When to use**: Store and retrieve project knowledge, create knowledge graphs

### Available Tools

#### `create_entities`

Create new entities in knowledge graph

**Example**:

```typescript
// Store information about a new feature
create_entities({
  entities: [
    {
      name: 'Issue Tracker',
      entityType: 'feature',
      observations: [
        'Implemented in Week 1 Day 3',
        'Uses Prisma for database',
        'Supports full-text search',
      ],
    },
  ],
});
```

#### `create_relations`

Create relationships between entities

**Example**:

```typescript
create_relations({
  relations: [
    {
      from: 'Issue Tracker',
      to: 'Prisma',
      relationType: 'uses',
    },
  ],
});
```

#### `search_nodes`

Search knowledge graph

**Example**:

```typescript
search_nodes({
  query: 'authentication',
});
```

**When to use**:

- Storing project decisions and context
- Creating knowledge base of implementations
- Remembering past solutions
- Building relationships between concepts

---

## Filesystem

**Server**: `mcp__filesystem`
**When to use**: File and directory operations

### Available Tools

#### `read_text_file`

Read file contents as text

**Example**:

```typescript
read_text_file({
  path: '/path/to/file.ts',
  head: 50, // Optional: first 50 lines only
});
```

#### `write_file`

Create or overwrite a file

**Example**:

```typescript
write_file({
  path: '/path/to/file.ts',
  content: '/* file content */',
});
```

> **Note**: Use filesystem tools for application code files only. Progress tracking and project state are stored in database entities (Task, Session, Phase, etc.) accessed via ProjectPulse MCP tools, not files.

#### `edit_file`

Make line-based edits

**Example**:

```typescript
edit_file({
  path: '/path/to/file.ts',
  edits: [
    {
      oldText: "const theme = 'light'",
      newText: "const theme = 'dark'",
    },
  ],
});
```

#### `list_directory`

List files and directories

**Example**:

```typescript
list_directory({
  path: '/path/to/directory',
});
```

#### `search_files`

Recursively search for files

**Example**:

```typescript
search_files({
  path: '/project',
  pattern: '*.tsx',
  excludePatterns: ['node_modules', '.next'],
});
```

**When to use**:

- Reading/writing code files
- Directory navigation
- File searches
- Batch file operations

**Note**: Prefer Claude Code's built-in Read/Write/Edit tools for better integration

---

## Git

**Server**: `mcp__git`
**When to use**: Git version control operations

### Available Tools

#### `git_status`

Show working tree status

**Example**:

```typescript
git_status({
  repo_path: '/path/to/repo',
});
```

#### `git_diff_unstaged`

Show unstaged changes

**Example**:

```typescript
git_diff_unstaged({
  repo_path: '/path/to/repo',
  context_lines: 3,
});
```

#### `git_commit`

Create a commit

**Example**:

```typescript
git_commit({
  repo_path: '/path/to/repo',
  message: 'feat: add issue tracker',
});
```

#### `git_log`

Show commit history

**Example**:

```typescript
git_log({
  repo_path: '/path/to/repo',
  max_count: 10,
});
```

#### `git_create_branch`

Create a new branch

**Example**:

```typescript
git_create_branch({
  repo_path: '/path/to/repo',
  branch_name: 'feature/new-feature',
  base_branch: 'master',
});
```

**When to use**:

- Checking git status
- Viewing diffs
- Creating commits
- Branch management

**Note**: Follow [git-workflow.md](../sops/git-workflow.md) conventions

---

## GitKraken

**Server**: `mcp__gitkraken`
**When to use**: GitHub/GitLab integration, issues, pull requests

### Available Tools

#### `issues_assigned_to_me`

Get issues assigned to user

**Example**:

```typescript
issues_assigned_to_me({
  provider: 'github',
});
```

#### `issues_get_detail`

Get issue details

**Example**:

```typescript
issues_get_detail({
  provider: 'github',
  repository_name: 'projectpulse',
  repository_organization: 'myorg',
  issue_id: '123',
});
```

#### `pull_request_create`

Create a pull request

**Example**:

```typescript
pull_request_create({
  provider: 'github',
  repository_name: 'projectpulse',
  repository_organization: 'myorg',
  title: 'Add issue tracker',
  source_branch: 'feature/issues',
  target_branch: 'master',
  body: 'Implements issue tracking feature',
});
```

**When to use**:

- Creating/managing GitHub issues
- Creating pull requests
- Reviewing code
- Managing repositories

---

## Postgres

**Server**: `mcp__postgres`
**When to use**: Direct PostgreSQL database queries

### Available Tools

#### `query`

Run read-only SQL query

**Example**:

```typescript
query({
  sql: `
    SELECT * FROM user_preferences
    WHERE theme = 'desert'
    LIMIT 10
  `,
});
```

**When to use**:

- Debugging database state
- Complex queries not supported by Prisma
- Database inspection
- Performance analysis (EXPLAIN)

**Caution**:

- Read-only queries only
- Prefer Prisma for application code
- Use for debugging and analysis

---

## Playwright

**Server**: `mcp__playwright`
**When to use**: Browser automation, E2E testing, UI verification

### Available Tools

#### `browser_navigate`

Navigate to URL

**Example**:

```typescript
browser_navigate({
  url: 'http://localhost:3000',
});
```

#### `browser_snapshot`

Capture accessibility snapshot

**Example**:

```typescript
browser_snapshot();
```

#### `browser_click`

Click an element

**Example**:

```typescript
browser_click({
  element: 'Submit button',
  ref: "button[type='submit']",
});
```

#### `browser_type`

Type text into input

**Example**:

```typescript
browser_type({
  element: 'Search input',
  ref: "input[name='search']",
  text: 'test query',
});
```

#### `browser_take_screenshot`

Capture screenshot

**Example**:

```typescript
browser_take_screenshot({
  filename: 'homepage.png',
  fullPage: true,
});
```

**When to use**:

- E2E testing
- UI verification
- Visual regression testing
- Manual testing automation

---

## Docker DevHub

**Server**: `mcp__docker-devhub`
**When to use**: Docker container management for ProjectPulse

### Available Tools

#### `docker_status`

Show all containers

**Example**:

```typescript
docker_status();
```

#### `docker_logs`

View container logs

**Example**:

```typescript
docker_logs({
  container: 'projectpulse-db',
  tail: 50,
});
```

#### `docker_restart`

Restart a container

**Example**:

```typescript
docker_restart({
  container: 'projectpulse-web',
});
```

#### `docker_compose_status`

Show Docker Compose services

**Example**:

```typescript
docker_compose_status();
```

**When to use**:

- Debugging container issues
- Checking database status
- Restarting services
- Viewing logs

---

## ProjectPulse MCP Server

**Server**: `projectpulse` (Sprint 8.7 - Stateless HTTP Streaming)
**URL**: `http://192.168.1.15:3001/mcp`
**Transport**: HTTP (stateless streaming)
**Protocol**: MCP 2024-11-05
**Tools**: 42 tools across 9 categories
**Status**: ✅ Production Ready (Validated 2025-11-20)

**When to use**: Sprint management, onboarding workflows, wiki documentation, issue tracking, workflow orchestration, roadmap planning, blueprint management, **context management (Memory Banks)**

### Context & Memory Bank Tools

**Entry Point**: `projectpulse_context_load` - **🚀 START HERE**

#### Recommended Context Tools (Self-Guiding MCP)

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `projectpulse_context_load` | 🚀 Load all project context | **Always call first** when starting work or after context loss |
| `projectpulse_context_lookup` | Load single memory bank | Token-efficient partial context loading |
| `projectpulse_context_update` | Update memory bank content | User-explicit updates to project brief, patterns, tech context |

#### ⚠️ Deprecated Memory Tools (Sprint 9 - Legacy)

These tools are deprecated but kept for backward compatibility. **Use context tools instead.**

| Deprecated Tool | Replacement | Migration |
|-----------------|-------------|-----------|
| `projectpulse_memory_sessionStart` | `projectpulse_context_load` | Same data + session state + hints |
| `projectpulse_memory_patternLookup` | `projectpulse_context_lookup` | Same data + better formatting |
| `projectpulse_memory_contextRecovery` | `projectpulse_context_load` with `banksToLoad: 'active-only'` | Same banks + session state |

#### Memory Bank Types

| Bank Type | Purpose | Token Budget |
|-----------|---------|--------------|
| `PROJECT_BRIEF` | WHAT we're building and WHY | ≤3K tokens |
| `SYSTEM_PATTERNS` | HOW we build (architecture patterns) | ≤2K tokens |
| `TECH_CONTEXT` | Technical stack and constraints | ≤2K tokens |
| `ACTIVE_CONTEXT` | Current focus and work state | ≤1K tokens |
| `PROGRESS` | What's done, what's left | ≤2K tokens |

---

**Architecture Update (Sprint 8.7)**:
- Single POST `/mcp` endpoint (stateless HTTP)
- Removed SSE transport and JSON-RPC shim
- Fixed HTTP 406 with rawHeaders middleware
- Validated with Factory Droid, Claude Code, curl
- See [MCP_ARCHITECTURE.md](../MCP_ARCHITECTURE.md) v2.0.0

### Available Tools

#### `projectpulse.sprint.phase.create`

Create a new sprint phase with auto-generated child weeks

**Parameters**:

```typescript
{
  title: string,              // Phase title (1-200 chars)
  description?: string,       // Optional description
  startDate: string,          // ISO 8601 date (e.g., "2025-11-10T00:00:00.000Z")
  durationWeeks: number,      // Number of weeks (1-52, default: 4)
  goals?: string[]            // Optional array of phase goals
}
```

**Example**:

```typescript
projectpulse.sprint.phase.create({
  title: 'Phase 2: API Development',
  description: 'Build REST APIs for sprint management',
  startDate: '2025-11-10T00:00:00.000Z',
  durationWeeks: 4,
  goals: [
    'Implement POST /api/phases endpoint',
    'Implement GET /api/tasks/current endpoint',
    'Add performance indexes',
  ],
});
```

**Returns**:

```json
{
  "status": "success",
  "phase": {
    "id": "clxxxx",
    "title": "Phase 2: API Development",
    "startDate": "2025-11-10T00:00:00.000Z",
    "endDate": "2025-12-08T00:00:00.000Z",
    "progress": 0
  },
  "weeks": [
    {
      "id": "clxxxx",
      "title": "Phase 2: API Development - Week 1",
      "startDate": "2025-11-10T00:00:00.000Z",
      "endDate": "2025-11-17T00:00:00.000Z"
    }
    // ... (4 weeks total)
  ]
}
```

**Implementation**:

- **API Endpoint**: `POST /api/phases`
- **Performance**: Uses Prisma nested write (3x faster than manual loops)
- **Auto-Generation**: Automatically creates N child weeks based on duration
- **Atomic**: Single database transaction ensures data consistency

**Source**: [apps/mcp-server/src/tools/sprintPhaseCreate.ts](../../apps/mcp-server/src/tools/sprintPhaseCreate.ts)

---

#### `projectpulse.sprint.getCurrentTask`

Retrieve the currently active task with full hierarchical context

**Parameters**:

```typescript
{
  includeHistory?: boolean    // Include recent session history (default: false)
}
```

**Example**:

```typescript
// Get current task without history
projectpulse.sprint.getCurrentTask({});

// Get current task with session history
projectpulse.sprint.getCurrentTask({
  includeHistory: true,
});
```

**Returns (Task Active)**:

```json
{
  "status": "active_task_found",
  "currentTask": {
    "id": "clxxxx",
    "title": "Implement POST /api/phases endpoint",
    "status": "IN_PROGRESS",
    "progress": "75%"
  },
  "context": {
    "hierarchy": {
      "phase": "Sprint 1: Foundation (58% complete)",
      "week": "Sprint 1 - Week 1 (100% complete)",
      "day": "Day 6-7: Sprint Tools Implementation (85% complete)"
    }
  }
}
```

**Returns (No Active Task)**:

```json
{
  "status": "no_active_task",
  "message": "No task is currently in progress"
}
```

**Implementation**:

- **API Endpoint**: `GET /api/tasks/current?includeHistory={boolean}`
- **Performance**: Uses optimized `select` (52% smaller payload) + critical index on `updatedAt DESC` (100x faster)
- **Query Strategy**: `findFirst` with `status='IN_PROGRESS'` ordered by most recently updated
- **Hierarchy**: Flattened 3-level nested structure (task → day → week → phase)

**Source**: [apps/mcp-server/src/tools/sprintGetCurrentTask.ts](../../apps/mcp-server/src/tools/sprintGetCurrentTask.ts)

---

#### `projectpulse.sprint.updateProgress`

Update entity progress with automatic parent roll-up propagation

**Parameters**:

```typescript
{
  entityType: 'session' | 'task' | 'day' | 'week' | 'phase',  // Entity type (required)
  entityId: string,           // Entity ID in CUID format (required)
  progress: number            // Progress value 0-100 (required, integer)
}
```

**Example**:

```typescript
// Update session progress (triggers task → day → week → phase propagation)
projectpulse.sprint.updateProgress({
  entityType: 'session',
  entityId: 'clx1234567890abcdefgh',
  progress: 75,
});

// Update task progress directly
projectpulse.sprint.updateProgress({
  entityType: 'task',
  entityId: 'clxABCD1234567890XYZ',
  progress: 50,
});
```

**Returns (Success)**:

```json
{
  "status": "success",
  "entity": {
    "id": "clx1234567890abcdefgh",
    "type": "session",
    "progress": 75,
    "status": "IN_PROGRESS"
  },
  "propagation": {
    "updated": [
      {
        "id": "clx0987654321zyxwvuts",
        "type": "task",
        "progress": 62,
        "status": "IN_PROGRESS"
      },
      {
        "id": "clx5555666677778888",
        "type": "day",
        "progress": 45,
        "status": "IN_PROGRESS"
      }
    ],
    "summary": "Updated session → propagated to task (62%) → day (45%)"
  }
}
```

**Returns (Error)**:

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Progress must be between 0 and 100"
  }
}
```

**Implementation**:

- **API Endpoint**: `PUT /api/:entity/:id/progress` (generic route for all 5 entity types)
- **Progress Algorithm**: Uses `updateProgressAndPropagate()` from `lib/db/progress.ts` (Day 3 implementation)
- **Propagation Tracking**: Returns summary of all affected parent entities
- **Performance**: Incremental transactions (1 level at a time) to prevent deadlocks
- **Validation**: Zod schema validation for entity type enum + progress range (0-100)

**Use Cases**:

- Mark session as complete after work (progress: 100)
- Update task progress manually (progress: 50, 75, etc.)
- Track day/week/phase completion automatically via child updates
- Observe propagation chain to verify roll-up calculations

**Source**: [apps/mcp-server/src/tools/sprintUpdateProgress.ts](../../apps/mcp-server/src/tools/sprintUpdateProgress.ts)

---

#### `projectpulse.sprint.task.create`

Create a new task under a day with parent validation and date range checks

**Parameters**:

```typescript
{
  dayId: string,              // Parent day ID (CUID, required)
  title: string,              // Task title 1-200 chars (required)
  description?: string,       // Optional description
  startDate: string,          // ISO 8601 datetime (required)
  endDate: string,            // ISO 8601 datetime (required)
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED',  // Default: NOT_STARTED
  progress?: number,          // Integer 0-100 (default: 0)
  estimatedHours?: number     // Positive number (optional)
}
```

**Example**:

```typescript
// Create task with full details
projectpulse.sprint.task.create({
  dayId: 'clx9999888877776666',
  title: 'Implement progress update API',
  description: 'Create generic PUT /api/:entity/:id/progress route',
  startDate: '2025-11-09T09:00:00Z',
  endDate: '2025-11-09T17:00:00Z',
  status: 'IN_PROGRESS',
  progress: 0,
  estimatedHours: 4,
});

// Create minimal task
projectpulse.sprint.task.create({
  dayId: 'clx9999888877776666',
  title: 'Fix bug in session validation',
  startDate: '2025-11-09T14:00:00Z',
  endDate: '2025-11-09T16:00:00Z',
});
```

**Returns (Success)**:

```json
{
  "status": "success",
  "task": {
    "id": "clxABCD1234567890XYZ",
    "dayId": "clx9999888877776666",
    "title": "Implement progress update API",
    "description": "Create generic PUT /api/:entity/:id/progress route",
    "startDate": "2025-11-09T09:00:00.000Z",
    "endDate": "2025-11-09T17:00:00.000Z",
    "status": "IN_PROGRESS",
    "progress": 0,
    "estimatedHours": 4,
    "actualHours": null
  },
  "context": {
    "day": { "id": "clx9999888877776666", "title": "Day 10" },
    "week": { "id": "clx1111222233334444", "title": "Week 2" },
    "phase": { "id": "clx5555666677778888", "title": "Sprint 1" }
  }
}
```

**Returns (Error - Date Range Violation)**:

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Task dates must be within day's range (2025-11-09 to 2025-11-09)",
    "details": {
      "taskStart": "2025-11-09T09:00:00Z",
      "taskEnd": "2025-11-10T17:00:00Z",
      "dayStart": "2025-11-09T00:00:00Z",
      "dayEnd": "2025-11-09T23:59:59Z"
    }
  }
}
```

**Returns (Error - Parent Not Found)**:

```json
{
  "status": "error",
  "error": {
    "code": "NOT_FOUND",
    "message": "Day with ID clx9999888877776666 not found"
  }
}
```

**Implementation**:

- **API Endpoint**: `POST /api/tasks`
- **Parent Validation**: Verifies day exists before creating task
- **Date Range Validation**: Enforces task dates within day's start/end range
- **Hierarchical Context**: Returns full context (day → week → phase) for navigation
- **Validation**: Zod schema for type safety, CUID format for IDs

**Use Cases**:

- Break down a day into specific tasks
- Track estimated vs actual hours
- Create task structure for sprint planning
- Maintain data integrity via date range constraints

**Source**: [apps/mcp-server/src/tools/sprintTaskCreate.ts](../../apps/mcp-server/src/tools/sprintTaskCreate.ts)

---

#### `projectpulse.sprint.session.create`

Create a new session under a task with parent validation and optional endDate support

**Parameters**:

```typescript
{
  taskId: string,             // Parent task ID (CUID, required)
  title: string,              // Session title 1-200 chars (required)
  description?: string,       // Optional description
  startDate: string,          // ISO 8601 datetime (required)
  endDate?: string,           // ISO 8601 datetime (optional - sessions can be in-progress)
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED',  // Default: NOT_STARTED
  progress?: number,          // Integer 0-100 (default: 0)
  notes?: string,             // Optional session notes
  tokenCount?: number         // Positive integer (optional - AI token usage tracking)
}
```

**Example**:

```typescript
// Create completed session
projectpulse.sprint.session.create({
  taskId: 'clxABCD1234567890XYZ',
  title: 'Morning implementation session',
  description: 'Implement progress route and MCP tool',
  startDate: '2025-11-09T09:00:00Z',
  endDate: '2025-11-09T12:00:00Z',
  status: 'COMPLETED',
  progress: 100,
  notes: 'Successfully implemented generic route pattern',
  tokenCount: 45000,
});

// Create in-progress session (no endDate)
projectpulse.sprint.session.create({
  taskId: 'clxABCD1234567890XYZ',
  title: 'Afternoon debugging session',
  startDate: '2025-11-09T14:00:00Z',
  status: 'IN_PROGRESS',
  progress: 50,
});
```

**Returns (Success)**:

```json
{
  "status": "success",
  "session": {
    "id": "clxEFGH9876543210ABC",
    "taskId": "clxABCD1234567890XYZ",
    "title": "Morning implementation session",
    "description": "Implement progress route and MCP tool",
    "startDate": "2025-11-09T09:00:00.000Z",
    "endDate": "2025-11-09T12:00:00.000Z",
    "status": "COMPLETED",
    "progress": 100,
    "notes": "Successfully implemented generic route pattern",
    "tokenCount": 45000
  },
  "context": {
    "task": { "id": "clxABCD1234567890XYZ", "title": "Implement progress update API" },
    "day": { "id": "clx9999888877776666", "title": "Day 10" },
    "week": { "id": "clx1111222233334444", "title": "Week 2" },
    "phase": { "id": "clx5555666677778888", "title": "Sprint 1" }
  }
}
```

**Returns (Error - Date Range Violation)**:

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Session end date must be within task's range (2025-11-09 09:00 to 2025-11-09 17:00)",
    "details": {
      "sessionEnd": "2025-11-09T18:00:00Z",
      "taskStart": "2025-11-09T09:00:00Z",
      "taskEnd": "2025-11-09T17:00:00Z"
    }
  }
}
```

**Implementation**:

- **API Endpoint**: `POST /api/sessions`
- **Parent Validation**: Verifies task exists before creating session
- **Optional endDate**: Supports in-progress sessions without end time
- **Date Range Validation**: When `endDate` provided, enforces within task's range
- **Hierarchical Context**: Returns full context (task → day → week → phase)
- **Token Tracking**: Optional `tokenCount` field for AI usage monitoring

**Use Cases**:

- Track individual work sessions within a task
- Monitor AI token consumption per session
- Create session notes for future reference
- Support in-progress sessions (no endDate until complete)
- Maintain data integrity via date range constraints

**Source**: [apps/mcp-server/src/tools/sprintSessionCreate.ts](../../apps/mcp-server/src/tools/sprintSessionCreate.ts)

---

#### `projectpulse.sprint.checkpoint.create`

Create a checkpoint to save agent progress every 15K tokens for context recovery

**Parameters**:

```typescript
{
  sessionId: string,          // Parent session ID (CUID, required)
  notes: string,              // Checkpoint notes 1-5000 chars (required)
  tokenUsage: number,         // Current token usage 0-200000 (required)
  sessionContext?: {          // Optional context snapshot
    taskId?: string,
    taskTitle?: string,
    dayId?: string,
    dayTitle?: string,
    completionPercentage?: number,
    checkpointCount?: number,
    filesModified?: string[],
    filesCreated?: string[],
    endpointsImplemented?: string[],
    uncommittedChanges?: boolean,
    currentBranch?: string,
    tokenBudgetRemaining?: number
  }
}
```

**Example**:

```typescript
// Create checkpoint with full context
projectpulse.sprint.checkpoint.create({
  sessionId: 'clxEFGH9876543210ABC',
  notes: 'Completed API implementation, starting tests. Files modified: route.ts, checkpoint.ts',
  tokenUsage: 45000,
  sessionContext: {
    taskId: 'clxABCD1234567890XYZ',
    taskTitle: 'Implement checkpoint API',
    completionPercentage: 60,
    filesModified: ['app/api/checkpoints/route.ts', 'lib/validation/checkpoint.ts'],
    uncommittedChanges: true,
    currentBranch: 'feature/sprint-1-foundation',
    tokenBudgetRemaining: 155000
  }
});

// Create minimal checkpoint (no context)
projectpulse.sprint.checkpoint.create({
  sessionId: 'clxEFGH9876543210ABC',
  notes: 'Quick checkpoint at 30K tokens',
  tokenUsage: 30000
});
```

**Returns (Success)**:

```json
{
  "status": "success",
  "checkpoint": {
    "id": "clxCHK1234567890DEF",
    "checkpointNumber": 3,
    "sessionId": "clxEFGH9876543210ABC",
    "tokenUsage": 45000,
    "createdAt": "2025-11-09T14:30:00.000Z"
  },
  "message": "Checkpoint #3 created successfully",
  "nextCheckpoint": "Create next checkpoint at 60000 tokens"
}
```

**Returns (Error - Session Not Found)**:

```json
{
  "status": "error",
  "error": "Session with ID clxEFGH9876543210ABC not found",
  "code": "SESSION_NOT_FOUND"
}
```

**Implementation**:

- **API Endpoint**: `POST /api/checkpoints`
- **Parent Validation**: Verifies session exists before creating checkpoint
- **Sequential Numbering**: Auto-increments checkpointNumber per session
- **JSONB Storage**: Flexible sessionContext field (no schema changes needed)
- **Performance**: <100ms creation, <50ms latest checkpoint query
- **Strict Validation**: Rejects unknown sessionContext properties

**Use Cases**:

- Save progress every 15K tokens (15K, 30K, 45K, 60K, 75K, 90K)
- Context recovery after compaction or session interruption
- Checkpoint at major milestones (component complete, tests passing)
- Track implementation progress with file/endpoint lists
- Monitor token budget to prevent hitting 200K limit

**Workflow Integration**:

```typescript
// 1. Agent tracks token usage during session
let currentTokens = 0;

// 2. Every 15K tokens → Create checkpoint automatically
if (currentTokens >= 15000 && currentTokens % 15000 < 1000) {
  projectpulse.sprint.checkpoint.create({
    sessionId: currentSessionId,
    notes: `Checkpoint at ${currentTokens} tokens. Implemented: ${completedItems.join(', ')}`,
    tokenUsage: currentTokens,
    sessionContext: {
      completionPercentage: calculateProgress(),
      filesModified: getModifiedFiles(),
      uncommittedChanges: hasUncommittedChanges(),
      tokenBudgetRemaining: 200000 - currentTokens
    }
  });
}

// 3. On context compaction → Query latest checkpoint to restore state
const latestCheckpoint = await queryLatestCheckpoint(sessionId);
// Use checkpoint.sessionContext to resume work
```

**Source**: [apps/mcp-server/src/tools/sprintCheckpointCreate.ts](../../apps/mcp-server/src/tools/sprintCheckpointCreate.ts)

---

#### `projectpulse.sprint.queryHierarchy`

Query hierarchy entities with filters (status, progress) for reporting and finding specific work items

**Parameters**:

```typescript
{
  level: "phase" | "week" | "day" | "task" | "session",  // Entity level to query (required)
  status?: ("NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "CANCELLED")[],  // Filter by status (OR logic)
  progressMin?: number,     // Minimum progress (0-100)
  progressMax?: number,     // Maximum progress (0-100)
  page?: number,            // Page number (default 1)
  limit?: number            // Results per page (default 20, max 100)
}
```

**Examples**:

```typescript
// Find all blocked tasks
projectpulse.sprint.queryHierarchy({
  level: 'task',
  status: ['BLOCKED']
});

// Find stuck work (low progress, in progress)
projectpulse.sprint.queryHierarchy({
  level: 'task',
  status: ['IN_PROGRESS'],
  progressMax: 30
});

// Find nearly complete sessions
projectpulse.sprint.queryHierarchy({
  level: 'session',
  progressMin: 75,
  progressMax: 99
});

// Find completed OR blocked tasks (OR logic)
projectpulse.sprint.queryHierarchy({
  level: 'task',
  status: ['COMPLETED', 'BLOCKED']
});

// Pagination example (page 2, 50 results per page)
projectpulse.sprint.queryHierarchy({
  level: 'week',
  status: ['IN_PROGRESS'],
  page: 2,
  limit: 50
});
```

**Returns (Success)**:

```json
{
  "status": "success",
  "query": {
    "level": "task",
    "filters": {
      "status": ["BLOCKED"],
      "progressRange": null
    }
  },
  "results": [
    {
      "id": "clxABC123",
      "title": "Implement authentication system",
      "description": "OAuth + JWT auth flow",
      "status": "BLOCKED",
      "progress": 25,
      "startDate": "2025-11-08T09:00:00.000Z",
      "endDate": null,
      "createdAt": "2025-11-08T09:00:00.000Z",
      "day": {
        "id": "clxDAY001",
        "title": "Day 5 - Auth Implementation",
        "week": {
          "id": "clxWEEK01",
          "title": "Week 2 - Security Features",
          "phase": {
            "id": "clxPHASE1",
            "title": "Phase B - Core Features"
          }
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1,
    "hasMore": false
  }
}
```

**Returns (Error - Invalid Level)**:

```json
{
  "status": "error",
  "error": "Invalid enum value. Expected 'phase' | 'week' | 'day' | 'task' | 'session', received 'invalid'",
  "code": "VALIDATION_ERROR"
}
```

**Implementation**:

- **API Endpoint**: `GET /api/hierarchy/query`
- **Single Endpoint Pattern**: DRY - reduces code duplication by 80%
- **Parent Context**: Always included via Prisma `select` (52% smaller payload)
- **Status Filter**: OR logic (matches ANY of the provided statuses)
- **Progress Range**: Validates progressMin <= progressMax
- **Pagination**: Default 20, max 100 items per page
- **Performance**: <50ms simple query, <200ms complex query

**Use Cases**:

- **Find blocked work**: `status: ['BLOCKED']`
- **Find stuck tasks**: `status: ['IN_PROGRESS'], progressMax: 30`
- **Find completed items**: `status: ['COMPLETED']`
- **Find nearly done work**: `progressMin: 75, progressMax: 99`
- **Sprint reporting**: Query all levels for status dashboard
- **Identify issues**: Find blocked or low-progress items for intervention

**Workflow Integration**:

```typescript
// 1. Daily standup: Find all blocked work
const blockedItems = await projectpulse.sprint.queryHierarchy({
  level: 'task',
  status: ['BLOCKED']
});

// 2. Sprint review: Find all completed work this week
const completedWork = await projectpulse.sprint.queryHierarchy({
  level: 'task',
  status: ['COMPLETED']
});

// 3. Risk assessment: Find stuck tasks (in progress but low completion)
const stuckTasks = await projectpulse.sprint.queryHierarchy({
  level: 'task',
  status: ['IN_PROGRESS'],
  progressMax: 25
});

// 4. Planning: Find nearly complete items to prioritize finishing
const almostDone = await projectpulse.sprint.queryHierarchy({
  level: 'session',
  progressMin: 80,
  status: ['IN_PROGRESS']
});
```

**Scope (Minimal US-007 - 2 story points)**:

- ✅ Status filtering (OR logic, multiple values)
- ✅ Progress range filtering (min/max)
- ✅ Pagination (efficiency for large datasets)
- ⏭️ Date range filtering (deferred to Sprint 2 for full US-007 completion)

**Source**: [apps/mcp-server/src/tools/sprintQueryHierarchy.ts](../../apps/mcp-server/src/tools/sprintQueryHierarchy.ts)

---

#### `projectpulse.workflow.list`

List available workflow templates with optional filtering

**Parameters**:

```typescript
{
  category?: string,     // Optional filter: "development", "project-management", "knowledge"
  isActive?: boolean     // Optional filter (default: true)
}
```

**Example**:

```typescript
// List all active workflows
projectpulse.workflow.list({});

// Filter by development category
projectpulse.workflow.list({
  category: 'development',
});

// Include inactive workflows
projectpulse.workflow.list({
  isActive: false,
});
```

**Returns**:

```
📋 Available Workflow Templates (6 found)

🔧 Development Workflows:
1. Feature Implementation (10 steps)
   Complete workflow for implementing a new feature from planning to deployment

2. Bug Fix (8 steps)
   Systematic workflow for investigating and fixing bugs

📊 Project Management Workflows:
3. Sprint Planning (6 steps)
   Setup new sprint with phases, weeks, days, and tasks

[...]
```

**Implementation**:

- **API Endpoint**: `GET /api/workflows`
- **Formatted Output**: Rich text with emoji categorization
- **Filtering**: Supports category and active status filters

**Source**: [apps/mcp-server/src/tools/workflowList.ts](../../apps/mcp-server/src/tools/workflowList.ts)

---

#### `projectpulse.workflow.start`

Start a new workflow run from a template

**Parameters**:

```typescript
{
  templateId: number,               // Required, workflow template ID
  projectId?: number,               // Optional, link to project
  initialContext?: Record<string, any>  // Optional, initial execution context
}
```

**Example**:

```typescript
// Start Feature Implementation workflow
projectpulse.workflow.start({
  templateId: 1,
  initialContext: {
    featureName: 'User Authentication',
    targetBranch: 'feature/auth',
  },
});

// Start Bug Fix workflow with project link
projectpulse.workflow.start({
  templateId: 2,
  projectId: 42,
  initialContext: {
    bugTitle: 'Fix login timeout',
    issueNumber: 123,
  },
});
```

**Returns**:

```
✅ Workflow Run Started

Run ID: 123
Template: Feature Implementation
Status: pending
Current Step: 1/10

📝 Next Step:
Step 1: Create Feature Branch
Create new git branch for feature

Ready to execute first step with workflow.executeStep
```

**Implementation**:

- **API Endpoint**: `POST /api/workflows/run`
- **Creates**: WorkflowRun + all WorkflowStep records
- **Returns**: Run ID and next step information

**Source**: [apps/mcp-server/src/tools/workflowStart.ts](../../apps/mcp-server/src/tools/workflowStart.ts)

---

#### `projectpulse.workflow.executeStep`

Execute the current step in a workflow run

**Parameters**:

```typescript
{
  runId: number,                     // Required, workflow run ID
  stepResult?: Record<string, any>   // Optional, result from completed step
}
```

**Example**:

```typescript
// Execute step without result data
projectpulse.workflow.executeStep({
  runId: 123,
});

// Execute step with result data
projectpulse.workflow.executeStep({
  runId: 123,
  stepResult: {
    success: true,
    branchName: 'feature/auth',
    filesCreated: ['auth.ts', 'login.tsx'],
  },
});
```

**Returns**:

```
✅ Step Completed

Step 3: Create Wiki Page ✓
Status: completed

📝 Next Step:
Step 4: Create Sprint Task
Track feature in sprint system

Progress: 3/10 steps complete
Workflow Status: running
```

**Implementation**:

- **API Endpoint**: `POST /api/workflows/run/:id/step`
- **Updates**: Current step status, advances to next step
- **State Machine**: Enforces valid transitions

**Source**: [apps/mcp-server/src/tools/workflowExecuteStep.ts](../../apps/mcp-server/src/tools/workflowExecuteStep.ts)

---

#### `projectpulse.workflow.getStatus`

Get current status of a workflow run

**Parameters**:

```typescript
{
  runId: number   // Required, workflow run ID
}
```

**Example**:

```typescript
// Get workflow status
projectpulse.workflow.getStatus({
  runId: 123,
});
```

**Returns**:

```
📊 Workflow Run Status

Run ID: 123
Template: Feature Implementation
Status: running
Progress: 3/10 steps complete (30%)

⏱️ Timeline:
Started: 2025-11-12 08:00:00
Current Duration: 2 hours

📝 Steps:
✓ Step 1: Create Feature Branch (completed)
✓ Step 2: Run Onboarding Session (completed)
✓ Step 3: Create Wiki Page (completed)
⏳ Step 4: Create Sprint Task (pending)
⏸ Step 5: Implement Feature Code (pending)
[...]

💾 Context:
{
  "featureName": "User Authentication",
  "branchName": "feature/auth"
}
```

**Implementation**:

- **API Endpoint**: `GET /api/workflows/run/:id`
- **Returns**: Full status, all steps, context data
- **Formatted**: Rich text with progress indicators

**Source**: [apps/mcp-server/src/tools/workflowGetStatus.ts](../../apps/mcp-server/src/tools/workflowGetStatus.ts)

---

#### `projectpulse.workflow.pause`

Pause a running workflow (creates checkpoint)

**Parameters**:

```typescript
{
  runId: number   // Required, workflow run ID
}
```

**Example**:

```typescript
// Pause workflow
projectpulse.workflow.pause({
  runId: 123,
});
```

**Returns**:

```
⏸️ Workflow Paused

Run ID: 123
Template: Feature Implementation
Previous Status: running → paused
Current Step: 4/10

Paused At: 2025-11-12 10:30:00
Progress Saved: 3 steps completed

Use workflow.resume to continue execution
```

**Implementation**:

- **Updates**: WorkflowRun status to `paused`
- **Sets**: `pausedAt` timestamp
- **Integration**: Can trigger `sprint.checkpoint.create`

**Source**: [apps/mcp-server/src/tools/workflowPause.ts](../../apps/mcp-server/src/tools/workflowPause.ts)

---

#### `projectpulse.workflow.resume`

Resume a paused workflow

**Parameters**:

```typescript
{
  runId: number   // Required, workflow run ID
}
```

**Example**:

```typescript
// Resume workflow
projectpulse.workflow.resume({
  runId: 123,
});
```

**Returns**:

```
▶️ Workflow Resumed

Run ID: 123
Template: Feature Implementation
Previous Status: paused → running
Current Step: 4/10

Paused Duration: 2 hours 15 minutes

📝 Next Step:
Step 4: Create Sprint Task
Track feature in sprint system

Ready to continue with workflow.executeStep
```

**Implementation**:

- **Updates**: WorkflowRun status to `running`
- **Clears**: `pausedAt` timestamp
- **Returns**: Current step for continued execution

**Source**: [apps/mcp-server/src/tools/workflowResume.ts](../../apps/mcp-server/src/tools/workflowResume.ts)

---

#### `projectpulse.workflow.complete`

Manually mark workflow as complete

**Parameters**:

```typescript
{
  runId: number   // Required, workflow run ID
}
```

**Example**:

```typescript
// Complete workflow manually
projectpulse.workflow.complete({
  runId: 123,
});
```

**Returns**:

```
✅ Workflow Completed

Run ID: 123
Template: Feature Implementation
Final Status: completed

⏱️ Duration:
Started: 2025-11-12 08:00:00
Completed: 2025-11-12 16:30:00
Total Time: 8 hours 30 minutes

📊 Summary:
Total Steps: 10
Completed: 10
Success Rate: 100%

All steps executed successfully
```

**Implementation**:

- **Updates**: WorkflowRun status to `completed`
- **Sets**: `completedAt` timestamp
- **Use Case**: Manual completion or early termination

**Source**: [apps/mcp-server/src/tools/workflowComplete.ts](../../apps/mcp-server/src/tools/workflowComplete.ts)

---

#### `projectpulse.issue.create`

Create a single issue with automatic tagging and context injection

**Parameters**:

```typescript
{
  projectId: number,           // Required, project ID
  title: string,               // Required, 1-200 chars
  description?: string,        // Optional, max 50,000 chars
  status?: string,             // Optional, max 32 chars
  priority?: string,           // Optional, max 32 chars
  module?: string,             // Optional, max 80 chars
  assignee?: string,           // Optional, max 120 chars
  labelIds?: number[],         // Optional, max 25 labels
  context?: {
    files?: Array<{
      filePath: string,        // Required, max 2048 chars
      lineNumber?: number,     // Optional, 1-1,000,000
      snippet?: string         // Optional, max 5000 chars
    }>,                        // Max 25 files
    metadata?: Record<string, unknown>
  }
}
```

**Example**:

```typescript
projectpulse.issue.create({
  projectId: 5,
  title: 'Add user authentication',
  description: 'Implement JWT-based authentication',
  priority: 'high',
  context: {
    files: [
      {
        filePath: 'src/auth/AuthService.ts',
        lineNumber: 42,
        snippet: 'function login(credentials: LoginInput) {...}'
      }
    ]
  }
});
```

**Features**:
- **Auto-tagging**: Module and labels derived from file paths
- **Auto-priority**: Derived from file path patterns
- **Label creation**: Missing labels are created automatically
- **Context injection**: Stores file references with line numbers and code snippets

**API**: `POST /api/issues`
**Source**: [apps/mcp-server/src/tools/issues/create.ts](../../apps/mcp-server/src/tools/issues/create.ts)

---

#### `projectpulse.issue.bulkCreate`

Create multiple issues in a single transaction (up to 50 issues)

**Parameters**:

```typescript
{
  projectId: number,
  issues: Array<{
    title: string,
    description?: string,
    status?: string,
    priority?: string,
    module?: string,
    assignee?: string,
    labelIds?: number[],
    context?: {
      files?: Array<{
        filePath: string,
        lineNumber?: number,
        snippet?: string
      }>,
      metadata?: Record<string, unknown>
    },
    reference?: string         // Optional identifier, max 64 chars
  }>                          // Min: 1, Max: 50
}
```

**Example**:

```typescript
projectpulse.issue.bulkCreate({
  projectId: 5,
  issues: [
    {
      title: 'Fix login bug',
      priority: 'high',
      context: {
        files: [{ filePath: 'src/auth/login.ts', lineNumber: 42 }]
      }
    },
    {
      title: 'Add logout endpoint',
      priority: 'medium',
      context: {
        files: [{ filePath: 'src/api/auth/route.ts', lineNumber: 100 }]
      }
    }
  ]
});
```

**Performance**: Optimized for bulk operations (<2s for 15 issues)

**Features**:
- **Transactional**: All issues created or none
- **Auto-tagging**: Applied to each issue based on context files
- **Bulk optimized**: Uses Prisma `createMany` for performance

**API**: `POST /api/issues/bulk`
**Source**: [apps/mcp-server/src/tools/issues/bulkCreate.ts](../../apps/mcp-server/src/tools/issues/bulkCreate.ts)

---

#### `projectpulse.issue.update`

Update an existing issue (partial update)

**Parameters**:

```typescript
{
  issueId: number,             // Required, issue ID
  title?: string,
  description?: string,
  status?: string,
  priority?: string,
  module?: string,
  assignee?: string,
  labelIds?: number[]
}
```

**Example**:

```typescript
projectpulse.issue.update({
  issueId: 123,
  status: 'in_progress',
  priority: 'high',
  assignee: 'john@example.com'
});
```

**API**: `PATCH /api/issues/[id]`
**Source**: [apps/mcp-server/src/tools/issues/update.ts](../../apps/mcp-server/src/tools/issues/update.ts)

---

#### `projectpulse.issue.search`

Search and filter issues with pagination

**Parameters**:

```typescript
{
  projectId?: number,
  status?: string | string[],
  priority?: string | string[],
  module?: string | string[],
  assignee?: string,
  labelIds?: number | number[],
  search?: string,             // Searches title + description
  orderBy?: "createdAt" | "updatedAt" | "priority" | "status",
  orderDir?: "asc" | "desc",
  page?: number,               // Default: 1
  pageSize?: number            // Default: 25, Max: 100
}
```

**Example**:

```typescript
// Find all high-priority open issues
projectpulse.issue.search({
  projectId: 5,
  status: 'open',
  priority: 'high',
  orderBy: 'createdAt',
  orderDir: 'desc'
});

// Search by text
projectpulse.issue.search({
  search: 'authentication',
  page: 1,
  pageSize: 10
});
```

**API**: `GET /api/issues`
**Source**: [apps/mcp-server/src/tools/issues/search.ts](../../apps/mcp-server/src/tools/issues/search.ts)

---

#### `projectpulse.issue.addComment`

Add a comment to an existing issue

**Parameters**:

```typescript
{
  issueId: number,             // Required, issue ID
  content: string,             // Required, 1-10000 chars
  author?: string              // Optional, defaults to 'Anonymous'
}
```

**Example**:

```typescript
projectpulse.issue.addComment({
  issueId: 123,
  content: 'Fixed in commit abc123. Ready for review.',
  author: 'john@example.com'
});
```

**API**: `POST /api/issues/[id]/comments`
**Source**: [apps/mcp-server/src/tools/issues/addComment.ts](../../apps/mcp-server/src/tools/issues/addComment.ts)

---

#### `projectpulse.issue.setStatus`

Update issue status with automatic timestamp management

**Parameters**:

```typescript
{
  issueId: number,             // Required, issue ID
  status: string               // Required, max 32 chars
}
```

**Example**:

```typescript
// Close an issue
projectpulse.issue.setStatus({
  issueId: 123,
  status: 'closed'
});

// Reopen an issue
projectpulse.issue.setStatus({
  issueId: 123,
  status: 'open'
});
```

**Features**:
- **Auto-timestamps**: Sets `closedAt` when status changes to 'closed'
- **Reopen support**: Clears `closedAt` when reopening

**API**: `PATCH /api/issues/[id]/status`
**Source**: [apps/mcp-server/src/tools/issues/setStatus.ts](../../apps/mcp-server/src/tools/issues/setStatus.ts)

---

### Kanban Board Tools (Sprint 15)

These tools support the 5-column kanban workflow for sprint-based ticket management.

#### `projectpulse_kanban_getBoard`

Get complete kanban board for a sprint with tickets grouped by column

**Parameters**:

```typescript
{
  sprintId: string   // Sprint ID (cuid) to fetch kanban board for
}
```

**Example**:

```typescript
// Get kanban board for current sprint
projectpulse_kanban_getBoard({
  sprintId: 'cm5abc123xyz789...',
});
```

**Returns**:

```json
{
  "status": "success",
  "data": {
    "sprint": {
      "id": "cm5abc123...",
      "sprintNumber": 1,
      "title": "Sprint 1: Foundation",
      "status": "IN_PROGRESS",
      "progress": 45,
      "phase": {
        "id": "cm5phase...",
        "title": "Phase 1: Core Features"
      }
    },
    "columns": {
      "backlog": [],
      "todo": [
        {
          "id": 25,
          "title": "Implement search API",
          "status": "todo",
          "priority": "high",
          "kind": "feature",
          "displayOrder": 0,
          "parentTicketId": null,
          "assignee": "Claude Code"
        }
      ],
      "in-progress": [...],
      "in-review": [...],
      "done": [...]
    },
    "ghosts": [
      {
        "ticketId": 30,
        "title": "Parent Feature",
        "kind": "feature",
        "actualStatus": "in-progress",
        "ghostInStatus": "todo",
        "ghostType": "parent",
        "relatedTicketId": 31
      }
    ],
    "stats": {
      "total": 15,
      "done": 5,
      "inProgress": 3,
      "progress": 33,
      "columnSummary": "Backlog: 2, Todo: 5, In Progress: 3, In Review: 0, Done: 5"
    }
  }
}
```

**Features**:
- **5-Column Workflow**: backlog → todo → in-progress → in-review → done
- **Ghost Cards**: Shows parent/child relationships when tickets are in different columns
- **Board Statistics**: Total counts, completion progress, per-column breakdown
- **Sprint Context**: Full sprint and phase metadata for navigation

**When to use**:
- Rendering kanban board UI for a sprint
- Getting complete board state for ticket management
- Checking sprint progress and ticket distribution
- Understanding parent-child relationships across columns

**API**: `GET /api/sprints/[sprintId]/kanban`
**Source**: [apps/mcp-server/src/tools/kanban/getBoardTool.ts](../../apps/mcp-server/src/tools/kanban/getBoardTool.ts)

---

#### `projectpulse_kanban_moveTicket`

Move a ticket to a new column and/or position with automatic progress cascade

**Parameters**:

```typescript
{
  ticketId: number,      // Ticket ID to move (positive integer)
  status: string,        // Target column: 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done'
  displayOrder: number   // Target position in column (0-indexed, 0 = top)
}
```

**Example**:

```typescript
// Move ticket to in-progress column at position 0 (top)
projectpulse_kanban_moveTicket({
  ticketId: 25,
  status: 'in-progress',
  displayOrder: 0,
});
```

**Returns**:

```json
{
  "status": "success",
  "data": {
    "ticket": {
      "id": 25,
      "title": "Implement search API",
      "status": "in-progress",
      "displayOrder": 0,
      "priority": "high",
      "kind": "feature",
      "parentTicketId": null,
      "assignee": "Claude Code"
    },
    "progressUpdates": {
      "ticketId": 25,
      "parentProgress": "75%",
      "sprintProgress": "45%",
      "phaseProgress": "30%"
    },
    "message": "Progress updated: Parent feature: 75%, Sprint: 45%, Phase: 30%"
  }
}
```

**Features**:
- **Automatic Reordering**: Other tickets in column shift to accommodate
- **Progress Cascade**: Moving to 'done' triggers parent/sprint/phase progress recalculation
- **Timestamp Management**: Sets `closedAt` when moving to 'done', clears when moving away
- **Validation**: Enforces valid status values and position bounds

**When to use**:
- Drag-drop operations in kanban UI
- Moving tickets between workflow stages
- Reordering tickets within a column
- Completing work (move to 'done' triggers progress cascade)

**Prefer over `ticket_update` because**:
1. Handles reordering of other tickets in column automatically
2. Returns progress cascade for immediate UI feedback
3. Manages `closedAt` timestamp automatically

**API**: `PATCH /api/tickets/[id]/move`
**Source**: [apps/mcp-server/src/tools/kanban/moveTicketTool.ts](../../apps/mcp-server/src/tools/kanban/moveTicketTool.ts)

---

### When to Use ProjectPulse Tools

**Use `sprint.phase.create` when**:

- Starting a new sprint or phase
- Need to set up sprint structure with weeks
- Planning multi-week development cycles
- Initializing project timeline

**Use `sprint.getCurrentTask` when**:

- Need to know what task is currently in progress
- Want full context of current work (phase → week → day → task)
- Checking sprint progress and hierarchy
- Resuming work after interruption

**Use `sprint.updateProgress` when**:

- Marking session as complete after work
- Updating task progress manually
- Tracking completion across hierarchy levels
- Verifying progress roll-up calculations
- Need to see propagation chain (which parents were updated)

**Use `sprint.task.create` when**:

- Breaking down a day into specific tasks
- Planning detailed work within a day
- Need to track estimated vs actual hours
- Setting up task structure for sprint

**Use `sprint.session.create` when**:

- Starting a new work session on a task
- Tracking AI token consumption
- Recording session notes and outcomes
- Supporting in-progress sessions (no endDate)
- Monitoring detailed work activity

**Use `sprint.checkpoint.create` when**:

- Saving agent progress every 15K tokens (15K, 30K, 45K, 60K, 75K, 90K)
- Creating context recovery points before context compaction
- Tracking implementation progress at major milestones
- Monitoring token budget to prevent hitting 200K limit
- Saving work state with file/endpoint lists for resumption

**Use `sprint.queryHierarchy` when**:

- Finding all blocked or stuck work items
- Generating sprint status reports
- Identifying low-progress tasks that need attention
- Finding completed work for sprint review
- Filtering entities by status (completed, blocked, in progress)
- Finding nearly complete items to prioritize finishing
- Daily standup: "What's blocked?"
- Risk assessment: "What's stuck with low progress?"

**Use `kanban_getBoard` when**:

- Rendering kanban board UI for a sprint
- Need complete board state with all columns, tickets, and stats
- Checking sprint progress and ticket distribution
- Understanding parent-child relationships via ghost cards
- Getting sprint context (phase, progress, metadata)

**Use `kanban_moveTicket` when**:

- Implementing drag-drop in kanban UI
- Moving tickets between workflow stages (backlog → todo → in-progress → in-review → done)
- Reordering tickets within a column
- Completing work (triggers progress cascade automatically)
- Need automatic `closedAt` timestamp management

**Prefer `kanban_moveTicket` over `ticket_update` for status changes because**:
- Handles reordering of other tickets in column automatically
- Returns progress cascade for immediate UI feedback
- Manages `closedAt` timestamp automatically

**Common Workflows**:

```typescript
// 1. Start new phase
projectpulse.sprint.phase.create({
  title: 'Phase 2',
  startDate: '2025-11-10T00:00:00.000Z',
  durationWeeks: 4,
});

// 2. Create task under a day
projectpulse.sprint.task.create({
  dayId: 'clx9999888877776666',
  title: 'Implement progress update API',
  startDate: '2025-11-09T09:00:00Z',
  endDate: '2025-11-09T17:00:00Z',
  estimatedHours: 4,
});

// 3. Create session under task
projectpulse.sprint.session.create({
  taskId: 'clxABCD1234567890XYZ',
  title: 'Morning implementation session',
  startDate: '2025-11-09T09:00:00Z',
  status: 'IN_PROGRESS',
});

// 4. Update session progress (triggers propagation)
projectpulse.sprint.updateProgress({
  entityType: 'session',
  entityId: 'clxEFGH9876543210ABC',
  progress: 100,
});
// Response shows: session → task → day → week → phase propagation

// 5. Check current task context
projectpulse.sprint.getCurrentTask({ includeHistory: true });
```

**Performance Notes**:

- All 5 tools optimized for <500ms response time (NFR-019)
- Database indexes added for critical queries (updatedAt DESC, dayId, taskId)
- Prisma nested writes and select patterns for efficiency
- Generic route pattern reduces code duplication (1 route for 5 entity types)
- Progress propagation uses incremental transactions to prevent deadlocks
- Implementation notes tracked in database (Session and Checkpoint entities)
- Verification results available via `projectpulse.sprint.queryHierarchy` for completed work

---

## Ticket Identification (Sprint 17)

All ticket tools support **dual-input**: either global `ticketId` OR project-scoped `ticketNumber` + `projectId`.

### The Problem

Users see **#123** in the web UI. This is `ticketNumber` (project-scoped).
**DO NOT** use this as `ticketId` - that's a different number (global database ID)!

### Decision Rule

| User Says | Parameter to Use | Example |
|-----------|------------------|---------|
| "#5", "ticket 5", "work on 5" | `ticketNumber` + `projectId` | `ticket_get({ ticketNumber: 5, projectId: 6 })` |
| (from previous API response) | `ticketId` | `ticket_update({ ticketId: 42, ... })` |

**Rule**: If USER gave you the number, use `ticketNumber`. If API returned it, use `ticketId`.

### Tools Supporting Dual-Input

| Tool | ticketNumber | ticketId |
|------|--------------|----------|
| `ticket_get` | Yes + projectId | Yes |
| `ticket_update` | Yes + projectId | Yes |
| `ticket_setStatus` | Yes + projectId | Yes |
| `ticket_addComment` | Yes + projectId | Yes |
| `ticket_getChildren` | Yes + projectId | Yes |
| `ticket_getHierarchy` | Yes + projectId | Yes |
| `kanban_moveTicket` | Yes + projectId | Yes |
| `agent_session_start` | `activeTicketNumbers[]` | `activeTicketIds[]` |

### Examples

```typescript
// CORRECT: User says "update ticket #5"
projectpulse_ticket_update({
  ticketNumber: 5,   // User's number from UI
  projectId: 6,      // Always required with ticketNumber
  status: "in-progress"
});

// WRONG: This gets a DIFFERENT ticket!
projectpulse_ticket_update({
  ticketId: 5,       // Global ID - NOT what user sees!
  status: "in-progress"
});

// Agent session with user-referenced tickets
projectpulse_agent_session_start({
  projectId: 6,
  activeTicketNumbers: [5, 7]  // Use this, NOT activeTicketIds!
});
```

### Quick Decision Tree

1. **Did the USER give you the number?** → Use `ticketNumber` + `projectId`
2. **Did an API call return an ID?** → Use `ticketId`
3. **Not sure?** → Use `ticketNumber` + `projectId` (safer default)

---

## Sequential Thinking

**Server**: `mcp__sequential-thinking`
**When to use**: Complex problem-solving requiring multi-step reasoning

### Available Tools

#### `sequentialthinking`

Step-by-step problem solving

**Example**:

```typescript
sequentialthinking({
  thought: 'First, I need to understand the database schema',
  nextThoughtNeeded: true,
  thoughtNumber: 1,
  totalThoughts: 5,
});
```

**Parameters**:

- `thought`: Current thinking step
- `nextThoughtNeeded`: Whether more steps needed
- `thoughtNumber`: Current step number
- `totalThoughts`: Estimated total steps
- `isRevision`: If revising previous thought
- `revisesThought`: Which thought to revise

**When to use**:

- Complex architecture decisions
- Multi-step debugging
- System design
- Performance optimization planning

---

## Tool Selection Guide

### When to use which tool?

**File Operations**:

- **Prefer**: Claude Code's built-in Read/Write/Edit tools
- **Use filesystem**: Only for advanced operations or batch processing

**Git Operations**:

- **Prefer**: Claude Code's built-in git tools
- **Use mcp\_\_git**: For advanced git operations

**Database Operations**:

- **Prefer**: Prisma (in code)
- **Use postgres**: For debugging, complex queries, EXPLAIN

**Issue/PR Management**:

- **Prefer**: gitkraken tools
- **Manual**: GitHub web interface for complex workflows

**Testing**:

- **Prefer**: Jest/Playwright tests in codebase
- **Use playwright MCP**: For interactive testing, debugging

**Problem Solving**:

- **Simple**: Direct implementation
- **Complex**: Use sequential-thinking for planning

---

## MCP Configuration

**Location**: Claude Code settings (`~/.config/claude-code/` or similar)

**Current servers configured**:

```json
{
  "mcpServers": {
    "memory": {
      /* byterover config */
    },
    "filesystem": {
      /* filesystem config */
    },
    "git": {
      /* git config */
    },
    "gitkraken": {
      /* gitkraken config */
    },
    "postgres": {
      /* postgres config */
    },
    "playwright": {
      /* playwright config */
    },
    "docker-devhub": {
      /* docker config */
    },
    "sequential-thinking": {
      /* thinking config */
    }
  }
}
```

---

## Best Practices

### 1. Tool Efficiency

**Use right tool for the job**:

- File reading → Read tool (not filesystem MCP)
- Git status → Built-in git (not MCP git)
- Database queries → Prisma (not postgres MCP)

**MCP tools are for**:

- Features not in built-in tools
- Integration with external services
- Specialized operations

### 2. Error Handling

**Always handle MCP tool errors**:

```typescript
try {
  const result = await mcp_tool({ ... });
} catch (error) {
  // Handle error
}
```

### 3. Resource Cleanup

**Close resources after use**:

- Browser sessions (playwright)
- Database connections
- File handles

### 4. Security

**Never expose**:

- Database credentials
- API tokens
- Secrets in MCP calls

**Use environment variables**:

```bash
DATABASE_URL=postgresql://...
GITHUB_TOKEN=ghp_...
```

---

## Troubleshooting

### MCP Server Not Responding

**Check server status**:

```bash
# View Claude Code logs
cat ~/.config/claude-code/logs/mcp-servers.log
```

**Restart Claude Code**

### Tool Not Available

**Verify MCP server is configured**:

1. Check Claude Code settings
2. Restart Claude Code
3. Check server logs

### Database Connection Issues

**postgres MCP**:

- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Test connection: `psql $DATABASE_URL`

### Docker Issues

**docker-devhub MCP**:

- Verify Docker is running: `docker ps`
- Check container names: `docker ps -a`
- Check Docker Compose: `docker-compose ps`

---

## Code Execution vs Traditional MCP

### Traditional MCP (Current Usage)

**How it works:**
1. All tool definitions are sent to the model at session start
2. Model calls tools via function calling
3. Results return through the model context window
4. Repeat for each tool call

**Token costs:**
- Tool definitions: ~500–1000 tokens per tool
- Results: Full content passes back through context
- Example: 9 servers × ~10 tools ≈ ~45K–90K tokens upfront

**Best for:**
- Small tool sets (<20 tools)
- Simple request/response patterns
- Immediate tool availability

### Code Execution MCP (Planned)

**How it works:**
1. Tools organized as filesystem modules (e.g., `./servers/projectpulse/...`)
2. Agent explores directories to discover tools on-demand
3. Agent writes code that imports and calls tools
4. Code executes locally, processes/filters data, returns minimal results

**Token costs:**
- Tool definitions: Loaded only when needed
- Results: Pre-filtered locally before returning to model
- Example: 150K tokens → ~2K tokens (≈98.7% reduction)

**Best for:**
- Large tool sets (current scope: 41 tools; expandable)
- Complex workflows (loops/filtering)
- Privacy-sensitive operations
- Large dataset processing (search/rank/filter)

### When to Use Each Approach

| Use Case                          | Traditional MCP | Code Execution MCP |
|-----------------------------------|-----------------|--------------------|
| Current day-to-day ops            | ✅               | ➖ Planned          |
| ProjectPulse server (41 tools)   | ❌ Context bloat | ✅ Planned Sprint 2 |
| Simple CRUD                       | ✅ Fast          | ⚠️ Overhead         |
| Search/filter large datasets      | ❌ Token heavy   | ✅ Efficient        |
| Privacy-sensitive data processing | ⚠️ Manual        | ✅ Auto-tokenize    |

### Functional Parity Guarantee

All MCP clients receive identical functionality:
- Same 41 tools, same business logic and results
- Same privacy protections (tokenization)
- Same data access (Prisma operations)

Efficiency varies by client capability:
- Traditional mode (ALL clients): 50–70% token reduction (pagination, filtering, compression)
- Code execution mode (Claude Code if supported): 90–98% token reduction (local processing)

### Client Capability Detection (Hybrid)

- Attempt negotiation during handshake (if supported): server `capabilities: { tools: true, codeExecution: true }`, client `supports: { codeExecution: boolean }`
- Fallback via env var: `PP_MCP_MODE=traditional|code-exec|auto` (default: `auto`)
- Probe on first call with session caching; safe default is traditional mode

### Implementation Roadmap

**Sprint 1 (Current):**
- Continue using traditional MCP; focus on core features

**Sprint 2 (Week 5: Design + Traditional POC):**
- Traditional MCP server POC (3 tools: create-issue, search-issues, filter-issues)
- Capability detection design + detection stubs (PP_MCP_MODE + probe)
- Shared services interface definitions (Issue/Privacy/Validation)
- Privacy tokenization specification (document)
- Sandbox security specification (document)
- Multi-client test harness design (mock traditional client + CLI)
- Token usage baseline (traditional mode)

**Sprint 2 (Weeks 6-7):**
- Refine specs; optimize traditional mode (pagination-first, compression, timeouts)
- Document dual-mode patterns; prepare Sprint 3 plan

**Sprint 3 (Integration):**
- Implement code execution environment and wrappers for all tools
- Enable on-demand loading + local filtering for search-heavy tools

**Future:**
- Evaluate wrapping existing servers for heavy operations (e.g., postgres)
- Hybrid: traditional for simple, code execution for complex

**References:**
- Code Execution with MCP – https://www.anthropic.com/engineering/code-execution-with-mcp
- MCP Spec – https://modelcontextprotocol.io
- Architecture – ../../docs/03-Architecture.md
- Design – ../../docs/archive/plans/mcp-code-execution-design.md

---

## Resources

### Documentation

- [MCP Specification](https://modelcontextprotocol.io/)
- [Claude Code MCP Guide](https://docs.claude.com/claude-code/mcp)

### Project Documentation

- [MCP Architecture](../../docs/03-MCP_ARCHITECTURE.md) (when created)
- [DevHub MCP Server](../../apps/mcp-server/) (future implementation)

### Tool-Specific Docs

- [Playwright](https://playwright.dev/)
- [GitKraken](https://www.gitkraken.com/)
- [Prisma](https://www.prisma.io/)

---

---

#### `projectpulse.skill.list`

List skills with frontmatter only (token-efficient lazy-loading)

**Parameters**:

```typescript
{
  category?: "framework" | "testing" | "workflow" | "troubleshooting",  // Filter by category (optional)
  search?: string,          // Search in title and description (optional)
  page?: number,            // Page number (default: 1)
  limit?: number            // Items per page (default: 20, max: 100)
}
```

**Example**:

```typescript
// List all testing skills
projectpulse.skill.list({
  category: 'testing',
  page: 1,
  limit: 20,
});

// Search for specific skills
projectpulse.skill.list({
  search: 'jest',
  limit: 10,
});
```

**Returns**:

```typescript
{
  skills: Array<{
    id: number,
    title: string,
    description: string,
    category: string,
    tags: string[],
    metadata?: object,
    createdAt: string,
    updatedAt: string
  }>,
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number,
    hasMore: boolean
  }
}
```

**Token Efficiency**: ~70 tokens per skill (97.2% reduction vs 2,500 token baseline)

**When to use**:

- Browse available skills without loading full content
- Filter skills by category or search term
- Get skill metadata for selection
- Minimize token usage when exploring skills

**Source**: [apps/mcp-server/src/tools/skill/list.ts](../../apps/mcp-server/src/tools/skill/list.ts)

---

#### `projectpulse.skill.load`

Load full skill content including markdown body (on-demand loading)

**Parameters**:

```typescript
{
  skillId: number           // Required, skill ID to load
}
```

**Example**:

```typescript
// Load full skill content
projectpulse.skill.load({
  skillId: 1,
});
```

**Returns**:

```typescript
{
  id: number,
  title: string,
  description: string,
  category: string,
  tags: string[],
  content: string,          // Full markdown content
  metadata?: object,
  linkedKnowledge: Array<{
    id: number,
    title: string
  }>,
  createdAt: string,
  updatedAt: string
}
```

**Token Efficiency**: ~220 tokens per skill (91.2% reduction vs 2,500 token baseline)

**When to use**:

- Load complete skill content for implementation
- Access markdown documentation and examples
- View linked knowledge items
- After selecting skill from list

**Auto-Unload**: Skills unload after 5 minutes of inactivity (LRU cache with 100-entry limit)

**Source**: [apps/mcp-server/src/tools/skill/load.ts](../../apps/mcp-server/src/tools/skill/load.ts)

---

#### `projectpulse.skill.search`

Search skills by keyword in title, description, and content

**Parameters**:

```typescript
{
  query: string,            // Required, search query
  category?: string,        // Optional category filter
  limit?: number            // Results limit (default: 10, max: 50)
}
```

**Example**:

```typescript
// Search for testing-related skills
projectpulse.skill.search({
  query: 'unit testing',
  category: 'testing',
  limit: 10,
});
```

**Returns**:

```typescript
{
  results: Array<{
    id: number,
    title: string,
    description: string,
    category: string,
    tags: string[],
    matchScore?: number,    // Relevance score
    excerpt: string         // Matched content snippet
  }>,
  total: number,
  query: string
}
```

**When to use**:

- Find skills by keyword or topic
- Discover relevant skills for specific tasks
- Full-text search across skill content
- Ranked results by relevance

**Source**: [apps/mcp-server/src/tools/skill/search.ts](../../apps/mcp-server/src/tools/skill/search.ts)

---

#### `projectpulse.skill.create`

Create a new skill with frontmatter and markdown content

**Parameters**:

```typescript
{
  title: string,            // Required, 1-200 chars
  description: string,      // Required, 1-500 chars
  content: string,          // Required, markdown content
  category: "framework" | "testing" | "workflow" | "troubleshooting",  // Required
  tags?: string[],          // Optional, max 10 tags
  metadata?: object         // Optional metadata (difficulty, prerequisites, etc.)
}
```

**Example**:

```typescript
// Create new testing skill
projectpulse.skill.create({
  title: 'Playwright E2E Testing',
  description: 'End-to-end testing with Playwright framework',
  content: '# Playwright E2E Testing\n\n## Setup\n...',
  category: 'testing',
  tags: ['playwright', 'e2e', 'automation'],
  metadata: {
    difficulty: 'intermediate',
    prerequisites: ['javascript-basics'],
  },
});
```

**Returns**:

```typescript
{
  id: number,
  title: string,
  description: string,
  category: string,
  tags: string[],
  content: string,
  metadata: object,
  createdAt: string,
  updatedAt: string
}
```

**When to use**:

- Document new implementation patterns
- Create skill from discovered best practices
- Add framework-specific techniques
- Build reusable workflow guides

**Source**: [apps/mcp-server/src/tools/skill/create.ts](../../apps/mcp-server/src/tools/skill/create.ts)

---

#### `projectpulse.skill.update`

Update an existing skill (partial update)

**Parameters**:

```typescript
{
  skillId: number,          // Required, skill ID
  title?: string,           // Optional update
  description?: string,     // Optional update
  content?: string,         // Optional update
  category?: string,        // Optional update
  tags?: string[],          // Optional update
  metadata?: object         // Optional update
}
```

**Example**:

```typescript
// Update skill description and tags
projectpulse.skill.update({
  skillId: 1,
  description: 'Updated description with more details',
  tags: ['jest', 'unit-testing', 'tdd', 'mocking'],
});
```

**Returns**:

```typescript
{
  id: number,
  title: string,
  description: string,
  category: string,
  tags: string[],
  content: string,
  metadata: object,
  updatedAt: string
}
```

**When to use**:

- Refine skill content based on usage
- Add new examples or techniques
- Update metadata (difficulty, prerequisites)
- Fix errors or outdated information

**Source**: [apps/mcp-server/src/tools/skill/update.ts](../../apps/mcp-server/src/tools/skill/update.ts)

---

#### `projectpulse.skill.delete`

Delete a skill permanently

**Parameters**:

```typescript
{
  skillId: number           // Required, skill ID to delete
}
```

**Example**:

```typescript
// Delete obsolete skill
projectpulse.skill.delete({
  skillId: 5,
});
```

**Returns**:

```typescript
{
  success: true,
  deletedId: number,
  message: string
}
```

**When to use**:

- Remove obsolete or deprecated skills
- Clean up duplicate skills
- Remove incorrect or harmful patterns
- Maintain skill quality

**Warning**: Permanent deletion - consider archiving knowledge items instead

**Source**: [apps/mcp-server/src/tools/skill/delete.ts](../../apps/mcp-server/src/tools/skill/delete.ts)

---

#### `projectpulse.skill.export`

Export skills to JSON format for backup or migration

**Parameters**:

```typescript
{
  filters?: {
    category?: string,      // Filter by category
    tags?: string[],        // Filter by tags
    search?: string         // Search term
  }
}
```

**Example**:

```typescript
// Export all testing skills
projectpulse.skill.export({
  filters: {
    category: 'testing',
  },
});

// Export skills matching specific tags
projectpulse.skill.export({
  filters: {
    tags: ['react', 'hooks'],
  },
});
```

**Returns**:

```typescript
{
  format: 'json',
  itemCount: number,
  exportData: Array<{
    id: number,
    title: string,
    description: string,
    content: string,
    category: string,
    tags: string[],
    metadata: object,
    createdAt: string,
    updatedAt: string
  }>,
  timestamp: string
}
```

**When to use**:

- Backup skills before major changes
- Migrate skills between environments
- Share skills with team members
- Create skill snapshots

**Source**: [apps/mcp-server/src/tools/skill/export.ts](../../apps/mcp-server/src/tools/skill/export.ts)

---

#### `projectpulse.skill.import`

Import skills from JSON format with validation

**Parameters**:

```typescript
{
  items: Array<{
    title: string,
    description: string,
    content: string,
    category: string,
    tags?: string[],
    metadata?: object
  }>,
  options?: {
    skipDuplicates?: boolean,   // Skip duplicate titles (default: false)
    overwrite?: boolean         // Overwrite existing items (default: false)
  }
}
```

**Example**:

```typescript
// Import skills from backup
projectpulse.skill.import({
  items: [
    {
      title: 'Next.js Server Components',
      description: 'Patterns for React Server Components',
      content: '# Next.js Server Components\n\n...',
      category: 'framework',
      tags: ['nextjs', 'react', 'server-components'],
    },
  ],
  options: {
    skipDuplicates: true,
  },
});
```

**Returns**:

```typescript
{
  imported: number,
  skipped: number,
  failed: number,
  details: Array<{
    title: string,
    status: 'imported' | 'skipped' | 'failed',
    reason?: string
  }>
}
```

**When to use**:

- Restore skills from backup
- Migrate skills from another environment
- Bulk import team-shared skills
- Initialize skills database

**Validation**: All imported skills validated against schema before insertion

**Source**: [apps/mcp-server/src/tools/skill/import.ts](../../apps/mcp-server/src/tools/skill/import.ts)

---

#### `projectpulse.skill.linkKnowledge`

Create bidirectional link between skill and knowledge item

**Parameters**:

```typescript
{
  skillId: number,          // Required, skill ID
  knowledgeId: number       // Required, knowledge item ID
}
```

**Example**:

```typescript
// Link testing skill to testing best practices knowledge
projectpulse.skill.linkKnowledge({
  skillId: 1,
  knowledgeId: 5,
});
```

**Returns**:

```typescript
{
  linkId: number,
  skillId: number,
  knowledgeId: number,
  createdAt: string
}
```

**When to use**:

- Connect implementation skills to theoretical knowledge
- Link pattern skills to architectural knowledge
- Create cross-references between resources
- Build knowledge graph relationships

**Bidirectional**: Link appears in both skill.load() and knowledge.related()

**Source**: [apps/mcp-server/src/tools/skill/linkKnowledge.ts](../../apps/mcp-server/src/tools/skill/linkKnowledge.ts)

---

**Last Updated:** 2025-12-26
**MCP Status:** Core tools configured + ProjectPulse MCP server active (42 tools - Sprint 15)
**Completed:** Sprint 1-15 (8 sprint + 6 workflow + 6 issue + 7 knowledge + 7 skills + 2 kanban)

**See also**: [.agent/progress.md](../progress.md) for current project status
