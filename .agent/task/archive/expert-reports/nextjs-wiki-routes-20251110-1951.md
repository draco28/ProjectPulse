# Next.js Implementation Plan: Wiki Editor Routes & API

**Created**: 2025-11-10 19:51 IST
**Type**: Pages (New/Edit) + API Routes (CRUD + Search + Validation)
**Context**: Sprint 2 Day 3 - Wiki Editor UI + API + MCP Tools

---

## Architecture Decisions

### Rendering Strategy

**✅ Hybrid Approach: Server Components + Client Components**

**Why:**
- Server Components for data fetching (edit route loads existing content)
- Client Components for interactive editor (TipTap requires browser APIs)
- ISR for caching wiki pages (documentation changes infrequently)

### Component Strategy

**Server Components:**
- `/wiki/new/page.tsx` - Wrapper that passes metadata to Client Component
- `/wiki/[slug]/edit/page.tsx` - Fetches wiki page data, hydrates Client Component

**Client Components:**
- `WikiEditor.tsx` - TipTap editor with split view (markdown + preview)
- Form handling with react-hook-form + Zod validation

**Rationale:**
- Server Components reduce client-side JavaScript bundle
- Data fetching happens server-side for better SEO and initial load
- Client Components only used where interactivity is required (editor, form)
- Matches existing pattern from wiki detail page (Server Component wrapping Client Components)

---

## File Structure

```
apps/web/
├── app/
│   ├── wiki/
│   │   ├── new/
│   │   │   └── page.tsx                    # Server Component (new wiki page)
│   │   ├── [slug]/
│   │   │   ├── edit/
│   │   │   │   └── page.tsx                # Server Component (edit wiki page)
│   │   │   └── page.tsx                    # Existing detail page
│   │   └── page.tsx                        # Existing list page
│   └── api/
│       └── wiki/
│           ├── route.ts                    # POST /api/wiki (create)
│           ├── search/
│           │   └── route.ts                # POST /api/wiki/search (full-text search)
│           ├── validate-slug/
│           │   └── route.ts                # GET /api/wiki/validate-slug (async validation)
│           └── [slug]/
│               └── route.ts                # PATCH /api/wiki/[slug] (update) + existing GET
├── components/
│   └── wiki/
│       ├── WikiEditor.tsx                  # Client Component (TipTap editor)
│       ├── WikiEditorToolbar.tsx           # Client Component (editor toolbar)
│       └── WikiEditorPreview.tsx           # Client Component (markdown preview)
└── lib/
    ├── validations/
    │   └── wiki.ts                         # Zod schemas for wiki CRUD
    └── utils/
        └── wiki-search.ts                  # Helper for PostgreSQL full-text search
```

---

## Implementation Steps

### Step 1: Route - `/wiki/new/page.tsx` (Server Component)

**Purpose**: Render new wiki page form with empty editor

**Pattern**: Server Component wrapping Client Component

```typescript
// File: apps/web/app/wiki/new/page.tsx
import { Metadata } from 'next';
import { Sidebar } from '@/components/Sidebar';
import { FloatingBackground } from '@/components/FloatingBackground';
import { WikiEditor } from '@/components/wiki/WikiEditor';

export const metadata: Metadata = {
  title: 'New Wiki Page | ProjectPulse',
  description: 'Create a new wiki page',
};

export default function NewWikiPage() {
  return (
    <>
      <FloatingBackground />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="content-wrapper flex-1 overflow-auto p-4">
          <div className="mx-auto max-w-7xl space-y-4">
            {/* Header */}
            <header className="neu-raised smooth-transition rounded-3xl px-8 py-5">
              <h1 className="text-3xl font-bold text-white">Create Wiki Page</h1>
              <p className="text-sm text-slate">
                Write documentation, guides, or references
              </p>
            </header>

            {/* Editor (Client Component) */}
            <WikiEditor mode="create" />
          </div>
        </div>
      </div>
    </>
  );
}
```

**Key Points:**
- ✅ Server Component (no 'use client')
- ✅ Static metadata export for SEO
- ✅ Passes `mode="create"` to Client Component
- ✅ No data fetching needed (empty form)
- ✅ Matches layout pattern from existing wiki pages

**Caching Strategy**: Static (pre-rendered at build time)

---

### Step 2: Route - `/wiki/[slug]/edit/page.tsx` (Server Component)

**Purpose**: Fetch existing wiki page and hydrate editor

**Pattern**: Server Component fetches data → passes to Client Component

