# 02 - Moksha DevHub: Complete Database Schema

**Version:** 1.1 - Week 15 Extensions  
**Last Updated:** October 29, 2025  
**Status:** Production Ready ✅

---

## 🎯 Overview

This document contains the **complete** Prisma schema for Moksha DevHub, including all models, relationships, indexes, and PostgreSQL-specific features.

**Database:** PostgreSQL 16  
**ORM:** Prisma 5.x  
**Extensions:** pgvector, pg_trgm

---

## 📊 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE SCHEMA                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CORE ENTITIES                                                  │
│  ├── Project (1) ──────────< Issue (*) ────────> Label (*)     │
│  │                             │                                 │
│  │                             ├──────> Comment (*)             │
│  │                             ├──────> Attachment (*)          │
│  │                             └──────> LinkedFile (*)          │
│  │                                                               │
│  ├── KnowledgeItem (1) ──────> Tag (*)                          │
│  │      │                                                        │
│  │      └──────> KnowledgeLink (issue/wiki)                     │
│  │                                                               │
│  ├── WikiPage (tree structure)                                  │
│  │      ├── parent ──────> WikiPage (recursive)                 │
│  │      ├── children ─────> WikiPage (*) (recursive)           │
│  │      └── links ────────> PageLink (*)                        │
│  │                                                               │
│  ├── SecurityFinding (1) ──> Issue (optional)                   │
│  │                                                               │
│  └── AgentPersona (1) ────> PromptTemplate (*)                  │
│         │                                                        │
│         └──────> AgentSession (*) (usage tracking)              │
│                                                                  │
│  FUTURE (Phase 4+)                                              │
│  ├── Milestone (1) ────────> Issue (*)                          │
│  ├── Sprint (1) ───────────> Issue (*)                          │
│  ├── ADR (Architecture Decision Record)                         │
│  └── TimeEntry (1) ────────> Issue (1)                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📝 Complete Prisma Schema

### schema.prisma

