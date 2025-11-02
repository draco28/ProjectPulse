# Implementation Roadmap - ProjectPulse (Agent-First)

**Based on**: [PLANNING_PHASES_projectpulse-agent-first.md](PLANNING_PHASES_projectpulse-agent-first.md)
**Created**: 2025-11-02
**Status**: Ready to Implement
**Architecture**: Agent-First (95% MCP, 5% human UI)

---

## 📋 Overview

**Total Implementation Time**: ~12-16 weeks (solo developer)
**Phases**: 5 major phases
**Approach**: Iterative - each phase delivers working features

**Core Philosophy**:

- Build agent automation FIRST (MCP tools)
- Add UI SECOND (monitoring + manual CRUD)
- Test continuously (agent + human workflows)

---

## 🎯 Implementation Strategy

### Build Order Rationale

**Why this order?**

1. **Foundation First**: Database + API establishes data layer
2. **Agent Access**: MCP server enables agent automation
3. **Core Features**: P0 features (Sprint, Workflow, Issues) provide base functionality
4. **Token Efficiency**: Knowledge system (best feature) requires solid foundation
5. **UI Enhancement**: Rich editors after core functionality working

**Parallel Tracks**:

- Backend (Prisma + API) and Frontend (UI pages) can be built in parallel
- MCP tools can be implemented alongside API endpoints (same logic)

---

# Phase A: Foundation & Core Infrastructure

**Duration**: 3-4 weeks
**Goal**: Database, API foundation, MCP server skeleton, git hook protection

---

## Week 1: Database Schema & Migrations

### Day 1-2: Prisma Schema Setup

**Tasks**:

1. Update `schema.prisma` with 10 core models:
   - Phase, Week, Day, Task, Session (5-level hierarchy)
   - Workflow, WorkflowStep
   - KnowledgeItem, KnowledgeRelationship
   - Issue, Skill, WikiPage, HealthFinding, AgentPersona
   - MarkdownFile, AgentAction, Rollback, ApprovalRequest

2. Add PostgreSQL extensions:

   ```prisma
   generator client {
     provider = "prisma-client-js"
     previewFeatures = ["postgresqlExtensions"]
   }

   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     extensions = [pgvector(map: "vector"), pg_trgm]
   }
   ```

3. Generate initial migration:
   ```bash
   pnpm prisma migrate dev --name init-agent-first-schema
   ```

**Success Criteria**:

- ✅ All 10 models defined in schema
- ✅ Migration runs successfully
- ✅ pgvector extension enabled
- ✅ Relationships correctly defined

---

### Day 3-4: Seed Data & Test Queries

**Tasks**:

1. Create seed script (`prisma/seed.ts`):
   - 12 predefined workflows (from CLAUDE.md)
   - Sample phase/week/day structure
   - Test issues, knowledge items

2. Test Prisma queries:
   - Hierarchical queries (Phase → Week → Day → Task → Session)
   - Graph traversal (KnowledgeRelationship)
   - Full-text search setup (tsvector)

3. Performance testing:
   - Index verification
   - Query optimization

**Success Criteria**:

- ✅ Seed script runs successfully
- ✅ Can query entire hierarchy in <100ms
- ✅ Full-text search working
- ✅ Graph queries returning results

---

### Day 5: Git Hook Protection

**Tasks**:

1. Create `.husky/pre-commit` hook:

   ```bash
   #!/bin/sh

   # Prevent manual edits to auto-generated files
   PROTECTED_FILES="STATUS.md DEVELOPMENT_PLAN.md .agent/task/current-todos.md .agent/task/current-plan.md"

   for file in $PROTECTED_FILES; do
     if git diff --cached --name-only | grep -q "^$file$"; then
       echo "❌ ERROR: $file is auto-generated and cannot be edited manually"
       echo "ℹ️  Update via ProjectPulse app instead"
       exit 1
     fi
   done
   ```

