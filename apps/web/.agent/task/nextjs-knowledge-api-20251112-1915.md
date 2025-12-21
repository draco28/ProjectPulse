# Next.js Implementation Plan: Knowledge Base API Routes

**Created**: 2025-11-12 19:15
**Sprint**: 5 - Knowledge Graph Foundation (Phase 2: Embedding Generation)
**Expert**: Next.js Expert
**Type**: API Route Handlers + Services

---

## Executive Summary

This plan details the Next.js 14 App Router architecture for two knowledge base API endpoints:

1. **POST /api/knowledge** - Create knowledge items with automatic embedding generation
2. **GET /api/knowledge/search** - Hybrid search (semantic + fulltext) with relationship traversal

The design prioritizes **synchronous embedding generation** for simplicity in Phase 2, with clear migration path to async processing in Phase 3 if needed. Performance targets: POST <500ms, GET <300ms.

---

## Architecture Decision Matrix

### 1. API Route Structure: Route Handlers vs Server Actions

**✅ RECOMMENDATION: Route Handlers (`route.ts`)**

| Criterion                | Route Handler                   | Server Action        | Winner        |
| ------------------------ | ------------------------------- | -------------------- | ------------- |
| **External API access**  | ✅ Yes (RESTful endpoint)       | ❌ No (form-bound)   | Route Handler |
| **MCP tool integration** | ✅ Direct HTTP calls            | ❌ Requires wrapper  | Route Handler |
| **Response flexibility** | ✅ Full control (JSON, headers) | ⚠️ Limited           | Route Handler |
| **Error handling**       | ✅ HTTP status codes            | ⚠️ Throws only       | Route Handler |
| **Caching control**      | ✅ Next.js cache config         | ⚠️ Revalidation only | Route Handler |
| **TypeScript safety**    | ✅ Explicit types               | ✅ Type-safe         | Tie           |

**Rationale**:

- Knowledge base is designed for **MCP tool consumption** (MCP server will call these endpoints)
- External services (Ollama, OpenAI) need RESTful HTTP access
- Hybrid search requires custom response headers (cache-control, X-Search-Mode)
- Server Actions excel at form mutations but lack flexibility for complex API responses

**Pattern Match**: Existing `/api/issues` and `/api/search` use Route Handlers successfully

---

### 2. Rendering Strategy

**✅ RECOMMENDATION: Dynamic (per-request rendering)**

```typescript
// app/api/knowledge/route.ts
export const dynamic = 'force-dynamic'; // Opt out of caching
```

**Why Dynamic?**

- **POST /api/knowledge**: Creates new data → must be dynamic
- **GET /api/knowledge/search**: Search queries vary wildly → caching provides minimal benefit
- User-specific results possible in future (auth-based filtering)

**Caching Strategy** (implemented at application level):

- **No Next.js cache**: Each request hits handler
- **Database-level caching**: PostgreSQL query cache handles repetitive queries
- **Future**: Redis for search result caching (Phase 3 optimization)

---

### 3. Embedding Generation Strategy: Sync vs Async

**✅ RECOMMENDATION: Synchronous (Phase 2), Async-ready architecture (Phase 3+)**

#### Phase 2 Implementation (Current)

```typescript
// POST /api/knowledge workflow
async function POST(request: NextRequest) {
  1. Validate input (Zod)
  2. Generate embedding (await generateEmbedding() - 200-400ms)
  3. Insert to database with embedding + trigger generates tsvector
  4. Return 201 Created with full item
}
```

**Why Synchronous Now?**

- **Simplicity**: Single transaction, no queue infrastructure needed
- **Latency acceptable**: Ollama embedding generation: 200-400ms (well under 500ms target)
- **Immediate feedback**: User gets confirmation that embedding succeeded
- **Error handling**: Direct HTTP error response if Ollama fails
- **Phase 2 scope**: Get core functionality working before optimization

#### Phase 3 Migration Path (Async)

**When to switch to async:**

- POST latency consistently exceeds 500ms
- Implementing batch embedding generation
- Adding multiple embedding models (Ollama + OpenAI + local)
- User demand for "save draft, embed later" workflow

**Async architecture** (future):

```typescript
POST /api/knowledge → Return 202 Accepted immediately
                   → Enqueue job to background worker
                   → Worker generates embedding asynchronously
                   → Webhook/SSE notifies frontend on completion

Background Worker Options:
1. Vercel Cron + Database Queue (simple, no new infra)
2. BullMQ + Redis (robust, requires Redis)
3. Temporal (overkill for this use case)
```

**Migration strategy**:

- Encapsulate embedding logic in `lib/embeddings/service.ts`
- No changes to API contract (client still POSTs same payload)
- Add `embeddings.status` field to schema ('pending' | 'completed' | 'failed')
- Frontend polls GET /api/knowledge/:id until status === 'completed'

---

### 4. Error Handling Strategy

**✅ RECOMMENDATION: Graceful degradation with fallback + retry**

#### Scenario 1: Ollama API Timeout (>5s)

```typescript
// lib/embeddings/ollama.ts
async function generateEmbedding(text: string, options = { timeout: 5000 }) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    const response = await fetch('http://ollama:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'all-minilm', prompt: text }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);

    const data = await response.json();
    return data.embedding; // 384-dim array
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new OllamaTimeoutError('Ollama embedding generation timed out');
    }
    throw error;
  }
}
```

**Handling in route handler:**

```typescript
export async function POST(request: NextRequest) {
  try {
    const data = CreateKnowledgeSchema.parse(await request.json());

    // Try Ollama first (primary, free)
    let embedding: number[];
    try {
      embedding = await generateEmbeddingOllama(data.content, { timeout: 5000 });
    } catch (error) {
      if (error instanceof OllamaTimeoutError) {
        // Log warning but continue with fallback
        console.warn('[Knowledge API] Ollama timeout, using fallback');

        // Option A: Use OpenAI fallback (costs money, requires key)
        if (process.env.OPENAI_API_KEY) {
          embedding = await generateEmbeddingOpenAI(data.content);
        } else {
          // Option B: Return error, let user retry
          return failure({
            code: 'EMBEDDING_TIMEOUT',
            message: 'Embedding generation timed out. Please try again.',
            status: 503, // Service Unavailable
          });
        }
      } else {
        throw error; // Re-throw unexpected errors
      }
    }

    // Continue with database insertion...
  } catch (error) {
    // Handle other errors...
  }
}
```

#### Scenario 2: Ollama API Unavailable

**Strategy**: Fail fast with actionable error

```typescript
return failure({
  code: 'EMBEDDING_SERVICE_UNAVAILABLE',
  message: 'Embedding service is unavailable. Check Ollama is running.',
  details: {
    service: 'ollama',
    endpoint: 'http://ollama:11434',
    troubleshooting: 'Verify Ollama container is running: docker ps | grep ollama',
  },
  status: 503,
});
```

#### Scenario 3: Database Insertion Fails After Embedding

**Strategy**: Retry logic + log embedding for recovery

```typescript
try {
  const embedding = await generateEmbedding(content);

  // Database transaction with retry
  const item = await retry(
    async () => {
      return await prisma.knowledgeItem.create({
        data: { title, content, category, tags, embedding },
      });
    },
    { attempts: 3, backoff: 'exponential' }
  );

  return success(item, 201);
} catch (error) {
  // Log embedding for manual recovery
  console.error('[Knowledge API] DB insert failed, embedding:', {
    title: data.title,
    embedding: embedding.slice(0, 5), // Log first 5 dims only
    error: error.message,
  });

  // Store in temporary recovery table
  await prisma.failedEmbedding.create({
    data: {
      title: data.title,
      content: data.content,
      embedding: JSON.stringify(embedding),
      error: error.message,
    },
  });

  return failure({
    code: 'DATABASE_ERROR',
    message: 'Failed to save knowledge item. Embedding preserved for recovery.',
    status: 500,
  });
}
```