```prisma
// Prisma schema for Moksha DevHub
// Database: PostgreSQL 16
// Features: JSONB, Full-text search, Vector embeddings

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// CORE ENTITIES: PROJECT & ISSUES
// ============================================================================

model Project {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?  @db.Text
  repository  String?  // Git repository URL

  issues      Issue[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([name])
}

model Issue {
  id            Int       @id @default(autoincrement())

  // Core fields
  title         String
  description   String?   @db.Text
  status        String    @default("open")
  priority      String    @default("medium")
  module        String?   // Combat, Core, UI, Systems, World, Creatures
  assignee      String?

  // Custom fields (flexible schema)
  customFields  Json?     @db.JsonB

  // Full-text search
  searchVector  Unsupported("tsvector")?

  // Semantic search (pgvector embeddings - 384 dimensions)
  embedding     Unsupported("vector(384)")?

  // Relationships
  projectId     Int
  project       Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)

  labels        Label[]
  comments      Comment[]
  attachments   Attachment[]
  linkedFiles   LinkedFile[]
  linkedCommits LinkedCommit[]

  // Knowledge & Wiki links
  linkedKnowledge KnowledgeLink[] @relation("IssueKnowledge")
  linkedWikiPages WikiPageLink[]  @relation("IssueWiki")

  // Security findings
  securityFinding SecurityFinding?

  // Time tracking (Phase 4)
  timeEntries   TimeEntry[]

  // Milestones (Phase 4)
  milestoneId   Int?
  milestone     Milestone?  @relation(fields: [milestoneId], references: [id])

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  closedAt      DateTime?

  @@index([status])
  @@index([priority])
  @@index([module])
  @@index([projectId])
  @@index([assignee])
  @@index([createdAt(sort: Desc)])
  @@index([milestoneId])

  // JSONB indexes for custom fields
  @@index([customFields], type: Gin)

  // Full-text search index
  @@index([searchVector], type: Gin)

  // Semantic search index (HNSW for fast vector similarity)
  @@index([embedding], type: Hnsw)
}

model Label {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  color     String   @default("#808080")

  issues    Issue[]

  createdAt DateTime @default(now())

  @@index([name])
}

model Comment {
  id        Int      @id @default(autoincrement())
  content   String   @db.Text
  author    String?

  issueId   Int
  issue     Issue    @relation(fields: [issueId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([issueId])
  @@index([createdAt(sort: Desc)])
}

model Attachment {
  id          Int      @id @default(autoincrement())
  filename    String
  filepath    String
  mimetype    String
  size        Int      // bytes

  issueId     Int
  issue       Issue    @relation(fields: [issueId], references: [id], onDelete: Cascade)

  uploadedAt  DateTime @default(now())

  @@index([issueId])
}

model LinkedFile {
  id          Int      @id @default(autoincrement())
  filePath    String   // Relative path from project root
  lineNumber  Int?

  issueId     Int
  issue       Issue    @relation(fields: [issueId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())

  @@unique([issueId, filePath])
  @@index([filePath])
}

model LinkedCommit {
  id          Int      @id @default(autoincrement())
  commitHash  String   // Git commit hash
  commitMessage String?
  commitDate  DateTime?

  issueId     Int
  issue       Issue    @relation(fields: [issueId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())

  @@unique([issueId, commitHash])
  @@index([commitHash])
}

// ============================================================================
// KNOWLEDGE BASE
// ============================================================================

model KnowledgeItem {
  id          Int       @id @default(autoincrement())

  title       String
  content     String    @db.Text
  category    String?

  // Tags (array)
  tags        String[]

  // Semantic search embedding
  embedding   Unsupported("vector(384)")?  // all-MiniLM-L6-v2 dimensions

  // Full-text search
  searchVector Unsupported("tsvector")?

  // Links to issues/wiki
  linkedIssues KnowledgeLink[] @relation("KnowledgeIssue")

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([category])
  @@index([tags], type: Gin)
  @@index([searchVector], type: Gin)

  // Vector similarity search index (HNSW)
  @@index([embedding], type: Hnsw, ops: VectorCosineOps)
}

model KnowledgeLink {
  id              Int             @id @default(autoincrement())

  knowledgeItemId Int
  knowledgeItem   KnowledgeItem   @relation("KnowledgeIssue", fields: [knowledgeItemId], references: [id], onDelete: Cascade)

  issueId         Int
  issue           Issue           @relation("IssueKnowledge", fields: [issueId], references: [id], onDelete: Cascade)

  createdAt       DateTime        @default(now())

  @@unique([knowledgeItemId, issueId])
  @@index([knowledgeItemId])
  @@index([issueId])
}

// ============================================================================
// DOCUMENTATION WIKI
// ============================================================================

model WikiPage {
  id            Int       @id @default(autoincrement())

  title         String
  content       String    @db.Text

  // Week 15 Extended Fields
  category      String?   // Category for organization (e.g., "Rules", "Combat", "Systems")

  // Hierarchical structure
  parentId      Int?
  parent        WikiPage? @relation("PageHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children      WikiPage[] @relation("PageHierarchy")

  // URL path (e.g., /rules/combat/fsm-authority)
  path          String    @unique
  orderIndex    Int       @default(0)

  // Full-text search
  searchVector  Unsupported("tsvector")?

  // Links
  outgoingLinks PageLink[] @relation("SourcePage")
  incomingLinks PageLink[] @relation("TargetPage")

  // Issue links
  linkedIssues  WikiPageLink[] @relation("WikiIssue")

  // Version history (simplified - Phase 3)
  version       Int       @default(1)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([path])
  @@index([parentId])
  @@index([orderIndex])
  @@index([searchVector], type: Gin)
}

model PageLink {
  id            Int       @id @default(autoincrement())

  sourcePageId  Int
  sourcePage    WikiPage  @relation("SourcePage", fields: [sourcePageId], references: [id], onDelete: Cascade)

  targetPageId  Int
  targetPage    WikiPage  @relation("TargetPage", fields: [targetPageId], references: [id], onDelete: Cascade)

  linkType      String?   // 'reference', 'related', 'example'

  createdAt     DateTime  @default(now())

  @@unique([sourcePageId, targetPageId])
  @@index([sourcePageId])
  @@index([targetPageId])
}

model WikiPageLink {
  id          Int       @id @default(autoincrement())

  wikiPageId  Int
  wikiPage    WikiPage  @relation("WikiIssue", fields: [wikiPageId], references: [id], onDelete: Cascade)

  issueId     Int
  issue       Issue     @relation("IssueWiki", fields: [issueId], references: [id], onDelete: Cascade)

  createdAt   DateTime  @default(now())

  @@unique([wikiPageId, issueId])
  @@index([wikiPageId])
  @@index([issueId])
}

// ============================================================================
// SECURITY DASHBOARD
// ============================================================================

model SecurityFinding {
  id            Int       @id @default(autoincrement())

  // Semgrep data
  ruleId        String
  severity      String    // ERROR, WARNING, INFO
  message       String    @db.Text
  filePath      String
  lineNumber    Int
  codeSnippet   String?   @db.Text

  // Status
  status        String    @default("open")  // open, false_positive, fixed

  // Optional link to issue
  issueId       Int?      @unique
  issue         Issue?    @relation(fields: [issueId], references: [id], onDelete: SetNull)

  // Metadata
  scanDate      DateTime  @default(now())
  fixedAt       DateTime?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([ruleId])
  @@index([severity])
  @@index([status])
  @@index([filePath])
  @@index([scanDate(sort: Desc)])
}

// ============================================================================
// SYSTEM CONFIGURATION
// ============================================================================

model Setting {
  key       String   @id
  value     Json     @db.JsonB
  category  String   // 'search', 'security', 'features', 'mcp'
  description String? @db.Text

  updatedAt DateTime @updatedAt
  updatedBy String?  // Track who changed it (future: user system)

  @@index([category])
}

// ============================================================================
// AGENT PERSONAS
// ============================================================================

model AgentPersona {
  id              Int       @id @default(autoincrement())

  name            String    @unique
  slug            String    @unique  // For slash commands: /code-reviewer
  icon            String?   // Emoji or icon name
  description     String?   @db.Text

  // Week 15 Extended Fields
  isActive        Boolean   @default(false)  // Active/inactive status
  expertise       String[]  // Areas of expertise
  personality     String?   @db.Text  // Personality traits

  // System prompt
  systemPrompt    String    @db.Text

  // Skills/capabilities
  skills          String[]  // e.g., ["debugging", "security", "architecture"]

  // MCP tools this persona can use
  tools           String[]  // e.g., ["create_issue", "search_knowledge"]

  // Rules/guidelines
  rules           String[]  // e.g., ["Always cite SoT rules", "Suggest tests"]

  // Auto-activation
  autoActivate    Boolean   @default(false)
  activationConditions Json? @db.JsonB  // { filePatterns: ["*.cpp"], keywords: ["review"] }

  // Template usage
  templateId      Int?
  template        PromptTemplate? @relation(fields: [templateId], references: [id])

  // Usage tracking
  sessions        AgentSession[]

  // Built-in vs custom
  isBuiltIn       Boolean   @default(false)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([slug])
  @@index([isBuiltIn])
}

model PromptTemplate {
  id              Int       @id @default(autoincrement())

  name            String    @unique
  description     String?   @db.Text

  // Template content (can have variables)
  content         String    @db.Text

  // Variables used in template
  variables       String[]  // e.g., ["module", "context", "rules"]

  // Category
  category        String?   // "code-review", "debugging", "documentation"

  // Usage
  personas        AgentPersona[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([category])
}

model AgentSession {
  id              Int       @id @default(autoincrement())

  personaId       Int
  persona         AgentPersona @relation(fields: [personaId], references: [id], onDelete: Cascade)

  // Session metadata
  activatedBy     String?   // How it was activated: "slash_command", "auto", "cmd_k"
  context         Json?     @db.JsonB  // Context at activation time

  // Metrics
  duration        Int?      // seconds
  toolCalls       Int       @default(0)
  issuesCreated   Int       @default(0)

  startedAt       DateTime  @default(now())
  endedAt         DateTime?

  @@index([personaId])
  @@index([startedAt(sort: Desc)])
}

// ============================================================================
// PHASE 4 FEATURES
// ============================================================================

model Milestone {
  id          Int       @id @default(autoincrement())

  title       String
  description String?   @db.Text

  // Dates
  startDate   DateTime?
  dueDate     DateTime?
  completedAt DateTime?

  // Status
  status      String    @default("planned")  // planned, active, completed

  // Issues
  issues      Issue[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([status])
  @@index([dueDate])
}

model TimeEntry {
  id          Int       @id @default(autoincrement())

  issueId     Int
  issue       Issue     @relation(fields: [issueId], references: [id], onDelete: Cascade)

  duration    Int       // minutes
  note        String?   @db.Text

  startedAt   DateTime
  endedAt     DateTime

  createdAt   DateTime  @default(now())

  @@index([issueId])
  @@index([startedAt(sort: Desc)])
}

model ADR {
  id            Int       @id @default(autoincrement())

  title         String
  content       String    @db.Text

  // Status
  status        String    @default("proposed")  // proposed, accepted, deprecated, superseded

  // Superseded by
  supersededById Int?
  supersededBy   ADR?     @relation("ADRSuperseded", fields: [supersededById], references: [id])
  supersedes     ADR[]    @relation("ADRSuperseded")

  // Dates
  proposedDate  DateTime  @default(now())
  decidedDate   DateTime?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([status])
  @@index([decidedDate(sort: Desc)])
}

// ============================================================================
// ENUMS (defined as strings in models, but documented here)
// ============================================================================

// Issue.status: open, in-progress, blocked, review, closed
// Issue.priority: low, medium, high, critical
// Issue.module: Combat, Core, UI, Systems, World, Creatures

// SecurityFinding.severity: ERROR, WARNING, INFO
// SecurityFinding.status: open, false_positive, fixed

// Milestone.status: planned, active, completed

// ADR.status: proposed, accepted, deprecated, superseded
```