2. Add approval workflow bypass:
   - Check for `[agent-approved]` in commit message
   - Allow edits if approval flag present

**Success Criteria**:

- ✅ Manual edits to protected files blocked
- ✅ Agent-approved commits allowed
- ✅ Clear error messages

---

## Week 2: API Foundation

### Day 1-3: Core API Endpoints (RESTful)

**Build order** (by feature priority):

**P0 Features** (Sprint, Workflow, Issues):

1. Sprint/Phase Tracking API:

   ```
   GET    /api/sprint/hierarchy
   GET    /api/sprint/progress
   POST   /api/sprint/checkpoint
   PUT    /api/sprint/update
   POST   /api/sprint/sync
   ```

2. Workflow API:

   ```
   GET    /api/workflows
   GET    /api/workflows/[id]
   POST   /api/workflows/[id]/start
   PUT    /api/workflows/steps/[id]/complete
   GET    /api/workflows/current
   ```

3. Issues API:
   ```
   GET    /api/issues
   POST   /api/issues
   POST   /api/issues/bulk
   GET    /api/issues/[id]
   PUT    /api/issues/[id]
   DELETE /api/issues/[id]
   ```

**Implementation Pattern**:

```typescript
// /app/api/sprint/hierarchy/route.ts
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export async function GET(request: Request) {
  try {
    const hierarchy = await prisma.phase.findMany({
      include: {
        weeks: {
          include: {
            days: {
              include: {
                tasks: {
                  include: {
                    sessions: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    return Response.json({ data: hierarchy });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch hierarchy' }, { status: 500 });
  }
}
```

**Success Criteria**:

- ✅ All P0 API endpoints implemented
- ✅ Zod validation on all inputs
- ✅ Error handling with proper status codes
- ✅ Response format consistent: `{ data, error }`

---

### Day 4-5: Markdown Sync Mechanism

**Tasks**:

1. Create markdown generation service (`/lib/markdown-sync.ts`):

   ```typescript
   export async function syncAllMarkdown() {
     await syncStatusMd();
     await syncDevelopmentPlanMd();
     await syncCurrentTodosMd();
     await syncCurrentPlanMd();
   }

   async function syncStatusMd() {
     const hierarchy = await getHierarchy();
     const template = generateStatusTemplate(hierarchy);
     await saveMarkdownFile('STATUS.md', template);
   }
   ```

2. Template system:
   - STATUS.md template (current phase, progress, last task)
   - DEVELOPMENT_PLAN.md template (all phases, detailed tasks)
   - current-todos.md template (active tasks, checkboxes)

3. Auto-sync triggers:
   - On every `sprint.updateProgress()`
   - On every `sprint.checkpoint()`
   - On workflow step completion

**Success Criteria**:

- ✅ Markdown files auto-generated on progress updates
- ✅ Files match expected format
- ✅ Git hook prevents manual edits
- ✅ Performance: sync completes in <500ms

---

## Week 3: MCP Server Skeleton

### Day 1-2: MCP Server Setup

**Tasks**:

1. Create new package (`packages/mcp-server/`):

   ```bash
   mkdir -p packages/mcp-server
   cd packages/mcp-server
   pnpm init
   pnpm add @modelcontextprotocol/sdk zod
   ```

2. MCP server entry point (`src/index.ts`):

   ```typescript
   import { Server } from '@modelcontextprotocol/sdk/server/index.js';
   import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
   import { PrismaClient } from '@prisma/client';

   const prisma = new PrismaClient();
   const server = new Server(
     {
       name: 'projectpulse',
       version: '1.0.0',
     },
     {
       capabilities: {
         tools: {},
       },
     }
   );

   // Register tools (to be added)

   async function main() {
     const transport = new StdioServerTransport();
     await server.connect(transport);
   }

   main();
   ```

3. Build configuration:
   ```json
   // package.json
   {
     "name": "@moksha/mcp-server",
     "type": "module",
     "scripts": {
       "build": "tsc",
       "dev": "tsc --watch"
     }
   }
   ```

