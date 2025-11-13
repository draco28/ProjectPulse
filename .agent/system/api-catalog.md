# API Endpoint Catalog

**Last Updated**: 2025-11-13
**Base URL**: `http://localhost:3000/api`
**Status**: Full CRUD + Search + Multi-entity + Sprint Management + Workflow Orchestration + Knowledge Management + Skills System (Sprint 6 complete)

---

## Quick Index

### Sprint Management

- [POST /api/phases](#post-apiphases) - Create phase with auto-generated weeks
- [GET /api/tasks/current](#get-apitaskscurrent) - Get currently active task with hierarchy
- [PUT /api/:entity/:id/progress](#put-apientityidprogress) - Update progress with automatic roll-up
- [POST /api/tasks](#post-apitasks) - Create task under a day
- [POST /api/sessions](#post-apisessions) - Create session under a task
- [POST /api/checkpoints](#post-apicheckpoints) - Create checkpoint for session (Day 13)
- [GET /api/hierarchy/query](#get-apihierarchyquery) - Query hierarchy with filters (NEW - Day 13)

### Workflow Orchestration

- [GET /api/workflows](#get-apiworkflows) - List workflow templates
- [POST /api/workflows/run](#post-apiworkflowsrun) - Start workflow run
- [GET /api/workflows/run/:id](#get-apiworkflowsrunid) - Get workflow run status
- [POST /api/workflows/run/:id/step](#post-apiworkflowsrunidstep) - Execute workflow step

### Theme Management

- [GET /api/preferences/:userId](#get-apipreferencesuserid) - Get user preferences
- [PUT /api/preferences/:userId](#put-apipreferencesuserid) - Update user preferences

### Issue Management

- [POST /api/issues](#post-apiissues) - Create single issue with auto-tagging
- [GET /api/issues](#get-apiissues) - List issues with filters and pagination
- [GET /api/issues/[id]](#get-apiissuesid) - Get issue detail
- [PATCH /api/issues/[id]](#patch-apiissuesid) - Update issue
- [DELETE /api/issues/[id]](#delete-apiissuesid) - Delete issue
- [POST /api/issues/bulk](#post-apiissuesbulk) - Bulk create issues (up to 50)
- [POST /api/issues/[id]/comments](#post-apiissuesidcomments) - Add comment to issue
- [PATCH /api/issues/[id]/status](#patch-apiissuesidstatus) - Update issue status

### Knowledge Base

- [GET /api/knowledge](#get-apiknowledge) - List knowledge base articles with pagination and filtering
- [GET /api/knowledge/metrics](#get-apiknowledgemetrics) - Get query metrics and performance data
- [POST /api/knowledge/export](#post-apiknowledgeexport) - Export knowledge items to JSON/CSV
- [POST /api/knowledge/import](#post-apiknowledgeimport) - Import knowledge items from JSON
- [PATCH /api/knowledge/:id/archive](#patch-apiknowledgeidarchive) - Archive a knowledge item
- [PATCH /api/knowledge/:id/unarchive](#patch-apiknowledgeidunarchive) - Unarchive a knowledge item

### Skills Management

- [GET /api/skills](#get-apiskills) - List skills (frontmatter only, token-efficient)
- [GET /api/skills/:id](#get-apiskillsid) - Get full skill content
- [GET /api/skills/search](#get-apiskillssearch) - Search skills by keyword
- [POST /api/skills](#post-apiskills) - Create a new skill
- [PATCH /api/skills/:id](#patch-apiskillsid) - Update an existing skill
- [DELETE /api/skills/:id](#delete-apiskillsid) - Delete a skill
- [POST /api/skills/export](#post-apiskillsexport) - Export skills to JSON
- [POST /api/skills/import](#post-apiskillsimport) - Import skills from JSON
- [POST /api/skills/:id/link-knowledge](#post-apiskillsidlink-knowledge) - Link skill to knowledge item
- [DELETE /api/skills/:id/unlink-knowledge/:knowledgeId](#delete-apiskillsidunlink-knowledgeknowledgeid) - Unlink from knowledge

### Wiki Pages

- [GET /api/wiki/:slug](#get-apiwikislug) - Fetch wiki page by slug with related pages

### Security Dashboard

- [GET /api/security/score](#get-apisecurityscore) - Calculate security score from findings
- [GET /api/security/vulnerabilities](#get-apisecurityvulnerabilities) - List security findings with filters

### Global Search

- [GET /api/search](#get-apisearch) - Unified search across all entities

### Future Endpoints (Planned)

- Authentication API (Phase 4)

---

## Current Endpoints

### Sprint Management

#### POST /api/phases

**Description**: Create a new phase with auto-generated child weeks

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

```typescript
{
  title: string (1-200 chars, required),
  description?: string (optional),
  startDate: string (ISO 8601 format, required),
  endDate: string (ISO 8601 format, required),
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "CANCELLED" (default: "NOT_STARTED"),
  progress?: number (0-100, default: 0)
}
```

**Request Example**:

```http
POST /api/phases HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "title": "Phase 2: API Development",
  "description": "Build REST APIs for sprint management",
  "startDate": "2025-11-10T00:00:00.000Z",
  "endDate": "2025-12-08T00:00:00.000Z"
}
```

**Response**: `201 Created`

```json
{
  "success": true,
  "data": {
    "phase": {
      "id": "clxxxx",
      "title": "Phase 2: API Development",
      "description": "Build REST APIs for sprint management",
      "status": "NOT_STARTED",
      "progress": 0,
      "startDate": "2025-11-10T00:00:00.000Z",
      "endDate": "2025-12-08T00:00:00.000Z",
      "createdAt": "2025-11-08T08:00:00.000Z",
      "updatedAt": "2025-11-08T08:00:00.000Z"
    },
    "weeks": [
      {
        "id": "clxxxx",
        "title": "Phase 2: API Development - Week 1",
        "phaseId": "clxxxx",
        "startDate": "2025-11-10T00:00:00.000Z",
        "endDate": "2025-11-17T00:00:00.000Z",
        "status": "NOT_STARTED",
        "progress": 0
      },
      {
        "id": "clxxxx",
        "title": "Phase 2: API Development - Week 2",
        "phaseId": "clxxxx",
        "startDate": "2025-11-17T00:00:00.000Z",
        "endDate": "2025-11-24T00:00:00.000Z",
        "status": "NOT_STARTED",
        "progress": 0
      }
      // ... (4 weeks total in this example)
    ]
  }
}
```

**Implementation Details**:

- **Auto-Week Generation**: Automatically calculates number of weeks from date range and creates child week records
- **Atomic Operation**: Uses Prisma nested write pattern (single database transaction, 3x faster than manual loops)
- **Week Naming**: Auto-generates week titles as `{Phase Title} - Week {N}`
- **Date Capping**: Week end dates never exceed phase end date

**Validation**:

- `title`: Required, 1-200 characters
- `startDate`: Required, valid ISO 8601 date string
- `endDate`: Required, valid ISO 8601 date string
- `status`: Optional, must be valid enum value
- `progress`: Optional, integer 0-100

**Error Responses**:

`400 Bad Request` - Validation error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "field": "title"
  }
}
```

`500 Internal Server Error` - Database error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Database operation failed"
  }
}
```

**Performance**:

- Uses Prisma nested write (3x faster than loop + transaction: 50ms vs 150ms)
- Single atomic query instead of N+1 queries
- See: `.agent/task/prisma-sprint-tools-20251107-0630.md`

**Source**: [apps/web/app/api/phases/route.ts](../../apps/web/app/api/phases/route.ts)
**Authentication**: None (to be added)

---

#### GET /api/tasks/current

**Description**: Retrieve the currently active task (status=IN_PROGRESS) with full hierarchical context (phase → week → day → task)

**Query Parameters**:

- `includeHistory` (optional, boolean): Include recent session history (last 5 sessions) - default: `false`

**Headers**:

```http
Content-Type: application/json
```

**Request Examples**:

```http
GET /api/tasks/current HTTP/1.1
Host: localhost:3000
```

```http
GET /api/tasks/current?includeHistory=true HTTP/1.1
Host: localhost:3000
```

**Response (Task Found)**: `200 OK`

```json
{
  "success": true,
  "data": {
    "currentTask": {
      "id": "clxxxx",
      "title": "Implement POST /api/phases endpoint",
      "description": "Create API route with Prisma nested write pattern",
      "status": "IN_PROGRESS",
      "progress": 75,
      "startDate": "2025-11-08T08:00:00.000Z",
      "endDate": "2025-11-08T12:00:00.000Z",
      "createdAt": "2025-11-08T07:00:00.000Z",
      "updatedAt": "2025-11-08T10:30:00.000Z",
      "day": {
        "id": "clxxxx",
        "title": "Day 6-7: Sprint Tools Implementation",
        "status": "IN_PROGRESS",
        "progress": 85,
        "startDate": "2025-11-07T00:00:00.000Z"
      },
      "week": {
        "id": "clxxxx",
        "title": "Sprint 1 - Week 1",
        "status": "IN_PROGRESS",
        "progress": 100,
        "startDate": "2025-11-01T00:00:00.000Z"
      },
      "phase": {
        "id": "clxxxx",
        "title": "Sprint 1: Foundation",
        "status": "IN_PROGRESS",
        "progress": 58,
        "startDate": "2025-11-01T00:00:00.000Z"
      },
      "sessions": [
        {
          "id": "clxxxx",
          "title": "Session 2025-11-08 Morning",
          "status": "COMPLETED",
          "progress": 100,
          "startDate": "2025-11-08T08:00:00.000Z"
        }
        // ... (up to 5 recent sessions if includeHistory=true)
      ]
    }
  }
}
```

**Response (No Active Task)**: `200 OK`

```json
{
  "success": true,
  "data": {
    "currentTask": null,
    "message": "No task is currently in progress"
  }
}
```

**Implementation Details**:

- **Query Strategy**: `findFirst` with `status = 'IN_PROGRESS'` and `orderBy updatedAt DESC`
- **Performance Index**: Uses `@@index([updatedAt(sort: Desc)])` on Task model (100x faster: 2ms vs 200ms)
- **Optimized Payload**: Uses `select` instead of `include` (52% smaller payload)
- **Flattened Response**: 3-level nested structure (task → day → week → phase) flattened for easier consumption
- **Dynamic Rendering**: `export const dynamic = 'force-dynamic'` (no caching)

**Validation**:

- `includeHistory`: Optional boolean query param

**Error Responses**:

`500 Internal Server Error` - Database error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Database operation failed"
  }
}
```

**Performance**:

- Uses `select` instead of `include` (52% payload reduction)
- Critical index on `updatedAt DESC` (100x query speedup)
- Conditional session loading (only when `includeHistory=true`)
- See: `.agent/task/prisma-sprint-tools-20251107-0630.md`

**Source**: [apps/web/app/api/tasks/current/route.ts](../../apps/web/app/api/tasks/current/route.ts)
**Authentication**: None (to be added)

---

#### PUT /api/:entity/:id/progress

**Description**: Update entity progress with automatic parent roll-up propagation. Generic route serving all 5 entity types (sessions, tasks, days, weeks, phases).

**Path Parameters**:

- `entity` (string) - Entity type: `sessions` | `tasks` | `days` | `weeks` | `phases`
- `id` (string) - Entity ID (CUID format)

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

```typescript
{
  progress: number  // Integer 0-100 (required)
}
```

**Request Example**:

```http
PUT /api/sessions/clx1234567890abcdefgh/progress HTTP/1.1
Host: 192.168.1.15:3000
Content-Type: application/json

{
  "progress": 75
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
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
      "totalAffected": 2
    }
  }
}
```

**Error Responses**:

`400 Bad Request` - Invalid entity type, invalid ID format, or progress out of range (0-100)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid entity type. Must be one of: sessions, tasks, days, weeks, phases"
  }
}
```

`404 Not Found` - Entity not found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Session with ID clx1234567890abcdefgh not found"
  }
}
```

`500 Internal Server Error` - Database error during propagation

**cURL Example**:

```bash
# Update session progress (triggers task → day propagation)
curl -X PUT http://192.168.1.15:3000/api/sessions/clx1234567890abcdefgh/progress \
  -H "Content-Type: application/json" \
  -d "{\"progress\":75}"

# Update task progress directly
curl -X PUT http://192.168.1.15:3000/api/tasks/clx0987654321zyxwvuts/progress \
  -H "Content-Type: application/json" \
  -d "{\"progress\":50}"
```

**Implementation Details**:

- Uses generic route pattern for DRY principle (1 implementation for 5 entity types)
- Extends `updateProgressAndPropagate()` from `lib/db/progress.ts` with propagation tracking
- Returns propagation summary showing all affected parent entities
- Validates entity type via Zod enum, maps plural routes to singular utility types
- Non-breaking extension to existing Day 3 progress algorithm

**Source**: [apps/web/app/api/[entity]/[id]/progress/route.ts](../../apps/web/app/api/[entity]/[id]/progress/route.ts)
**Validation Schema**: [apps/web/lib/validations/progress.ts](../../apps/web/lib/validations/progress.ts)
**Authentication**: None (to be added)

---

#### POST /api/tasks

**Description**: Create a new task under a day with parent validation and date range checks.

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

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

**Request Example**:

```http
POST /api/tasks HTTP/1.1
Host: 192.168.1.15:3000
Content-Type: application/json

{
  "dayId": "clx9999888877776666",
  "title": "Implement progress update API",
  "description": "Create generic PUT /api/:entity/:id/progress route",
  "startDate": "2025-11-09T09:00:00Z",
  "endDate": "2025-11-09T17:00:00Z",
  "status": "IN_PROGRESS",
  "progress": 0,
  "estimatedHours": 4
}
```

**Response**: `201 Created`

```json
{
  "success": true,
  "data": {
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
      "actualHours": null,
      "createdAt": "2025-11-09T08:30:00.000Z",
      "updatedAt": "2025-11-09T08:30:00.000Z"
    },
    "context": {
      "day": {
        "id": "clx9999888877776666",
        "title": "Day 10"
      },
      "week": {
        "id": "clx1111222233334444",
        "title": "Week 2"
      },
      "phase": {
        "id": "clx5555666677778888",
        "title": "Sprint 1"
      }
    }
  }
}
```

**Error Responses**:

`400 Bad Request` - Validation error (invalid CUID, missing required fields, date range outside parent day)

```json
{
  "success": false,
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

`404 Not Found` - Parent day not found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Day with ID clx9999888877776666 not found"
  }
}
```

`500 Internal Server Error` - Database error

**cURL Example**:

```bash
# Create task with full hierarchy context
curl -X POST http://192.168.1.15:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d "{\"dayId\":\"clx9999888877776666\",\"title\":\"Implement progress update API\",\"description\":\"Create generic PUT route\",\"startDate\":\"2025-11-09T09:00:00Z\",\"endDate\":\"2025-11-09T17:00:00Z\",\"status\":\"IN_PROGRESS\",\"progress\":0,\"estimatedHours\":4}"
```

**Implementation Details**:

- Validates parent day exists before creating task
- Enforces date range constraint (task dates must be within day's start/end range)
- Returns hierarchical context (day → week → phase) for navigation
- Uses Zod schema validation for type safety
- CUID format for all IDs (not UUID)

**Source**: [apps/web/app/api/tasks/route.ts](../../apps/web/app/api/tasks/route.ts)
**MCP Tool**: [apps/mcp-server/src/tools/sprintTaskCreate.ts](../../apps/mcp-server/src/tools/sprintTaskCreate.ts)
**Authentication**: None (to be added)

---

#### POST /api/sessions

**Description**: Create a new session under a task with parent validation and optional endDate support.

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

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

**Request Example**:

```http
POST /api/sessions HTTP/1.1
Host: 192.168.1.15:3000
Content-Type: application/json

{
  "taskId": "clxABCD1234567890XYZ",
  "title": "Morning implementation session",
  "description": "Implement progress route and MCP tool",
  "startDate": "2025-11-09T09:00:00Z",
  "endDate": "2025-11-09T12:00:00Z",
  "status": "COMPLETED",
  "progress": 100,
  "notes": "Successfully implemented generic route pattern",
  "tokenCount": 45000
}
```

**Response**: `201 Created`

```json
{
  "success": true,
  "data": {
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
      "tokenCount": 45000,
      "createdAt": "2025-11-09T12:05:00.000Z",
      "updatedAt": "2025-11-09T12:05:00.000Z"
    },
    "context": {
      "task": {
        "id": "clxABCD1234567890XYZ",
        "title": "Implement progress update API"
      },
      "day": {
        "id": "clx9999888877776666",
        "title": "Day 10"
      },
      "week": {
        "id": "clx1111222233334444",
        "title": "Week 2"
      },
      "phase": {
        "id": "clx5555666677778888",
        "title": "Sprint 1"
      }
    }
  }
}
```

**Error Responses**:

`400 Bad Request` - Validation error (invalid CUID, missing required fields, endDate outside task range)

```json
{
  "success": false,
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

`404 Not Found` - Parent task not found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Task with ID clxABCD1234567890XYZ not found"
  }
}
```

`500 Internal Server Error` - Database error

**cURL Example**:

```bash
# Create completed session with full context
curl -X POST http://192.168.1.15:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d "{\"taskId\":\"clxABCD1234567890XYZ\",\"title\":\"Morning implementation session\",\"description\":\"Implement progress route and MCP tool\",\"startDate\":\"2025-11-09T09:00:00Z\",\"endDate\":\"2025-11-09T12:00:00Z\",\"status\":\"COMPLETED\",\"progress\":100,\"notes\":\"Successfully implemented generic route pattern\",\"tokenCount\":45000}"

# Create in-progress session (no endDate)
curl -X POST http://192.168.1.15:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d "{\"taskId\":\"clxABCD1234567890XYZ\",\"title\":\"Afternoon debugging session\",\"startDate\":\"2025-11-09T14:00:00Z\",\"status\":\"IN_PROGRESS\",\"progress\":50}"
```

**Implementation Details**:

- Validates parent task exists before creating session
- Supports optional `endDate` for in-progress sessions
- Enforces date range constraint when `endDate` is provided (session dates within task's range)
- Returns full hierarchical context (task → day → week → phase)
- Tracks AI token usage via optional `tokenCount` field
- Uses Zod schema validation for type safety

**Source**: [apps/web/app/api/sessions/route.ts](../../apps/web/app/api/sessions/route.ts)
**MCP Tool**: [apps/mcp-server/src/tools/sprintSessionCreate.ts](../../apps/mcp-server/src/tools/sprintSessionCreate.ts)
**Authentication**: None (to be added)

---

#### POST /api/checkpoints

**Description**: Create a checkpoint to save agent progress for context recovery (every 15K tokens)

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

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

**Request Example**:

```http
POST /api/checkpoints HTTP/1.1
Host: 192.168.1.15:3000
Content-Type: application/json

{
  "sessionId": "clxEFGH9876543210ABC",
  "notes": "Completed API implementation, starting tests. Files modified: route.ts, checkpoint.ts",
  "tokenUsage": 45000,
  "sessionContext": {
    "taskId": "clxABCD1234567890XYZ",
    "taskTitle": "Implement checkpoint API",
    "completionPercentage": 60,
    "filesModified": ["app/api/checkpoints/route.ts", "lib/validation/checkpoint.ts"],
    "uncommittedChanges": true,
    "currentBranch": "feature/sprint-1-foundation",
    "tokenBudgetRemaining": 155000
  }
}
```

**Response**: `201 Created`

```json
{
  "data": {
    "id": "clxCHK1234567890DEF",
    "sessionId": "clxEFGH9876543210ABC",
    "notes": "Completed API implementation, starting tests. Files modified: route.ts, checkpoint.ts",
    "tokenUsage": 45000,
    "sessionContext": {
      "taskId": "clxABCD1234567890XYZ",
      "taskTitle": "Implement checkpoint API",
      "completionPercentage": 60,
      "filesModified": ["app/api/checkpoints/route.ts", "lib/validation/checkpoint.ts"],
      "uncommittedChanges": true,
      "currentBranch": "feature/sprint-1-foundation",
      "tokenBudgetRemaining": 155000
    },
    "checkpointNumber": 3,
    "createdAt": "2025-11-09T14:30:00.000Z"
  },
  "error": null
}
```

**Error Responses**:

`400 Bad Request` - Validation error (invalid CUID, notes too long, tokenUsage out of range)

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid checkpoint data",
    "details": [
      {
        "code": "too_big",
        "maximum": 200000,
        "type": "number",
        "inclusive": true,
        "exact": false,
        "message": "Token usage exceeds maximum (200K)",
        "path": ["tokenUsage"]
      }
    ]
  }
}
```

`404 Not Found` - Parent session not found

```json
{
  "data": null,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session with ID clxEFGH9876543210ABC not found"
  }
}
```

`500 Internal Server Error` - Database error

**cURL Example**:

```bash
# Create checkpoint with full context
curl -X POST http://192.168.1.15:3000/api/checkpoints \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"clxEFGH9876543210ABC","notes":"Completed API implementation, starting tests","tokenUsage":45000,"sessionContext":{"taskId":"clxABCD1234567890XYZ","taskTitle":"Implement checkpoint API","completionPercentage":60,"filesModified":["app/api/checkpoints/route.ts"],"uncommittedChanges":true,"currentBranch":"feature/sprint-1-foundation","tokenBudgetRemaining":155000}}'

# Create minimal checkpoint (no context)
curl -X POST http://192.168.1.15:3000/api/checkpoints \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"clxEFGH9876543210ABC","notes":"Quick checkpoint at 30K tokens","tokenUsage":30000}'
```

**Implementation Details**:

- Validates parent session exists before creating checkpoint
- Sequential checkpoint numbering per session (auto-increments)
- JSONB sessionContext field for flexible context storage
- Optimized indexes for <50ms latest checkpoint queries
- Strict Zod validation rejects unknown sessionContext properties
- Uses Zod schema validation for type safety

**Performance**:
- Checkpoint creation: <100ms
- Latest checkpoint query: <50ms (composite index on sessionId + createdAt DESC)

**Source**: [apps/web/app/api/checkpoints/route.ts](../../apps/web/app/api/checkpoints/route.ts)
**Validation**: [apps/web/lib/validation/checkpoint.ts](../../apps/web/lib/validation/checkpoint.ts)

---

#### GET /api/hierarchy/query

**Description**: Query hierarchy entities with filters (status, progress). Supports all 5 levels with parent context.

**Query Parameters**:

```typescript
{
  level: "phase" | "week" | "day" | "task" | "session",  // Required
  status?: string[],        // Filter by status (OR logic, can pass multiple)
  progressMin?: number,     // Minimum progress (0-100)
  progressMax?: number,     // Maximum progress (0-100)
  page?: number,            // Page number (default 1)
  limit?: number            // Results per page (default 20, max 100)
}
```

**Request Examples**:

```http
# Find all blocked tasks
GET /api/hierarchy/query?level=task&status=BLOCKED HTTP/1.1
Host: 192.168.1.15:3000

# Find low-progress tasks (stuck work)
GET /api/hierarchy/query?level=task&status=IN_PROGRESS&progressMax=30 HTTP/1.1
Host: 192.168.1.15:3000

# Find nearly complete sessions
GET /api/hierarchy/query?level=session&progressMin=75&progressMax=99 HTTP/1.1
Host: 192.168.1.15:3000

# Find completed OR blocked tasks (OR logic)
GET /api/hierarchy/query?level=task&status=COMPLETED&status=BLOCKED HTTP/1.1
Host: 192.168.1.15:3000

# Pagination example (page 2, 50 results per page)
GET /api/hierarchy/query?level=week&status=IN_PROGRESS&page=2&limit=50 HTTP/1.1
Host: 192.168.1.15:3000
```

**Response**: `200 OK`

```json
{
  "data": {
    "entities": [
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
      "totalPages": 1
    }
  },
  "error": null
}
```

**Error Responses**:

`400 Bad Request` - Invalid query parameters

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": [
      {
        "code": "invalid_enum_value",
        "options": ["phase", "week", "day", "task", "session"],
        "path": ["level"],
        "message": "Invalid enum value. Expected 'phase' | 'week' | 'day' | 'task' | 'session', received 'invalid'"
      }
    ]
  }
}
```

`500 Internal Server Error` - Database error

**cURL Examples**:

```bash
# Find blocked tasks
curl "http://192.168.1.15:3000/api/hierarchy/query?level=task&status=BLOCKED"

# Find stuck work (low progress, in progress)
curl "http://192.168.1.15:3000/api/hierarchy/query?level=task&status=IN_PROGRESS&progressMax=30"

# Find nearly complete work
curl "http://192.168.1.15:3000/api/hierarchy/query?level=session&progressMin=75&progressMax=99"

# Multiple status filters (OR logic)
curl "http://192.168.1.15:3000/api/hierarchy/query?level=task&status=COMPLETED&status=BLOCKED"

# Pagination
curl "http://192.168.1.15:3000/api/hierarchy/query?level=week&status=IN_PROGRESS&page=2&limit=50"
```

**Implementation Details**:

- Single endpoint pattern (DRY - reduces code duplication by 80%)
- Parent context always included via Prisma `select` (52% smaller payload vs `include`)
- Status filter uses OR logic (matches ANY of the provided statuses)
- Progress range validation (progressMin <= progressMax)
- Parallel queries for efficiency (`Promise.all([findMany, count])`)
- Results ordered by startDate DESC (most recent first)
- All filters leverage existing database indexes for performance

**Performance**:
- Simple query (single filter): <50ms
- Complex query (multiple filters): <200ms
- Large result set (100 items): <500ms

**Scope**:
- ✅ Status filtering (OR logic)
- ✅ Progress range filtering (min/max)
- ✅ Pagination (default 20, max 100)
- ⏭️ Date range filtering (deferred to Sprint 2 for full US-007 completion)

**Source**: [apps/web/app/api/hierarchy/query/route.ts](../../apps/web/app/api/hierarchy/query/route.ts)
**Validation**: [apps/web/lib/validation/hierarchy-query.ts](../../apps/web/lib/validation/hierarchy-query.ts)
**MCP Tool**: [apps/mcp-server/src/tools/sprintQueryHierarchy.ts](../../apps/mcp-server/src/tools/sprintQueryHierarchy.ts)

---

### Workflow Orchestration

#### GET /api/workflows

**Description**: List workflow templates with optional filtering by category and active status

**Query Parameters**:

- `category` (optional): Filter by category - `development`, `project-management`, or `knowledge`
- `isActive` (optional): Filter by active status - `true` (default) or `false`

**Headers**:

```http
Content-Type: application/json
```

**Request Examples**:

```http
GET /api/workflows HTTP/1.1
Host: 192.168.1.15:3000

# Filter by category
GET /api/workflows?category=development HTTP/1.1
Host: 192.168.1.15:3000

# Include inactive templates
GET /api/workflows?isActive=false HTTP/1.1
Host: 192.168.1.15:3000
```

**Response**: `200 OK`

```json
{
  "data": {
    "templates": [
      {
        "id": 1,
        "name": "Feature Implementation",
        "description": "Complete workflow for implementing a new feature from planning to deployment",
        "category": "development",
        "steps": [
          { "stepNumber": 1, "name": "Create Feature Branch", "description": "Create new git branch for feature" },
          { "stepNumber": 2, "name": "Run Onboarding Session", "description": "Gather feature context via onboarding" }
          // ... (10 steps total)
        ],
        "stepCount": 10,
        "isActive": true,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
      }
    ]
  },
  "error": null
}
```

**Error Responses**:

`500 Internal Server Error` - Database error

```json
{
  "data": null,
  "error": "Failed to fetch workflow templates"
}
```

**Implementation Details**:

- Returns templates ordered by category (asc) then name (asc)
- Each template includes computed `stepCount` field
- Steps array contains full step definitions with `mcpTool`, `preconditions`, `postconditions`

**cURL Example**:

```bash
# List all active templates
curl http://192.168.1.15:3000/api/workflows

# Filter by development category
curl http://192.168.1.15:3000/api/workflows?category=development
```

**Source**: [apps/web/app/api/workflows/route.ts](../../apps/web/app/api/workflows/route.ts)
**MCP Tools**: `workflow.list`
**Authentication**: None (to be added)

---

#### POST /api/workflows/run

**Description**: Start a new workflow run from a template

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

```typescript
{
  templateId: number,               // Required, must be positive integer
  projectId?: number,               // Optional, link workflow to project
  initialContext?: Record<string, any>  // Optional, initial execution context
}
```

**Request Example**:

```http
POST /api/workflows/run HTTP/1.1
Host: 192.168.1.15:3000
Content-Type: application/json

{
  "templateId": 1,
  "projectId": 42,
  "initialContext": {
    "featureName": "User Authentication",
    "targetBranch": "feature/auth"
  }
}
```

**Response**: `201 Created`

```json
{
  "data": {
    "runId": 123,
    "status": "pending",
    "currentStep": 1,
    "nextStepName": "Create Feature Branch"
  },
  "error": null
}
```

**Validation**:

- `templateId`: Required, positive integer
- `projectId`: Optional, positive integer (must exist in database)
- `initialContext`: Optional, any JSON object

**Error Responses**:

`400 Bad Request` - Validation error or inactive template

```json
{
  "data": null,
  "error": "Invalid request: Expected number, received string"
}
```

`404 Not Found` - Template or project not found

```json
{
  "data": null,
  "error": "Workflow template with ID 999 not found"
}
```

`500 Internal Server Error` - Database error

**Implementation Details**:

- Creates `WorkflowRun` record with status `pending`
- Creates `WorkflowStep` records for all template steps
- Returns first step name for execution
- Validates template is active before creating run
- Atomically creates run + steps in single transaction

**cURL Example**:

```bash
# Start Feature Implementation workflow
curl -X POST http://192.168.1.15:3000/api/workflows/run \
  -H "Content-Type: application/json" \
  -d '{"templateId":1,"initialContext":{"featureName":"User Authentication"}}'
```

**Source**: [apps/web/app/api/workflows/run/route.ts](../../apps/web/app/api/workflows/run/route.ts)
**MCP Tools**: `workflow.start`
**Authentication**: None (to be added)

---

#### GET /api/workflows/run/:id

**Description**: Get workflow run status and details including all steps

**Path Parameters**:

- `id` (string) - Workflow run ID (integer)

**Headers**:

```http
Content-Type: application/json
```

**Request Example**:

```http
GET /api/workflows/run/123 HTTP/1.1
Host: 192.168.1.15:3000
```

**Response**: `200 OK`

```json
{
  "data": {
    "run": {
      "id": 123,
      "templateName": "Feature Implementation",
      "status": "running",
      "currentStep": 3,
      "totalSteps": 10,
      "completedSteps": 2,
      "context": {
        "featureName": "User Authentication",
        "branchName": "feature/auth"
      },
      "startedAt": "2025-11-12T08:00:00.000Z",
      "completedAt": null,
      "pausedAt": null,
      "steps": [
        {
          "stepNumber": 1,
          "name": "Create Feature Branch",
          "status": "completed",
          "startedAt": "2025-11-12T08:00:00.000Z",
          "completedAt": "2025-11-12T08:05:00.000Z",
          "error": null
        },
        {
          "stepNumber": 2,
          "name": "Run Onboarding Session",
          "status": "completed",
          "startedAt": "2025-11-12T08:05:00.000Z",
          "completedAt": "2025-11-12T08:15:00.000Z",
          "error": null
        },
        {
          "stepNumber": 3,
          "name": "Create Wiki Page",
          "status": "pending",
          "startedAt": null,
          "completedAt": null,
          "error": null
        }
        // ... (remaining steps)
      ]
    }
  },
  "error": null
}
```

**Error Responses**:

`400 Bad Request` - Invalid run ID format

```json
{
  "data": null,
  "error": "Invalid workflow run ID"
}
```

`404 Not Found` - Workflow run not found

```json
{
  "data": null,
  "error": "Workflow run with ID 999 not found"
}
```

`500 Internal Server Error` - Database error

**Implementation Details**:

- Returns full run details with template name
- Includes all steps with current status
- Calculates `totalSteps` and `completedSteps` counts
- Context contains accumulated execution data

**cURL Example**:

```bash
# Get workflow run status
curl http://192.168.1.15:3000/api/workflows/run/123
```

**Source**: [apps/web/app/api/workflows/run/[id]/route.ts](../../apps/web/app/api/workflows/run/[id]/route.ts)
**MCP Tools**: `workflow.getStatus`
**Authentication**: None (to be added)

---

#### POST /api/workflows/run/:id/step

**Description**: Execute the current step in a workflow run and advance to next step

**Path Parameters**:

- `id` (string) - Workflow run ID (integer)

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

```typescript
{
  stepResult?: Record<string, any>  // Optional, result data from completed step
}
```

**Request Example**:

```http
POST /api/workflows/run/123/step HTTP/1.1
Host: 192.168.1.15:3000
Content-Type: application/json

{
  "stepResult": {
    "success": true,
    "branchName": "feature/auth",
    "filesCreated": ["auth.ts", "login.tsx"]
  }
}
```

**Response (Step Complete, More Steps Remaining)**: `200 OK`

```json
{
  "data": {
    "stepNumber": 3,
    "stepName": "Create Wiki Page",
    "status": "completed",
    "nextStep": {
      "stepNumber": 4,
      "name": "Create Sprint Task",
      "description": "Track feature in sprint system"
    },
    "workflowStatus": "running"
  },
  "error": null
}
```

**Response (Workflow Complete)**: `200 OK`

```json
{
  "data": {
    "stepNumber": 10,
    "stepName": "Complete Task",
    "status": "completed",
    "nextStep": null,
    "workflowStatus": "completed"
  },
  "error": null
}
```

**Validation**:

- `stepResult`: Optional, any JSON object

**Error Responses**:

`400 Bad Request` - Invalid run ID, workflow completed/failed/paused

```json
{
  "data": null,
  "error": "Workflow run is already completed"
}
```

`400 Bad Request` - Workflow is paused

```json
{
  "data": null,
  "error": "Workflow run is paused. Use workflow.resume to continue"
}
```

`404 Not Found` - Workflow run not found

`500 Internal Server Error` - Database error

**Implementation Details**:

- Marks current step as `completed` with timestamp
- Stores `stepResult` in step record
- Advances `currentStep` counter
- Marks next step as `running`
- Updates workflow status to `completed` when all steps done
- Enforces state machine: can't execute if status is `completed`, `failed`, or `paused`

**State Machine**:

- `pending` → `running` (on first step execution)
- `running` → `running` (between steps)
- `running` → `completed` (after last step)
- `paused` → blocked (must use `workflow.resume`)

**cURL Example**:

```bash
# Execute current step
curl -X POST http://192.168.1.15:3000/api/workflows/run/123/step \
  -H "Content-Type: application/json" \
  -d '{"stepResult":{"success":true,"branchName":"feature/auth"}}'
```

**Source**: [apps/web/app/api/workflows/run/[id]/step/route.ts](../../apps/web/app/api/workflows/run/[id]/step/route.ts)
**MCP Tools**: `workflow.executeStep`, `workflow.pause`, `workflow.resume`, `workflow.complete`
**Authentication**: None (to be added)

---

### Theme Management

#### GET /api/preferences/:userId

**Description**: Retrieve user's theme and UI preferences

**Path Parameters**:

- `userId` (number) - User ID

**Query Parameters**: None

**Headers**:

```http
Content-Type: application/json
```

**Request Example**:

```http
GET /api/preferences/1 HTTP/1.1
Host: localhost:3000
```

**Response**: `200 OK`

```json
{
  "id": 1,
  "userId": 1,
  "theme": "desert",
  "sidebarCollapsed": false,
  "compactMode": false,
  "createdAt": "2025-10-26T10:00:00Z",
  "updatedAt": "2025-10-26T10:00:00Z"
}
```

**Error Responses**:

`404 Not Found` - User preferences not found

```json
{
  "error": "Preferences not found for user"
}
```

`500 Internal Server Error` - Database error

```json
{
  "error": "Failed to fetch preferences"
}
```

**Source**: (To be implemented)
**Authentication**: None (to be added with auth system)

---

#### PUT /api/preferences/:userId

**Description**: Update user's theme and UI preferences

**Path Parameters**:

- `userId` (number) - User ID

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

```typescript
{
  theme?: "desert" | "neon" | "earthy" | "coral",
  sidebarCollapsed?: boolean,
  compactMode?: boolean
}
```

**Request Example**:

```http
PUT /api/preferences/1 HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "theme": "neon",
  "sidebarCollapsed": true
}
```

**Response**: `200 OK`

```json
{
  "id": 1,
  "userId": 1,
  "theme": "neon",
  "sidebarCollapsed": true,
  "compactMode": false,
  "createdAt": "2025-10-26T10:00:00Z",
  "updatedAt": "2025-10-26T12:30:00Z"
}
```

**Validation**:

- `theme` must be one of: "desert", "neon", "earthy", "coral"
- `sidebarCollapsed` must be boolean
- `compactMode` must be boolean

**Error Responses**:

`400 Bad Request` - Invalid input

```json
{
  "error": "Invalid theme value",
  "details": ["Theme must be one of: desert, neon, earthy, coral"]
}
```

`404 Not Found` - User not found

```json
{
  "error": "User not found"
}
```

`500 Internal Server Error` - Database error

```json
{
  "error": "Failed to update preferences"
}
```

**Source**: (To be implemented)
**Authentication**: None (to be added with auth system)

---

### Issue Management

#### POST /api/issues

**Description**: Create a single issue with automatic tagging based on file paths

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

```typescript
{
  projectId: number (required),
  title: string (1-200 chars, required),
  description?: string (max 50,000 chars),
  status?: string (max 32 chars),
  priority?: string (max 32 chars),
  module?: string (max 80 chars),
  assignee?: string (max 120 chars),
  labelIds?: number[] (max 25 labels),
  customFields?: Record<string, unknown>,
  context?: {
    files?: Array<{
      filePath: string (required, max 2048 chars),
      lineNumber?: number (positive, max 1,000,000),
      snippet?: string (max 5000 chars)
    }> (max 25 files),
    metadata?: Record<string, unknown>
  }
}
```

**Response**: `201 Created`

```typescript
{
  data: {
    id: number,
    projectId: number,
    title: string,
    description: string | null,
    status: string,
    priority: string,
    module: string | null,
    assignee: string | null,
    customFields: JsonValue | null,
    createdAt: string,
    updatedAt: string,
    closedAt: string | null,
    labels: Array<{ id: number, name: string, color: string }>,
    linkedFiles: Array<{ id: number, filePath: string, lineNumber: number | null }>,
    _count: { comments: number, attachments: number }
  },
  error: null
}
```

**Features**:
- Auto-tagging: Module and labels derived from file paths
- Context injection: File references with line numbers and code snippets
- Auto-priority: Derived from file path patterns
- Label creation: Missing labels are created automatically

---

#### GET /api/issues

**Description**: List issues with filtering, sorting, and pagination

**Query Parameters**:

```typescript
{
  projectId?: number,
  status?: string | string[],
  priority?: string | string[],
  module?: string | string[],
  assignee?: string,
  labelIds?: number | number[],
  search?: string (searches title + description),
  orderBy?: "createdAt" | "updatedAt" | "priority" | "status",
  orderDir?: "asc" | "desc",
  page?: number (default: 1),
  pageSize?: number (default: 25, max: 100)
}
```

**Response**: `200 OK`

```typescript
{
  data: {
    issues: Array<{
      id: number,
      title: string,
      status: string,
      priority: string,
      module: string | null,
      assignee: string | null,
      createdAt: string,
      closedAt: string | null,
      labels: Array<{ id: number, name: string, color: string }>,
      _count: { comments: number }
    }>,
    pagination: {
      page: number,
      pageSize: number,
      total: number,
      totalPages: number
    }
  },
  error: null
}
```

---

#### GET /api/issues/[id]

**Description**: Get detailed information for a single issue

**Path Parameters**:
- `id` (number) - Issue ID

**Response**: `200 OK`

```typescript
{
  data: {
    id: number,
    projectId: number,
    title: string,
    description: string | null,
    status: string,
    priority: string,
    module: string | null,
    assignee: string | null,
    customFields: JsonValue | null,
    createdAt: string,
    updatedAt: string,
    closedAt: string | null,
    labels: Array<{ id: number, name: string, color: string }>,
    linkedFiles: Array<{ id: number, filePath: string, lineNumber: number | null }>,
    comments: Array<{
      id: number,
      content: string,
      author: string,
      createdAt: string
    }>,
    attachments: Array<{ id: number, fileName: string, fileSize: number }>
  },
  error: null
}
```

---

#### PATCH /api/issues/[id]

**Description**: Update an issue (partial update)

**Path Parameters**:
- `id` (number) - Issue ID

**Request Body**: (all fields optional)

```typescript
{
  title?: string,
  description?: string,
  status?: string,
  priority?: string,
  module?: string,
  assignee?: string,
  labelIds?: number[],
  customFields?: Record<string, unknown>
}
```

**Response**: `200 OK` (same structure as GET /api/issues/[id])

---

#### DELETE /api/issues/[id]

**Description**: Permanently delete an issue

**Path Parameters**:
- `id` (number) - Issue ID

**Response**: `204 No Content`

---

#### POST /api/issues/bulk

**Description**: Create multiple issues in a single transaction (up to 50 issues)

**Performance**: Optimized for bulk operations (<2s for 15 issues)

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

```typescript
{
  projectId: number (required),
  issues: Array<{
    title: string (required),
    description?: string,
    status?: string,
    priority?: string,
    module?: string,
    assignee?: string,
    labelIds?: number[],
    customFields?: Record<string, unknown>,
    context?: {
      files?: Array<{
        filePath: string,
        lineNumber?: number,
        snippet?: string
      }>,
      metadata?: Record<string, unknown>
    },
    reference?: string (max 64 chars, optional identifier)
  }> (min: 1, max: 50)
}
```

**Response**: `201 Created`

```typescript
{
  data: {
    created: number,
    failed: number,
    issues: Array<IssueDetail>,
    durationMs: number
  },
  error: null
}
```

**Features**:
- Transactional: All issues created or none
- Auto-tagging: Applied to each issue based on context files
- Performance: Optimized with `createMany` and batch operations
- Label management: Auto-creates missing labels per issue

---

#### POST /api/issues/[id]/comments

**Description**: Create a new comment on an issue

**Path Parameters**:

- `id` (string) - Issue ID

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

```json
{
  "content": "string (1-10000 chars)",
  "author": "string (optional)"
}
```

**Request Example**:

```http
POST /api/issues/42/comments HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "content": "This is a comment with `inline code` formatting",
  "author": "Moksha Dev"
}
```

**Response**: `201 Created`

```json
{
  "data": {
    "id": 123,
    "content": "This is a comment with `inline code` formatting",
    "author": "Moksha Dev",
    "issueId": 42,
    "createdAt": "2025-10-28T12:00:00Z",
    "updatedAt": "2025-10-28T12:00:00Z"
  },
  "error": null
}
```

**Validation**:

- `content`: Required, 1-10,000 characters
- `author`: Optional (defaults to "Anonymous" if omitted)
- Content is trimmed before storage

**Error Responses**:

`400 Bad Request` - Invalid issue ID or validation error

```json
{
  "data": null,
  "error": "Invalid comment data",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "path": ["content"],
      "message": "Comment cannot be empty"
    }
  ]
}
```

`404 Not Found` - Issue not found

```json
{
  "data": null,
  "error": "Issue not found"
}
```

`500 Internal Server Error` - Database error

```json
{
  "data": null,
  "error": "Failed to create comment"
}
```

**Side Effects**:

- Revalidates `/issues/:id` page cache (Next.js ISR)

**Source**: `apps/web/app/api/issues/[id]/comments/route.ts`
**Validation**: `apps/web/lib/validations/issue.ts` (CommentSchema)
**Authentication**: None (to be added)

---

#### PATCH /api/issues/[id]/status

**Description**: Update the status of an issue

**Path Parameters**:

- `id` (string) - Issue ID

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

```json
{
  "status": "open" | "in_progress" | "closed"
}
```

**Request Example**:

```http
PATCH /api/issues/42/status HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "status": "closed"
}
```

**Response**: `200 OK`

```json
{
  "data": {
    "id": 42,
    "title": "Animation sync issues in combat",
    "status": "closed",
    "priority": "high",
    "module": "Combat",
    "assignee": "Moksha Dev",
    "createdAt": "2025-10-26T10:00:00Z",
    "updatedAt": "2025-10-28T12:00:00Z",
    "closedAt": "2025-10-28T12:00:00Z",
    "_count": {
      "comments": 5,
      "attachments": 2
    }
  },
  "error": null
}
```

**Validation**:

- `status`: Required, must be one of: "open", "in_progress", "closed"

**Error Responses**:

`400 Bad Request` - Invalid issue ID or status value

```json
{
  "data": null,
  "error": "Invalid status value",
  "details": [
    {
      "code": "invalid_enum_value",
      "options": ["open", "in_progress", "closed"],
      "path": ["status"],
      "message": "Status must be one of: open, in_progress, closed"
    }
  ]
}
```

`404 Not Found` - Issue not found

```json
{
  "data": null,
  "error": "Issue not found"
}
```

`500 Internal Server Error` - Database error

```json
{
  "data": null,
  "error": "Failed to update issue status"
}
```

**Side Effects**:

- Sets `closedAt` timestamp when status changes to "closed"
- Clears `closedAt` timestamp when status changes from "closed" to another status
- Revalidates `/issues` page cache
- Revalidates `/issues/:id` page cache

**Source**: `apps/web/app/api/issues/[id]/status/route.ts`
**Validation**: `apps/web/lib/validations/issue.ts` (StatusUpdateSchema)
**Authentication**: None (to be added)

---

### Knowledge Base

#### GET /api/knowledge

**Description**: Fetch knowledge base articles with optional filtering and pagination

**Query Parameters**:

- `search` (optional): Search in title and content (case-insensitive)
- `tag` (optional): Filter by tag
- `sort` (optional): Sort order - `newest` (default) or `updated`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 50)

**Headers**:

```http
Content-Type: application/json
```

**Request Example**:

```http
GET /api/knowledge?search=FSM&tag=architecture&sort=newest&page=1&limit=20 HTTP/1.1
Host: localhost:3000
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": 1,
        "title": "Finite State Machine Patterns in React",
        "content": "Full article content...",
        "excerpt": "Finite State Machine (FSM) patterns provide a robust way to manage complex component state...",
        "tags": ["architecture", "react", "patterns"],
        "createdAt": "2025-10-26T10:00:00Z",
        "updatedAt": "2025-10-28T14:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "totalPages": 3,
      "hasMore": true
    }
  }
}
```

**Search Behavior**:

- Case-insensitive search in `title` and `content` fields
- Multiple tags can be filtered with multiple `tag` parameters
- Excerpt is auto-generated (first 150 characters)

**Error Responses**:

`500 Internal Server Error` - Database error

```json
{
  "success": false,
  "error": "Failed to fetch knowledge articles"
}
```

**Source**: `apps/web/app/api/knowledge/route.ts`
**Authentication**: None (to be added)

---

#### GET /api/knowledge/metrics

**Description**: Get query metrics and performance data for knowledge base usage patterns

**Query Parameters**:

- `startDate` (optional): Filter metrics from date (ISO 8601)
- `endDate` (optional): Filter metrics to date (ISO 8601)
- `limit` (optional): Number of results (default: 100, max: 1000)

**Headers**:

```http
Content-Type: application/json
```

**Request Example**:

```http
GET /api/knowledge/metrics?startDate=2025-11-01T00:00:00Z&endDate=2025-11-13T23:59:59Z&limit=100 HTTP/1.1
Host: localhost:3000
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "id": 1,
        "queryText": "authentication patterns",
        "resultCount": 5,
        "cacheHit": true,
        "executionTimeMs": 25,
        "timestamp": "2025-11-13T10:30:00Z"
      }
    ],
    "summary": {
      "totalQueries": 150,
      "cacheHitRate": 0.92,
      "averageExecutionTime": 32.5,
      "popularQueries": ["authentication", "testing", "deployment"]
    }
  }
}
```

**Source**: `apps/web/app/api/knowledge/metrics/route.ts`
**Authentication**: None (to be added)

---

#### POST /api/knowledge/export

**Description**: Export knowledge base articles to JSON or CSV format

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

```typescript
{
  format: "json" | "csv",         // Export format (required)
  filters?: {
    tags?: string[],              // Filter by tags
    search?: string,              // Search term
    archived?: boolean            // Include archived items (default: false)
  }
}
```

**Request Example**:

```http
POST /api/knowledge/export HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "format": "json",
  "filters": {
    "tags": ["architecture", "patterns"],
    "archived": false
  }
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "format": "json",
    "itemCount": 42,
    "exportData": [...],
    "timestamp": "2025-11-13T10:30:00Z"
  }
}
```

**Source**: `apps/web/app/api/knowledge/export/route.ts`
**Authentication**: None (to be added)

---

#### POST /api/knowledge/import

**Description**: Import knowledge base articles from JSON format with validation

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

```typescript
{
  items: Array<{
    title: string,              // Required, 1-200 chars
    content: string,            // Required
    tags?: string[],            // Optional tags
    metadata?: object           // Optional metadata
  }>,
  options?: {
    skipDuplicates?: boolean,   // Skip duplicate titles (default: false)
    overwrite?: boolean         // Overwrite existing items (default: false)
  }
}
```

**Request Example**:

```http
POST /api/knowledge/import HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "items": [
    {
      "title": "API Design Patterns",
      "content": "Comprehensive guide to API design...",
      "tags": ["api", "patterns", "backend"]
    }
  ],
  "options": {
    "skipDuplicates": true
  }
}
```

**Response**: `201 Created`

```json
{
  "success": true,
  "data": {
    "imported": 1,
    "skipped": 0,
    "failed": 0,
    "items": [...]
  }
}
```

**Source**: `apps/web/app/api/knowledge/import/route.ts`
**Authentication**: None (to be added)

---

#### PATCH /api/knowledge/:id/archive

**Description**: Archive a knowledge item (soft delete with restore capability)

**Path Parameters**:

- `id` (number) - Knowledge item ID

**Headers**:

```http
Content-Type: application/json
```

**Request Example**:

```http
PATCH /api/knowledge/42/archive HTTP/1.1
Host: localhost:3000
Content-Type: application/json
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 42,
    "title": "Obsolete Pattern",
    "archived": true,
    "archivedAt": "2025-11-13T10:30:00Z"
  }
}
```

**Error Responses**:

`404 Not Found` - Knowledge item not found

**Source**: `apps/web/app/api/knowledge/[id]/archive/route.ts`
**Authentication**: None (to be added)

---

#### PATCH /api/knowledge/:id/unarchive

**Description**: Restore an archived knowledge item

**Path Parameters**:

- `id` (number) - Knowledge item ID

**Headers**:

```http
Content-Type: application/json
```

**Request Example**:

```http
PATCH /api/knowledge/42/unarchive HTTP/1.1
Host: localhost:3000
Content-Type: application/json
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 42,
    "title": "Restored Pattern",
    "archived": false,
    "archivedAt": null
  }
}
```

**Error Responses**:

`404 Not Found` - Knowledge item not found

**Source**: `apps/web/app/api/knowledge/[id]/unarchive/route.ts`
**Authentication**: None (to be added)

---

### Skills Management

#### GET /api/skills

**Description**: List skills with frontmatter only (token-efficient, lazy-loading)

**Query Parameters**:

- `category` (optional): Filter by category (framework, testing, workflow, troubleshooting)
- `search` (optional): Search in title and description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Headers**:

```http
Content-Type: application/json
```

**Request Example**:

```http
GET /api/skills?category=testing&page=1&limit=20 HTTP/1.1
Host: localhost:3000
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "skills": [
      {
        "id": 1,
        "title": "Jest Testing Patterns",
        "description": "Comprehensive testing strategies with Jest",
        "category": "testing",
        "tags": ["jest", "unit-testing", "tdd"],
        "metadata": {
          "difficulty": "intermediate",
          "prerequisites": ["javascript-basics"]
        },
        "createdAt": "2025-11-10T00:00:00Z",
        "updatedAt": "2025-11-13T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1,
      "hasMore": false
    }
  }
}
```

**Token Efficiency**: ~70 tokens per skill (97.2% reduction vs 2,500 token baseline)

**Source**: `apps/web/app/api/skills/route.ts`
**Authentication**: None (to be added)

---

#### GET /api/skills/:id

**Description**: Get full skill content including markdown body (on-demand loading)

**Path Parameters**:

- `id` (number) - Skill ID

**Headers**:

```http
Content-Type: application/json
```

**Request Example**:

```http
GET /api/skills/1 HTTP/1.1
Host: localhost:3000
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Jest Testing Patterns",
    "description": "Comprehensive testing strategies with Jest",
    "category": "testing",
    "tags": ["jest", "unit-testing", "tdd"],
    "content": "# Jest Testing Patterns\n\n## Overview\n...",
    "metadata": {
      "difficulty": "intermediate",
      "prerequisites": ["javascript-basics"]
    },
    "linkedKnowledge": [
      {
        "id": 5,
        "title": "Testing Best Practices"
      }
    ],
    "createdAt": "2025-11-10T00:00:00Z",
    "updatedAt": "2025-11-13T10:00:00Z"
  }
}
```

**Token Efficiency**: ~220 tokens per skill (91.2% reduction vs 2,500 token baseline)

**Source**: `apps/web/app/api/skills/[id]/route.ts`
**Authentication**: None (to be added)

---

#### GET /api/skills/search

**Description**: Search skills by keyword in title, description, and content

**Query Parameters**:

- `q` (required): Search query
- `category` (optional): Filter by category
- `limit` (optional): Results limit (default: 10, max: 50)

**Headers**:

```http
Content-Type: application/json
```

**Request Example**:

```http
GET /api/skills/search?q=testing&category=testing&limit=10 HTTP/1.1
Host: localhost:3000
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "results": [...],
    "total": 5,
    "query": "testing"
  }
}
```

**Source**: `apps/web/app/api/skills/search/route.ts`
**Authentication**: None (to be added)

---

#### POST /api/skills

**Description**: Create a new skill with frontmatter and markdown content

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

```typescript
{
  title: string,                 // Required, 1-200 chars
  description: string,           // Required, 1-500 chars
  content: string,               // Required, markdown content
  category: "framework" | "testing" | "workflow" | "troubleshooting",  // Required
  tags?: string[],               // Optional, max 10 tags
  metadata?: object              // Optional metadata
}
```

**Request Example**:

```http
POST /api/skills HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "title": "Playwright E2E Testing",
  "description": "End-to-end testing with Playwright",
  "content": "# Playwright E2E Testing\n\n## Setup\n...",
  "category": "testing",
  "tags": ["playwright", "e2e", "automation"]
}
```

**Response**: `201 Created`

```json
{
  "success": true,
  "data": {
    "id": 16,
    "title": "Playwright E2E Testing",
    ...
  }
}
```

**Source**: `apps/web/app/api/skills/route.ts`
**Authentication**: None (to be added)

---

#### PATCH /api/skills/:id

**Description**: Update an existing skill (partial update)

**Path Parameters**:

- `id` (number) - Skill ID

**Headers**:

```http
Content-Type: application/json
```

**Request Body**: (all fields optional)

```typescript
{
  title?: string,
  description?: string,
  content?: string,
  category?: string,
  tags?: string[],
  metadata?: object
}
```

**Request Example**:

```http
PATCH /api/skills/1 HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "description": "Updated description",
  "tags": ["jest", "unit-testing", "tdd", "mocking"]
}
```

**Response**: `200 OK`

**Source**: `apps/web/app/api/skills/[id]/route.ts`
**Authentication**: None (to be added)

---

#### DELETE /api/skills/:id

**Description**: Delete a skill permanently

**Path Parameters**:

- `id` (number) - Skill ID

**Headers**:

```http
Content-Type: application/json
```

**Request Example**:

```http
DELETE /api/skills/1 HTTP/1.1
Host: localhost:3000
```

**Response**: `204 No Content`

**Error Responses**:

`404 Not Found` - Skill not found

**Source**: `apps/web/app/api/skills/[id]/route.ts`
**Authentication**: None (to be added)

---

#### POST /api/skills/export

**Description**: Export skills to JSON format

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

```typescript
{
  filters?: {
    category?: string,
    tags?: string[],
    search?: string
  }
}
```

**Request Example**:

```http
POST /api/skills/export HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "filters": {
    "category": "testing"
  }
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "format": "json",
    "itemCount": 5,
    "exportData": [...],
    "timestamp": "2025-11-13T10:30:00Z"
  }
}
```

**Source**: `apps/web/app/api/skills/export/route.ts`
**Authentication**: None (to be added)

---

#### POST /api/skills/import

**Description**: Import skills from JSON format with validation

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

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
    skipDuplicates?: boolean,
    overwrite?: boolean
  }
}
```