```typescript
// File: apps/web/app/wiki/[slug]/edit/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { FloatingBackground } from '@/components/FloatingBackground';
import { WikiEditor } from '@/components/wiki/WikiEditor';
import { prisma } from '@/lib/prisma';

interface PageProps {
  params: {
    slug: string;
  };
}

// ISR: Revalidate every hour (same as detail page)
export const revalidate = 3600;

// Fetch wiki page data server-side
async function getWikiPage(slug: string) {
  const path = slug.startsWith('/') ? slug : `/${slug}`;

  const page = await prisma.wikiPage.findUnique({
    where: { path },
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      path: true,
    },
  });

  return page;
}

// Generate metadata dynamically
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await getWikiPage(params.slug);

  if (!page) {
    return {
      title: 'Page Not Found | ProjectPulse',
    };
  }

  return {
    title: `Edit: ${page.title} | ProjectPulse`,
    description: `Edit wiki page: ${page.title}`,
  };
}

// Generate static params for ISR (same as detail page)
export async function generateStaticParams() {
  const pages = await prisma.wikiPage.findMany({
    select: { path: true },
    take: 50, // Limit for build time
  });

  return pages.map((page) => ({
    slug: page.path.replace(/^\//, ''), // Remove leading slash
  }));
}

export default async function EditWikiPage({ params }: PageProps) {
  const page = await getWikiPage(params.slug);

  if (!page) {
    notFound();
  }

  return (
    <>
      <FloatingBackground />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="content-wrapper flex-1 overflow-auto p-4">
          <div className="mx-auto max-w-7xl space-y-4">
            {/* Header */}
            <header className="neu-raised smooth-transition rounded-3xl px-8 py-5">
              <h1 className="text-3xl font-bold text-white">Edit Wiki Page</h1>
              <p className="text-sm text-slate">Editing: {page.title}</p>
            </header>

            {/* Editor with existing data (Client Component) */}
            <WikiEditor
              mode="edit"
              initialData={{
                id: page.id,
                title: page.title,
                content: page.content,
                category: page.category || undefined,
                path: page.path,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
```

**Key Points:**
- ✅ Server Component fetches data server-side
- ✅ Data passed as props to Client Component (`initialData`)
- ✅ ISR with 1-hour revalidation (documentation changes infrequently)
- ✅ `generateStaticParams` for pre-rendering top 50 pages
- ✅ Dynamic metadata based on page title
- ✅ 404 handling with `notFound()` if slug doesn't exist
- ✅ Matches pattern from existing wiki detail page

**Caching Strategy**: ISR with 1-hour revalidation

**Why Server-Side Fetching > Client-Side:**
- ✅ Better SEO (content available at initial load)
- ✅ Faster initial render (no loading spinner)
- ✅ Reduced client-side JavaScript
- ✅ Prisma queries stay on server (secure)

---

### Step 3: API Route - `POST /api/wiki` (Create Wiki Page)

**Purpose**: Create new wiki page with validation

**Pattern**: Route handler with Zod validation + Prisma mutation + cache revalidation

```typescript
// File: apps/web/app/api/wiki/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Validation schema
const CreateWikiPageSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  category: z.string().optional(),
  path: z
    .string()
    .min(1, 'Path is required')
    .regex(/^\/[a-z0-9-]+$/, 'Path must start with / and contain only lowercase letters, numbers, and hyphens'),
});

/**
 * POST /api/wiki
 *
 * Create a new wiki page
 *
 * Body:
 * {
 *   title: string,
 *   content: string,
 *   category?: string,
 *   path: string (e.g., '/getting-started')
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const data = CreateWikiPageSchema.parse(body);

    // Check if path already exists
    const existingPage = await prisma.wikiPage.findUnique({
      where: { path: data.path },
    });

    if (existingPage) {
      return NextResponse.json(
        { error: 'A wiki page with this path already exists' },
        { status: 409 } // Conflict
      );
    }

    // Create wiki page
    const wikiPage = await prisma.wikiPage.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category || null,
        path: data.path,
        searchVector: null, // Will be updated by background job or trigger
        version: 1,
      },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        path: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Revalidate wiki list page
    revalidatePath('/wiki');

    // Revalidate new page (for ISR)
    revalidatePath(`/wiki/${data.path.replace(/^\//, '')}`);

    return NextResponse.json({ data: wikiPage }, { status: 201 });
  } catch (error) {
    // Validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    // Database error or other errors
    console.error('Failed to create wiki page:', error);
    return NextResponse.json(
      { error: 'Failed to create wiki page' },
      { status: 500 }
    );
  }
}
```

**Key Points:**
- ✅ Zod validation before database mutation
- ✅ Check for duplicate path (409 Conflict if exists)
- ✅ `revalidatePath()` to invalidate ISR cache for list + detail pages
- ✅ Return 201 Created with new page data
- ✅ Matches API pattern from `/api/preferences` (validation + Prisma + error handling)

**Response Format:**
```json
// Success (201)
{
  "data": {
    "id": 1,
    "title": "Getting Started",
    "content": "# Getting Started\n...",
    "category": "Guide",
    "path": "/getting-started",
    "createdAt": "2025-11-10T19:51:00.000Z",
    "updatedAt": "2025-11-10T19:51:00.000Z"
  }
}