**Success Criteria**:

- ✅ MCP server starts without errors
- ✅ Can be invoked via stdio transport
- ✅ TypeScript compilation working

---

### Day 3-5: Implement P0 MCP Tools

**Tool Implementation Pattern**:

```typescript
// src/tools/sprint.ts
import { z } from 'zod';

export const sprintTools = {
  'sprint.updateProgress': {
    description: 'Update progress percentage for any entity (phase, week, day, task)',
    inputSchema: z.object({
      entityId: z.number(),
      entityType: z.enum(['phase', 'week', 'day', 'task']),
      percentage: z.number().min(0).max(100),
    }),
    handler: async ({ entityId, entityType, percentage }) => {
      // 1. Update entity in database
      // 2. Trigger markdown sync
      // 3. Log to AgentAction table
      // 4. Return updated entity
    },
  },

  'sprint.getCurrentTask': {
    description: 'Get the current active task',
    inputSchema: z.object({}),
    handler: async () => {
      const task = await prisma.task.findFirst({
        where: { status: 'IN_PROGRESS' },
        include: { sessions: true },
      });
      return task;
    },
  },
};
```

**Tools to implement** (P0 priority):

1. Sprint/Phase Tracking (6 tools)
2. Workflow Orchestration (5 tools)
3. Issues (5 tools)
4. Dashboard (4 tools)

**Success Criteria**:

- ✅ 20 P0 tools implemented
- ✅ All tools have Zod validation
- ✅ All actions logged to AgentAction table
- ✅ Error handling with clear messages

---

## Week 4: Testing & Integration

### Day 1-2: MCP Tool Testing

**Tasks**:

1. Manual testing via Claude Code:
   - Configure MCP server in `claude_desktop_config.json`
   - Test each tool manually
   - Verify responses match expected format

2. Create test scenarios:
   - Create phase/week/day/task hierarchy
   - Update progress at each level
   - Start workflow, complete steps
   - Create issues in bulk

**Success Criteria**:

- ✅ All P0 tools working via Claude Code
- ✅ No error responses
- ✅ Markdown files update correctly

---

### Day 3-5: Integration Testing

**Tasks**:

1. End-to-end workflow tests:
   - Agent creates phase → weeks → days → tasks
   - Agent updates progress at each level
   - Markdown files sync automatically
   - Git hook prevents manual edits

2. Performance testing:
   - Measure tool response times
   - Optimize slow queries
   - Cache frequently accessed data

3. Documentation:
   - MCP tool catalog (all 20 tools documented)
   - Usage examples for each tool
   - Troubleshooting guide

**Success Criteria**:

- ✅ Complete agent workflow executes successfully
- ✅ All tools respond in <1 second
- ✅ Documentation complete

---

# Phase B: P1 Features - Knowledge System

**Duration**: 3-4 weeks
**Goal**: Implement best feature - hybrid search + knowledge graph

---

## Week 5: Embedding Generation & Semantic Search

### Day 1-2: Embedding Service Setup

**Tasks**:

1. Choose embedding model:
   - **Option A**: OpenAI `text-embedding-3-small` (384 dimensions)
   - **Option B**: Local model via Ollama (llama3.2:1b embeddings)
   - **Recommendation**: OpenAI for MVP (better accuracy)

2. Create embedding service (`/lib/embeddings.ts`):

   ```typescript
   import OpenAI from 'openai';

   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

   export async function generateEmbedding(text: string): Promise<number[]> {
     const response = await openai.embeddings.create({
       model: 'text-embedding-3-small',
       input: text,
       dimensions: 384,
     });
     return response.data[0].embedding;
   }
   ```

3. Database setup:
   - Verify pgvector extension enabled
   - Create vector index on `KnowledgeItem.embedding`

**Success Criteria**:

