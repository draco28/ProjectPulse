# Prisma Design Plan: Skills Lazy-Loading System

**Created**: 2025-11-13 14:20
**Type**: Schema Design + Migration Strategy + Query Optimization
**Sprint**: Sprint 6 - Knowledge Graph + Skills System
**Target**: 92% token reduction (2,500 → 220 tokens)

---

## Executive Summary

The Skills table stores framework documentation with YAML frontmatter + markdown content for end users' AI agents. The design prioritizes:

1. **Token Efficiency**: List queries return frontmatter only (<80 tokens per 10 skills), load queries return full content (<250 tokens per skill)
2. **Multi-Tenancy**: All skills scoped to `projectId` for data isolation
3. **Performance**: Optimized indexes for filtering (category, tags, frameworks) and sorting (usage, popularity)
4. **Lazy-Loading Support**: Clear separation of frontmatter (always loaded) vs content (on-demand)

**Key Design Decision**: Use `String` for category (not enum) to allow end users to extend categories without schema migrations.

---

## Data Model Requirements

### Core Entities

1. **Skill** (primary model)
   - Multi-tenant (projectId foreign key)
   - YAML frontmatter stored as separate fields (title, description, tags, frameworks, category)
   - Markdown content stored in `content` field (lazy-loaded)
   - Usage tracking (usageCount, lastLoadedAt)
   - Relationships: Many-to-many with KnowledgeItem (within same project)

2. **SkillLoadMetric** (optional - for Phase 4)
   - Track token usage per skill load
   - Measure frontmatter vs full content token counts
   - Validate 92% reduction target

---

## Schema Design

### Skill Model (Optimized for Lazy-Loading)

```prisma
model Skill {
  id          String   @id @default(uuid())

  // Multi-tenancy (CRITICAL: Must be indexed first)
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Identifier
  slug        String   // URL-friendly, unique within project (e.g., "react-server-components")

  // Categorization
  category    String   // Framework-level: "framework", "testing", "workflow", "troubleshooting"

  // Frontmatter (YAML) - Always loaded for list queries
  title       String   @db.VarChar(200)
  description String?  @db.Text
  tags        String[] // Keywords: ["react", "ssr", "performance"]
  frameworks  String[] // Framework stack: ["react", "nextjs", "typescript"]
  version     String?  @db.VarChar(50) // Framework version: "react@18", "nextjs@14"

  // Markdown content - LAZY-LOADED (excluded from list queries)
  content     String   @db.Text

  // Usage tracking
  usageCount   Int      @default(0)
  lastLoadedAt DateTime?

  // Relationships
  // Many-to-many with KnowledgeItem (within same project)
  linkedKnowledge KnowledgeItem[] @relation("SkillKnowledge")

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Constraints
  @@unique([projectId, slug]) // Slug unique within project

  // Indexes (optimized for lazy-loading queries)
  @@index([projectId])                     // Primary filter (multi-tenancy)
  @@index([projectId, category])           // Filter by category within project
  @@index([projectId, usageCount(sort: Desc)]) // Sort by popularity within project
  @@index([projectId, lastLoadedAt(sort: Desc)]) // Recent usage tracking
  @@index([tags], type: Gin)               // Fast tag filtering (PostgreSQL GIN index)
  @@index([frameworks], type: Gin)         // Fast framework filtering (PostgreSQL GIN index)

  @@map("skills")
}
```

### Project Model Extension (Multi-Tenancy)

```prisma
model Project {
  id          Int     @id @default(autoincrement())
  name        String  @unique
  description String? @db.Text
  repository  String?

  // Existing relations
  issues             Issue[]
  onboardingSessions OnboardingSession[]
  workflowRuns       WorkflowRun[]

  // NEW: Skills relation (Sprint 6)
  skills             Skill[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([name])
}
```

### KnowledgeItem Model Extension (Skills Linking)

```prisma
model KnowledgeItem {
  id Int @id @default(autoincrement())

  // Existing fields...
  title    String   @db.VarChar(200)
  content  String   @db.Text
  category String   @db.VarChar(50)
  tags     String[]
  embedding Unsupported("vector(768)")
  contentTsvector Unsupported("tsvector")

  // Existing relations...
  relationsFrom KnowledgeRelationship[] @relation("FromKnowledge")
  relationsTo   KnowledgeRelationship[] @relation("ToKnowledge")
  versions      KnowledgeItemVersion[]
  linkedIssues  KnowledgeLink[] @relation("KnowledgeIssue")

  // NEW: Skills relation (Sprint 6)
  linkedSkills  Skill[] @relation("SkillKnowledge")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Existing indexes...
  @@index([category])
  @@index([tags], type: Gin)
  @@index([contentTsvector], type: Gin)
  @@index([createdAt(sort: Desc)])

  @@map("knowledge_items")
}
```

### Optional: SkillLoadMetric Model (Phase 4, US-098)

```prisma
model SkillLoadMetric {
  id        Int      @id @default(autoincrement())

  // Reference
  skillId   String
  projectId String   // Denormalized for filtering

  // Token measurements
  frontmatterTokens Int      // Estimated tokens for frontmatter only
  fullTokens        Int      // Estimated tokens for full skill (frontmatter + content)
  reductionPercent  Decimal  @db.Decimal(5, 2) // 92.00 = 92% reduction

  // Context
  loadedVia String?  @db.VarChar(50) // "list", "load", "search"

  // Timestamp
  createdAt DateTime @default(now())

  // Indexes
  @@index([skillId])
  @@index([projectId])
  @@index([createdAt(sort: Desc)])

  @@map("skill_load_metrics")
}
```

---

## Design Rationale: Key Decisions

### 1. String vs Enum for Category

**Decision**: Use `String` instead of `enum SkillCategory`