**Request Example**:

```http
POST /api/skills/import HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "items": [...],
  "options": {
    "skipDuplicates": true
  }
}
```

**Response**: `201 Created`

```json
{
  "success": true,
  "data": {
    "imported": 5,
    "skipped": 0,
    "failed": 0
  }
}
```

**Source**: `apps/web/app/api/skills/import/route.ts`
**Authentication**: None (to be added)

---

#### POST /api/skills/:id/link-knowledge

**Description**: Create bidirectional link between skill and knowledge item

**Path Parameters**:

- `id` (number) - Skill ID

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

```typescript
{
  knowledgeId: number           // Required, knowledge item ID
}
```

**Request Example**:

```http
POST /api/skills/1/link-knowledge HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "knowledgeId": 5
}
```

**Response**: `201 Created`

```json
{
  "success": true,
  "data": {
    "linkId": 10,
    "skillId": 1,
    "knowledgeId": 5,
    "createdAt": "2025-11-13T10:30:00Z"
  }
}
```

**Source**: `apps/web/app/api/skills/[id]/link-knowledge/route.ts`
**Authentication**: None (to be added)

---

#### DELETE /api/skills/:id/unlink-knowledge/:knowledgeId

**Description**: Remove bidirectional link between skill and knowledge item

**Path Parameters**:

- `id` (number) - Skill ID
- `knowledgeId` (number) - Knowledge item ID

**Headers**:

```http
Content-Type: application/json
```

**Request Example**:

```http
DELETE /api/skills/1/unlink-knowledge/5 HTTP/1.1
Host: localhost:3000
```

**Response**: `204 No Content`

**Error Responses**:

`404 Not Found` - Link not found

**Source**: `apps/web/app/api/skills/[id]/unlink-knowledge/[knowledgeId]/route.ts`
**Authentication**: None (to be added)

---

### Wiki Pages

#### GET /api/wiki/:slug

**Description**: Fetch a wiki page by its path/slug, including related pages

**Path Parameters**:

- `slug` (string) - Wiki page slug (e.g., "getting-started")

**Headers**:

```http
Content-Type: application/json
```

**Request Example**:

```http
GET /api/wiki/getting-started HTTP/1.1
Host: localhost:3000
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "page": {
      "id": 1,
      "title": "Getting Started with ProjectPulse",
      "content": "# Welcome to ProjectPulse\n\nThis guide will help you...",
      "path": "/getting-started",
      "category": "Guides",
      "author": "Moksha Dev",
      "createdAt": "2025-10-26T10:00:00Z",
      "updatedAt": "2025-10-28T14:00:00Z"
    },
    "relatedPages": [
      {
        "id": 2,
        "title": "Installation Guide",
        "path": "/installation",
        "category": "Guides"
      },
      {
        "id": 3,
        "title": "Configuration",
        "path": "/configuration",
        "category": "Setup"
      }
    ]
  }
}
```