---

## 🔧 PostgreSQL Extensions Setup

### Required Extensions

```sql
-- Enable pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable UUID generation (optional, for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 🔍 Full-Text Search Setup

### Creating tsvector Columns

```sql
-- Issues table
ALTER TABLE "Issue"
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english',
    title || ' ' || COALESCE(description, '')
  )
) STORED;

CREATE INDEX idx_issues_search ON "Issue" USING GIN(search_vector);

-- Knowledge items table
ALTER TABLE "KnowledgeItem"
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english',
    title || ' ' || content
  )
) STORED;

CREATE INDEX idx_knowledge_search ON "KnowledgeItem" USING GIN(search_vector);

-- Wiki pages table
ALTER TABLE "WikiPage"
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english',
    title || ' ' || content
  )
) STORED;

CREATE INDEX idx_wiki_search ON "WikiPage" USING GIN(search_vector);
```

### Full-Text Search Queries

```typescript
// Search issues
const issues = await prisma.$queryRaw<Issue[]>`
  SELECT *, 
         ts_rank(search_vector, plainto_tsquery('english', ${query})) as rank
  FROM "Issue"
  WHERE search_vector @@ plainto_tsquery('english', ${query})
  ORDER BY rank DESC
  LIMIT 20;
`;

// Search with highlighting
const issues = await prisma.$queryRaw`
  SELECT *,
         ts_headline('english', description, plainto_tsquery('english', ${query})) as highlighted
  FROM "Issue"
  WHERE search_vector @@ plainto_tsquery('english', ${query});
`;
```

---

## 🧠 Vector Embeddings Setup

### Creating Vector Columns

```sql
-- Knowledge items table (384 dimensions for all-MiniLM-L6-v2)
ALTER TABLE "KnowledgeItem"
ADD COLUMN embedding vector(384);

