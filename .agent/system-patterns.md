# System Patterns

**Project**: ProjectPulse
**Updated**: 2025-12-19

---

## Architecture Principles

1. **Database as Truth**: All state in PostgreSQL, not files
2. **Agent-First**: MCP tools are primary interface (95% usage)
3. **Multi-tenant**: Per-project scoping on all queries
4. **Token Efficient**: Minimize context size for agents

---

## Component Patterns

### Server vs Client Components

**Default**: Server Components (no directive needed)

**Use Server Components for**:
- Data fetching from database
- Reading environment variables
- Static content rendering

**Use Client Components ("use client") for**:
- User interactivity (onClick, onChange)
- React hooks (useState, useEffect)
- Browser APIs (localStorage, window)

**Hybrid Pattern**:
```typescript
// page.tsx (Server) - fetches data
export default async function Page() {
  const data = await prisma.entity.findMany();
  return <ClientList initialData={data} />;
}

// ClientList.tsx (Client) - handles interactivity
"use client";
export function ClientList({ initialData }) {
  const [items, setItems] = useState(initialData);
  return <div>{/* Interactive UI */}</div>;
}
```

---

## Database Patterns

### Query Optimization
```typescript
// ✅ Select only needed fields
const items = await prisma.ticket.findMany({
  select: { id: true, title: true, status: true },
  where: { projectId, status: 'open' },
  orderBy: { createdAt: 'desc' },
  take: 20,
});

// ❌ Avoid fetching everything
const items = await prisma.ticket.findMany({ include: { labels: true } });
```

### Full-Text Search (tsvector)
```typescript
// Always use Prisma parameterization (safe from injection)
const results = await prisma.$queryRaw`
  SELECT * FROM "Ticket"
  WHERE content_tsv @@ plainto_tsquery('english', ${query})
  ORDER BY ts_rank(content_tsv, plainto_tsquery('english', ${query})) DESC
`;
```

### Multi-tenancy
```typescript
// ALWAYS include projectId in queries
const tickets = await prisma.ticket.findMany({
  where: { projectId: auth.projectId, ...filters },
});
```

---

## API Route Pattern

```typescript
// app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const schema = z.object({
  title: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    const result = await prisma.entity.create({ data });
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

---

## MCP Tool Pattern

```typescript
// apps/mcp-server/src/tools/[resource]/create.ts
import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const schema = z.object({
  projectId: z.number().positive(),
  title: z.string().min(1),
});

export const createTool: ToolDefinition = {
  name: 'projectpulse_entity_create',
  description: '[ACTION] Create new entity...',
  schema,
  inputSchema: { /* JSON Schema for MCP */ },
  async execute(params, context) {
    const validated = schema.parse(params);
    const response = await context.httpClient.post('/api/entity', validated);
    return { content: [{ type: 'text', text: JSON.stringify(response) }] };
  },
};
```

---

## File Organization

```
apps/web/
  app/
    api/[resource]/route.ts    # API endpoints
    (authenticated)/           # Protected pages
    actions/                   # Server Actions
  components/
    ui/                        # shadcn/ui components
    [feature]/                 # Feature components
  lib/
    db.ts                      # Prisma client
    validations/               # Zod schemas

apps/mcp-server/
  src/tools/
    [resource]/                # Tool implementations
    index.ts                   # Tool registry
```

---

## Testing Patterns

**Unit**: Jest for utilities and business logic
**Component**: React Testing Library for UI
**E2E**: Playwright for user workflows

```typescript
// E2E Test Pattern
test('ticket workflow', async ({ page }) => {
  await page.goto('/tickets/1');
  await page.fill('[data-testid="comment"]', 'Test');
  await page.click('[data-testid="submit"]');
  await expect(page.locator('[data-testid="comments"]')).toContainText('Test');
});
```

---

## Naming Conventions

- **Files**: `PascalCase.tsx` (components), `camelCase.ts` (utils)
- **Components**: PascalCase (`TicketCard`, `SearchBar`)
- **Props**: camelCase, boolean prefix (`isOpen`, `hasError`)
- **Callbacks**: `on` prefix (`onClick`, `onSubmit`)

---

## Key Rules

1. Always validate with Zod before database operations
2. Always scope queries to projectId (multi-tenancy)
3. Use ISR (revalidate) for list pages, dynamic for detail pages
4. Return structured responses: `{ data }` or `{ error }`
5. Log errors with context: `logger.error('msg', { ticketId, error })`

---

*See tech-context.md for stack details and configuration.*