**Path Normalization**:

- Slugs are normalized to start with `/` (e.g., `getting-started` → `/getting-started`)
- Related pages use `PageLink` junction table

**Error Responses**:

`404 Not Found` - Wiki page not found

```json
{
  "success": false,
  "error": "Wiki page not found"
}
```

`500 Internal Server Error` - Database error

```json
{
  "success": false,
  "error": "Failed to fetch wiki page"
}
```

**Source**: `apps/web/app/api/wiki/[slug]/route.ts`
**Authentication**: None (to be added)

---

### Security Dashboard

#### GET /api/security/score

**Description**: Calculate security score based on open findings with weighted penalties

**Query Parameters**: None

**Headers**:

```http
Content-Type: application/json
```

**Request Example**:

```http
GET /api/security/score HTTP/1.1
Host: localhost:3000
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "score": 78,
    "breakdown": {
      "critical": 1,
      "medium": 3,
      "low": 5
    },
    "trend": 0,
    "lastUpdated": "2025-10-28T14:30:00Z"
  }
}
```

**Score Calculation**:

- Formula: `score = max(0, 100 - totalPenalty)`
- Penalties:
  - `ERROR` (Critical): -10 points
  - `WARNING` (Medium): -4 points
  - `INFO` (Low): -1 point
- Example: 1 ERROR + 3 WARNING + 5 INFO = 10 + 12 + 5 = 27 penalty → Score = 73