-- Create HNSW index for fast similarity search
CREATE INDEX idx_knowledge_embedding ON "KnowledgeItem"
USING hnsw (embedding vector_cosine_ops);
```

### Vector Search Queries

```typescript
// Semantic search
const queryEmbedding = await generateEmbedding(query);

const results = await prisma.$queryRaw<KnowledgeItem[]>`
  SELECT *,
         1 - (embedding <=> ${queryEmbedding}::vector) as similarity
  FROM "KnowledgeItem"
  WHERE embedding IS NOT NULL
    AND 1 - (embedding <=> ${queryEmbedding}::vector) > 0.7
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 10;
`;
```

---

## 📊 JSONB Custom Fields

### Querying Custom Fields

```typescript
// Find issues by custom field
const issues = await prisma.issue.findMany({
  where: {
    customFields: {
      path: ['epic'],
      equals: 'Combat Overhaul',
    },
  },
});

// Find issues with custom field containing value
const issues = await prisma.issue.findMany({
  where: {
    customFields: {
      path: ['affectedModules'],
      array_contains: 'Combat',
    },
  },
});

// Complex JSONB query
const issues = await prisma.$queryRaw`
  SELECT * FROM "Issue"
  WHERE custom_fields @> '{"epic": "Combat Overhaul"}'
    AND (custom_fields->>'estimatedHours')::int > 5;
`;
```

### Indexing Custom Fields

```sql
-- Index specific custom field
CREATE INDEX idx_issues_custom_epic ON "Issue" ((custom_fields->>'epic'));