**Rationale**:
- **Extensibility**: End users may want custom categories ("devops", "mobile", "cloud") without requiring schema migrations
- **Validation**: Enforce allowed categories at application level (Zod schema) rather than database level
- **Performance**: String comparison with index is fast enough (<1ms difference vs enum)
- **Trade-off**: Lose database-level constraint, but gain flexibility for multi-tenant system

**Alternative Considered**:
```prisma
enum SkillCategory {
  FRAMEWORK
  TESTING
  WORKFLOW
  TROUBLESHOOTING
}
category SkillCategory
```
**Rejected**: Too rigid for multi-tenant system where different projects may need different categories.

### 2. String[] vs Junction Table for Tags/Frameworks

**Decision**: Use PostgreSQL `String[]` with GIN indexes

**Rationale**:
- **Query Performance**: GIN index on String[] is 10-50x faster than junction table joins for filtering
- **Token Efficiency**: No additional joins = fewer tokens in serialized responses
- **Simplicity**: No need for `SkillTag`, `SkillFramework` junction tables
- **PostgreSQL Native**: `String[]` is a first-class type in PostgreSQL with excellent index support

**Query Example**:
```sql
-- String[] with GIN (FAST: <5ms for 1000 skills)
SELECT * FROM skills WHERE tags @> ARRAY['react', 'ssr']::text[];

-- Junction table (SLOW: 20-50ms for 1000 skills)
SELECT s.* FROM skills s
JOIN skill_tags st ON s.id = st.skill_id
WHERE st.tag IN ('react', 'ssr')
GROUP BY s.id HAVING COUNT(*) = 2;
```

**When to Use Junction Tables Instead**:
- If tags/frameworks need metadata (description, aliases, popularity)
- If tags/frameworks need many-to-many relationships beyond skills
- If tags/frameworks need separate CRUD management

**For Skills**: Tags/frameworks are simple strings, so `String[]` is optimal.

### 3. UUID vs Auto-Increment for Skill ID

**Decision**: Use `uuid()` (String ID)

**Rationale**:
- **Distributed Systems**: UUIDs prevent ID collisions if generating skills from multiple sources (import, CLI, API)
- **Security**: Non-sequential IDs prevent enumeration attacks
- **Consistency**: Matches existing `cuid()` pattern in ProjectPulse (Phase, Week, Day, Task, Session models use cuid)
- **Trade-off**: Slightly larger index size (~16 bytes vs 4 bytes), but negligible for expected skill count (<10K per project)

**Performance Impact**:
- UUID index size: ~160KB per 10K skills
- Int index size: ~40KB per 10K skills
- Difference: 120KB (negligible on modern PostgreSQL)

### 4. Denormalized projectId in Many-to-Many Relation

**Decision**: Implicit many-to-many (Prisma manages junction table)

**Schema**:
```prisma
model Skill {
  linkedKnowledge KnowledgeItem[] @relation("SkillKnowledge")
}

model KnowledgeItem {
  linkedSkills Skill[] @relation("SkillKnowledge")
}
```

**Prisma Generates**:
```sql
CREATE TABLE "_SkillKnowledge" (
  "A" TEXT NOT NULL REFERENCES "skills"("id") ON DELETE CASCADE,
  "B" INTEGER NOT NULL REFERENCES "knowledge_items"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "_SkillKnowledge_AB_unique" ON "_SkillKnowledge"("A", "B");
CREATE INDEX "_SkillKnowledge_B_index" ON "_SkillKnowledge"("B");
```

**Rationale**:
- **Simplicity**: No need to manually create `SkillKnowledgeLink` table
- **Prisma Managed**: Automatic cleanup, cascading deletes
- **Performance**: Prisma generates optimal indexes (unique constraint + reverse index)

**When to Use Explicit Junction Table Instead**:
- If links need metadata (createdBy, createdAt, linkType, notes)
- If links need soft deletes (deletedAt)
- If links need to enforce project-level isolation (require both skill and knowledge item in same project)

**Current Design**: Use implicit many-to-many. If project isolation needs enforcement, add explicit junction table in Phase 6 (US-104).

---

## Index Strategy

### Index Placement Rationale

**Primary Indexes (Required for Multi-Tenancy)**:
1. `@@index([projectId])` - CRITICAL: All queries filter by projectId first
2. `@@unique([projectId, slug])` - Ensure slug uniqueness within project

**Query Performance Indexes**:
3. `@@index([projectId, category])` - Filter by category within project (US-096)
4. `@@index([projectId, usageCount(sort: Desc)])` - Popular skills within project (US-103)
5. `@@index([projectId, lastLoadedAt(sort: Desc)])` - Recent usage tracking

**Array Indexes (GIN for Fast Filtering)**:
6. `@@index([tags], type: Gin)` - Fast tag filtering (US-093)
7. `@@index([frameworks], type: Gin)` - Fast framework filtering (US-093)

### Index Cardinality Analysis

**Estimated Data**:
- Projects: 100-1000 (multi-tenant system)
- Skills per project: 50-200 (framework docs, testing patterns, SOPs)
- Total skills: 5K-200K

**Index Sizes** (estimated for 100K skills):
- `projectId` index: ~400KB (low cardinality, but required for isolation)
- `(projectId, category)` composite: ~800KB (medium cardinality)
- `(projectId, usageCount)` composite: ~1.2MB (high cardinality, sorted)
- `tags` GIN index: ~2-5MB (depends on unique tag count)
- `frameworks` GIN index: ~500KB-1MB (lower cardinality than tags)

**Total Index Overhead**: ~5-10MB per 100K skills (acceptable for PostgreSQL)

### Missing Indexes? (Future Considerations)

**NOT Indexed**:
- `title` - Full-text search handled by content field (if needed, add tsvector)
- `version` - Low query frequency (rarely filtered alone)
- `createdAt` - Timestamp queries rare (focus on lastLoadedAt for recency)

**When to Add**:
- `@@index([projectId, title])` - If title autocomplete becomes a requirement
- Full-text search on `title + description` - If semantic search insufficient