- ✅ Embedding generation working
- ✅ Embeddings stored in database
- ✅ Vector index created

---

### Day 3-5: Hybrid Search Implementation

**Tasks**:

1. Semantic search query:

   ```typescript
   async function semanticSearch(query: string, k: number = 5) {
     const embedding = await generateEmbedding(query);

     const results = await prisma.$queryRaw`
       SELECT id, content, tags,
         embedding <=> ${embedding}::vector AS distance
       FROM "KnowledgeItem"
       ORDER BY distance ASC
       LIMIT ${k}
     `;

     return results;
   }
   ```

2. Full-text search query:

   ```typescript
   async function fulltextSearch(query: string, k: number = 5) {
     const results = await prisma.$queryRaw`
       SELECT id, content, tags,
         ts_rank(searchVector, to_tsquery('english', ${query})) AS rank
       FROM "KnowledgeItem"
       WHERE searchVector @@ to_tsquery('english', ${query})
       ORDER BY rank DESC
       LIMIT ${k}
     `;

     return results;
   }
   ```

3. Hybrid search (combine both):

   ```typescript
   async function hybridSearch(query: string, k: number = 5) {
     const [semantic, fulltext] = await Promise.all([
       semanticSearch(query, k * 2),
       fulltextSearch(query, k * 2),
     ]);

     // Combine results with weighted scoring
     const combined = mergeResults(semantic, fulltext, {
       semanticWeight: 0.7,
       fulltextWeight: 0.3,
     });

     return combined.slice(0, k);
   }
   ```

**Success Criteria**:

- ✅ Semantic search returns relevant results
- ✅ Full-text search working
- ✅ Hybrid search outperforms individual methods

---

## Week 6: Knowledge Graph Traversal

### Day 1-3: Graph Query Implementation

**Tasks**:

1. Limited depth traversal:

   ```sql
   -- Get knowledge item + related items (max 2 hops)
   WITH RECURSIVE related AS (
     SELECT id, content, tags, 0 AS depth
     FROM "KnowledgeItem"
     WHERE id = $startId

     UNION ALL

     SELECT k.id, k.content, k.tags, r.depth + 1
     FROM "KnowledgeItem" k
     JOIN "KnowledgeRelationship" rel ON k.id = rel."toId"
     JOIN related r ON rel."fromId" = r.id
     WHERE r.depth < 2
   )
   SELECT * FROM related;
   ```

2. Relationship inference:
   - Find contradictions (type = CONTRADICTS)
   - Find extensions (type = EXTENDS)
   - Rank by relationship strength

3. Token-efficient context building:
   - Query returns top-K results only
   - Include relationship metadata
   - Summarize content (first 200 chars)

**Success Criteria**:

- ✅ Graph traversal working (max 2 hops)
- ✅ Relationship types correctly identified
- ✅ Token cost: ~1,200 tokens per query (not 10,000+)

---

### Day 4-5: Knowledge MCP Tools

**Tools to implement**:

```typescript
- knowledge.add(content, metadata) → KnowledgeItem
- knowledge.query(question, k=5) → KnowledgeItem[]
- knowledge.relate(fromId, toId, type) → KnowledgeRelationship
- knowledge.traverse(startId, depth=2) → KnowledgeGraph
- knowledge.semanticSearch(query, k=5) → KnowledgeItem[]
```

**Special feature**: Auto-relationship detection (post-MVP)

- Analyze new knowledge items
- Suggest relationships to existing items
- Human approval before creating relationships

**Success Criteria**:

- ✅ All 5 knowledge tools working
- ✅ Hybrid search used by `knowledge.query()`
- ✅ Graph traversal limited to 2 hops

---

## Week 7: Skills System

### Day 1-2: Skills CRUD API

**Tasks**:

1. Skills API:

   ```
   GET    /api/skills
   GET    /api/skills/[id]
   POST   /api/skills
   PUT    /api/skills/[id]
   DELETE /api/skills/[id]
   GET    /api/skills/search?q=keyword
   ```