-- Index for containment queries
CREATE INDEX idx_issues_custom_fields ON "Issue" USING GIN(custom_fields);
```

---

## 🔄 Migration Strategy

### Initial Setup

```bash
# Install Prisma
pnpm add -D prisma
pnpm add @prisma/client

# Initialize Prisma
pnpm prisma init

# Edit schema.prisma (copy from above)

# Create initial migration
pnpm prisma migrate dev --name init

# Generate Prisma Client
pnpm prisma generate
```

### Adding Extensions After Migration

```sql
-- Run these SQL commands after initial migration
-- File: prisma/migrations/XXXXXX_add_extensions/migration.sql

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add tsvector columns (generated columns)
ALTER TABLE "Issue"
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english', title || ' ' || COALESCE(description, ''))
) STORED;

-- Add vector columns
ALTER TABLE "KnowledgeItem"
ADD COLUMN embedding vector(384);

-- Create indexes
CREATE INDEX idx_issues_search ON "Issue" USING GIN(search_vector);
CREATE INDEX idx_knowledge_search ON "KnowledgeItem" USING GIN(search_vector);
CREATE INDEX idx_knowledge_embedding ON "KnowledgeItem"
USING hnsw (embedding vector_cosine_ops);
```

### Handling Unsupported Types in Prisma

```prisma
// For types Prisma doesn't natively support, use Unsupported()
model Issue {
  searchVector Unsupported("tsvector")?
}

model KnowledgeItem {
  embedding Unsupported("vector(384)")?
}
```

**Note:** These fields won't have TypeScript types, so you'll use raw queries for them.

---

## 🌱 Seeding Data

### seed.ts

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default project
  const project = await prisma.project.upsert({
    where: { name: 'Moksha Mythic Clash' },
    update: {},
    create: {
      name: 'Moksha Mythic Clash',
      description: 'Main game project',
      repository: 'https://github.com/yourusername/moksha',
    },
  });

  console.log('Created project:', project);

  // Create default labels
  const labels = await prisma.label.createMany({
    data: [
      { name: 'bug', color: '#d73a4a' },
      { name: 'enhancement', color: '#a2eeef' },
      { name: 'documentation', color: '#0075ca' },
      { name: 'fsm', color: '#fef2c0' },
      { name: 'combat', color: '#ff6b6b' },
      { name: 'animation', color: '#4ecdc4' },
    ],
    skipDuplicates: true,
  });

  console.log('Created labels:', labels.count);

  // Create default personas
  const personas = await prisma.agentPersona.createMany({
    data: [
      {
        name: 'Code Reviewer',
        slug: 'code-reviewer',
        icon: '🔍',
        description: 'Critical code analysis with focus on bugs and SoT compliance',
        systemPrompt: `You are an expert code reviewer for the Moksha project. Focus on:
- Security vulnerabilities
- SoT rule violations
- Code quality and patterns
- Performance issues
Always cite specific rules when suggesting changes.`,
        skills: ['security', 'patterns', 'architecture', 'debugging'],
        tools: ['create_issue', 'search_knowledge', 'query_sot_rules'],
        rules: [
          'Always cite specific SoT rules',
          'Check for security vulnerabilities',
          'Look for violations of module dependencies',
          'Suggest concrete improvements with examples',
        ],
        isBuiltIn: true,
        autoActivate: true,
        activationConditions: {
          filePatterns: ['*.cpp', '*.h'],
          keywords: ['review', 'check'],
        },
      },
      {
        name: 'Bug Hunter',
        slug: 'bug-hunter',
        icon: '🐛',
        description: 'Root cause analysis and debugging specialist',
        systemPrompt: `You are a debugging specialist. Your goal is to find root causes, not symptoms.`,
        skills: ['debugging', 'root-cause-analysis', 'testing'],
        tools: ['search_issues', 'create_issue', 'search_knowledge'],
        rules: [
          'Always reproduce the bug first',
          'Identify root cause, not symptoms',
          'Suggest tests to prevent regression',
        ],
        isBuiltIn: true,
      },
      // ... more personas
    ],
    skipDuplicates: true,
  });

  console.log('Created personas:', personas.count);

  // Create sample issue
  const issue = await prisma.issue.create({
    data: {
      title: 'Example Issue',
      description: 'This is an example issue to demonstrate the system.',
      status: 'open',
      priority: 'medium',
      module: 'Combat',
      projectId: project.id,
      customFields: {
        epic: 'Setup',
        estimatedHours: 2,
      },
      labels: {
        connect: [{ name: 'bug' }, { name: 'combat' }],
      },
    },
  });

  console.log('Created sample issue:', issue);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Running Seed

```bash
# Add to package.json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}

# Run seed
pnpm prisma db seed
```

---

## 🔐 Database Security

### Connection String

```env
# .env
DATABASE_URL="postgresql://moksha:password@localhost:5432/moksha_devhub?schema=public"
```

**Security Notes:**

- Use strong passwords
- Don't commit .env to git
- PostgreSQL only accessible from localhost (Docker internal network)
- No external database access needed

### Row-Level Security (Future)

```sql
-- If multi-user support is added later
ALTER TABLE "Issue" ENABLE ROW LEVEL SECURITY;

CREATE POLICY issue_policy ON "Issue"
  FOR ALL
  TO authenticated_user
  USING (assignee = current_user);
```

---

## 📈 Performance Optimization

### Key Indexes

```sql
-- Issues
CREATE INDEX idx_issues_status ON "Issue"(status);
CREATE INDEX idx_issues_priority ON "Issue"(priority);
CREATE INDEX idx_issues_module ON "Issue"(module);
CREATE INDEX idx_issues_created_desc ON "Issue"(created_at DESC);
CREATE INDEX idx_issues_assignee ON "Issue"(assignee) WHERE assignee IS NOT NULL;

-- Composite indexes
CREATE INDEX idx_issues_status_priority ON "Issue"(status, priority);
CREATE INDEX idx_issues_module_status ON "Issue"(module, status);

-- Partial indexes
CREATE INDEX idx_open_issues ON "Issue"(created_at DESC) WHERE status = 'open';
CREATE INDEX idx_high_priority ON "Issue"(created_at DESC) WHERE priority = 'high' OR priority = 'critical';

