# Roadmap UI - API Specification

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/roadmap` | List roadmaps for project |
| POST | `/api/roadmap` | Create new roadmap |
| GET | `/api/roadmap/[id]` | Get roadmap details |
| PUT | `/api/roadmap/[id]` | Update roadmap |
| DELETE | `/api/roadmap/[id]` | Delete roadmap |
| POST | `/api/roadmap/[id]/materialize` | Trigger materialization |
| POST | `/api/roadmap/import` | Import from JSON |

---

## POST /api/roadmap - Create Roadmap

### Request
```typescript
interface CreateRoadmapRequest {
  projectId: number;
  title: string;
  description?: string;
  startDate: string;  // ISO8601: "2025-01-01T00:00:00.000Z"
  phases: Array<{
    title: string;
    description?: string;
    duration?: string;  // "4 weeks", "2 months"
    sprints: Array<{
      name: string;
      duration?: string;  // "2 weeks"
      weeks?: string;     // "Weeks 1-2"
      goals: string[];
      deliverables: string[];
      storyPoints?: number;
    }>;
  }>;
  materialize?: boolean;  // Default: true - auto-materialize after creation
}
```

### Zod Schema
```typescript
const createRoadmapSchema = z.object({
  projectId: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startDate: z.string().datetime(),
  phases: z.array(z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    duration: z.string().optional(),
    sprints: z.array(z.object({
      name: z.string().min(1).max(200),
      duration: z.string().optional(),
      weeks: z.string().optional(),
      goals: z.array(z.string()),
      deliverables: z.array(z.string()),
      storyPoints: z.number().int().positive().optional(),
    })).min(1),
  })).min(1),
  materialize: z.boolean().default(true),
});
```

### Response (Success - 201)
```json
{
  "success": true,
  "data": {
    "roadmap": {
      "id": "clxxx...",
      "projectId": 1,
      "title": "Q1 2025 Roadmap",
      "phases": { /* JSON structure */ },
      "currentPhase": null,
      "currentSprint": null,
      "currentWeek": null,
      "currentDay": null,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    "materialization": {
      "phases": 3,
      "sprints": 9,
      "weeks": 36,
      "days": 180
    }
  }
}
```

### Response (Error - 400)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      { "path": ["phases", 0, "title"], "message": "Required" }
    ]
  }
}
```

---

## GET /api/roadmap - List Roadmaps

### Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| projectId | number | **Required** - Filter by project |

### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "roadmaps": [
      {
        "id": "clxxx...",
        "projectId": 1,
        "title": "Q1 2025 Roadmap",
        "currentPhase": "Phase 1",
        "progress": 25,
        "phasesCount": 3,
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

## GET /api/roadmap/[id] - Get Roadmap Details

### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "roadmap": {
      "id": "clxxx...",
      "projectId": 1,
      "title": "Q1 2025 Roadmap",
      "description": "Development roadmap for Q1",
      "phases": { /* JSON structure */ },
      "phases_rel": [
        {
          "id": "phase1...",
          "title": "Phase 1: Foundation",
          "status": "IN_PROGRESS",
          "progress": 50,
          "sprints": [
            {
              "id": "sprint1...",
              "title": "Sprint 1",
              "status": "COMPLETED",
              "progress": 100,
              "weeks": [/* ... */]
            }
          ]
        }
      ],
      "currentPhase": "Phase 1",
      "currentSprint": "Sprint 2",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

---

## PUT /api/roadmap/[id] - Update Roadmap

### Request
```typescript
interface UpdateRoadmapRequest {
  title?: string;
  description?: string;
  currentPhase?: string;
  currentSprint?: string;
  currentWeek?: string;
  currentDay?: string;
}
```

### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "roadmap": { /* updated roadmap */ }
  }
}
```

---

## DELETE /api/roadmap/[id] - Delete Roadmap

### Response (Success - 200)
```json
{
  "success": true,
  "message": "Roadmap deleted successfully"
}
```

**Note**: Deleting a roadmap cascades to all Phase/Sprint/Week/Day/Task records.

---

## POST /api/roadmap/[id]/materialize - Trigger Materialization

Converts the `phases` JSON structure into actual Phase/Sprint/Week/Day database records.

### Request
```typescript
interface MaterializeRequest {
  force?: boolean;  // Re-materialize even if already done
}
```

### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "materialization": {
      "phases": 3,
      "sprints": 9,
      "weeks": 36,
      "days": 180,
      "tasks": 0
    }
  }
}
```

### Response (Error - 409)
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_MATERIALIZED",
    "message": "Roadmap is already materialized. Use force=true to re-materialize."
  }
}
```

---

## POST /api/roadmap/import - Import from JSON

### Request
```typescript
interface ImportRoadmapRequest {
  projectId: number;
  title?: string;  // Override title from JSON
  source:
    | { type: 'json'; data: ParsedRoadmap }
    | { type: 'file'; content: string };  // Base64 encoded JSON file
  materialize?: boolean;  // Default: true
}
```

### ParsedRoadmap Schema
```typescript
interface ParsedRoadmap {
  phases: Array<{
    title?: string;
    name?: string;  // Alias for title
    duration?: string;
    sprints: Array<{
      name: string;
      duration?: string;
      weeks?: string;
      goals: string[];
      deliverables: string[];
      storyPoints?: number;
    }>;
  }>;
}
```

### Response (Success - 201)
```json
{
  "success": true,
  "data": {
    "roadmap": { /* created roadmap */ },
    "materialization": {
      "phases": 3,
      "sprints": 9,
      "weeks": 36,
      "days": 180
    },
    "warnings": [
      "Phase 2 has no sprints defined, skipped"
    ]
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request body |
| NOT_FOUND | 404 | Roadmap not found |
| UNAUTHORIZED | 401 | Not authenticated |
| FORBIDDEN | 403 | Not project owner |
| ALREADY_MATERIALIZED | 409 | Roadmap already materialized |
| PARSE_ERROR | 422 | Failed to parse JSON |

---

## Authentication

All endpoints require authentication via session cookie. Project ownership is verified by checking `roadmap.projectId` against user's projects.

---

## Rate Limits

- GET endpoints: 100 requests/minute
- POST/PUT/DELETE endpoints: 30 requests/minute
- Materialize endpoint: 10 requests/minute (expensive operation)