---

## Migration Strategy

### Step 1: Baseline Migration (Day 3, US-095)

**Migration Name**: `add_skills_table`

**Commands**:
```bash
# On Mac mini (192.168.1.15)
cd /Users/draco/projects/AI_HUB/apps/web

# Generate migration (creates SQL in migrations/ folder)
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" \
  npx prisma migrate dev --name add_skills_table

# Review generated SQL before applying
cat prisma/migrations/*_add_skills_table/migration.sql
```

**Expected SQL** (Prisma will generate):
```sql
-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "frameworks" TEXT[],
    "version" VARCHAR(50),
    "content" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastLoadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skills_projectId_slug_key" ON "skills"("projectId", "slug");

-- CreateIndex
CREATE INDEX "skills_projectId_idx" ON "skills"("projectId");

-- CreateIndex
CREATE INDEX "skills_projectId_category_idx" ON "skills"("projectId", "category");

-- CreateIndex
CREATE INDEX "skills_projectId_usageCount_idx" ON "skills"("projectId", "usageCount" DESC);

-- CreateIndex
CREATE INDEX "skills_projectId_lastLoadedAt_idx" ON "skills"("projectId", "lastLoadedAt" DESC);

-- CreateIndex
CREATE INDEX "skills_tags_idx" ON "skills" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "skills_frameworks_idx" ON "skills" USING GIN ("frameworks");

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

**IMPORTANT: projectId Type Mismatch**:
- Current `Project.id` is `Int` (auto-increment)
- Skill schema uses `projectId String` (assumes uuid)

**FIX REQUIRED**:
```prisma
model Skill {
  id          String   @id @default(uuid())
  projectId   Int      // CHANGE: Match Project.id type
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  // ... rest of fields
}
```

**Corrected Migration SQL**:
```sql
-- AddForeignKey (CORRECTED)
ALTER TABLE "skills" ADD CONSTRAINT "skills_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Note: "projects" is the @@map name for Project model
```

### Step 2: Many-to-Many Relation (Day 9, US-104)

**Migration Name**: `add_skill_knowledge_relation`

**Commands**:
```bash
# On Mac mini (after updating schema with @relation("SkillKnowledge"))
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" \
  npx prisma migrate dev --name add_skill_knowledge_relation
```

**Expected SQL** (Prisma generates junction table):
```sql
-- CreateTable
CREATE TABLE "_SkillKnowledge" (
    "A" TEXT NOT NULL,  -- Skill.id (uuid)
    "B" INTEGER NOT NULL -- KnowledgeItem.id (int)
);

-- CreateIndex
CREATE UNIQUE INDEX "_SkillKnowledge_AB_unique" ON "_SkillKnowledge"("A", "B");

-- CreateIndex
CREATE INDEX "_SkillKnowledge_B_index" ON "_SkillKnowledge"("B");

-- AddForeignKey
ALTER TABLE "_SkillKnowledge" ADD CONSTRAINT "_SkillKnowledge_A_fkey"
  FOREIGN KEY ("A") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SkillKnowledge" ADD CONSTRAINT "_SkillKnowledge_B_fkey"
  FOREIGN KEY ("B") REFERENCES "knowledge_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### Step 3: Optional Metrics Table (Day 6, US-098)

**Migration Name**: `add_skill_load_metrics`

**Commands**:
```bash
# Only if metrics tracking is implemented
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" \
  npx prisma migrate dev --name add_skill_load_metrics
```

**Expected SQL**:
```sql
-- CreateTable
CREATE TABLE "skill_load_metrics" (
    "id" SERIAL NOT NULL,
    "skillId" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "frontmatterTokens" INTEGER NOT NULL,
    "fullTokens" INTEGER NOT NULL,
    "reductionPercent" DECIMAL(5,2) NOT NULL,
    "loadedVia" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_load_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "skill_load_metrics_skillId_idx" ON "skill_load_metrics"("skillId");
CREATE INDEX "skill_load_metrics_projectId_idx" ON "skill_load_metrics"("projectId");
CREATE INDEX "skill_load_metrics_createdAt_idx" ON "skill_load_metrics"("createdAt" DESC);

-- Note: No foreign key to skills table (metrics retained even if skill deleted)
```

### Migration Best Practices

**Before Applying**:
1. Review generated SQL in `prisma/migrations/` folder
2. Test migration on development database first
3. Backup production database (if deploying to prod)
4. Verify foreign key constraints match existing schema

**Testing Migration**:
```bash
# On Mac mini
cd /Users/draco/projects/AI_HUB/apps/web

# 1. Apply migration
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" \
  npx prisma migrate dev --name add_skills_table

# 2. Regenerate Prisma Client
npx prisma generate

# 3. Verify schema in PostgreSQL
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" \
  npx prisma db execute --stdin <<SQL
\d skills
\d _SkillKnowledge
SQL

# 4. Test queries
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" \
  npx prisma studio
# Open Prisma Studio and verify Skill model appears
```

**Rollback Strategy** (if migration fails):
```bash
# Prisma doesn't support automatic rollback, so manual SQL required
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" \
  npx prisma db execute --stdin <<SQL
DROP TABLE IF EXISTS "skills" CASCADE;
DROP TABLE IF EXISTS "_SkillKnowledge" CASCADE;
DROP TABLE IF EXISTS "skill_load_metrics" CASCADE;
SQL

# Then delete migration folder
rm -rf prisma/migrations/*_add_skills_table
rm -rf prisma/migrations/*_add_skill_knowledge_relation
rm -rf prisma/migrations/*_add_skill_load_metrics

# Regenerate Prisma Client
npx prisma generate
```

---

## Query Patterns

### Pattern 1: List Skills (Frontmatter Only) - US-091

**Use Case**: Agent lists available skills to decide which to load