2. Lazy loading implementation:
   - `GET /api/skills` returns frontmatter only (name, description, triggers, tokenEstimate)
   - `GET /api/skills/[id]` returns full content
   - Token optimization: 50-280 tokens per skill

**Success Criteria**:

- ✅ Skills CRUD working
- ✅ Search by keywords/category
- ✅ Lazy loading reducing token usage

---

### Day 3-5: Skills MCP Tools + Migration

**Tasks**:

1. Skills MCP tools:

   ```typescript
   - skills.list() → SkillFrontmatter[]
   - skills.load(skillName) → Skill
   - skills.search(keywords) → Skill[]
   - skills.create(data) → Skill
   ```

2. Migrate existing skills to database:
   - Import from `.claude/skills/projectpulse/*.md`
   - Parse YAML frontmatter
   - Store in database
   - Keep files in sync (optional)

3. Auto-invocation system:
   - Match keywords from query to skill triggers
   - Load relevant skills automatically
   - Unload after use

**Success Criteria**:

- ✅ 7 existing skills migrated to database
- ✅ Skills tools working via MCP
- ✅ Auto-invocation based on keywords

---

## Week 8: P1 Integration & Testing

### Day 1-3: End-to-End Knowledge + Skills Testing

**Test scenarios**:

1. Agent adds knowledge item → Embedding generated → Searchable
2. Agent queries "How to implement auth?" → Hybrid search returns top-5
3. Agent creates relationship → Graph traversal finds related items
4. Agent loads skill → Content injected into context → Unloaded after use

**Success Criteria**:

- ✅ Knowledge graph queries work end-to-end
- ✅ Skills auto-invocation working
- ✅ Token savings: 92% for skills, 96% for knowledge

---

### Day 4-5: Performance Optimization

**Tasks**:

1. Index optimization:
   - pgvector index tuning
   - tsvector index tuning
   - Relationship index optimization

2. Caching strategy:
   - Cache frequently accessed knowledge items
   - Cache skill frontmatter
   - Redis or in-memory cache

3. Query optimization:
   - Analyze slow queries
   - Add missing indexes
   - Optimize N+1 queries

**Success Criteria**:

- ✅ Knowledge queries <200ms
- ✅ Skills load <100ms
- ✅ Graph traversal <500ms

---

# Phase C: P2 Features + Remaining P0 UI

**Duration**: 3-4 weeks
**Goal**: Wiki, Project Health, New UI Pages

---

## Week 9: Wiki System

### Day 1-2: Wiki API + MCP Tools

**Tasks**:

1. Wiki API (similar to Skills)
2. Wiki MCP tools:

   ```typescript
   - wiki.create(path, content) → WikiPage
   - wiki.update(path, content) → WikiPage
   - wiki.read(path) → WikiPage
   - wiki.search(query) → WikiPage[]
   - wiki.autoGenerate(sourceFiles) → WikiPage[]
   ```

3. Auto-generation from code:
   - Parse JSDoc comments
   - Extract function signatures
   - Generate markdown documentation

**Success Criteria**:

- ✅ Wiki CRUD working
- ✅ Auto-generation from code
- ✅ Hierarchical structure (parent/children pages)

---

### Day 3-5: Project Health Scanning

**Tasks**:

1. Scanner integration:
   - Semgrep (security)
   - ESLint (code quality)
   - Lighthouse (performance) - optional for MVP
   - axe-core (accessibility) - optional for MVP

2. Health API + MCP tools:

   ```typescript
   - health.scan(scannerType) → HealthScanResult
   - health.findings(filters) → HealthFinding[]
   - health.score() → ProjectHealthScore
   - health.remediate(findingId, fix) → HealthFinding
   ```

3. Dashboard metrics:
   - Overall health score (0-100)
   - Findings by severity (critical, high, medium, low)
   - Trends over time