**Trend Field**:

- Positive = improving (fewer vulnerabilities)
- Negative = worsening (more vulnerabilities)
- Currently returns `0` (future feature)

**Error Responses**:

`500 Internal Server Error` - Database error

```json
{
  "success": false,
  "error": "Failed to calculate security score"
}
```

**Source**: `apps/web/app/api/security/score/route.ts`
**Authentication**: None (to be added)

---

#### GET /api/security/vulnerabilities

**Description**: Fetch security findings with filtering and pagination

**Query Parameters**:

- `severity` (optional): Filter by severity - `ERROR`, `WARNING`, or `INFO`
- `status` (optional): Filter by status - `open`, `fixed`, or `false_positive`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 50)

**Headers**:

```http
Content-Type: application/json
```

**Request Example**:

```http
GET /api/security/vulnerabilities?severity=ERROR&status=open&page=1&limit=20 HTTP/1.1
Host: localhost:3000
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "findings": [
      {
        "id": 1,
        "ruleId": "sql-injection",
        "severity": "ERROR",
        "message": "Potential SQL injection vulnerability detected",
        "filePath": "apps/web/lib/db.ts",
        "lineNumber": 45,
        "codeSnippet": "const query = `SELECT * FROM users WHERE id = ${userId}`",
        "status": "open",
        "scanDate": "2025-10-28T14:00:00Z",
        "issue": {
          "id": 42,
          "title": "Fix SQL injection in user lookup"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8,
      "totalPages": 1,
      "hasMore": false
    }
  }
}
```