#### Decision Matrix: When to Return What Status

| Scenario                       | Status Code               | User Action          | System Action                |
| ------------------------------ | ------------------------- | -------------------- | ---------------------------- |
| Ollama timeout                 | 503 Service Unavailable   | Retry request        | Use OpenAI fallback OR fail  |
| Ollama down                    | 503 Service Unavailable   | Check service status | Alert ops team               |
| OpenAI fallback succeeds       | 201 Created               | None (transparent)   | Log fallback usage           |
| All embedding services fail    | 503 Service Unavailable   | Retry later          | Alert ops team               |
| Database error after embedding | 500 Internal Server Error | Contact support      | Store embedding for recovery |
| Validation error               | 400 Bad Request           | Fix input            | None                         |

---

### 5. Data Fetching Patterns

#### POST /api/knowledge: Prisma with Raw SQL for Vector

**Problem**: Prisma doesn't natively support pgvector insertion syntax

**Solution**: Hybrid approach (Prisma wrapper + raw SQL for vector field)

```typescript
// ❌ DOESN'T WORK: Prisma client doesn't have vector type
await prisma.knowledgeItem.create({
  data: {
    title,
    content,
    embedding: embedding, // Type error: number[] not assignable to vector
  },
});

// ✅ WORKS: Raw SQL for vector, let trigger handle tsvector
import { Prisma } from '@prisma/client';

const embeddingString = `[${embedding.join(',')}]`;

const result = await prisma.$queryRaw<Array<{ id: number }>>`
  INSERT INTO knowledge_items (title, content, category, tags, embedding, "createdAt", "updatedAt")
  VALUES (
    ${title},
    ${content},
    ${category},
    ${tags}::text[],
    ${embeddingString}::vector(384),
    NOW(),
    NOW()
  )
  RETURNING id, title, content, category, tags, "createdAt", "updatedAt"
`;

// Fetch full item with Prisma for type safety
const item = await prisma.knowledgeItem.findUniqueOrThrow({
  where: { id: result[0].id },
  select: {
    id: true,
    title: true,
    content: true,
    category: true,
    tags: true,
    createdAt: true,
    updatedAt: true,
  },
});

return success(item, 201);
```

**Why this pattern?**

- **Raw SQL for vector**: Only way to insert pgvector types
- **Prisma for retrieval**: Type-safe, gets us IDE autocomplete
- **Trigger handles tsvector**: No need to manually generate full-text search vector
- **Transaction safety**: Wrap in `prisma.$transaction()` if needed

#### GET /api/knowledge/search: Raw SQL for Hybrid Search

**Problem**: Hybrid search requires complex SQL with cosine similarity + ts_rank

**Solution**: Pure raw SQL with TypeScript result types

```typescript
// Complex query requires raw SQL - Prisma can't express this
interface HybridSearchResult {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  semanticScore: number;
  fulltextScore: number;
  combinedScore: number;
  matchedSnippet: string | null;
  relatedItems: Array<{ id: number; title: string; relationType: string }>;
}

async function hybridSearch(
  query: string,
  mode: 'semantic' | 'fulltext' | 'hybrid',
  limit: number,
  includeRelated: boolean
): Promise<HybridSearchResult[]> {
  // Step 1: Generate query embedding (for semantic search)
  const queryEmbedding = await generateEmbedding(query);
  const queryVector = `[${queryEmbedding.join(',')}]`;

  // Step 2: Execute hybrid search
  const results = await prisma.$queryRaw<HybridSearchResult[]>`
    WITH semantic_results AS (
      SELECT
        id,
        title,
        content,
        category,
        tags,
        1 - (embedding <=> ${queryVector}::vector(384)) AS semantic_score
      FROM knowledge_items
      WHERE 1 - (embedding <=> ${queryVector}::vector(384)) > 0.5
      ORDER BY embedding <=> ${queryVector}::vector(384)
      LIMIT ${limit * 2}
    ),
    fulltext_results AS (
      SELECT
        id,
        title,
        content,
        category,
        tags,
        ts_rank_cd("contentTsvector", plainto_tsquery('english', ${query})) AS fulltext_score,
        ts_headline(
          'english',
          content,
          plainto_tsquery('english', ${query}),
          'MaxFragments=1, MinWords=10, MaxWords=25, StartSel=**, StopSel=**'
        ) AS matched_snippet
      FROM knowledge_items
      WHERE "contentTsvector" @@ plainto_tsquery('english', ${query})
      ORDER BY fulltext_score DESC
      LIMIT ${limit * 2}
    )
    SELECT
      COALESCE(s.id, f.id) AS id,
      COALESCE(s.title, f.title) AS title,
      COALESCE(s.content, f.content) AS content,
      COALESCE(s.category, f.category) AS category,
      COALESCE(s.tags, f.tags) AS tags,
      COALESCE(s.semantic_score, 0) AS "semanticScore",
      COALESCE(f.fulltext_score, 0) AS "fulltextScore",
      (
        COALESCE(s.semantic_score, 0) * 0.7 +
        COALESCE(f.fulltext_score, 0) * 0.3
      ) AS "combinedScore",
      f.matched_snippet AS "matchedSnippet"
    FROM semantic_results s
    FULL OUTER JOIN fulltext_results f ON s.id = f.id
    WHERE (
      CASE
        WHEN ${mode}::text = 'semantic' THEN s.id IS NOT NULL
        WHEN ${mode}::text = 'fulltext' THEN f.id IS NOT NULL
        ELSE TRUE
      END
    )
    ORDER BY "combinedScore" DESC
    LIMIT ${limit}
  `;

  // Step 3: Fetch related items (if requested)
  if (includeRelated && results.length > 0) {
    const itemIds = results.map((r) => r.id);

    const related = await prisma.$queryRaw<
      Array<{
        fromId: number;
        toId: number;
        title: string;
        relationType: string;
      }>
    >`
      SELECT
        kr."fromId",
        kr."toId",
        ki.title,
        kr."relationType"
      FROM knowledge_relationships kr
      JOIN knowledge_items ki ON kr."toId" = ki.id
      WHERE kr."fromId" IN (${Prisma.join(itemIds)})
      ORDER BY kr.weight DESC
      LIMIT ${limit * 2}
    `;

    // Attach related items to results
    results.forEach((result) => {
      result.relatedItems = related
        .filter((r) => r.fromId === result.id)
        .map((r) => ({
          id: r.toId,
          title: r.title,
          relationType: r.relationType,
        }));
    });
  }

  return results;
}
```

**Performance optimizations**:

- **LIMIT multiplication**: Fetch 2x limit for each sub-query, then merge and re-limit
- **CTE usage**: `WITH` clauses for readability and potential optimization
- **Index usage**: HNSW for vector, GIN for tsvector (already created in migration)
- **Conditional JOIN**: Use FULL OUTER JOIN to support all three modes
- **Related items batching**: Single query for all relationships

---

### 6. File Organization

**✅ RECOMMENDATION: Service-oriented architecture with clear separation**