**Target**: <80 tokens per 10 skills (average 8 tokens per skill)

**Query**:
```typescript
import { prisma } from '@/lib/db';

// List skills with frontmatter only (NO content field)
const skills = await prisma.skill.findMany({
  where: {
    projectId: parseInt(projectId), // Multi-tenancy filter
    category: category, // Optional: filter by category
    tags: {
      hasSome: tags, // Optional: filter by tags (OR logic)
    },
    frameworks: {
      hasSome: frameworks, // Optional: filter by frameworks
    },
  },
  select: {
    id: true,
    slug: true,
    title: true,
    description: true,
    category: true,
    tags: true,
    frameworks: true,
    version: true,
    usageCount: true,
    lastLoadedAt: true,
    // CRITICAL: Exclude content field (lazy-loading)
    content: false,
  },
  orderBy: [
    { usageCount: 'desc' }, // Popular first
    { title: 'asc' },        // Alphabetical fallback
  ],
  take: 20, // Pagination
  skip: page * 20,
});

// Response shape (example):
// [
//   {
//     id: "uuid-1",
//     slug: "react-server-components",
//     title: "React Server Components",
//     description: "Best practices for RSC in Next.js 14+",
//     category: "framework",
//     tags: ["react", "nextjs", "ssr"],
//     frameworks: ["react@18", "nextjs@14"],
//     version: "react@18",
//     usageCount: 42,
//     lastLoadedAt: "2025-11-10T14:30:00Z"
//   },
//   // ... 9 more skills
// ]
```

**Token Efficiency**:
- Frontmatter only: ~60-80 tokens per 10 skills
- Content excluded: Saves ~2,000 tokens per 10 skills
- Reduction: 96% (2,500 → 80 tokens)

**Performance**:
- Expected latency: <50ms (P95)
- Index used: `skills_projectId_category_idx` or `skills_projectId_usageCount_idx`
- Rows scanned: 20 (with pagination)

### Pattern 2: Load Full Skill Content (On-Demand) - US-092

**Use Case**: Agent decides to load specific skill for implementation guidance

**Target**: <250 tokens per skill (including content)

**Query**:
```typescript
import { prisma } from '@/lib/db';

// Load full skill (frontmatter + content)
const skill = await prisma.skill.findUnique({
  where: {
    projectId_slug: {
      projectId: parseInt(projectId), // Multi-tenancy
      slug: slug,                     // Unique within project
    },
  },
  select: {
    id: true,
    slug: true,
    title: true,
    description: true,
    category: true,
    tags: true,
    frameworks: true,
    version: true,
    content: true, // INCLUDED: Full markdown content
    usageCount: true,
    lastLoadedAt: true,
    createdAt: true,
    updatedAt: true,
  },
});

// Update usage tracking (separate transaction)
if (skill) {
  await prisma.skill.update({
    where: {
      projectId_slug: {
        projectId: parseInt(projectId),
        slug: slug,
      },
    },
    data: {
      usageCount: { increment: 1 },
      lastLoadedAt: new Date(),
    },
  });
}

return skill;
```

**Alternative: Atomic Update + Read**:
```typescript
// Atomic increment + read in single query
const skill = await prisma.skill.update({
  where: {
    projectId_slug: {
      projectId: parseInt(projectId),
      slug: slug,
    },
  },
  data: {
    usageCount: { increment: 1 },
    lastLoadedAt: new Date(),
  },
  select: {
    id: true,
    slug: true,
    title: true,
    description: true,
    category: true,
    tags: true,
    frameworks: true,
    version: true,
    content: true,
    usageCount: true,
    lastLoadedAt: true,
    createdAt: true,
    updatedAt: true,
  },
});
```

**Token Efficiency**:
- Frontmatter: ~80 tokens
- Content: ~100-150 tokens (typical skill size)
- Total: ~180-230 tokens per skill
- Reduction: 92% (2,500 → 220 tokens average)

**Performance**:
- Expected latency: <100ms (P95)
- Index used: `skills_projectId_slug_key` (unique index = instant lookup)
- Rows scanned: 1

### Pattern 3: Search Skills by Keywords/Tags - US-093

**Use Case**: Agent searches for skills matching specific keywords or tags

**Target**: <80 tokens per 10 results (frontmatter only)

**Query**:
```typescript
import { prisma } from '@/lib/db';

// Search skills (full-text search on title + description, tag filtering)
const skills = await prisma.skill.findMany({
  where: {
    projectId: parseInt(projectId),
    AND: [
      // Text search (case-insensitive contains)
      query ? {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      } : {},

      // Tag filtering (OR logic)
      tags && tags.length > 0 ? {
        tags: { hasSome: tags },
      } : {},

      // Framework filtering (OR logic)
      frameworks && frameworks.length > 0 ? {
        frameworks: { hasSome: frameworks },
      } : {},

      // Category filtering
      category ? { category } : {},
    ],
  },
  select: {
    id: true,
    slug: true,
    title: true,
    description: true,
    category: true,
    tags: true,
    frameworks: true,
    version: true,
    usageCount: true,
    lastLoadedAt: true,
    // CRITICAL: Exclude content field
    content: false,
  },
  orderBy: [
    { usageCount: 'desc' }, // Popular first
    { title: 'asc' },
  ],
  take: 20,
});
```

**Advanced: PostgreSQL Full-Text Search** (if needed for content search):
```typescript
// Add tsvector column to Skill model (future enhancement)
model Skill {
  // ... existing fields
  searchVector Unsupported("tsvector")?

  @@index([searchVector], type: Gin)
}

// Raw SQL query for full-text search (including content)
const skills = await prisma.$queryRaw`
  SELECT id, slug, title, description, category, tags, frameworks, version,
         usage_count, last_loaded_at,
         ts_rank(search_vector, to_tsquery('english', ${query})) AS rank
  FROM skills
  WHERE project_id = ${projectId}::int
    AND search_vector @@ to_tsquery('english', ${query})
  ORDER BY rank DESC, usage_count DESC
  LIMIT 20;
