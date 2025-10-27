# API Endpoint Catalog

**Last Updated**: 2025-10-28
**Base URL**: `http://localhost:3000/api`
**Status**: Theme system + Issue management (Phase 3 Day 4 complete)

---

## Quick Index

### Theme Management

- [GET /api/preferences/:userId](#get-apipreferencesuserid) - Get user preferences
- [PUT /api/preferences/:userId](#put-apipreferencesuserid) - Update user preferences

### Issue Management

- [POST /api/issues/[id]/comments](#post-apiissuesidcomments) - Add comment to issue
- [PATCH /api/issues/[id]/status](#patch-apiissuesidstatus) - Update issue status

### Future Endpoints (Planned)

- Search API (Week 1 Day 4)
- Knowledge Base API (Week 2)
- Authentication API (Week 2)

---

## Current Endpoints

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

**Last Updated:** 2025-10-28
**API Status:** Theme system + Issue management (comments, status updates)
**Next Update:** Phase 3 Day 5+ (Additional issue endpoints)

**See also**: [STATUS.md](../../STATUS.md) for current project status