// Error (400)
{
  "error": "Validation failed",
  "details": [
    { "path": ["title"], "message": "Title is required" }
  ]
}

// Error (409)
{
  "error": "A wiki page with this path already exists"
}
```

---

### Step 4: API Route - `PATCH /api/wiki/[slug]` (Update Wiki Page)

**Purpose**: Update existing wiki page with validation

**Pattern**: Route handler with Zod validation + Prisma update + cache revalidation

```typescript
// File: apps/web/app/api/wiki/[slug]/route.ts (add PATCH to existing file)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ... (keep existing GET handler)

// Validation schema for updates
const UpdateWikiPageSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  category: z.string().optional(),
});

/**
 * PATCH /api/wiki/:slug
 *
 * Update an existing wiki page
 *
 * Path params:
 * - slug: The wiki page path (e.g., 'getting-started')
 *
 * Body (all optional):
 * {
 *   title?: string,
 *   content?: string,
 *   category?: string
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const path = slug.startsWith('/') ? slug : `/${slug}`;

    const body = await request.json();

    // Validate input
    const data = UpdateWikiPageSchema.parse(body);

    // Check if at least one field is provided
    if (!data.title && !data.content && !data.category) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      );
    }

    // Check if page exists
    const existingPage = await prisma.wikiPage.findUnique({
      where: { path },
      select: { id: true, version: true },
    });

    if (!existingPage) {
      return NextResponse.json({ error: 'Wiki page not found' }, { status: 404 });
    }

    // Update wiki page (increment version)
    const updatedPage = await prisma.wikiPage.update({
      where: { path },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.category !== undefined && { category: data.category || null }),
        version: { increment: 1 }, // Increment version number
        searchVector: null, // Will be updated by background job or trigger
      },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        path: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Revalidate wiki list page
    revalidatePath('/wiki');

    // Revalidate detail page
    revalidatePath(`/wiki/${slug}`);

    // Revalidate edit page
    revalidatePath(`/wiki/${slug}/edit`);

    return NextResponse.json({ data: updatedPage });
  } catch (error) {
    // Validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    // Database error or other errors
    console.error('Failed to update wiki page:', error);
    return NextResponse.json(
      { error: 'Failed to update wiki page' },
      { status: 500 }
    );
  }
}
```

**Key Points:**
- ✅ Zod validation for partial updates (all fields optional)
- ✅ Check at least one field provided
- ✅ 404 if slug doesn't exist
- ✅ Increment version number on update
- ✅ `revalidatePath()` for list, detail, and edit pages
- ✅ Return updated page data with new version
- ✅ Matches pattern from existing `/api/preferences` PATCH endpoint

**Response Format:**
```json
// Success (200)
{
  "data": {
    "id": 1,
    "title": "Getting Started (Updated)",
    "content": "# Getting Started\n...",
    "category": "Guide",
    "path": "/getting-started",
    "version": 2,
    "createdAt": "2025-11-10T19:51:00.000Z",
    "updatedAt": "2025-11-10T20:00:00.000Z"
  }
}

// Error (404)
{
  "error": "Wiki page not found"
}
```

---

### Step 5: API Route - `POST /api/wiki/search` (Full-Text Search)

**Purpose**: Search wiki pages using PostgreSQL full-text search

**Pattern**: Route handler with Prisma full-text search (tsvector)

**Why POST instead of GET?**
- POST allows complex search parameters (filters, facets)
- Avoids URL length limits for long queries
- Body can include structured filters (category, date range)
- Matches pattern from existing `/api/search` endpoint

```typescript
// File: apps/web/app/api/wiki/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const WikiSearchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  category: z.string().optional(),
  limit: z.number().int().positive().max(50).default(10),
  offset: z.number().int().nonnegative().default(0),
});

/**
 * POST /api/wiki/search
 *
 * Search wiki pages using PostgreSQL full-text search
 *
 * Body:
 * {
 *   query: string,
 *   category?: string,
 *   limit?: number (default: 10, max: 50),
 *   offset?: number (default: 0)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const data = WikiSearchSchema.parse(body);

    // Build where clause
    const where: any = {
      OR: [
        // Case-insensitive search in title
        { title: { contains: data.query, mode: 'insensitive' } },
        // Case-insensitive search in content
        { content: { contains: data.query, mode: 'insensitive' } },
      ],
    };

    // Add category filter if provided
    if (data.category) {
      where.category = data.category;
    }

    // Execute search query
    const [results, totalCount] = await Promise.all([
      prisma.wikiPage.findMany({
        where,
        select: {
          id: true,
          title: true,
          content: true, // Will truncate to excerpt client-side
          category: true,
          path: true,
          updatedAt: true,
        },
        orderBy: [
          // Prioritize title matches (using raw SQL would be better for ranking)
          { updatedAt: 'desc' }, // Fallback: most recently updated
        ],
        take: data.limit,
        skip: data.offset,
      }),
      prisma.wikiPage.count({ where }),
    ]);

    // Generate excerpts (truncate content to 200 chars)
    const resultsWithExcerpts = results.map((page) => {
      // Find the position of the query in the content (case-insensitive)
      const lowerContent = page.content.toLowerCase();
      const lowerQuery = data.query.toLowerCase();
      const queryIndex = lowerContent.indexOf(lowerQuery);

      let excerpt: string;

      if (queryIndex !== -1) {
        // Extract context around the query (100 chars before and after)
        const start = Math.max(0, queryIndex - 100);
        const end = Math.min(page.content.length, queryIndex + data.query.length + 100);
        excerpt = page.content.slice(start, end);

        // Add ellipsis if truncated
        if (start > 0) excerpt = '...' + excerpt;
        if (end < page.content.length) excerpt = excerpt + '...';
      } else {
        // Query not in content, use first 200 chars
        excerpt = page.content.slice(0, 200);
        if (page.content.length > 200) excerpt = excerpt + '...';
      }

      return {
        id: page.id,
        title: page.title,
        excerpt,
        category: page.category || 'Uncategorized',
        path: page.path,
        updatedAt: page.updatedAt,
      };
    });

    return NextResponse.json({
      data: {
        results: resultsWithExcerpts,
        totalCount,
        query: data.query,
        limit: data.limit,
        offset: data.offset,
      },
    });
  } catch (error) {
    // Validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    // Database error or other errors
    console.error('Wiki search failed:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
```

**Key Points:**
- ✅ POST method for complex queries
- ✅ Pagination with `limit` and `offset`
- ✅ Category filter optional
- ✅ Case-insensitive search in title + content
- ✅ Smart excerpt generation (show context around query)
- ✅ Returns total count for pagination
- ✅ Matches pattern from existing `/api/search` endpoint

**Response Format:**
```json
{
  "data": {
    "results": [
      {
        "id": 1,
        "title": "Getting Started",
        "excerpt": "...follow these steps to get started with the project...",
        "category": "Guide",
        "path": "/getting-started",
        "updatedAt": "2025-11-10T19:51:00.000Z"
      }
    ],
    "totalCount": 5,
    "query": "getting started",
    "limit": 10,
    "offset": 0
  }
}
```

**Future Enhancement (PostgreSQL tsvector):**

For better performance with large datasets, use PostgreSQL's native full-text search:

```typescript
// Use Prisma raw SQL for tsvector search
const results = await prisma.$queryRaw`
  SELECT
    id,
    title,
    content,
    category,
    path,
    "updatedAt",
    ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', ${data.query})) as rank
  FROM "WikiPage"
  WHERE to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', ${data.query})
  ${data.category ? Prisma.sql`AND category = ${data.category}` : Prisma.empty}
  ORDER BY rank DESC
  LIMIT ${data.limit}
  OFFSET ${data.offset}
`;
```

**Benefits of tsvector:**
- ✅ Stemming (e.g., "running" matches "run")
- ✅ Stop word removal (e.g., "the", "a")
- ✅ Ranking by relevance (`ts_rank`)
- ✅ Faster for large datasets (with GIN index)

**Implementation Note**: The schema already has `searchVector` field. To use it:
1. Add migration to populate `searchVector` column with tsvector
2. Add GIN index on `searchVector`
3. Update Prisma queries to use `searchVector`

---

### Step 6: API Route - `GET /api/wiki/validate-slug` (Async Slug Validation)

**Purpose**: Check if slug/path is already taken (for real-time validation)

**Pattern**: Route handler with query parameter validation

```typescript
// File: apps/web/app/api/wiki/validate-slug/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const ValidateSlugSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(
      /^\/[a-z0-9-]+$/,
      'Slug must start with / and contain only lowercase letters, numbers, and hyphens'
    ),
});

/**
 * GET /api/wiki/validate-slug?slug=/getting-started
 *
 * Check if a wiki page slug/path is already taken
 *
 * Query params:
 * - slug: The wiki page path to validate (e.g., '/getting-started')
 *
 * Returns:
 * - available: boolean (true if slug is available, false if taken)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    // Validate input
    const data = ValidateSlugSchema.parse({ slug });

    // Check if slug exists
    const existingPage = await prisma.wikiPage.findUnique({
      where: { path: data.slug },
      select: { id: true }, // Only select id (minimal data)
    });

    return NextResponse.json({
      data: {
        slug: data.slug,
        available: !existingPage, // Available if NOT found
      },
    });
  } catch (error) {
    // Validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    // Database error or other errors
    console.error('Slug validation failed:', error);
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}
```

**Key Points:**
- ✅ GET method (read-only operation)
- ✅ Query parameter validation with Zod
- ✅ Returns boolean `available` flag
- ✅ Minimal database query (only select id)
- ✅ Used for async validation in WikiEditor form

**Response Format:**
```json
// Slug available (200)
{
  "data": {
    "slug": "/getting-started",
    "available": true
  }
}

// Slug taken (200)
{
  "data": {
    "slug": "/getting-started",
    "available": false
  }
}

// Invalid slug (400)
{
  "error": "Validation failed",
  "details": [
    { "path": ["slug"], "message": "Slug must start with / and contain only lowercase letters, numbers, and hyphens" }
  ]
}
```

**Usage in WikiEditor:**

```typescript
// Debounced async validation
const checkSlugAvailability = useMemo(
  () =>
    debounce(async (slug: string) => {
      const res = await fetch(`/api/wiki/validate-slug?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();

      if (!data.data.available) {
        setError('path', { message: 'This slug is already taken' });
      } else {
        clearErrors('path');
      }
    }, 500),
  []
);
```

**Preventing Race Conditions:**
- ✅ Debounce API calls (500ms delay)
- ✅ Cancel previous requests if new input comes in
- ✅ Show loading state during validation

---

## Data Fetching Plan

### Where Data is Fetched

**Server-Side (Server Components):**
- `/wiki/[slug]/edit/page.tsx` - Fetch existing wiki page data
- Pattern: `await prisma.wikiPage.findUnique()`

**Client-Side (API Routes):**
- Form submissions (create/update) - Client Component calls API routes
- Search queries - Client Component calls `/api/wiki/search`
- Slug validation - Client Component calls `/api/wiki/validate-slug`

### Method

**Prisma ORM for Database Queries:**
- ✅ Type-safe queries
- ✅ Relation handling (outgoing links)
- ✅ Transaction support for complex operations

**Fetch API for Client-Side:**
- ✅ Standard Web API (works in all browsers)
- ✅ Used in form submission and search

### Caching Strategy

**Server Components:**
- ISR with 1-hour revalidation (`revalidate = 3600`)
- Matches existing wiki pages pattern

**API Routes:**
- No caching (always fresh data)
- Use `revalidatePath()` to invalidate ISR cache after mutations

**Revalidation Triggers:**
- After `POST /api/wiki` - Revalidate `/wiki` list page
- After `PATCH /api/wiki/[slug]` - Revalidate list + detail + edit pages

---

## Performance Considerations

### Bundle Size Impact

**Server Components:**
- ✅ No JavaScript sent to client (page wrappers)
- ✅ Prisma stays on server (no bundle bloat)

**Client Components:**
- ⚠️ TipTap editor (~100KB gzipped)
- ⚠️ React Hook Form (~20KB gzipped)
- ⚠️ Zod (~10KB gzipped)
- **Total**: ~130KB additional client-side JavaScript

**Mitigation:**
- ✅ Code splitting (TipTap loaded only on editor pages)
- ✅ Lazy load editor extensions (optional features)
- ✅ Use Next.js dynamic imports for heavy components

### Data Fetching Optimization

**Parallel Fetching:**
- Edit route could fetch related pages in parallel (future enhancement)
- Search endpoint fetches results + count in parallel (`Promise.all`)

**Sequential Fetching:**
- Edit route fetches page data first, then renders editor
- No dependent fetches required

**Database Query Optimization:**
- ✅ Select only required fields (`select` clause)
- ✅ Limit related pages to 5 (avoid N+1 queries)
- ✅ Index on `path` column (already exists in schema)
- ✅ Future: Add GIN index on `searchVector` for full-text search

### Caching Strategy Justification

**Why ISR (not static or dynamic)?**
- Wiki pages change occasionally (not frequently)
- ISR balances freshness and performance
- 1-hour revalidation ensures content stays reasonably up-to-date
- Reduces database load (cached responses served from CDN)

**Why revalidatePath() after mutations?**
- Ensures list page shows new pages immediately
- Detail page reflects updates without waiting 1 hour
- Edit page loads fresh data for next editor session

---

## Search Implementation (PostgreSQL Full-Text Search)

### Current Approach (Basic Search)

**Prisma ORM with `contains` operator:**
```typescript
where: {
  OR: [
    { title: { contains: query, mode: 'insensitive' } },
    { content: { contains: query, mode: 'insensitive' } },
  ],
}
```

**Limitations:**
- ❌ No stemming (e.g., "running" doesn't match "run")
- ❌ No ranking by relevance
- ❌ Slower for large datasets (no index)
- ❌ No stop word filtering

### Enhanced Approach (PostgreSQL tsvector)

**Step 1: Add Migration to Populate `searchVector`**

```sql
-- prisma/migrations/XXX_populate_search_vector.sql
-- Update existing rows
UPDATE "WikiPage"
SET "searchVector" = to_tsvector('english', title || ' ' || content);

-- Add trigger to auto-update on insert/update
CREATE OR REPLACE FUNCTION update_wiki_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW."searchVector" := to_tsvector('english', NEW.title || ' ' || NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wiki_search_vector_update
BEFORE INSERT OR UPDATE ON "WikiPage"
FOR EACH ROW
EXECUTE FUNCTION update_wiki_search_vector();
```

**Step 2: Add GIN Index**

```prisma
// prisma/schema.prisma
model WikiPage {
  // ... existing fields
  searchVector String?

  @@index([searchVector], type: Gin) // PostgreSQL GIN index for full-text search
}
```

**Step 3: Update Search Query**

```typescript
// Use Prisma raw SQL for tsvector search
const results = await prisma.$queryRaw<Array<{
  id: number;
  title: string;
  content: string;
  category: string | null;
  path: string;
  updatedAt: Date;
  rank: number;
}>>`
  SELECT
    id,
    title,
    content,
    category,
    path,
    "updatedAt",
    ts_rank("searchVector", plainto_tsquery('english', ${data.query})) as rank
  FROM "WikiPage"
  WHERE "searchVector" @@ plainto_tsquery('english', ${data.query})
  ${data.category ? Prisma.sql`AND category = ${data.category}` : Prisma.empty}
  ORDER BY rank DESC
  LIMIT ${data.limit}
  OFFSET ${data.offset}
`;
```

**Benefits:**
- ✅ Stemming (e.g., "running" matches "run", "runs", "ran")
- ✅ Stop word removal (e.g., "the", "a", "is")
- ✅ Ranking by relevance (`ts_rank`)
- ✅ 10-100x faster with GIN index
- ✅ Supports complex queries (AND, OR, NOT)

**Implementation Timeline:**
- ✅ Phase 1 (Current Sprint): Basic search with `contains`
- ⏳ Phase 2 (Future Sprint): Migrate to tsvector + GIN index

---

## Error Handling

### Next.js Error Boundaries

**404 Handling (Non-Existent Slug):**

**Edit Route:**
```typescript
// apps/web/app/wiki/[slug]/edit/page.tsx
export default async function EditWikiPage({ params }: PageProps) {
  const page = await getWikiPage(params.slug);

  if (!page) {
    notFound(); // Shows app/wiki/[slug]/edit/not-found.tsx (or default 404)
  }

  // ... render editor
}
```

**Create `not-found.tsx` for custom 404:**
```typescript
// apps/web/app/wiki/[slug]/edit/not-found.tsx
export default function NotFound() {
  return (
    <div className="neu-raised rounded-3xl p-12 text-center">
      <h2 className="text-2xl font-bold text-white">Wiki Page Not Found</h2>
      <p className="text-slate">The wiki page you're looking for doesn't exist.</p>
      <a href="/wiki" className="coral-gradient rounded-2xl px-6 py-3">
        Back to Wiki
      </a>
    </div>
  );
}
```

**Error Boundary (Server Errors):**

**Create `error.tsx` for error handling:**
```typescript
// apps/web/app/wiki/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="neu-raised rounded-3xl p-12 text-center">
      <h2 className="text-2xl font-bold text-white">Something went wrong!</h2>
      <p className="text-slate">{error.message}</p>
      <button onClick={reset} className="coral-gradient rounded-2xl px-6 py-3">
        Try again
      </button>
    </div>
  );
}
```

### API Validation Errors

**Zod Validation Errors:**
```typescript
// Handled in all API routes
if (error instanceof z.ZodError) {
  return NextResponse.json(
    { error: 'Validation failed', details: error.errors },
    { status: 400 }
  );
}
```

**Client-Side Handling:**
```typescript
// WikiEditor.tsx (Client Component)
const onSubmit = async (data: FormData) => {
  const res = await fetch('/api/wiki', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();

    if (error.details) {
      // Show Zod validation errors on form fields
      error.details.forEach((err: any) => {
        setError(err.path[0], { message: err.message });
      });
    } else {
      // Show generic error toast
      toast.error(error.error || 'Failed to save wiki page');
    }
    return;
  }

  // Success - redirect to new page
  const result = await res.json();
  router.push(`/wiki${result.data.path}`);
};
```

### Database Errors

**Duplicate Path (409 Conflict):**
```typescript
// Handled in POST /api/wiki
const existingPage = await prisma.wikiPage.findUnique({
  where: { path: data.path },
});

if (existingPage) {
  return NextResponse.json(
    { error: 'A wiki page with this path already exists' },
    { status: 409 }
  );
}
```

**Generic Database Errors (500):**
```typescript
// Handled in all API routes
catch (error) {
  console.error('Database error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

---

## Testing Recommendations

### Server-Side Data Fetching

**Test: Edit route fetches correct data**
```typescript
// Test in apps/web/app/wiki/[slug]/edit/page.test.tsx
it('should fetch wiki page data and render editor', async () => {
  const page = await getWikiPage('getting-started');

  expect(page).toMatchObject({
    title: 'Getting Started',
    content: expect.any(String),
    path: '/getting-started',
  });
});

it('should return null for non-existent slug', async () => {
  const page = await getWikiPage('non-existent');
  expect(page).toBeNull();
});
```

### Client-Side Interactions

**Test: Form submission**
```typescript
// Test in apps/web/components/wiki/WikiEditor.test.tsx
it('should submit form and create wiki page', async () => {
  render(<WikiEditor mode="create" />);

  // Fill form
  await userEvent.type(screen.getByLabelText('Title'), 'Test Page');
  await userEvent.type(screen.getByLabelText('Content'), '# Test Content');

  // Submit
  await userEvent.click(screen.getByRole('button', { name: /save/i }));

  // Verify API call
  expect(fetch).toHaveBeenCalledWith('/api/wiki', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Page',
      content: '# Test Content',
      path: '/test-page',
    }),
  });
});
```

### Error States

**Test: Validation errors**
```typescript
it('should show validation errors for empty title', async () => {
  render(<WikiEditor mode="create" />);

  // Submit without filling form
  await userEvent.click(screen.getByRole('button', { name: /save/i }));

  // Verify error message
  expect(screen.getByText(/title is required/i)).toBeInTheDocument();
});
```

**Test: 404 handling**
```typescript
it('should call notFound() for non-existent slug', async () => {
  const notFoundSpy = jest.spyOn(require('next/navigation'), 'notFound');

  render(<EditWikiPage params={{ slug: 'non-existent' }} />);

  expect(notFoundSpy).toHaveBeenCalled();
});
```

### Loading States

**Test: Loading UI**
```typescript
// Test in apps/web/app/wiki/[slug]/edit/loading.test.tsx
it('should render loading skeleton while fetching', () => {
  render(<Loading />);

  expect(screen.getByRole('status')).toBeInTheDocument();
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});
```

---

## Next Steps for Parent Agent

### Phase 1: Create Route Pages (1-2 hours)

1. **Create `/wiki/new/page.tsx`**
   - Server Component with metadata
   - Render WikiEditor with `mode="create"`
   - Match layout from existing wiki pages

2. **Create `/wiki/[slug]/edit/page.tsx`**
   - Server Component with ISR (`revalidate = 3600`)
   - Fetch wiki page data with Prisma
   - Pass data to WikiEditor with `mode="edit"`
   - Add 404 handling with `notFound()`
   - Add `generateMetadata()` for dynamic titles
   - Add `generateStaticParams()` for ISR pre-rendering

3. **Create `not-found.tsx` for edit route**
   - Custom 404 UI for non-existent slugs

### Phase 2: Create API Routes (2-3 hours)

4. **Create `POST /api/wiki`**
   - Zod validation schema
   - Check duplicate path (409)
   - Create wiki page with Prisma
   - Revalidate `/wiki` and `/wiki/[slug]` pages
   - Return 201 with new page data

5. **Add `PATCH /api/wiki/[slug]`**
   - Zod validation schema (partial updates)
   - Check page exists (404)
   - Update wiki page with Prisma
   - Increment version number
   - Revalidate list, detail, and edit pages
   - Return updated page data

6. **Create `POST /api/wiki/search`**
   - Zod validation schema
   - Prisma query with `contains` (basic search)
   - Generate excerpts with context
   - Return results + total count
   - Support pagination (limit/offset)
   - Support category filter

7. **Create `GET /api/wiki/validate-slug`**
   - Zod validation schema
   - Check slug uniqueness with Prisma
   - Return `available` boolean

### Phase 3: Create Zod Schemas (30 minutes)

8. **Create `lib/validations/wiki.ts`**
   - `CreateWikiPageSchema` (title, content, category, path)
   - `UpdateWikiPageSchema` (partial updates)
   - `WikiSearchSchema` (query, category, limit, offset)
   - `ValidateSlugSchema` (slug format validation)

### Phase 4: WikiEditor Integration (handled by React expert)

9. **WikiEditor Client Component**
   - TipTap integration
   - Form handling with react-hook-form
   - API calls to create/update endpoints
   - Async slug validation
   - Loading states and error handling

### Phase 5: Testing (1-2 hours)

10. **Test server-side data fetching**
    - Edit route fetches correct data
    - 404 handling for non-existent slugs

11. **Test API endpoints**
    - Create wiki page (POST /api/wiki)
    - Update wiki page (PATCH /api/wiki/[slug])
    - Search wiki pages (POST /api/wiki/search)
    - Validate slug (GET /api/wiki/validate-slug)

12. **Test error handling**
    - Validation errors (400)
    - Duplicate path (409)
    - Not found (404)
    - Server errors (500)

13. **Verify on Mac mini**
    - Test all routes at `http://192.168.1.15:3000/wiki/new`
    - Test edit route with existing slug
    - Test API endpoints with curl/Postman

---

## Summary

### Architecture Decisions

✅ **Hybrid rendering**: Server Components (pages) + Client Components (editor)
✅ **ISR caching**: 1-hour revalidation for wiki pages
✅ **Server-side data fetching**: Edit route fetches data in Server Component
✅ **API routes for mutations**: POST (create) + PATCH (update) + POST (search) + GET (validate)
✅ **Zod validation**: All API routes validate input
✅ **Cache revalidation**: `revalidatePath()` after mutations

### Key Patterns

✅ **Server Component → Client Component**: Data fetched server-side, passed as props
✅ **RESTful API**: POST /api/wiki (create), PATCH /api/wiki/[slug] (update)
✅ **Full-text search**: POST /api/wiki/search (basic search with `contains`)
✅ **Async validation**: GET /api/wiki/validate-slug (debounced)
✅ **Error handling**: 404 with `notFound()`, 400/409/500 from API routes

### Performance Optimizations

✅ **Code splitting**: TipTap loaded only on editor pages
✅ **Parallel fetching**: Search endpoint fetches results + count in parallel
✅ **Minimal database queries**: Select only required fields
✅ **ISR caching**: Reduces database load for frequently accessed pages

### Future Enhancements

⏳ **PostgreSQL tsvector**: Migrate to full-text search with stemming and ranking
⏳ **GIN index**: Add index on `searchVector` for faster search
⏳ **Related pages**: Fetch related pages in parallel on edit route
⏳ **Version history**: Show version history and diffs

---

**Parent agent should read this file and update `current-session.md` with key recommendations.**

**Key recommendations**: Use Server Components for page wrappers (new/edit routes) with ISR caching, Client Components only for WikiEditor. Fetch data server-side in edit route and pass to Client Component as props. Use POST /api/wiki for create, PATCH /api/wiki/[slug] for update, POST /api/wiki/search for full-text search (basic with `contains`, future: tsvector), and GET /api/wiki/validate-slug for async validation. Revalidate ISR cache with `revalidatePath()` after mutations.