-- JSONB indexes
CREATE INDEX idx_issues_custom_fields ON "Issue" USING GIN(custom_fields);
CREATE INDEX idx_issues_custom_epic ON "Issue" ((custom_fields->>'epic'));
```

### Query Performance Tips

1. **Use Prisma's include wisely**

   ```typescript
   // Good: Only include what you need
   const issues = await prisma.issue.findMany({
     include: {
       labels: true,
       _count: { select: { comments: true } },
     },
   });

   // Bad: Including everything
   const issues = await prisma.issue.findMany({
     include: {
       labels: true,
       comments: true, // Could be thousands!
       attachments: true,
       linkedFiles: true,
       // ...
     },
   });
   ```

2. **Paginate large result sets**

   ```typescript
   const issues = await prisma.issue.findMany({
     take: 20,
     skip: (page - 1) * 20,
     orderBy: { createdAt: 'desc' },
   });
   ```

3. **Use raw queries for complex searches**
   ```typescript
   // Complex hybrid search
   const results = await prisma.$queryRaw`
     WITH text_results AS (
       SELECT id, title, ts_rank(search_vector, query) as rank
       FROM "Issue", plainto_tsquery('english', ${query}) query
       WHERE search_vector @@ query
     ),
     vector_results AS (
       SELECT id, title, 1 - (embedding <=> ${embedding}::vector) as similarity
       FROM "KnowledgeItem"
       WHERE 1 - (embedding <=> ${embedding}::vector) > 0.7
     )
     SELECT * FROM text_results
     UNION ALL
     SELECT * FROM vector_results
     ORDER BY rank DESC, similarity DESC
     LIMIT 20;
   `;
   ```

---

## 🧪 Testing Database Schema

### Testing Relationships

```typescript
// tests/database/relationships.test.ts
test('issue with labels and comments', async () => {
  const project = await prisma.project.create({
    data: { name: 'Test Project' },
  });

  const issue = await prisma.issue.create({
    data: {
      title: 'Test Issue',
      projectId: project.id,
      labels: {
        create: [{ name: 'test-label', color: '#ff0000' }],
      },
      comments: {
        create: [{ content: 'Test comment', author: 'Tester' }],
      },
    },
    include: {
      labels: true,
      comments: true,
    },
  });

  expect(issue.labels).toHaveLength(1);
  expect(issue.comments).toHaveLength(1);
});
```

### Testing Full-Text Search

```typescript
test('full-text search finds issues', async () => {
  await prisma.issue.create({
    data: {
      title: 'FSM Authority Bug',
      description: 'The combat FSM violates authority rules',
      projectId: 1,
    },
  });

  const results = await prisma.$queryRaw`
    SELECT * FROM "Issue"
    WHERE search_vector @@ plainto_tsquery('english', 'fsm authority');
  `;

  expect(results).toHaveLength(1);
});
```

---

## 🔄 Schema Evolution

### Adding New Fields

```bash
# 1. Update schema.prisma
model Issue {
  // ... existing fields
  estimatedHours Int?  // New field
}

# 2. Create migration
pnpm prisma migrate dev --name add_estimated_hours

# 3. Update seed if needed
```

### Renaming Fields

```bash
# Prisma doesn't auto-detect renames, so do it manually:

# 1. Create empty migration
pnpm prisma migrate dev --create-only --name rename_field

# 2. Edit migration SQL
ALTER TABLE "Issue" RENAME COLUMN old_name TO new_name;

# 3. Apply migration
pnpm prisma migrate dev
```

### Adding Indexes

```bash
# 1. Add to schema.prisma
model Issue {
  @@index([newField])
}

# 2. Create migration
pnpm prisma migrate dev --name add_new_index
```

---

## 📊 Database Size Estimates

### MVP (Phase 1)

| Table       | Rows  | Size           |
| ----------- | ----- | -------------- |
| Issues      | 1,000 | ~5 MB          |
| Comments    | 5,000 | ~10 MB         |
| Attachments | 500   | ~50 MB (files) |
| Labels      | 50    | ~10 KB         |
| **Total**   |       | **~65 MB**     |

### Full System (1 year)

| Table             | Rows   | Size                       |
| ----------------- | ------ | -------------------------- |
| Issues            | 5,000  | ~25 MB                     |
| Comments          | 25,000 | ~50 MB                     |
| Attachments       | 2,500  | ~250 MB                    |
| Knowledge         | 500    | ~5 MB + embeddings (~1 MB) |
| Wiki Pages        | 200    | ~5 MB                      |
| Security Findings | 1,000  | ~10 MB                     |
| **Total**         |        | **~346 MB**                |

**Embeddings:** Each vector (384 dims) = ~1.5 KB, so 1000 items = ~1.5 MB

---

## 📚 Next Documents

Continue to:

- **03-MCP-SPECIFICATION.md** - All MCP tools/resources/prompts
- **04-UI-ARCHITECTURE.md** - Design system & components
- **05-IMPLEMENTATION-GUIDE.md** - Week-by-week guide

---

**Database schema complete and ready for implementation! 🚀**