**Success Criteria**:

- ✅ At least 2 scanners integrated (Semgrep + ESLint)
- ✅ Health score calculated
- ✅ Findings tracked in database

---

## Week 10: New UI Pages (P0 Priority)

### Day 1-2: Sprint/Phase Tracking Page

**Components to build**:

1. Hierarchical tree view:

   ```tsx
   <PhaseTree>
     <PhaseNode>
       <WeekNode>
         <DayNode>
           <TaskNode>
             <SessionNode />
           </TaskNode>
         </DayNode>
       </WeekNode>
     </PhaseNode>
   </PhaseTree>
   ```

2. Visual diagrams:
   - Gantt chart (Recharts or React-Gantt)
   - Burndown chart (Recharts)
   - Progress bars at each level

3. Manual CRUD forms:
   - Create phase/week/day/task/session
   - Edit inline or modal
   - Rich editor for task descriptions

**Success Criteria**:

- ✅ Hierarchy displays correctly
- ✅ Click to expand/collapse works
- ✅ Manual CRUD operations working
- ✅ Visual diagrams render

---

### Day 3-4: Workflow Orchestration Page

**Components**:

1. Workflow list:
   - 12 workflows from CLAUDE.md
   - Status indicators (active, completed, failed)
   - Progress bars

2. Workflow detail view:
   - Current step highlighted
   - Checkpoint history timeline
   - Failure/retry indicators

3. Manual workflow management:
   - Create new workflow (post-MVP)
   - Edit workflow steps (post-MVP)
   - Start/stop workflows

**Success Criteria**:

- ✅ All 12 workflows displayed
- ✅ Current workflow status visible
- ✅ Workflow step completion tracked

---

### Day 5: Skills Page

**Components**:

1. Skills catalog:
   - Browse by category (framework, testing, workflow, troubleshooting)
   - Search/filter by keywords
   - Token cost displayed

2. Skill detail view:
   - Frontmatter + full content
   - Usage analytics (how many times loaded)
   - Related docs links

3. Manual skill management:
   - Create new skill (rich editor)
   - Edit existing skill
   - Delete skill (with confirmation)

**Success Criteria**:

- ✅ 7 existing skills displayed
- ✅ Search/filter working
- ✅ Manual CRUD operations

---

## Week 11: Rich Editors Integration

### Day 1-3: TipTap Editor Setup

**Tasks**:

1. Install TipTap:

   ```bash
   pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
   ```

2. Create reusable editor component:

   ```tsx
   // components/editor/RichEditor.tsx
   import { useEditor, EditorContent } from '@tiptap/react';
   import StarterKit from '@tiptap/starter-kit';

   export function RichEditor({ content, onChange }) {
     const editor = useEditor({
       extensions: [StarterKit],
       content,
       onUpdate: ({ editor }) => {
         onChange(editor.getHTML());
       },
     });

     return <EditorContent editor={editor} />;
   }
   ```

3. Integrate into forms:
   - Issue description editor
   - Knowledge item editor
   - Skill content editor
   - Wiki page editor
   - Task description editor

**Success Criteria**:

- ✅ TipTap editor working
- ✅ Markdown support
- ✅ Code syntax highlighting
- ✅ Autocomplete for tags/references

---

### Day 4-5: Drag-and-Drop + Autocomplete

**Tasks**:

1. React Dropzone for file uploads:

   ```tsx
   import { useDropzone } from 'react-dropzone';

   function FileUpload() {
     const { getRootProps, getInputProps } = useDropzone({
       accept: { 'image/*': [], 'application/pdf': [] },
       onDrop: (files) => handleUpload(files),
     });

     return (
       <div {...getRootProps()}>
         <input {...getInputProps()} />
         <p>Drag files here or click to select</p>
       </div>
     );
   }
   ```

2. Downshift for autocomplete:
   - Tag/label autocomplete
   - File path autocomplete
   - Cross-reference autocomplete (@issue-42, @wiki/auth)