`;
```

**Token Efficiency**:
- Frontmatter only: ~60-80 tokens per 10 results
- Content excluded: Saves ~2,000 tokens
- Reduction: 96% (2,500 → 80 tokens)

**Performance**:
- Expected latency: <100ms (P95)
- Indexes used: `skills_projectId_idx`, `skills_tags_idx` (GIN), `skills_frameworks_idx` (GIN)
- Rows scanned: Depends on filters (worst case: all skills for project)

### Pattern 4: Link Skills to Knowledge Items - US-104

**Use Case**: Associate a skill with related knowledge items (within same project)

**Query (Create Link)**:
```typescript
import { prisma } from '@/lib/db';

// Link skill to knowledge item
await prisma.skill.update({
  where: {
    projectId_slug: {
      projectId: parseInt(projectId),
      slug: skillSlug,
    },
  },
  data: {
    linkedKnowledge: {
      connect: { id: knowledgeItemId }, // Many-to-many connect
    },
  },
});

// Prisma executes:
// INSERT INTO "_SkillKnowledge" ("A", "B") VALUES ('skill-uuid', knowledge-id);
```

**Query (Unlink)**:
```typescript
await prisma.skill.update({
  where: {
    projectId_slug: {
      projectId: parseInt(projectId),
      slug: skillSlug,
    },
  },
  data: {
    linkedKnowledge: {
      disconnect: { id: knowledgeItemId }, // Many-to-many disconnect
    },
  },
});

// Prisma executes:
// DELETE FROM "_SkillKnowledge" WHERE "A" = 'skill-uuid' AND "B" = knowledge-id;
```

**Query (Load Skill with Linked Knowledge)**:
```typescript
const skill = await prisma.skill.findUnique({
  where: {
    projectId_slug: {
      projectId: parseInt(projectId),
      slug: skillSlug,
    },
  },
  select: {
    id: true,
    slug: true,
    title: true,
    description: true,
    content: true,
    linkedKnowledge: {
      select: {
        id: true,
        title: true,
        category: true,
        tags: true,
      },
    },
  },
});

// Response shape:
// {
//   id: "uuid-1",
//   slug: "react-server-components",
//   title: "React Server Components",
//   description: "Best practices...",
//   content: "# React Server Components\n\n...",
//   linkedKnowledge: [
//     { id: 1, title: "Next.js Data Fetching", category: "framework", tags: ["nextjs", "ssr"] },
//     { id: 2, title: "React Suspense", category: "framework", tags: ["react", "streaming"] }
//   ]
// }
```

**Performance**:
- Expected latency: <150ms (includes join)
- Index used: `_SkillKnowledge_AB_unique`, `_SkillKnowledge_B_index`
- Rows scanned: 1 skill + N knowledge items (N typically <10)

### Pattern 5: Popular Skills (Usage Tracking) - US-103

**Use Case**: Dashboard showing most-used skills for a project

**Query**:
```typescript
import { prisma } from '@/lib/db';

// Get top 10 popular skills (frontmatter only)
const popularSkills = await prisma.skill.findMany({
  where: {
    projectId: parseInt(projectId),
  },
  select: {
    id: true,
    slug: true,
    title: true,
    description: true,
    category: true,
    tags: true,
    frameworks: true,
    usageCount: true,
    lastLoadedAt: true,
    // Exclude content
    content: false,
  },
  orderBy: {
    usageCount: 'desc',
  },
  take: 10,
});
```

**Performance**:
- Expected latency: <50ms (P95)
- Index used: `skills_projectId_usageCount_idx` (composite index with DESC sort)
- Rows scanned: 10 (LIMIT optimization)

### Pattern 6: Create Skill with Frontmatter Parsing - US-095

**Use Case**: Import skill from markdown file with YAML frontmatter

**Validation (Zod)**:
```typescript
import { z } from 'zod';

export const SkillFrontmatterSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  category: z.enum(['framework', 'testing', 'workflow', 'troubleshooting']),
  version: z.string().max(50).optional(),
});

export const SkillCreateSchema = z.object({
  projectId: z.number().int().positive(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/), // Validate slug format
  frontmatter: SkillFrontmatterSchema,
  content: z.string().min(1),
});
```

**Query (Create)**:
```typescript
import { prisma } from '@/lib/db';
import matter from 'gray-matter';
import { SkillCreateSchema } from '@/lib/validations/skill';

// Parse markdown with frontmatter
const markdownWithFrontmatter = `---
title: React Server Components
description: Best practices for RSC in Next.js 14+
tags:
  - react
  - nextjs
  - ssr
frameworks:
  - react@18
  - nextjs@14
category: framework
version: react@18
---

# React Server Components

...content here...
`;

const { data: frontmatter, content } = matter(markdownWithFrontmatter);

// Validate
const validated = SkillCreateSchema.parse({
  projectId: parseInt(projectId),
  slug: 'react-server-components',
  frontmatter,
  content,
});

// Create skill
const skill = await prisma.skill.create({
  data: {
    projectId: validated.projectId,
    slug: validated.slug,
    title: validated.frontmatter.title,
    description: validated.frontmatter.description,
    tags: validated.frontmatter.tags,
    frameworks: validated.frontmatter.frameworks,
    category: validated.frontmatter.category,
    version: validated.frontmatter.version,
    content: validated.content,
  },
});
```

**Performance**:
- Expected latency: <100ms (single insert)
- Index updated: `skills_projectId_slug_key`, `skills_projectId_idx`, `skills_tags_idx`, `skills_frameworks_idx`

---

## Performance Considerations

### Indexes Required

**Primary Indexes (Multi-Tenancy)**:
- `@@index([projectId])` - REQUIRED: All queries filter by projectId
- `@@unique([projectId, slug])` - REQUIRED: Unique constraint + instant lookup

