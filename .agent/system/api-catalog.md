# API Endpoint Catalog

**Last Updated**: 2025-10-26
**Base URL**: `http://localhost:3000/api`
**Status**: Minimal API (Theme preferences only - full API pending Week 1 Day 3)

---

## Quick Index

### Theme Management

- [GET /api/preferences/:userId](#get-apipreferencesuserid) - Get user preferences
- [PUT /api/preferences/:userId](#put-apipreferencesuserid) - Update user preferences

### Future Endpoints (Planned)

- Issues API (Week 1 Day 3)
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

**Last Updated:** 2025-10-26
**API Status:** Minimal (Preferences only)
**Next Update:** Week 1 Day 3 (Issues API implementation)