3. Rich components:
   - Emoji picker (emoji-picker-react)
   - Link insertion dialog
   - Table builder
   - Checklist builder

**Success Criteria**:

- ✅ File uploads working (drag-and-drop)
- ✅ Autocomplete for tags/references
- ✅ All rich components integrated

---

## Week 12: P2 Integration & Testing

### Day 1-3: End-to-End Testing (Wiki + Health + UI)

**Test scenarios**:

1. Agent auto-generates wiki from code
2. Agent runs health scan → Findings stored → Dashboard updated
3. Human creates skill via UI → Saved to database → Available via MCP
4. Human creates phase hierarchy via UI → Agent updates via MCP

**Success Criteria**:

- ✅ All P2 features working
- ✅ New UI pages functional
- ✅ Rich editors working

---

### Day 4-5: Documentation & Polish

**Tasks**:

1. Update README with new architecture
2. Create video demo (Loom):
   - Agent workflow (Claude Code using MCP tools)
   - Human workflow (UI monitoring + manual CRUD)
   - Knowledge graph query example

3. Polish UI:
   - Responsive design (complete Phase 4 Day 8)
   - Error states
   - Loading states
   - Empty states

**Success Criteria**:

- ✅ Documentation complete
- ✅ Demo video created
- ✅ UI polished

---

# Phase D: P3 Features + Safety Systems

**Duration**: 2-3 weeks
**Goal**: Personas, Audit Trail, Rollback, Approval Workflow

---

## Week 13: Personas System

### Day 1-3: Personas API + MCP Tools

**Tasks**:

1. Personas API (similar to Skills)
2. Personas MCP tools:

   ```typescript
   - personas.create(name, systemPrompt, capabilities) → AgentPersona
   - personas.list() → AgentPersona[]
   - personas.activate(personaId) → AgentPersona
   - personas.deactivate(personaId) → AgentPersona
   ```

3. Dynamic persona creation:
   - Agent analyzes project patterns
   - Generates system prompt
   - Saves persona to database

**Success Criteria**:

- ✅ Personas CRUD working
- ✅ Agent can create personas dynamically
- ✅ Activation/deactivation working

---

### Day 4-5: Safety Systems Implementation

**Tasks**:

1. Audit Trail:
   - All AgentAction records saved
   - UI to view audit log
   - Filter by action type, feature, timestamp

2. Rollback System:
   - Capture before/after state for Level 1 operations
   - UI to view rollback history
   - "Undo" button for recent actions

3. Approval Workflow:
   - Level 2 operations create ApprovalRequest
   - UI notification for pending approvals
   - Approve/reject workflow

**Success Criteria**:

- ✅ All agent actions logged
- ✅ Rollback working for Level 1 operations
- ✅ Approval workflow functional

---

## Week 14: Dashboard Tools + Final Testing

### Day 1-2: Dashboard MCP Tools

**Tools**:

```typescript
- dashboard.getOverview() → DashboardOverview
- dashboard.getActivityFeed(limit=20) → AgentAction[]
- dashboard.getMetrics() → ProjectMetrics
- dashboard.getAlerts() → Alert[]
```

**Dashboard data**:

- Issues count (open, in progress, closed)
- Knowledge items count
- Wiki pages count
- Health score
- Recent agent activity (last 20 actions)
- Blockers/alerts

**Success Criteria**:

- ✅ Dashboard tools working
- ✅ Dashboard UI displays all metrics
- ✅ Activity feed updates in real-time

---

### Day 3-5: Final Integration Testing

**Complete workflows**:

1. **5-Step Mandatory Protocol** (via MCP):
   - Agent reads STATUS.md
   - Agent creates plan → Saves to app
   - Agent creates todos → Synced to app
   - Agent implements with checkpoints → Progress tracked
   - Agent marks completion → STATUS.md updated