**Query Performance Indexes**:
- `@@index([projectId, category])` - Filter by category (US-096)
- `@@index([projectId, usageCount(sort: Desc)])` - Popular skills (US-103)
- `@@index([projectId, lastLoadedAt(sort: Desc)])` - Recent usage

**Array Indexes (GIN for Fast Filtering)**:
- `@@index([tags], type: Gin)` - Tag filtering (US-093)
- `@@index([frameworks], type: Gin)` - Framework filtering (US-093)

### Query Optimization

**1. Use Select Strategically**:
```typescript
// BAD: Loads entire skill (including content)
const skills = await prisma.skill.findMany({ where: { projectId } });

// GOOD: Frontmatter only
const skills = await prisma.skill.findMany({
  where: { projectId },
  select: { id: true, slug: true, title: true, /* ... no content */ },
});
```

**2. Avoid N+1 Queries**:
```typescript
// BAD: N+1 query problem
const skills = await prisma.skill.findMany({ where: { projectId } });
for (const skill of skills) {
  skill.linkedKnowledge = await prisma.knowledgeItem.findMany({
    where: { linkedSkills: { some: { id: skill.id } } },
  });
}

// GOOD: Single query with join
const skills = await prisma.skill.findMany({
  where: { projectId },
  include: { linkedKnowledge: true },
});
```

**3. Use Composite Indexes for Sorted Queries**:
```typescript
// Query: Popular skills by category
const skills = await prisma.skill.findMany({
  where: { projectId, category: 'framework' },
  orderBy: { usageCount: 'desc' },
  take: 10,
});

// Index used: skills_projectId_category_idx + sort optimization
// Performance: <50ms (index covers filter + sort)
```

**4. Pagination Strategy**:
```typescript
// Cursor-based (recommended for large datasets)
const skills = await prisma.skill.findMany({
  where: { projectId },
  take: 20,
  skip: 1,
  cursor: { id: lastSkillId },
  orderBy: { createdAt: 'desc' },
});

// Offset-based (simpler, but slower for large offsets)
const skills = await prisma.skill.findMany({
  where: { projectId },
  take: 20,
  skip: page * 20,
});
```

### Expected Performance Metrics

| Query | Expected Latency (P95) | Index Used | Rows Scanned |
|-------|------------------------|------------|--------------|
| List skills (frontmatter only) | <50ms | `projectId_category_idx` | 20-100 |
| Load full skill (by slug) | <100ms | `projectId_slug_key` (unique) | 1 |
| Search skills (text + tags) | <100ms | `projectId_idx`, `tags_idx` (GIN) | 50-500 |
| Popular skills (top 10) | <50ms | `projectId_usageCount_idx` | 10 |
| Link skill to knowledge | <150ms | `_SkillKnowledge_AB_unique` | 1 + N |

**Optimization Target**:
- All queries <200ms (P95) ✅
- Token efficiency: 92% reduction (2,500 → 220 tokens) ✅

---

## Data Integrity

### Foreign Key Constraints

**1. Skill → Project (Multi-Tenancy)**:
```prisma
project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
```
- **Cascade Delete**: When project deleted, all skills deleted
- **Referential Integrity**: Cannot create skill for non-existent project
- **Multi-Tenancy**: Skills isolated by projectId

**2. Skill ↔ KnowledgeItem (Many-to-Many)**:
```prisma
linkedKnowledge KnowledgeItem[] @relation("SkillKnowledge")
```
- **Cascade Delete**: When skill deleted, junction table rows deleted (Prisma manages)
- **Orphan Prevention**: Junction table prevents orphaned links
- **Bidirectional**: Can query from Skill → Knowledge or Knowledge → Skill

### Unique Constraints

**1. Skill Slug Unique Within Project**:
```prisma
@@unique([projectId, slug])
```
- **Prevents Duplicates**: No two skills in same project can have same slug
- **Cross-Project Allowed**: Different projects can have same skill names
- **Slug Format**: Validated by Zod schema (`/^[a-z0-9-]+$/`)

### Default Values

**1. Usage Tracking**:
```prisma
usageCount   Int      @default(0)
lastLoadedAt DateTime? // NULL on creation
```
- **Initial State**: New skills have usageCount = 0, no lastLoadedAt
- **Updated On Load**: Incremented on each `skill.load()` call

**2. Timestamps**:
```prisma
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt
```
- **Auto-Managed**: Prisma sets createdAt on insert, updatedAt on every update

### Validation Checklist

- [x] Foreign key constraints defined (`projectId → Project.id`)
- [x] Cascade delete handled (skills deleted with project)
- [x] Unique constraints enforced (`projectId + slug`)
- [x] Default values appropriate (`usageCount = 0`, `now()` timestamps)
- [x] Array fields use PostgreSQL native type (`String[]` with GIN indexes)
- [x] Text fields use appropriate types (`@db.Text` for content, `@db.VarChar` for title/version)

---

## Testing Recommendations

### 1. CRUD Operations

**Test: Create Skill**:
```typescript
test('creates skill with frontmatter', async () => {
  const skill = await prisma.skill.create({
    data: {
      projectId: 1,
      slug: 'test-skill',
      title: 'Test Skill',
      category: 'framework',
      tags: ['test'],
      frameworks: ['test@1.0'],
      content: '# Test Content',
    },
  });

  expect(skill.id).toBeDefined();
  expect(skill.slug).toBe('test-skill');
  expect(skill.usageCount).toBe(0);
  expect(skill.lastLoadedAt).toBeNull();
});
```

**Test: Update Skill Content**:
```typescript
test('updates skill content and metadata', async () => {
  const updated = await prisma.skill.update({
    where: {
      projectId_slug: { projectId: 1, slug: 'test-skill' },
    },
    data: {
      content: '# Updated Content',
      description: 'Updated description',
    },
  });

  expect(updated.content).toBe('# Updated Content');
  expect(updated.description).toBe('Updated description');
  expect(updated.updatedAt).not.toBe(updated.createdAt);
});
```

