# API Endpoint Catalog

**Last Updated**: 2025-11-08
**Base URL**: `http://localhost:3000/api`
**Status**: Full CRUD + Search + Multi-entity + Sprint Management (Sprint 1 Week 1 complete)

---

## Quick Index

### Sprint Management

- [POST /api/phases](#post-apiphases) - Create phase with auto-generated weeks
- [GET /api/tasks/current](#get-apitaskscurrent) - Get currently active task with hierarchy

### Theme Management

- [GET /api/preferences/:userId](#get-apipreferencesuserid) - Get user preferences
- [PUT /api/preferences/:userId](#put-apipreferencesuserid) - Update user preferences

### Issue Management

- [POST /api/issues/[id]/comments](#post-apiissuesidcomments) - Add comment to issue
- [PATCH /api/issues/[id]/status](#patch-apiissuesidstatus) - Update issue status

### Knowledge Base

- [GET /api/knowledge](#get-apiknowledge) - List knowledge base articles with pagination and filtering

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

**Last Updated:** 2025-11-08
**API Status:** Full CRUD + Search + Multi-entity + Sprint Management (Sprint 1 Week 1 complete)
**Total Endpoints:** 10 active (2 sprint, 2 theme, 2 issue, 1 knowledge, 1 wiki, 2 security, 1 search)
**Next Update:** Sprint 1 Week 2 (Days 8-14)

**See also**: [.agent/progress.md](../progress.md) for current project status