2. **Issue Creation Workflow**:
   - Agent runs tests → Finds 10 bugs
   - Agent creates 10 issues via `issues.createBulk()`
   - Human reviews issues via UI
   - Human approves/rejects issues

3. **Knowledge Query Workflow**:
   - Agent queries "How to implement auth?"
   - Hybrid search returns top-5 results
   - Agent traverses graph (2 hops)
   - Agent gets 6 total items (~1,200 tokens)

**Success Criteria**:

- ✅ All workflows execute successfully
- ✅ No errors in production
- ✅ Performance acceptable (<1s response times)

---

# Phase E: Production Readiness

**Duration**: 1-2 weeks
**Goal**: Polish, optimization, deployment

---

## Week 15: Performance Optimization

### Day 1-3: Backend Optimization

**Tasks**:

1. Database optimization:
   - Analyze slow queries
   - Add missing indexes
   - Optimize N+1 queries

2. Caching:
   - Cache knowledge embeddings
   - Cache skill frontmatter
   - Cache dashboard metrics

3. Rate limiting:
   - Max 100 issues/minute
   - Max 50 knowledge items/minute
   - Prevent abuse

**Success Criteria**:

- ✅ All API responses <500ms
- ✅ MCP tools respond <1s
- ✅ Database queries optimized

---

### Day 4-5: Frontend Optimization

**Tasks**:

1. Code splitting:
   - Lazy load pages
   - Lazy load rich editors
   - Reduce bundle size

2. Performance:
   - React.memo for expensive components
   - useCallback/useMemo optimization
   - Virtual scrolling for long lists

3. Responsive design:
   - Complete Phase 4 Day 8 (from DEVELOPMENT_PLAN.md)
   - Mobile breakpoints
   - Tablet breakpoints

**Success Criteria**:

- ✅ Lighthouse score >90
- ✅ First Contentful Paint <1.5s
- ✅ Responsive on all devices

---

## Week 16: Documentation & Launch

### Day 1-2: Complete Documentation

**Docs to create**:

1. README.md (updated for agent-first)
2. ARCHITECTURE.md (system overview)
3. MCP_TOOLS.md (all 42 tools documented)
4. API_REFERENCE.md (all endpoints)
5. USER_GUIDE.md (human workflow)
6. AGENT_GUIDE.md (agent workflow)

**Success Criteria**:

- ✅ All docs complete
- ✅ Clear setup instructions
- ✅ Troubleshooting guide

---

### Day 3-5: Launch Preparation

**Tasks**:

1. Create demo project:
   - Seed with realistic data
   - Record video walkthrough
   - Share on X/LinkedIn

2. Blog post:
   - "Building an Agent-First Project Management Platform"
   - Architecture decisions
   - Token optimization strategies
   - Knowledge graph implementation

3. MCP server publication:
   - Publish to npm (optional)
   - Add to MCP server registry
   - Announce on MCP Discord

**Success Criteria**:

- ✅ Demo project ready
- ✅ Blog post published
- ✅ MCP server available

---

# 🎉 Implementation Complete!

**Total Duration**: ~16 weeks (solo developer)
**Features Delivered**:

- ✅ 8 core features (Issues, Skills, Knowledge, Wiki, Project Health, Personas, Workflow, Sprint/Phase Tracking)
- ✅ 42 MCP tools (single server)
- ✅ 11 UI pages (8 existing + 3 new)
- ✅ Hybrid knowledge graph (semantic + full-text + limited traversal)
- ✅ Rich editors (WYSIWYG, drag-and-drop, autocomplete)
- ✅ Safety systems (audit trail, rollback, approval workflow)
- ✅ Markdown sync (DB → files, git hook protection)

**What's Next**:

- Post-MVP: Workflow customization, skill versioning, pattern drift detection
- Phase 2: Multi-agent orchestration, advanced analytics
- Phase 3: Cloud hosting, multi-tenant support

---

**Ready to start Phase A!** 🚀