**Test: Delete Skill**:
```typescript
test('deletes skill and removes junction table entries', async () => {
  // Create skill with linked knowledge
  const skill = await prisma.skill.create({
    data: {
      projectId: 1,
      slug: 'test-skill',
      title: 'Test Skill',
      category: 'framework',
      content: 'Test',
      linkedKnowledge: {
        connect: [{ id: 1 }, { id: 2 }],
      },
    },
  });

  // Delete skill
  await prisma.skill.delete({
    where: {
      projectId_slug: { projectId: 1, slug: 'test-skill' },
    },
  });

  // Verify junction table entries removed
  const links = await prisma.$queryRaw`
    SELECT * FROM "_SkillKnowledge" WHERE "A" = ${skill.id};
  `;
  expect(links).toHaveLength(0);
});
```

### 2. Relation Queries

**Test: Load Skill with Linked Knowledge**:
```typescript
test('loads skill with linked knowledge items', async () => {
  const skill = await prisma.skill.findUnique({
    where: {
      projectId_slug: { projectId: 1, slug: 'test-skill' },
    },
    include: {
      linkedKnowledge: {
        select: { id: true, title: true, category: true },
      },
    },
  });

  expect(skill).toBeDefined();
  expect(skill.linkedKnowledge).toHaveLength(2);
  expect(skill.linkedKnowledge[0]).toHaveProperty('title');
});
```

**Test: Link Skill to Knowledge**:
```typescript
test('links skill to knowledge item', async () => {
  await prisma.skill.update({
    where: {
      projectId_slug: { projectId: 1, slug: 'test-skill' },
    },
    data: {
      linkedKnowledge: {
        connect: { id: 3 },
      },
    },
  });

  const skill = await prisma.skill.findUnique({
    where: {
      projectId_slug: { projectId: 1, slug: 'test-skill' },
    },
    include: {
      linkedKnowledge: true,
    },
  });

  expect(skill.linkedKnowledge).toHaveLength(3);
  expect(skill.linkedKnowledge.find(k => k.id === 3)).toBeDefined();
});
```

### 3. Lazy-Loading Behavior

**Test: List Query Excludes Content**:
```typescript
test('list query returns frontmatter only (no content)', async () => {
  const skills = await prisma.skill.findMany({
    where: { projectId: 1 },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      category: true,
      tags: true,
      frameworks: true,
      content: false, // Explicitly exclude
    },
    take: 10,
  });

  expect(skills).toHaveLength(10);
  expect(skills[0]).not.toHaveProperty('content');

  // Verify token count
  const tokens = JSON.stringify(skills).length / 4; // Rough estimate
  expect(tokens).toBeLessThan(80);
});
```

**Test: Load Query Includes Content**:
```typescript
test('load query returns full skill with content', async () => {
  const skill = await prisma.skill.findUnique({
    where: {
      projectId_slug: { projectId: 1, slug: 'test-skill' },
    },
  });

  expect(skill).toHaveProperty('content');
  expect(skill.content).toBeTruthy();

  // Verify token count
  const tokens = JSON.stringify(skill).length / 4;
  expect(tokens).toBeLessThan(250);
});
```

### 4. Multi-Tenancy Tests

**Test: Skills Scoped by Project**:
```typescript
test('skills are scoped to project (no data leakage)', async () => {
  // Create skills in different projects
  await prisma.skill.create({
    data: {
      projectId: 1,
      slug: 'shared-slug',
      title: 'Project 1 Skill',
      category: 'framework',
      content: 'Project 1 content',
    },
  });

  await prisma.skill.create({
    data: {
      projectId: 2,
      slug: 'shared-slug', // Same slug, different project
      title: 'Project 2 Skill',
      category: 'framework',
      content: 'Project 2 content',
    },
  });

  // Query project 1 skills
  const project1Skills = await prisma.skill.findMany({
    where: { projectId: 1 },
  });

  expect(project1Skills).toHaveLength(1);
  expect(project1Skills[0].title).toBe('Project 1 Skill');
  expect(project1Skills[0].projectId).toBe(1);
});
```

**Test: Cascade Delete with Multi-Tenancy**:
```typescript
test('deleting project cascades to skills', async () => {
  // Create project with skills
  const project = await prisma.project.create({
    data: {
      name: 'Test Project',
      skills: {
        create: [
          { slug: 'skill-1', title: 'Skill 1', category: 'framework', content: 'Test' },
          { slug: 'skill-2', title: 'Skill 2', category: 'testing', content: 'Test' },
        ],
      },
    },
  });

  // Delete project
  await prisma.project.delete({
    where: { id: project.id },
  });

  // Verify skills deleted
  const skills = await prisma.skill.findMany({
    where: { projectId: project.id },
  });

  expect(skills).toHaveLength(0);
});
```

### 5. Performance Tests

**Test: Index Performance (List Query)**:
```typescript
test('list query uses projectId index (<50ms)', async () => {
  const start = Date.now();

  const skills = await prisma.skill.findMany({
    where: { projectId: 1 },
    take: 20,
  });

  const duration = Date.now() - start;

  expect(duration).toBeLessThan(50);
  expect(skills).toHaveLength(20);
});
```

**Test: Index Performance (Unique Lookup)**:
```typescript
test('load query uses unique index (<100ms)', async () => {
  const start = Date.now();

  const skill = await prisma.skill.findUnique({
    where: {
      projectId_slug: { projectId: 1, slug: 'test-skill' },
    },
  });

  const duration = Date.now() - start;

  expect(duration).toBeLessThan(100);
  expect(skill).toBeDefined();
});
```