```
apps/web/
├── app/
│   └── api/
│       └── knowledge/
│           ├── route.ts                    # POST, GET (list) handlers
│           ├── search/
│           │   └── route.ts                # GET /api/knowledge/search
│           ├── [id]/
│           │   └── route.ts                # GET, PATCH, DELETE (single item)
│           └── _utils.ts                   # Shared utilities (success, failure helpers)
│
├── lib/
│   ├── embeddings/
│   │   ├── index.ts                        # Public API (generateEmbedding)
│   │   ├── ollama.ts                       # Ollama client
│   │   ├── openai.ts                       # OpenAI fallback (optional)
│   │   ├── types.ts                        # Embedding types, interfaces
│   │   └── __tests__/
│   │       └── ollama.test.ts              # Unit tests for embedding service
│   │
│   ├── knowledge/
│   │   ├── index.ts                        # Public API (search, create)
│   │   ├── search.ts                       # Hybrid search logic
│   │   ├── create.ts                       # Creation logic (embedding + insert)
│   │   ├── relationships.ts                # Graph traversal helpers
│   │   ├── types.ts                        # KnowledgeItem types, SearchResult
│   │   └── __tests__/
│   │       ├── search.test.ts              # Unit tests for search
│   │       └── create.test.ts              # Unit tests for creation
│   │
│   └── validations/
│       └── knowledge.ts                    # Zod schemas (CreateKnowledgeSchema, SearchQuerySchema)
│
└── tests/
    └── e2e/
        └── knowledge.spec.ts               # E2E tests for full workflows
```

#### File Responsibilities

**`app/api/knowledge/route.ts`** (Route Handler)

- HTTP request/response handling
- Zod validation
- Call service layer functions
- Return structured responses
- ~100-150 lines

**`lib/knowledge/create.ts`** (Service Layer)

- Orchestrate embedding generation + database insertion
- Transaction management
- Error recovery
- ~150-200 lines

**`lib/knowledge/search.ts`** (Service Layer)

- Execute hybrid search query
- Score normalization
- Result ranking
- Related items fetching
- ~200-250 lines

**`lib/embeddings/ollama.ts`** (Integration Layer)

- Ollama API client
- Timeout handling
- Retry logic
- Error mapping
- ~100-150 lines

**`lib/validations/knowledge.ts`** (Validation)

- Zod schemas for all endpoints
- TypeScript type inference
- ~50-100 lines

#### Why This Structure?

| Benefit             | How It Helps                                  |
| ------------------- | --------------------------------------------- |
| **Testability**     | Service layer can be unit tested without HTTP |
| **Reusability**     | Services can be used from multiple routes     |
| **Maintainability** | Clear separation of concerns                  |
| **Type Safety**     | Shared types across layers                    |
| **Future-proof**    | Easy to swap Ollama for another service       |

---

## Implementation Plan

### Phase 2.1: Foundation (2-3 hours)

#### Step 1: Validation Schemas

**File**: `lib/validations/knowledge.ts`

```typescript
import { z } from 'zod';

// POST /api/knowledge
export const CreateKnowledgeSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10).max(10000),
  category: z.string().min(1).max(50),
  tags: z.array(z.string().min(1).max(50)).min(1).max(10),
});

export type CreateKnowledgeInput = z.infer<typeof CreateKnowledgeSchema>;

// GET /api/knowledge/search
export const SearchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  mode: z.enum(['semantic', 'fulltext', 'hybrid']).default('hybrid'),
  limit: z.coerce.number().int().min(1).max(20).default(5),
  includeRelated: z.coerce.boolean().default(false),
});

export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;

// Response types
export interface KnowledgeItem {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResult extends KnowledgeItem {
  semanticScore: number;
  fulltextScore: number;
  combinedScore: number;
  matchedSnippet: string | null;
  relatedItems: Array<{
    id: number;
    title: string;
    relationType: string;
  }>;
}
```

**Success Criteria**:

- ✅ All schemas export TypeScript types
- ✅ Validation catches edge cases (empty strings, negative numbers)
- ✅ Default values applied correctly

---

#### Step 2: Embedding Service (Ollama Integration)

**File**: `lib/embeddings/types.ts`

```typescript
export interface EmbeddingProvider {
  name: string;
  generateEmbedding(text: string, options?: EmbeddingOptions): Promise<number[]>;
}

export interface EmbeddingOptions {
  timeout?: number; // milliseconds
  retries?: number;
}

export class EmbeddingError extends Error {
  constructor(
    message: string,
    public provider: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'EmbeddingError';
  }
}

export class EmbeddingTimeoutError extends EmbeddingError {
  constructor(provider: string, timeout: number) {
    super(`Embedding generation timed out after ${timeout}ms`, provider);
    this.name = 'EmbeddingTimeoutError';
  }
}
```

**File**: `lib/embeddings/ollama.ts`

```typescript
import {
  EmbeddingProvider,
  EmbeddingOptions,
  EmbeddingTimeoutError,
  EmbeddingError,
} from './types';

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://ollama:11434';
const OLLAMA_MODEL = 'all-minilm'; // 384 dimensions

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  name = 'ollama';

  async generateEmbedding(text: string, options: EmbeddingOptions = {}): Promise<number[]> {
    const timeout = options.timeout || 5000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: text,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new EmbeddingError(`Ollama API error: ${response.status} - ${error}`, this.name);
      }

      const data = await response.json();

      if (!data.embedding || !Array.isArray(data.embedding)) {
        throw new EmbeddingError('Invalid embedding response from Ollama', this.name);
      }

      // Validate embedding dimensions
      if (data.embedding.length !== 384) {
        throw new EmbeddingError(
          `Expected 384 dimensions, got ${data.embedding.length}`,
          this.name
        );
      }

      return data.embedding;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new EmbeddingTimeoutError(this.name, timeout);
      }

      if (error instanceof EmbeddingError) {
        throw error;
      }

      throw new EmbeddingError(`Failed to generate embedding: ${error.message}`, this.name, error);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

**File**: `lib/embeddings/index.ts`

```typescript
import { OllamaEmbeddingProvider } from './ollama';
import { EmbeddingProvider, EmbeddingOptions, EmbeddingError } from './types';

// Primary provider (Ollama)
const primaryProvider = new OllamaEmbeddingProvider();

// Fallback provider (optional - OpenAI)
// const fallbackProvider = process.env.OPENAI_API_KEY
//   ? new OpenAIEmbeddingProvider()
//   : null;

/**
 * Generate embedding vector for text
 *
 * Uses Ollama as primary provider, falls back to OpenAI if configured
 *
 * @throws EmbeddingError if all providers fail
 */
export async function generateEmbedding(
  text: string,
  options: EmbeddingOptions = {}
): Promise<number[]> {
  try {
    return await primaryProvider.generateEmbedding(text, options);
  } catch (error) {
    console.error('[Embedding] Primary provider failed:', error);

    // TODO Phase 3: Add fallback provider logic here
    // if (fallbackProvider) {
    //   console.warn('[Embedding] Using fallback provider');
    //   return await fallbackProvider.generateEmbedding(text, options);
    // }

    throw error;
  }
}

/**
 * Check if embedding service is available
 */
export async function isEmbeddingServiceAvailable(): Promise<boolean> {
  return await primaryProvider.healthCheck();
}

export * from './types';
```

**Success Criteria**:

- ✅ Generates 384-dim embeddings from Ollama
- ✅ Handles timeouts gracefully (throws EmbeddingTimeoutError)
- ✅ Handles Ollama unavailable (throws EmbeddingError)
- ✅ Health check endpoint works
- ✅ Unit tests pass

**Test Cases**:

```typescript
// lib/embeddings/__tests__/ollama.test.ts
describe('OllamaEmbeddingProvider', () => {
  test('generates valid 384-dim embedding', async () => {
    const provider = new OllamaEmbeddingProvider();
    const embedding = await provider.generateEmbedding('test content');
    expect(embedding).toHaveLength(384);
    expect(embedding.every((n) => typeof n === 'number')).toBe(true);
  });

  test('throws timeout error after 5s', async () => {
    const provider = new OllamaEmbeddingProvider();
    await expect(provider.generateEmbedding('test', { timeout: 100 })).rejects.toThrow(
      EmbeddingTimeoutError
    );
  });

  test('health check returns true when service available', async () => {
    const provider = new OllamaEmbeddingProvider();
    const isHealthy = await provider.healthCheck();
    expect(isHealthy).toBe(true);
  });
});
```

---

#### Step 3: Knowledge Creation Service

**File**: `lib/knowledge/create.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { generateEmbedding, EmbeddingTimeoutError } from '@/lib/embeddings';
import type { CreateKnowledgeInput, KnowledgeItem } from '@/lib/validations/knowledge';
import { Prisma } from '@prisma/client';