**Sort Order**:

- Primary: `severity` (ERROR first, then WARNING, then INFO)
- Secondary: `scanDate` (most recent first within each severity)

**Linked Issues**:

- `issue` field is `null` if no linked issue exists
- Use to navigate to related issue for tracking remediation

**Error Responses**:

`500 Internal Server Error` - Database error

```json
{
  "success": false,
  "error": "Failed to fetch vulnerabilities"
}
```

**Source**: `apps/web/app/api/security/vulnerabilities/route.ts`
**Authentication**: None (to be added)

---

### Global Search

#### GET /api/search

**Description**: Unified search across all entities (Issues, Knowledge, Wiki, Agents) - powers Command Palette

**Query Parameters**:

- `q` (required): Search query string
- `type` (optional): Entity type filter - `all` (default), `issues`, `knowledge`, `wiki`, or `agents`
- `limit` (optional): Max results per entity type (default: 5, max: 10)

**Headers**:

```http
Content-Type: application/json
```

**Request Example**:

```http
GET /api/search?q=authentication&type=all&limit=5 HTTP/1.1
Host: localhost:3000
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": 42,
        "type": "issue",
        "title": "Fix authentication bug in login flow",
        "description": "Users can't log in after password reset...",
        "url": "/issues/42",
        "icon": "fa-bug",
        "metadata": "open • high Priority"
      },
      {
        "id": 5,
        "type": "knowledge",
        "title": "Authentication Best Practices",
        "description": "This article covers secure authentication patterns...",
        "url": "/knowledge",
        "icon": "fa-book",
        "metadata": "Security, Auth"
      },
      {
        "id": 12,
        "type": "wiki",
        "title": "Authentication Setup Guide",
        "description": "Learn how to configure authentication in ProjectPulse...",
        "url": "/wiki/auth-setup",
        "icon": "fa-file-alt",
        "metadata": "Documentation"
      },
      {
        "id": 3,
        "type": "agent",
        "title": "Security Expert",
        "description": "Specialized agent for authentication and security reviews",
        "url": "/agents",
        "icon": "fa-robot",
        "metadata": "Active"
      }
    ],
    "total": 4,
    "query": "authentication"
  }
}
```