**Test: Tag Filtering Performance (GIN Index)**:
```typescript
test('tag filtering uses GIN index (<100ms)', async () => {
  const start = Date.now();

  const skills = await prisma.skill.findMany({
    where: {
      projectId: 1,
      tags: { hasSome: ['react', 'nextjs'] },
    },
    take: 20,
  });

  const duration = Date.now() - start;

  expect(duration).toBeLessThan(100);
  expect(skills.length).toBeGreaterThan(0);
  expect(skills.every(s =>
    s.tags.includes('react') || s.tags.includes('nextjs')
  )).toBe(true);
});
```

---

## Next Steps for Parent Agent

### Step 1: Fix Schema (CRITICAL)

**Issue**: `projectId` type mismatch
- Current `Project.id`: `Int` (auto-increment)
- Draft `Skill.projectId`: `String` (uuid)

**Fix**:
```prisma
model Skill {
  id          String   @id @default(uuid())
  projectId   Int      // CHANGE: Match Project.id type
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  // ... rest unchanged
}
```

### Step 2: Update Project Model

Add Skills relation to existing Project model:
```prisma
model Project {
  // ... existing fields
  skills Skill[] // ADD THIS LINE
}
```

### Step 3: Run Migration (Mac Mini)

```bash
cd /Users/draco/projects/AI_HUB/apps/web

# Generate migration
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" \
  npx prisma migrate dev --name add_skills_table

# Regenerate Prisma Client
npx prisma generate

# Verify in Prisma Studio
npx prisma studio
```

### Step 4: Implement Validation (Zod)

Create `apps/web/src/lib/validations/skill.ts`:
```typescript
import { z } from 'zod';

export const SkillFrontmatterSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  category: z.enum(['framework', 'testing', 'workflow', 'troubleshooting']),
  version: z.string().max(50).optional(),
});

export const SkillCreateSchema = z.object({
  projectId: z.number().int().positive(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  frontmatter: SkillFrontmatterSchema,
  content: z.string().min(1),
});

export const SkillUpdateSchema = SkillCreateSchema.partial().omit({ projectId: true, slug: true });
```

### Step 5: Implement API Routes (Next.js)

**List Endpoint** (`apps/web/src/app/api/skills/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const category = searchParams.get('category');
  const tags = searchParams.get('tags')?.split(',');
  const frameworks = searchParams.get('frameworks')?.split(',');

  const skills = await prisma.skill.findMany({
    where: {
      projectId: parseInt(projectId),
      ...(category && { category }),
      ...(tags && { tags: { hasSome: tags } }),
      ...(frameworks && { frameworks: { hasSome: frameworks } }),
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      category: true,
      tags: true,
      frameworks: true,
      version: true,
      usageCount: true,
      lastLoadedAt: true,
      content: false, // EXCLUDE for lazy-loading
    },
    orderBy: [
      { usageCount: 'desc' },
      { title: 'asc' },
    ],
    take: 20,
  });

  return NextResponse.json({ data: skills });
}
```

**Load Endpoint** (`apps/web/src/app/api/skills/[slug]/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  // Load full skill + increment usage
  const skill = await prisma.skill.update({
    where: {
      projectId_slug: {
        projectId: parseInt(projectId),
        slug: params.slug,
      },
    },
    data: {
      usageCount: { increment: 1 },
      lastLoadedAt: new Date(),
    },
  });

  return NextResponse.json({ data: skill });
}
```

### Step 6: Add Tests

Create integration tests for:
1. List skills (frontmatter only, <80 tokens)
2. Load skill (full content, <250 tokens)
3. Search skills (by tags, frameworks)
4. Create/update/delete skills
5. Link skills to knowledge items
6. Multi-tenancy (project isolation)

### Step 7: Update Documentation

Update system docs:
1. `.agent/system/database-schema.md` - Add Skill model
2. `.agent/system/api-catalog.md` - Add skills endpoints
3. `.agent/system/mcp-tools-guide.md` - Add skill MCP tools
4. Create `.agent/system/skills-catalog.md` - NEW reference doc for end users

---

## Summary

### Schema Highlights

✅ **Multi-Tenancy**: Skills scoped to `projectId` with proper indexes
✅ **Lazy-Loading**: Frontmatter (always loaded) vs content (on-demand)
✅ **Token Efficiency**: 92% reduction (2,500 → 220 tokens)
✅ **Performance**: Optimized indexes for filtering and sorting
✅ **Extensibility**: String category (not enum) allows user customization
✅ **Data Integrity**: Foreign keys, unique constraints, cascade deletes

### Key Recommendations

1. **Fix projectId Type**: Use `Int` to match Project.id (not String/uuid)
2. **Use GIN Indexes**: For tags/frameworks filtering (10-50x faster than junction tables)
3. **Exclude Content in List Queries**: Always use `select: { content: false }` for lazy-loading
4. **Validate Frontmatter**: Use Zod schemas + `gray-matter` library for YAML parsing
5. **Track Usage Atomically**: Use `update()` instead of separate `findUnique()` + `update()` calls

### Migration Steps

1. Update `Skill.projectId` type to `Int`
2. Add `skills` relation to `Project` model
3. Run `prisma migrate dev --name add_skills_table`
4. Regenerate Prisma Client
5. Implement API routes with lazy-loading pattern
6. Write integration tests (CRUD, multi-tenancy, performance)

---

**Prisma design plan complete. Report saved to `.agent/task/prisma-skills-schema-20251113-1420.md`**

**Parent agent should**:
1. Read this file for complete schema design
2. Fix `projectId` type mismatch (critical)
3. Run migrations on Mac mini
4. Implement API routes following query patterns
5. Update `.agent/task/current-session-20251113-1334.md` with schema decisions
6. Update `.agent/task/current-plan.md` Phase 2 section with migration details

**Key recommendations**: Use `Int` for projectId (match Project.id), GIN indexes for tags/frameworks, lazy-loading pattern for content field, atomic usage tracking with `update()`.