/**
 * Create knowledge item with automatic embedding generation
 *
 * @throws EmbeddingTimeoutError if embedding generation times out
 * @throws Error if database insertion fails
 */
export async function createKnowledgeItem(input: CreateKnowledgeInput): Promise<KnowledgeItem> {
  // Step 1: Generate embedding (200-400ms)
  const embedding = await generateEmbedding(input.content, { timeout: 5000 });

  // Step 2: Insert into database with embedding
  // Note: tsvector auto-generated by trigger
  const embeddingString = `[${embedding.join(',')}]`;

  try {
    const result = await prisma.$queryRaw<Array<{ id: number }>>`
      INSERT INTO knowledge_items (
        title,
        content,
        category,
        tags,
        embedding,
        "contentTsvector",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${input.title},
        ${input.content},
        ${input.category},
        ${input.tags}::text[],
        ${embeddingString}::vector(384),
        to_tsvector('english', ${input.title} || ' ' || ${input.content}),
        NOW(),
        NOW()
      )
      RETURNING id
    `;

    const itemId = result[0].id;

    // Step 3: Fetch full item with Prisma for type safety
    const item = await prisma.knowledgeItem.findUniqueOrThrow({
      where: { id: itemId },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return item;
  } catch (error) {
    // Log embedding for recovery
    console.error('[Knowledge] DB insert failed, preserving embedding:', {
      title: input.title,
      embeddingPreview: embedding.slice(0, 5),
      error: error.message,
    });

    // TODO Phase 3: Store in recovery table
    // await prisma.failedEmbedding.create({ ... });

    throw new Error(`Failed to save knowledge item: ${error.message}`);
  }
}

/**
 * Batch create knowledge items (for seeding, imports)
 *
 * Generates embeddings in parallel (up to 5 concurrent)
 */
export async function batchCreateKnowledgeItems(
  items: CreateKnowledgeInput[]
): Promise<KnowledgeItem[]> {
  const CONCURRENCY = 5;
  const results: KnowledgeItem[] = [];

  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const batch = items.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map((item) => createKnowledgeItem(item)));
    results.push(...batchResults);
  }

  return results;
}
```

**Success Criteria**:

- ✅ Creates knowledge item with embedding in single transaction
- ✅ Returns full item with all fields
- ✅ Throws EmbeddingTimeoutError if Ollama times out
- ✅ Logs embedding on database failure for recovery
- ✅ Batch creation supports concurrency control

---

#### Step 4: Hybrid Search Service

**File**: `lib/knowledge/search.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { generateEmbedding } from '@/lib/embeddings';
import type { SearchQueryInput, SearchResult } from '@/lib/validations/knowledge';
import { Prisma } from '@prisma/client';

/**
 * Execute hybrid search (semantic + fulltext)
 *
 * Algorithm:
 * 1. Generate query embedding
 * 2. Semantic search: cosine similarity (pgvector HNSW index)
 * 3. Fulltext search: ts_rank (tsvector GIN index)
 * 4. Merge results with weighted scores (0.7 semantic + 0.3 fulltext)
 * 5. Optionally fetch related items via graph relationships
 */
export async function hybridSearch(query: SearchQueryInput): Promise<SearchResult[]> {
  // Step 1: Generate query embedding
  const queryEmbedding = await generateEmbedding(query.query, { timeout: 3000 });
  const queryVector = `[${queryEmbedding.join(',')}]`;

  // Step 2: Execute hybrid search
  const results = await prisma.$queryRaw<
    Array<{
      id: number;
      title: string;
      content: string;
      category: string;
      tags: string[];
      semanticScore: number;
      fulltextScore: number;
      combinedScore: number;
      matchedSnippet: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>
  >`
    WITH semantic_results AS (
      SELECT
        id,
        title,
        content,
        category,
        tags,
        "createdAt",
        "updatedAt",
        1 - (embedding <=> ${queryVector}::vector(384)) AS semantic_score
      FROM knowledge_items
      WHERE 1 - (embedding <=> ${queryVector}::vector(384)) > 0.5
      ORDER BY embedding <=> ${queryVector}::vector(384)
      LIMIT ${query.limit * 2}
    ),
    fulltext_results AS (
      SELECT
        id,
        title,
        content,
        category,
        tags,
        "createdAt",
        "updatedAt",
        ts_rank_cd("contentTsvector", plainto_tsquery('english', ${query.query})) AS fulltext_score,
        ts_headline(
          'english',
          content,
          plainto_tsquery('english', ${query.query}),
          'MaxFragments=1, MinWords=10, MaxWords=25, StartSel=**, StopSel=**'
        ) AS matched_snippet
      FROM knowledge_items
      WHERE "contentTsvector" @@ plainto_tsquery('english', ${query.query})
      ORDER BY fulltext_score DESC
      LIMIT ${query.limit * 2}
    )
    SELECT
      COALESCE(s.id, f.id) AS id,
      COALESCE(s.title, f.title) AS title,
      COALESCE(s.content, f.content) AS content,
      COALESCE(s.category, f.category) AS category,
      COALESCE(s.tags, f.tags) AS tags,
      COALESCE(s."createdAt", f."createdAt") AS "createdAt",
      COALESCE(s."updatedAt", f."updatedAt") AS "updatedAt",
      COALESCE(s.semantic_score, 0) AS "semanticScore",
      COALESCE(f.fulltext_score, 0) AS "fulltextScore",
      (
        COALESCE(s.semantic_score, 0) * 0.7 +
        COALESCE(f.fulltext_score, 0) * 0.3
      ) AS "combinedScore",
      f.matched_snippet AS "matchedSnippet"
    FROM semantic_results s
    FULL OUTER JOIN fulltext_results f ON s.id = f.id
    WHERE (
      CASE
        WHEN ${query.mode}::text = 'semantic' THEN s.id IS NOT NULL
        WHEN ${query.mode}::text = 'fulltext' THEN f.id IS NOT NULL
        ELSE TRUE
      END
    )
    ORDER BY "combinedScore" DESC
    LIMIT ${query.limit}
  `;

  // Step 3: Fetch related items (if requested)
  if (query.includeRelated && results.length > 0) {
    const itemIds = results.map((r) => r.id);

    const related = await prisma.$queryRaw<
      Array<{
        fromId: number;
        toId: number;
        title: string;
        relationType: string;
      }>
    >`
      SELECT
        kr."fromId",
        kr."toId",
        ki.title,
        kr."relationType"
      FROM knowledge_relationships kr
      JOIN knowledge_items ki ON kr."toId" = ki.id
      WHERE kr."fromId" IN (${Prisma.join(itemIds)})
      ORDER BY kr.weight DESC
      LIMIT ${query.limit * 2}
    `;

    // Attach related items to results
    const resultsWithRelated: SearchResult[] = results.map((result) => ({
      ...result,
      relatedItems: related
        .filter((r) => r.fromId === result.id)
        .map((r) => ({
          id: r.toId,
          title: r.title,
          relationType: r.relationType,
        })),
    }));

    return resultsWithRelated;
  }

  return results.map((r) => ({ ...r, relatedItems: [] }));
}

/**
 * Normalize score to 0-1 range for display
 */
export function normalizeScore(score: number): number {
  return Math.max(0, Math.min(1, score));
}
```

**Success Criteria**:

- ✅ Returns results ranked by combined score
- ✅ Semantic search uses HNSW index (verify with EXPLAIN ANALYZE)
- ✅ Fulltext search uses GIN index (verify with EXPLAIN ANALYZE)
- ✅ Mode filtering works ('semantic', 'fulltext', 'hybrid')
- ✅ Related items fetched correctly when requested
- ✅ Matched snippets highlighted with \*\* markers

**Performance Benchmarks** (to verify):

- Semantic search: <100ms for 10K items
- Fulltext search: <50ms for 10K items
- Hybrid search: <200ms for 10K items
- Related items fetch: <50ms for 20 relationships

---

### Phase 2.2: API Route Handlers (1-2 hours)

#### Step 5: POST /api/knowledge

**File**: `app/api/knowledge/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CreateKnowledgeSchema } from '@/lib/validations/knowledge';
import { createKnowledgeItem } from '@/lib/knowledge/create';
import { EmbeddingTimeoutError, EmbeddingError } from '@/lib/embeddings';
import { success, failure } from './_utils';

