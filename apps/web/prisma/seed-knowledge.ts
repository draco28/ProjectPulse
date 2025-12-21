import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedKnowledge() {
  console.log('🌱 Seeding knowledge items...');

  // Clear existing knowledge data
  await prisma.$executeRaw`TRUNCATE TABLE knowledge_item_versions CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE knowledge_relationships CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE knowledge_items CASCADE`;

  // Reset sequence
  await prisma.$executeRaw`ALTER SEQUENCE knowledge_items_id_seq RESTART WITH 1`;

  // Seed knowledge items
  const knowledgeItems = [
    {
      title: 'Next.js App Router Server Components',
      content: `Server Components in Next.js 14 App Router enable server-side rendering by default. They reduce client-side JavaScript bundle size and improve initial page load performance. Use Server Components for data fetching, accessing backend resources directly, and keeping sensitive information on the server. Client Components (marked with 'use client') are needed for interactivity, browser APIs, and React hooks like useState and useEffect.`,
      category: 'Architecture',
      tags: ['next.js', 'server-components', 'app-router', 'performance'],
    },
    {
      title: 'Prisma Query Optimization Patterns',
      content: `Optimize Prisma queries by using select to fetch only needed fields, include for eager loading relations, and where with indexes for filtering. Use findMany with take/skip for pagination. For complex queries, use raw SQL with prisma.$queryRaw. Always create indexes on foreign keys and frequently queried fields. Use Prisma's query logging to identify slow queries.`,
      category: 'Database',
      tags: ['prisma', 'optimization', 'database', 'performance', 'postgresql'],
    },
    {
      title: 'RESTful API Design Best Practices',
      content: `RESTful APIs should follow conventions: use nouns for resources (e.g., /api/issues), HTTP methods for actions (GET for read, POST for create, PUT/PATCH for update, DELETE for remove). Return appropriate status codes (200 for success, 201 for created, 400 for validation errors, 404 for not found, 500 for server errors). Use consistent response formats with data and error fields. Implement pagination, filtering, and sorting for list endpoints.`,
      category: 'API Design',
      tags: ['rest', 'api', 'best-practices', 'http', 'design-patterns'],
    },
    {
      title: 'pgvector HNSW Index Configuration',
      content: `HNSW (Hierarchical Navigable Small World) indexes in pgvector provide approximate nearest neighbor search with sub-linear complexity. Key parameters: m (16 default) controls graph connectivity, higher values improve recall but increase memory; ef_construction (64 default) affects build quality, higher values improve index accuracy but slow down creation. Use vector_cosine_ops for cosine similarity, vector_l2_ops for Euclidean distance. HNSW is ideal for 1K-10K+ vectors with <200ms query latency.`,
      category: 'Database',
      tags: ['pgvector', 'hnsw', 'vector-search', 'indexing', 'postgresql'],
    },
    {
      title: 'React Server vs Client Components Decision Tree',
      content: `Choose Server Components when: fetching data, accessing backend resources, using secrets/tokens, performing heavy computations. Choose Client Components when: using React hooks (useState, useEffect, useContext), handling browser events (onClick, onChange), using browser-only APIs (localStorage, window), needing real-time interactivity. You can compose them: Server Components can import Client Components (but not vice versa). Pass Server Component data to Client Components via props.`,
      category: 'Architecture',
      tags: ['react', 'server-components', 'client-components', 'next.js', 'architecture'],
    },
    {
      title: 'TypeScript Zod Validation Patterns',
      content: `Zod provides runtime type validation for TypeScript. Define schemas with z.object(), validate with schema.parse() (throws on error) or schema.safeParse() (returns result). Use .refine() for custom validation logic. For API routes, validate request body, query params, and headers separately. Transform data with .transform(). Infer TypeScript types with z.infer<typeof schema>. Compose schemas with .extend(), .merge(), and .pick().`,
      category: 'API Design',
      tags: ['typescript', 'zod', 'validation', 'type-safety', 'runtime-validation'],
    },
    {
      title: 'Docker Multi-Stage Build Optimization',
      content: `Multi-stage Docker builds reduce final image size by separating build dependencies from runtime dependencies. Use separate stages: builder stage installs build tools and compiles code, runtime stage copies only production artifacts. Example: Node.js apps can use node:20-alpine for small final images (~50MB vs 900MB+ for full node image). Cache npm dependencies by copying package.json before source code. Use .dockerignore to exclude node_modules, .git, and test files.`,
      category: 'DevOps',
      tags: ['docker', 'optimization', 'multi-stage-build', 'containers', 'deployment'],
    },
    {
      title: 'PostgreSQL Full-Text Search with tsvector',
      content: `PostgreSQL tsvector enables full-text search with ranking and stemming. Use to_tsvector() to convert text to searchable vectors, to_tsquery() for search patterns. Create GIN indexes on tsvector columns for fast searches. Use setweight() to prioritize fields (A > B > C > D). Rank results with ts_rank() or ts_rank_cd() (cover density). Support phrase searches with <-> operator and prefix matching with :* suffix. Configure language-specific dictionaries for better stemming.`,
      category: 'Database',
      tags: ['postgresql', 'full-text-search', 'tsvector', 'gin-index', 'search'],
    },
    {
      title: 'Playwright E2E Testing Strategy',
      content: `Playwright enables reliable end-to-end testing across browsers. Use Page Object Model pattern to encapsulate UI interactions. Wait for elements with page.waitForSelector() instead of fixed timeouts. Test user flows, not implementation details. Use test.describe() for grouping, test.beforeEach() for setup. Capture screenshots and videos on failure. Run tests in parallel with workers. Use fixtures for shared state. Mock external APIs with page.route() to avoid flakiness.`,
      category: 'Testing',
      tags: ['playwright', 'e2e-testing', 'testing', 'automation', 'quality-assurance'],
    },
    {
      title: 'Git Conventional Commits Standard',
      content: `Conventional Commits provide structured commit messages for automated changelog generation. Format: type(scope): description. Types: feat (new feature), fix (bug fix), docs (documentation), style (formatting), refactor (code restructuring), test (tests), chore (maintenance). Examples: 'feat(api): add POST /api/issues endpoint', 'fix(ui): resolve button alignment issue', 'docs(readme): update installation steps'. Use breaking changes footer for major updates.`,
      category: 'DevOps',
      tags: ['git', 'conventional-commits', 'version-control', 'best-practices', 'changelog'],
    },
    {
      title: 'MCP (Model Context Protocol) Architecture',
      content: `MCP enables AI assistants to interact with external tools and data sources through a standardized protocol. Consists of MCP Servers (expose tools/resources/prompts) and MCP Clients (like Claude Code). Supports multiple transports: stdio (local development), SSE (deprecated), HTTP with streaming (production). Tools are functions with JSON schemas for parameters. Resources provide context injection. Prompts enable dynamic prompt templates. Use for integrating databases, APIs, and custom workflows.`,
      category: 'Architecture',
      tags: ['mcp', 'model-context-protocol', 'ai', 'integration', 'architecture'],
    },
    {
      title: 'Hybrid Search: Combining Semantic and Lexical Search',
      content: `Hybrid search combines semantic search (embedding similarity) with lexical search (keyword matching) for optimal relevance. Semantic search understands context and meaning, catching paraphrased queries. Lexical search provides exact keyword matches and acronyms. Merge strategy: compute separate scores (cosine similarity for semantic, ts_rank for lexical), normalize to 0-1 range, combine with weights (e.g., 0.7 semantic + 0.3 lexical). Deduplicate results. Adjust weights based on query type detection.`,
      category: 'Architecture',
      tags: [
        'hybrid-search',
        'semantic-search',
        'full-text-search',
        'information-retrieval',
        'ranking',
      ],
    },
    {
      title: 'React Custom Hooks Best Practices',
      content: `Custom hooks encapsulate reusable stateful logic. Prefix names with 'use' (e.g., useDebounce, useFetch). Return arrays for simple state [value, setValue] or objects for complex state { data, loading, error }. Handle cleanup in useEffect return functions. Extract business logic from components. Use dependency arrays carefully to prevent infinite loops. Combine built-in hooks (useState, useEffect, useContext). Test custom hooks with @testing-library/react-hooks.`,
      category: 'Architecture',
      tags: ['react', 'hooks', 'custom-hooks', 'best-practices', 'reusable-logic'],
    },
    {
      title: 'PostgreSQL Indexing Strategies',
      content: `Choose index types based on use case: B-tree (default) for equality and range queries, GIN for arrays/JSON/tsvector, GiST for geometric data, HNSW for vector similarity. Create indexes on foreign keys, frequently filtered columns, and ORDER BY fields. Use partial indexes with WHERE clauses for filtering. Avoid over-indexing (slows writes). Monitor index usage with pg_stat_user_indexes. Use EXPLAIN ANALYZE to verify index usage. Rebuild fragmented indexes with REINDEX.`,
      category: 'Database',
      tags: ['postgresql', 'indexing', 'performance', 'query-optimization', 'database'],
    },
    {
      title: 'API Rate Limiting and Throttling',
      content: `Implement rate limiting to prevent API abuse and ensure fair usage. Strategies: token bucket (allows bursts), leaky bucket (constant rate), fixed window (simple but has boundary issues), sliding window (accurate but complex). Use Redis for distributed rate limiting. Return HTTP 429 Too Many Requests with Retry-After header. Apply different limits per user tier (free vs paid). Monitor rate limit hits to adjust thresholds. Consider geographic rate limiting for security.`,
      category: 'API Design',
      tags: ['rate-limiting', 'api', 'security', 'throttling', 'redis'],
    },
  ];

  // Create knowledge items (without embeddings initially)
  const createdItems = [];
  for (const item of knowledgeItems) {
    // Generate a dummy embedding vector (768 dimensions for nomic-embed-text)
    // In Phase 2, we'll implement proper embedding generation via Ollama
    const dummyEmbedding = new Array(768).fill(0).map(() => Math.random() * 0.1);
    const embeddingString = `[${dummyEmbedding.join(',')}]`;

    // Use raw query to insert with vector and tsvector fields
    // tsvector is auto-generated by trigger, but we need to provide embedding
    const result = await prisma.$queryRaw<Array<{ id: number }>>`
      INSERT INTO knowledge_items (title, content, category, tags, embedding, "contentTsvector", "createdAt", "updatedAt")
      VALUES (
        ${item.title},
        ${item.content},
        ${item.category},
        ${item.tags}::text[],
        ${embeddingString}::vector(768),
        to_tsvector('english', ''),
        NOW(),
        NOW()
      )
      RETURNING id
    `;

    if (result[0]) {
      createdItems.push({ id: result[0].id, ...item });
      console.log(`  ✅ Created: ${item.title} (ID: ${result[0].id})`);
    }
  }

  // Create knowledge relationships (graph edges)
  const relationships = [
    // Next.js and React relationships
    {
      from: 'Next.js App Router Server Components',
      to: 'React Server vs Client Components Decision Tree',
      type: 'RELATES_TO',
      weight: 0.9,
    },
    {
      from: 'React Server vs Client Components Decision Tree',
      to: 'React Custom Hooks Best Practices',
      type: 'RELATES_TO',
      weight: 0.7,
    },

    // Database optimization relationships
    {
      from: 'Prisma Query Optimization Patterns',
      to: 'PostgreSQL Indexing Strategies',
      type: 'DEPENDS_ON',
      weight: 0.85,
    },
    {
      from: 'pgvector HNSW Index Configuration',
      to: 'PostgreSQL Indexing Strategies',
      type: 'EXTENDS',
      weight: 0.8,
    },

    // Search system relationships
    {
      from: 'Hybrid Search: Combining Semantic and Lexical Search',
      to: 'pgvector HNSW Index Configuration',
      type: 'DEPENDS_ON',
      weight: 0.9,
    },
    {
      from: 'Hybrid Search: Combining Semantic and Lexical Search',
      to: 'PostgreSQL Full-Text Search with tsvector',
      type: 'DEPENDS_ON',
      weight: 0.9,
    },

    // API design relationships
    {
      from: 'RESTful API Design Best Practices',
      to: 'TypeScript Zod Validation Patterns',
      type: 'RELATES_TO',
      weight: 0.75,
    },
    {
      from: 'API Rate Limiting and Throttling',
      to: 'RESTful API Design Best Practices',
      type: 'EXTENDS',
      weight: 0.7,
    },

    // DevOps relationships
    {
      from: 'Docker Multi-Stage Build Optimization',
      to: 'Next.js App Router Server Components',
      type: 'RELATES_TO',
      weight: 0.6,
    },
    {
      from: 'Git Conventional Commits Standard',
      to: 'RESTful API Design Best Practices',
      type: 'RELATES_TO',
      weight: 0.5,
    },

    // Testing relationships
    {
      from: 'Playwright E2E Testing Strategy',
      to: 'Next.js App Router Server Components',
      type: 'RELATES_TO',
      weight: 0.65,
    },

    // MCP architecture relationships
    {
      from: 'MCP (Model Context Protocol) Architecture',
      to: 'RESTful API Design Best Practices',
      type: 'RELATES_TO',
      weight: 0.7,
    },
  ];

  console.log('\n🔗 Creating knowledge relationships...');
  for (const rel of relationships) {
    const fromItem = createdItems.find((i) => i.title === rel.from);
    const toItem = createdItems.find((i) => i.title === rel.to);

    if (fromItem && toItem) {
      await prisma.knowledgeRelationship.create({
        data: {
          fromId: fromItem.id,
          toId: toItem.id,
          relationType: rel.type,
          weight: rel.weight,
        },
      });
      console.log(`  ✅ ${rel.from} --[${rel.type}]--> ${rel.to}`);
    }
  }

  console.log(
    `\n✅ Seeded ${createdItems.length} knowledge items with ${relationships.length} relationships`
  );
}

async function main() {
  try {
    await seedKnowledge();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