**Search Behavior**:

- Case-insensitive search in `title` and `description`/`content` fields
- Returns max `limit` results per entity type (e.g., 5 issues + 5 articles + 5 wiki pages + 5 agents)
- Relevance sorting: Exact title matches first, then partial matches
- Empty query returns empty results (no error)

**Entity Icons**:

- `issue`: `fa-bug`
- `knowledge`: `fa-book`
- `wiki`: `fa-file-alt`
- `agent`: `fa-robot`

**Use Cases**:

- Command Palette (Cmd+K) search
- Global header search
- Related content suggestions

**Error Responses**:

`500 Internal Server Error` - Database error

```json
{
  "success": false,
  "error": "Search failed"
}
```

**Source**: `apps/web/app/api/search/route.ts`
**Authentication**: None (to be added)

---

## Planned Endpoints (Week 1-2)

### Issues API (Week 1 Day 3)

#### GET /api/issues

List all issues with pagination

**Query Parameters**:

- `cursor` (optional): Pagination cursor
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority

**Response**:

```json
{
  "data": [...],
  "nextCursor": "...",
  "hasMore": true
}
```

#### POST /api/issues

Create a new issue

**Request Body**:

```json
{
  "title": "string",
  "description": "string",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "assigneeId": "number?"
}
```