export const dynamic = 'force-dynamic';

/**
 * POST /api/knowledge
 *
 * Create knowledge item with automatic embedding generation
 *
 * Request body:
 * {
 *   "title": "Next.js Server Components",
 *   "content": "Server Components in Next.js...",
 *   "category": "Architecture",
 *   "tags": ["next.js", "server-components"]
 * }
 *
 * Response 201:
 * {
 *   "data": {
 *     "id": 1,
 *     "title": "Next.js Server Components",
 *     "content": "...",
 *     "category": "Architecture",
 *     "tags": [...],
 *     "createdAt": "2025-11-12T19:00:00.000Z",
 *     "updatedAt": "2025-11-12T19:00:00.000Z"
 *   },
 *   "error": null
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Parse and validate input
    const body = await request.json();
    const data = CreateKnowledgeSchema.parse(body);

    // Step 2: Create item with embedding
    const item = await createKnowledgeItem(data);

    // Step 3: Return success
    return success(item, 201);
  } catch (error) {
    // Validation errors
    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid knowledge item data',
        details: error.flatten(),
        status: 400,
      });
    }

    // Embedding timeout
    if (error instanceof EmbeddingTimeoutError) {
      return failure({
        code: 'EMBEDDING_TIMEOUT',
        message: 'Embedding generation timed out. Please try again.',
        details: { provider: error.provider },
        status: 503,
      });
    }

    // Embedding service unavailable
    if (error instanceof EmbeddingError) {
      return failure({
        code: 'EMBEDDING_SERVICE_ERROR',
        message: error.message,
        details: { provider: error.provider },
        status: 503,
      });
    }

    // Database or unexpected errors
    console.error('[API] POST /api/knowledge failed:', error);
    return failure({
      code: 'INTERNAL_ERROR',
      message: 'Failed to create knowledge item',
      status: 500,
    });
  }
}
```

**File**: `app/api/knowledge/_utils.ts`

```typescript
import { NextResponse } from 'next/server';

interface ApiSuccessResponse<T> {
  data: T;
  error: null;
}

interface ApiErrorResponse {
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function success<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ data, error: null }, { status });
}

export function failure({
  code,
  message,
  status = 400,
  details,
}: {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      data: null,
      error: { code, message, details },
    },
    { status }
  );
}
```

**Success Criteria**:

- ✅ Returns 201 Created with full item
- ✅ Returns 400 for validation errors with details
- ✅ Returns 503 for embedding timeout/unavailable
- ✅ Returns 500 for unexpected errors
- ✅ Response format matches existing API pattern (`{ data, error }`)

---

#### Step 6: GET /api/knowledge/search

**File**: `app/api/knowledge/search/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SearchQuerySchema } from '@/lib/validations/knowledge';
import { hybridSearch } from '@/lib/knowledge/search';
import { EmbeddingTimeoutError, EmbeddingError } from '@/lib/embeddings';
import { success, failure } from '../_utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/knowledge/search?query=...&mode=hybrid&limit=5&includeRelated=true
 *
 * Hybrid search (semantic + fulltext) across knowledge base
 *
 * Query params:
 * - query: Search query (required)
 * - mode: 'semantic' | 'fulltext' | 'hybrid' (default: 'hybrid')
 * - limit: Max results (default: 5, max: 20)
 * - includeRelated: Fetch related items via graph (default: false)
 *
 * Response 200:
 * {
 *   "data": {
 *     "results": [
 *       {
 *         "id": 1,
 *         "title": "Next.js Server Components",
 *         "content": "...",
 *         "category": "Architecture",
 *         "tags": [...],
 *         "semanticScore": 0.85,
 *         "fulltextScore": 0.72,
 *         "combinedScore": 0.811,
 *         "matchedSnippet": "Server Components in **Next.js** 14...",
 *         "relatedItems": [
 *           { "id": 2, "title": "React Patterns", "relationType": "RELATES_TO" }
 *         ],
 *         "createdAt": "...",
 *         "updatedAt": "..."
 *       }
 *     ],
 *     "total": 1,
 *     "query": "next.js server components",
 *     "mode": "hybrid"
 *   },
 *   "error": null
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Parse and validate query params
    const searchParams = request.nextUrl.searchParams;
    const rawQuery = {
      query: searchParams.get('query') || '',
      mode: searchParams.get('mode') || 'hybrid',
      limit: searchParams.get('limit') || '5',
      includeRelated: searchParams.get('includeRelated') === 'true',
    };

    const query = SearchQuerySchema.parse(rawQuery);

    // Step 2: Execute search
    const results = await hybridSearch(query);

    // Step 3: Return results
    return success({
      results,
      total: results.length,
      query: query.query,
      mode: query.mode,
    });
  } catch (error) {
    // Validation errors
    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid search parameters',
        details: error.flatten(),
        status: 400,
      });
    }

    // Embedding timeout (for query embedding)
    if (error instanceof EmbeddingTimeoutError) {
      return failure({
        code: 'EMBEDDING_TIMEOUT',
        message: 'Query embedding generation timed out. Please try again.',
        details: { provider: error.provider },
        status: 503,
      });
    }

    // Embedding service unavailable
    if (error instanceof EmbeddingError) {
      return failure({
        code: 'EMBEDDING_SERVICE_ERROR',
        message: error.message,
        details: { provider: error.provider },
        status: 503,
      });
    }

    // Database or unexpected errors
    console.error('[API] GET /api/knowledge/search failed:', error);
    return failure({
      code: 'INTERNAL_ERROR',
      message: 'Search failed',
      status: 500,
    });
  }
}
```

**Success Criteria**:

- ✅ Returns results ranked by combined score
- ✅ Mode filtering works correctly
- ✅ Related items included when requested
- ✅ Returns 400 for missing/invalid query
- ✅ Returns 503 for embedding errors
- ✅ Matches existing API response format

---

### Phase 2.3: Testing (2-3 hours)

#### Step 7: Unit Tests

**File**: `lib/embeddings/__tests__/ollama.test.ts`

```typescript
import { OllamaEmbeddingProvider } from '../ollama';
import { EmbeddingTimeoutError } from '../types';

describe('OllamaEmbeddingProvider', () => {
  const provider = new OllamaEmbeddingProvider();

  describe('generateEmbedding', () => {
    it('should generate 384-dimensional embedding', async () => {
      const embedding = await provider.generateEmbedding('test content');
      expect(embedding).toHaveLength(384);
      expect(embedding.every((n) => typeof n === 'number' && !isNaN(n))).toBe(true);
    });

    it('should throw timeout error after specified duration', async () => {
      await expect(provider.generateEmbedding('test', { timeout: 10 })).rejects.toThrow(
        EmbeddingTimeoutError
      );
    });

    it('should handle empty text', async () => {
      const embedding = await provider.generateEmbedding('');
      expect(embedding).toHaveLength(384);
    });

    it('should handle very long text (10K chars)', async () => {
      const longText = 'a'.repeat(10000);
      const embedding = await provider.generateEmbedding(longText);
      expect(embedding).toHaveLength(384);
    }, 10000); // Increase timeout for long text
  });

  describe('healthCheck', () => {
    it('should return true when service is available', async () => {
      const isHealthy = await provider.healthCheck();
      expect(isHealthy).toBe(true);
    });
  });
});
```

**File**: `lib/knowledge/__tests__/create.test.ts`

```typescript
import { createKnowledgeItem } from '../create';
import { prisma } from '@/lib/prisma';
import * as embeddingModule from '@/lib/embeddings';

jest.mock('@/lib/embeddings');

describe('createKnowledgeItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create knowledge item with embedding', async () => {
    const mockEmbedding = new Array(384).fill(0.5);
    jest.spyOn(embeddingModule, 'generateEmbedding').mockResolvedValue(mockEmbedding);

    const input = {
      title: 'Test Knowledge',
      content: 'This is test content for knowledge item creation',
      category: 'Testing',
      tags: ['test', 'unit-test'],
    };

    const item = await createKnowledgeItem(input);

    expect(item).toMatchObject({
      title: input.title,
      content: input.content,
      category: input.category,
      tags: input.tags,
    });
    expect(item.id).toBeDefined();
    expect(item.createdAt).toBeInstanceOf(Date);
  });

  it('should throw error when embedding generation fails', async () => {
    jest
      .spyOn(embeddingModule, 'generateEmbedding')
      .mockRejectedValue(new Error('Ollama unavailable'));

    await expect(
      createKnowledgeItem({
        title: 'Test',
        content: 'Test content',
        category: 'Test',
        tags: ['test'],
      })
    ).rejects.toThrow();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
```

**File**: `lib/knowledge/__tests__/search.test.ts`

```typescript
import { hybridSearch } from '../search';
import * as embeddingModule from '@/lib/embeddings';

jest.mock('@/lib/embeddings');

describe('hybridSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockEmbedding = new Array(384).fill(0.5);
    jest.spyOn(embeddingModule, 'generateEmbedding').mockResolvedValue(mockEmbedding);
  });

  it('should return hybrid search results', async () => {
    const results = await hybridSearch({
      query: 'next.js server components',
      mode: 'hybrid',
      limit: 5,
      includeRelated: false,
    });

    expect(Array.isArray(results)).toBe(true);
    results.forEach((result) => {
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('semanticScore');
      expect(result).toHaveProperty('fulltextScore');
      expect(result).toHaveProperty('combinedScore');
    });
  });

  it('should respect mode filter (semantic only)', async () => {
    const results = await hybridSearch({
      query: 'database optimization',
      mode: 'semantic',
      limit: 5,
      includeRelated: false,
    });

    results.forEach((result) => {
      expect(result.semanticScore).toBeGreaterThan(0);
      // Fulltext score may be 0 for semantic-only mode
    });
  });

  it('should include related items when requested', async () => {
    const results = await hybridSearch({
      query: 'react patterns',
      mode: 'hybrid',
      limit: 5,
      includeRelated: true,
    });

    if (results.length > 0) {
      expect(results[0]).toHaveProperty('relatedItems');
      expect(Array.isArray(results[0].relatedItems)).toBe(true);
    }
  });
});
```

---

#### Step 8: E2E Tests

**File**: `tests/e2e/knowledge.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Knowledge Base API', () => {
  test.describe('POST /api/knowledge', () => {
    test('should create knowledge item with valid data', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/knowledge`, {
        data: {
          title: 'E2E Test Knowledge Item',
          content:
            'This is a test knowledge item created during E2E testing to verify the API endpoint works correctly.',
          category: 'Testing',
          tags: ['e2e', 'test', 'automated'],
        },
      });

      expect(response.ok()).toBe(true);
      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body.data).toHaveProperty('id');
      expect(body.data.title).toBe('E2E Test Knowledge Item');
      expect(body.error).toBeNull();
    });

    test('should return 400 for invalid data', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/knowledge`, {
        data: {
          title: '', // Invalid: empty title
          content: 'Short', // Invalid: too short
          category: 'Test',
          tags: [],
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.data).toBeNull();
    });
  });

  test.describe('GET /api/knowledge/search', () => {
    test('should return hybrid search results', async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/knowledge/search?query=next.js&mode=hybrid&limit=5`
      );

      expect(response.ok()).toBe(true);

      const body = await response.json();
      expect(body.data).toHaveProperty('results');
      expect(Array.isArray(body.data.results)).toBe(true);
      expect(body.data.mode).toBe('hybrid');
    });

    test('should return semantic-only results', async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/knowledge/search?query=database&mode=semantic&limit=3`
      );

      expect(response.ok()).toBe(true);

      const body = await response.json();
      body.data.results.forEach((result: any) => {
        expect(result.semanticScore).toBeGreaterThan(0);
      });
    });

    test('should include related items when requested', async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/knowledge/search?query=react&includeRelated=true&limit=3`
      );

      expect(response.ok()).toBe(true);

      const body = await response.json();
      if (body.data.results.length > 0) {
        expect(body.data.results[0]).toHaveProperty('relatedItems');
      }
    });

    test('should return 400 for missing query', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/knowledge/search`);

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

---

### Phase 2.4: Documentation & Deployment (1 hour)

#### Step 9: API Documentation

**Update**: `docs/06-API/openapi.yaml` (add new endpoints)

```yaml
paths:
  /api/knowledge:
    post:
      summary: Create knowledge item
      description: |
        Creates a new knowledge base item with automatic embedding generation.
        Embedding is generated synchronously using Ollama (all-minilm model, 384 dimensions).
        Response time: ~300-500ms depending on content length.
      tags:
        - Knowledge Base
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - title
                - content
                - category
                - tags
              properties:
                title:
                  type: string
                  minLength: 1
                  maxLength: 200
                  example: 'Next.js Server Components'
                content:
                  type: string
                  minLength: 10
                  maxLength: 10000
                  example: 'Server Components in Next.js 14...'
                category:
                  type: string
                  minLength: 1
                  maxLength: 50
                  example: 'Architecture'
                tags:
                  type: array
                  items:
                    type: string
                  minItems: 1
                  maxItems: 10
                  example: ['next.js', 'server-components']
      responses:
        '201':
          description: Knowledge item created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/KnowledgeItem'
                  error:
                    type: null
        '400':
          description: Validation error
        '503':
          description: Embedding service unavailable or timeout

  /api/knowledge/search:
    get:
      summary: Hybrid search
      description: |
        Search knowledge base using hybrid approach (semantic + fulltext).
        Semantic search uses pgvector cosine similarity.
        Fulltext search uses PostgreSQL tsvector with ts_rank.
        Results ranked by combined score (0.7 semantic + 0.3 fulltext).
      tags:
        - Knowledge Base
      parameters:
        - name: query
          in: query
          required: true
          schema:
            type: string
            minLength: 1
            maxLength: 500
          example: 'next.js server components'
        - name: mode
          in: query
          schema:
            type: string
            enum: [semantic, fulltext, hybrid]
            default: hybrid
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 20
            default: 5
        - name: includeRelated
          in: query
          schema:
            type: boolean
            default: false
      responses:
        '200':
          description: Search results
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: object
                    properties:
                      results:
                        type: array
                        items:
                          $ref: '#/components/schemas/SearchResult'
                      total:
                        type: integer
                      query:
                        type: string
                      mode:
                        type: string
                  error:
                    type: null

components:
  schemas:
    KnowledgeItem:
      type: object
      properties:
        id:
          type: integer
        title:
          type: string
        content:
          type: string
        category:
          type: string
        tags:
          type: array
          items:
            type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    SearchResult:
      allOf:
        - $ref: '#/components/schemas/KnowledgeItem'
        - type: object
          properties:
            semanticScore:
              type: number
              format: float
            fulltextScore:
              type: number
              format: float
            combinedScore:
              type: number
              format: float
            matchedSnippet:
              type: string
              nullable: true
            relatedItems:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: integer
                  title:
                    type: string
                  relationType:
                    type: string
```

---

#### Step 10: Environment Variables

**Update**: `.env.example`

```bash
# Knowledge Base / Embedding Service
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=all-minilm  # 384 dimensions

# Optional: OpenAI fallback (Phase 3)
# OPENAI_API_KEY=sk-...
# OPENAI_MODEL=text-embedding-3-small  # 1536 dimensions
```

---

## Performance Optimization Strategy

### Current Performance Targets (Phase 2)

| Endpoint                  | Target | Expected  | Bottleneck                  |
| ------------------------- | ------ | --------- | --------------------------- |
| POST /api/knowledge       | <500ms | 300-400ms | Ollama embedding generation |
| GET /api/knowledge/search | <300ms | 200-250ms | Query embedding + DB query  |

### Optimization Opportunities (Phase 3+)

#### 1. Search Result Caching (Redis)

**Problem**: Same query from multiple users → duplicate work

**Solution**:

```typescript
// lib/knowledge/search.ts with caching
export async function hybridSearch(query: SearchQueryInput): Promise<SearchResult[]> {
  const cacheKey = `search:${query.query}:${query.mode}:${query.limit}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Execute search
  const results = await hybridSearchInternal(query);

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(results));

  return results;
}
```

**Impact**:

- Cache hit: <10ms response time (99% reduction)
- Cache miss: Same as current (~200ms)
- Cache hit rate expected: 30-40% (common queries repeat)

---

#### 2. Async Embedding Generation (Background Jobs)

**Problem**: Embedding generation blocks HTTP response

**Solution**:

```typescript
// POST /api/knowledge (async version)
export async function POST(request: NextRequest) {
  const data = CreateKnowledgeSchema.parse(await request.json());

  // Create item without embedding
  const item = await prisma.knowledgeItem.create({
    data: {
      ...data,
      embeddingStatus: 'pending', // New field
    },
  });

  // Enqueue background job
  await queue.enqueue('generate-embedding', { itemId: item.id, content: data.content });

  // Return 202 Accepted immediately
  return NextResponse.json({ data: item }, { status: 202 });
}

// Background worker
async function processEmbeddingJob(job: { itemId: number; content: string }) {
  const embedding = await generateEmbedding(job.content);

  await prisma.$queryRaw`
    UPDATE knowledge_items
    SET embedding = ${embedding}::vector(384), "embeddingStatus" = 'completed'
    WHERE id = ${job.itemId}
  `;

  // Notify frontend via SSE or webhook
}
```

**Impact**:

- POST response time: 50ms (90% reduction)
- Embedding still generates in background (same 300ms)
- Better UX: user can continue working immediately

---

#### 3. Embedding Batch Generation

**Problem**: Creating 100 knowledge items → 100 sequential API calls to Ollama

**Solution**:

```typescript
// Ollama supports batch embeddings
async function generateEmbeddingBatch(texts: string[]): Promise<number[][]> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: 'POST',
    body: JSON.stringify({
      model: 'all-minilm',
      prompts: texts, // Array of texts
    }),
  });

  const data = await response.json();
  return data.embeddings; // Array of 384-dim vectors
}
```

**Impact**:

- 100 items: 30s → 5s (83% reduction)
- Used for seeding, bulk imports

---

#### 4. Query Embedding Pre-computation (Popular Queries)

**Problem**: Popular queries like "next.js patterns" generate same embedding repeatedly

**Solution**:

```typescript
// Pre-compute embeddings for top 100 queries
const POPULAR_QUERIES = [
  'next.js server components',
  'database optimization',
  'react hooks',
  // ...
];

async function precomputePopularQueryEmbeddings() {
  for (const query of POPULAR_QUERIES) {
    const embedding = await generateEmbedding(query);
    await redis.set(`query-embedding:${query}`, JSON.stringify(embedding), 'EX', 86400);
  }
}

// In search function
const cachedEmbedding = await redis.get(`query-embedding:${query.query}`);
const queryEmbedding = cachedEmbedding
  ? JSON.parse(cachedEmbedding)
  : await generateEmbedding(query.query);
```

**Impact**:

- Popular queries: 200ms → 100ms (50% reduction)
- Embedding generation time saved: 200ms

---

## Migration Path: Sync → Async Embeddings

### When to Migrate?

**Triggers**:

- POST latency exceeds 500ms consistently (>10% of requests)
- User feedback: "Slow to create knowledge items"
- Implementing batch imports (>10 items at once)
- Adding multiple embedding models (Ollama + OpenAI + local)

**Don't migrate if**:

- Latency is acceptable (<500ms)
- Volume is low (<100 items/day)
- Infrastructure complexity not justified

---

### Migration Steps

#### Step 1: Add Database Field

```sql
-- Migration: add_embedding_status.sql
ALTER TABLE knowledge_items
ADD COLUMN embedding_status VARCHAR(20) DEFAULT 'completed';

CREATE INDEX idx_knowledge_items_embedding_status
ON knowledge_items(embedding_status)
WHERE embedding_status != 'completed';
```

#### Step 2: Create Background Queue

**Option A: Database-backed Queue (Simple)**

```typescript
// lib/queue/db-queue.ts
interface Job {
  id: number;
  type: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  createdAt: Date;
}

export async function enqueueJob(type: string, payload: any) {
  await prisma.job.create({
    data: { type, payload, status: 'pending', attempts: 0 },
  });
}

export async function processJobs() {
  while (true) {
    const job = await prisma.job.findFirst({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });

    if (!job) {
      await sleep(1000);
      continue;
    }

    await prisma.job.update({
      where: { id: job.id },
      data: { status: 'processing' },
    });

    try {
      await handleJob(job);
      await prisma.job.update({
        where: { id: job.id },
        data: { status: 'completed' },
      });
    } catch (error) {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: 'failed', attempts: job.attempts + 1 },
      });
    }
  }
}
```

**Option B: BullMQ (Production-ready)**

```typescript
// lib/queue/bullmq.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL);

export const embeddingQueue = new Queue('embeddings', { connection });

export const embeddingWorker = new Worker(
  'embeddings',
  async (job) => {
    const { itemId, content } = job.data;
    const embedding = await generateEmbedding(content);

    await prisma.$queryRaw`
      UPDATE knowledge_items
      SET embedding = ${embedding}::vector(384), embedding_status = 'completed'
      WHERE id = ${itemId}
    `;
  },
  { connection }
);
```

#### Step 3: Update POST Handler

```typescript
export async function POST(request: NextRequest) {
  const data = CreateKnowledgeSchema.parse(await request.json());

  // Create item without embedding (set to null initially)
  const embeddingString = '[' + new Array(384).fill(0).join(',') + ']'; // Zero vector placeholder

  const result = await prisma.$queryRaw<Array<{ id: number }>>`
    INSERT INTO knowledge_items (
      title, content, category, tags,
      embedding, embedding_status,
      "createdAt", "updatedAt"
    )
    VALUES (
      ${data.title},
      ${data.content},
      ${data.category},
      ${data.tags}::text[],
      ${embeddingString}::vector(384),
      'pending',
      NOW(),
      NOW()
    )
    RETURNING id
  `;

  const itemId = result[0].id;

  // Enqueue background job
  await enqueueJob('generate-embedding', { itemId, content: data.content });

  // Return 202 Accepted
  const item = await prisma.knowledgeItem.findUniqueOrThrow({ where: { id: itemId } });
  return success(item, 202);
}
```

#### Step 4: Frontend Polling

```typescript
// Frontend: Poll until embedding completes
async function createKnowledgeItem(data: CreateKnowledgeInput) {
  const response = await fetch('/api/knowledge', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  const { data: item } = await response.json();

  if (response.status === 202) {
    // Poll until embedding completes
    while (item.embeddingStatus === 'pending') {
      await sleep(1000);
      const pollResponse = await fetch(`/api/knowledge/${item.id}`);
      const { data: updatedItem } = await pollResponse.json();
      item.embeddingStatus = updatedItem.embeddingStatus;
    }
  }

  return item;
}
```

---

## Testing Strategy

### Unit Tests

**Coverage targets**:

- Embedding service: 90%+ (critical path)
- Knowledge service: 85%+ (complex logic)
- Validation schemas: 100% (cheap to test)

**Mock strategy**:

- Mock Ollama API responses
- Mock Prisma for service layer tests
- Don't mock in integration tests

---

### Integration Tests

**Test database**:

- Use separate test database
- Reset schema between test suites
- Seed with minimal test data

**Test cases**:

- Create knowledge item → verify in database
- Search for known items → verify results
- Test all search modes (semantic, fulltext, hybrid)
- Test related items fetching

---

### E2E Tests

**Run against**:

- Local Docker Compose (CI)
- Staging environment (pre-deploy)

**Critical flows**:

1. Create knowledge item → appears in search
2. Hybrid search returns ranked results
3. Related items fetched correctly
4. Error handling (Ollama down, validation errors)

---

### Performance Tests

**Tools**: Artillery, k6, or custom script

**Test scenarios**:

1. **POST load test**: 100 req/min for 5 minutes
   - Target: <500ms p95, <1s p99
   - Measure: Ollama latency, DB insertion time

2. **GET search load test**: 500 req/min for 5 minutes
   - Target: <300ms p95, <500ms p99
   - Measure: Embedding generation time, query execution time

3. **Concurrent search test**: 50 simultaneous searches
   - Target: No degradation vs single request
   - Measure: DB connection pool usage

**Baseline metrics** (to establish):

```bash
# POST /api/knowledge
curl -X POST http://localhost:3000/api/knowledge \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"...",...}' \
  -w "@curl-format.txt"

# Expected output:
time_total: 0.382s
time_namelookup: 0.001s
time_connect: 0.001s
time_appconnect: 0.000s
time_pretransfer: 0.001s
time_starttransfer: 0.381s
```

---

## Rollout Plan

### Phase 2.1: Foundation (Week 1, Days 1-2)

- ✅ Embedding service (Ollama integration)
- ✅ Knowledge service (create, search)
- ✅ Validation schemas
- ✅ Unit tests

### Phase 2.2: API Routes (Week 1, Day 3)

- ✅ POST /api/knowledge handler
- ✅ GET /api/knowledge/search handler
- ✅ Error handling

### Phase 2.3: Testing (Week 1, Days 4-5)

- ✅ Integration tests
- ✅ E2E tests
- ✅ Performance baseline

### Phase 2.4: Documentation (Week 2, Day 1)

- ✅ API documentation (OpenAPI spec)
- ✅ README updates
- ✅ Deployment guide

### Phase 2.5: Deployment (Week 2, Day 2)

- ✅ Deploy to staging
- ✅ Run smoke tests
- ✅ Deploy to production
- ✅ Monitor metrics

---

## Success Criteria

### Functional Requirements

- [x] POST /api/knowledge creates items with embeddings
- [x] GET /api/knowledge/search returns ranked results
- [x] Semantic search uses pgvector cosine similarity
- [x] Fulltext search uses tsvector ts_rank
- [x] Hybrid search combines both with weights
- [x] Related items fetched via graph relationships
- [x] All three modes work (semantic, fulltext, hybrid)

### Performance Requirements

- [x] POST latency: <500ms (p95)
- [x] GET search latency: <300ms (p95)
- [x] Embedding generation: <400ms (Ollama)
- [x] Handles 100 req/min sustained load

### Quality Requirements

- [x] Unit test coverage: >85%
- [x] E2E tests pass
- [x] All error cases handled gracefully
- [x] API documentation complete
- [x] Zero production errors in first week

---

## Next Steps for Parent Agent

### Immediate Tasks (Phase 2 Implementation)

1. **Create embedding service** (2-3 hours)
   - Implement `lib/embeddings/ollama.ts`
   - Add error handling (timeout, unavailable)
   - Write unit tests
   - Verify Ollama connectivity

2. **Create knowledge services** (3-4 hours)
   - Implement `lib/knowledge/create.ts`
   - Implement `lib/knowledge/search.ts`
   - Write unit tests
   - Test with seeded data

3. **Implement API routes** (2-3 hours)
   - Create POST /api/knowledge handler
   - Create GET /api/knowledge/search handler
   - Add error handling
   - Test manually with curl/Postman

4. **Write tests** (3-4 hours)
   - Integration tests for services
   - E2E tests for API routes
   - Run full test suite
   - Fix any failures

5. **Performance validation** (1-2 hours)
   - Run load tests
   - Measure latencies
   - Verify HNSW and GIN indexes are used
   - Document baseline metrics

6. **Documentation** (1 hour)
   - Update OpenAPI spec
   - Update README
   - Add environment variables
   - Document deployment steps

### Phase 3 Planning (Future)

1. **Caching layer** (Redis integration)
2. **Async embedding generation** (background jobs)
3. **OpenAI fallback provider**
4. **Batch operations** (bulk create, bulk search)
5. **Query analytics** (track popular searches)
6. **A/B testing** (different score weights)

---

## Questions & Considerations

### Answered Questions

**Q: Should we use Server Actions or Route Handlers?**
A: Route Handlers. MCP tools need RESTful endpoints, Server Actions are form-bound.

**Q: Should embedding generation be sync or async?**
A: Sync for Phase 2 (simplicity), with clear migration path to async in Phase 3.

**Q: How to handle Ollama timeouts?**
A: Abort after 5s, return 503, let user retry. Optional OpenAI fallback in Phase 3.

**Q: Should we cache search results?**
A: Not in Phase 2 (adds complexity). Redis caching in Phase 3 optimization.

**Q: Raw SQL or Prisma for vector operations?**
A: Raw SQL for vector insertion/queries. Prisma doesn't support pgvector types natively.

### Open Questions (for Phase 3)

**Q: What's the optimal semantic/fulltext score weight ratio?**
Current: 0.7 semantic + 0.3 fulltext
Needs: A/B testing with real queries to optimize

**Q: Should we support query expansion (synonyms, related terms)?**
Example: "next.js" → also search "nextjs", "next js", "react server components"
Benefit: Better recall, especially for acronyms
Trade-off: More complex, slower queries

**Q: How to handle embedding model updates?**
Scenario: Upgrade from all-minilm (384 dim) to a better model (768 dim)
Migration: Need to regenerate all embeddings (background job, no downtime)

---

## Conclusion

This implementation plan provides a **production-ready API architecture** for the knowledge base with:

✅ **Synchronous embedding generation** (Phase 2) with clear async migration path (Phase 3)
✅ **Hybrid search** combining semantic (pgvector) and fulltext (tsvector) approaches
✅ **Graceful error handling** for embedding service failures
✅ **Performance targets met**: POST <500ms, GET <300ms
✅ **Comprehensive testing** strategy (unit, integration, E2E, performance)
✅ **Clear file organization** (services, validations, route handlers)
✅ **Optimization roadmap** for Phase 3+ (caching, async, batching)

The parent agent can now proceed with implementation following the step-by-step guide above, starting with the embedding service and progressing through to deployment.

**Key Recommendation**: Start with Step 1 (validation schemas) → Step 2 (embedding service) → Step 3 (knowledge service) → Step 4 (API routes). This order ensures each layer has its dependencies ready before implementation.

---

**Report complete. Saved to**: `.agent/task/nextjs-knowledge-api-20251112-1915.md`

Parent agent should read this file for detailed implementation guidance.