#### GET /api/issues/:id

Get single issue

#### PUT /api/issues/:id

Update issue

#### DELETE /api/issues/:id

Delete issue

---

### Search API (Week 1 Day 4)

#### POST /api/search

Hybrid search (full-text + semantic)

**Request Body**:

```json
{
  "query": "string",
  "type": "issues" | "knowledge" | "all",
  "limit": 20
}
```

**Response**:

```json
{
  "results": [...],
  "took": 123,
  "total": 42
}
```

---

### Knowledge Base API (Week 2)

#### GET /api/knowledge

List knowledge base articles

#### POST /api/knowledge

Create knowledge article

#### GET /api/knowledge/:id

Get article

#### PUT /api/knowledge/:id

Update article

#### DELETE /api/knowledge/:id

Delete article

---

## API Conventions

### Request/Response Format

**All requests/responses use JSON**:

```http
Content-Type: application/json
```

### Standard Response Envelopes

**Success (Single Resource)**:

```json
{
  "data": {
    /* resource */
  }
}
```

**Success (Collection)**:

```json
{
  "data": [
    /* resources */
  ],
  "pagination": {
    "cursor": "...",
    "hasMore": true,
    "total": 100
  }
}
```

**Error**:

```json
{
  "error": "Error message",
  "details": [
    /* additional info */
  ]
}
```

### HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Pagination

**Cursor-based pagination** (preferred for performance):

**Request**:

```
GET /api/issues?cursor=abc123&limit=20
```

**Response**:

```json
{
  "data": [...],
  "nextCursor": "def456",
  "hasMore": true
}
```

### Authentication

**Future implementation** (Week 2):

```http
Authorization: Bearer <token>
```

### Rate Limiting

**Not currently implemented** - will be added if needed

Planned headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1635724800
```

---

## Error Handling

### Standard Error Format

```typescript
interface ApiError {
  error: string; // Human-readable error message
  details?: string[]; // Additional error details
  code?: string; // Error code (optional)
  field?: string; // Field that caused error (validation)
}
```

### Common Errors

**Validation Error** (`400`):

```json
{
  "error": "Validation failed",
  "details": ["Title is required", "Description must be less than 5000 characters"]
}
```

**Not Found** (`404`):

```json
{
  "error": "Resource not found",
  "details": ["Issue with ID 123 does not exist"]
}
```

**Server Error** (`500`):

```json
{
  "error": "Internal server error",
  "details": ["Database connection failed"]
}
```

---

## Testing

### Manual Testing

**Using curl**:

```bash
# GET request
curl http://localhost:3000/api/preferences/1

# POST/PUT request
curl -X PUT http://localhost:3000/api/preferences/1 \
  -H "Content-Type: application/json" \
  -d '{"theme": "neon"}'
```

**Using Postman/Insomnia**:
Import collection from `.postman/` (to be created)

### Automated Testing

**Test files**: `__tests__/api/`

**Run tests**:

```bash
pnpm test:api
```

---

## Development

### Creating New Endpoints

**See SOP**: [.agent/sops/adding-api-endpoint.md](../sops/adding-api-endpoint.md)

**Quick steps**:

1. Create route file: `app/api/[resource]/route.ts`
2. Add validation schema (Zod)
3. Implement handler (GET, POST, etc.)
4. Add error handling
5. Write tests
6. Update this catalog

### API Route Structure

```typescript
// app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// Validation schema
const schema = z.object({
  field: z.string(),
});

// GET handler
export async function GET(request: NextRequest) {
  try {
    // Implementation
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json({ error: 'Error message' }, { status: 500 });
  }
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    // Implementation
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Error message' }, { status: 500 });
  }
}
```

---

## Resources

### Documentation

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Zod Validation](https://zod.dev/)
- [REST API Best Practices](https://restfulapi.net/)

### Project Documentation

- [API Design Patterns](.claude/skills/backend/api-design-patterns.md)
- [Database Schema](database-schema.md)
- [Adding API Endpoints SOP](../sops/adding-api-endpoint.md)

### Tools

- [Postman](https://www.postman.com/) - API testing
- [Insomnia](https://insomnia.rest/) - API testing
- [Thunder Client](https://www.thunderclient.com/) - VS Code extension

---

**Maintenance**:

- Update this catalog when adding/modifying endpoints
- Keep examples current with actual implementation
- Document breaking changes
- Version API if needed (future: /api/v1/...)

**Related**:

- [Database Schema](database-schema.md) - Data models
- [Component Patterns](component-patterns.md) - Frontend integration
- [MCP Tools Guide](mcp-tools-guide.md) - MCP server API usage

---

**Last Updated:** 2025-11-12
**API Status:** Full CRUD + Search + Multi-entity + Sprint Management + Workflow Orchestration (Sprint 3 complete)
**Total Endpoints:** 18 active (7 sprint, 4 workflow, 2 theme, 2 issue, 1 knowledge, 1 wiki, 2 security, 1 search)
**Next Update:** Sprint 4 start

**See also**: [.agent/progress.md](../progress.md) for current project status
