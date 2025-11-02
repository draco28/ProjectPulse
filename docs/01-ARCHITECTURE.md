# 01 - ProjectPulse: Complete Architecture

**Version:** 1.0 Final  
**Last Updated:** October 23, 2025  
**Status:** Production Ready ✅

---

## 🎯 Executive Summary

ProjectPulse is a self-hosted, local-first development hub that replaces:

- **Linear** → Issue Tracker
- **Byterover** → Knowledge Base
- **Notion** → Documentation Wiki
- **Cloud Services** → Local PostgreSQL

**Key Innovation:** Deep integration with Claude Code via MCP (Model Context Protocol) with agent personas, context injection, and intelligent automation.

**Privacy:** 100% local - all data stays on your machine, no cloud dependencies.

---

## 🏗️ High-Level Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOKSHA DEVHUB SYSTEM                          │
│              (Running on Windows 11 - Docker)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │          NEXT.JS 14 (APP ROUTER + API ROUTES)             │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  FRONTEND (React + shadcn/ui + Tailwind)                 │ │
│  │  ├── Issue Tracker                                        │ │
│  │  ├── Knowledge Base                                       │ │
│  │  ├── Documentation Wiki                                   │ │
│  │  ├── Security Dashboard                                   │ │
│  │  ├── 🆕 Agent Personas Manager                            │ │
│  │  ├── Command Palette (Cmd+K)                             │ │
│  │  └── Slash Commands (/)                                  │ │
│  │                                                            │ │
│  │  API ROUTES (Next.js API)                                │ │
│  │  ├── /api/issues/*                                        │ │
│  │  ├── /api/knowledge/*                                     │ │
│  │  ├── /api/wiki/*                                          │ │
│  │  ├── /api/security/*                                      │ │
│  │  ├── /api/personas/*                                      │ │
│  │  ├── /api/templates/*                                     │ │
│  │  └── /api/search/* (hybrid search)                       │ │
│  │                                                            │ │
│  │  SERVER COMPONENTS & ACTIONS                              │ │
│  │  ├── Prisma Client (database access)                     │ │
│  │  ├── Embeddings (@xenova/transformers)                   │ │
│  │  ├── Search Service (full-text + semantic)               │ │
│  │  └── Helper Script Service                               │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          ▲                                       │
│                          │ HTTP/REST                            │
│                          │                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  MCP SERVER                                │ │
│  │          (Native Process - stdio transport)                │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  MCP Tools (25+ tools)                                    │ │
│  │  ├── Issue Management                                     │ │
│  │  ├── Knowledge Management                                 │ │
│  │  ├── Wiki Management                                      │ │
│  │  ├── Security Scanning                                    │ │
│  │  └── Helper Script Execution                             │ │
│  │                                                            │ │
│  │  MCP Resources (context injection)                        │ │
│  │  ├── Current Project Context                             │ │
│  │  ├── Open Issues Summary                                  │ │
│  │  ├── Recent Changes                                       │ │
│  │  └── SoT Rules Context                                   │ │
│  │                                                            │ │
│  │  MCP Prompts (agent personas)                             │ │
│  │  ├── Code Reviewer                                        │ │
│  │  ├── Bug Hunter                                          │ │
│  │  ├── Feature Architect                                    │ │
│  │  ├── Security Auditor                                     │ │
│  │  └── Custom Personas (user-defined)                      │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          │                                       │
│                          │ Prisma Client                        │
│                          ▼                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │             POSTGRESQL 16 (Docker Container)               │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  Core Tables:                                             │ │
│  │  ├── issues, comments, attachments                        │ │
│  │  ├── knowledge_items, tags                                │ │
│  │  ├── wiki_pages, page_links                               │ │
│  │  ├── security_findings                                    │ │
│  │  ├── agent_personas, prompt_templates                     │ │
│  │  └── agent_sessions (usage tracking)                      │ │
│  │                                                            │ │
│  │  Extensions:                                              │ │
│  │  ├── pg_trgm (fuzzy text search)                          │ │
│  │  └── pgvector (semantic embeddings)                       │ │
│  │                                                            │ │
│  │  Indexes:                                                 │ │
│  │  ├── Full-text search (tsvector)                          │ │
│  │  ├── Vector indexes (HNSW)                                │ │
│  │  └── Relational indexes (foreign keys)                    │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                          ▲
                          │ LAN Access
                          │
         ┌────────────────┴────────────────┐
         │                                  │
    ┌─────────┐                      ┌──────────┐
    │ Windows │                      │ Mac Mini │
    │ Browser │                      │ Browser  │
    │ :3000   │                      │ :3000    │
    └─────────┘                      └──────────┘
         │                                  │
    ┌─────────┐                      ┌──────────┐
    │ Claude  │                      │ Claude   │
    │ Code    │                      │ Code     │
    │ (MCP)   │                      │ (MCP)    │
    └─────────┘                      └──────────┘
```

---

## 🎯 Key Architectural Decisions

### Decision 1: Database - PostgreSQL ✅

**Chosen:** PostgreSQL 16  
**Rejected:** MongoDB

#### Why PostgreSQL?

1. **JSONB for Flexibility**

   ```sql
   CREATE TABLE issues (
       id SERIAL PRIMARY KEY,
       title TEXT,
       status VARCHAR(50),
       custom_fields JSONB  -- ⭐ Flexible schema
   );

   -- Query custom fields
   SELECT * FROM issues
   WHERE custom_fields->>'epic' = 'Combat Overhaul';
   ```

2. **Full-Text Search Built-in**

   ```sql
   -- Create tsvector index
   ALTER TABLE issues
   ADD COLUMN search_vector tsvector
   GENERATED ALWAYS AS (
       to_tsvector('english', title || ' ' || COALESCE(description, ''))
   ) STORED;

   CREATE INDEX idx_issues_search ON issues USING GIN(search_vector);

   -- Search
   SELECT * FROM issues
   WHERE search_vector @@ plainto_tsquery('english', 'fsm animation');
   ```

3. **Vector Embeddings (pgvector)**

   ```sql
   CREATE EXTENSION vector;

   ALTER TABLE knowledge_items
   ADD COLUMN embedding vector(384);  -- all-MiniLM-L6-v2 dimensions

   CREATE INDEX ON knowledge_items
   USING hnsw (embedding vector_cosine_ops);

   -- Semantic search
   SELECT *, 1 - (embedding <=> query_embedding) as similarity
   FROM knowledge_items
   WHERE 1 - (embedding <=> query_embedding) > 0.7
   ORDER BY embedding <=> query_embedding
   LIMIT 10;
   ```

4. **Relationships & Transactions**
   - Foreign keys enforce referential integrity
   - ACID transactions for multi-table operations
   - Complex joins for reports and analytics

#### Why NOT MongoDB?

- No native full-text search (weaker than PostgreSQL)
- No native vector search (requires Atlas cloud)
- Relationships require manual joins or aggregation pipelines
- Overkill for structured data (issues, wiki pages are structured)

---

### Decision 2: Tech Stack - Next.js 14 Unified ✅

**Chosen:** Next.js 14 (App Router) for BOTH frontend AND backend  
**Rejected:** Separate Fastify backend

#### Why Next.js Unified?

1. **Single Deployment**
   - One Docker container instead of two
   - Simpler architecture
   - Easier maintenance

2. **Server Components**
   - Direct database access from components
   - No API overhead for SSR pages
   - Better performance

3. **API Routes**
   - Still have REST API for MCP server
   - Next.js API routes are production-ready
   - Built-in TypeScript support

4. **Server Actions**
   - Form submissions without API calls
   - Progressive enhancement
   - Better UX

5. **File System**
   - All code in one place
   - Shared types between client/server
   - Easier to navigate

#### Structure

```
apps/web/                    # Next.js application
├── app/                     # App Router
│   ├── (dashboard)/         # Dashboard layout group
│   │   ├── issues/
│   │   │   ├── page.tsx           # Issue list (server component)
│   │   │   ├── [id]/page.tsx     # Issue detail
│   │   │   └── new/page.tsx      # Create issue
│   │   ├── knowledge/
│   │   ├── wiki/
│   │   ├── security/
│   │   └── personas/
│   ├── api/                 # API Routes (for MCP server)
│   │   ├── issues/
│   │   ├── knowledge/
│   │   ├── wiki/
│   │   ├── security/
│   │   ├── personas/
│   │   └── search/
│   └── layout.tsx
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── issues/
│   ├── knowledge/
│   ├── wiki/
│   └── personas/
├── lib/                     # Utilities
│   ├── prisma.ts            # Prisma client
│   ├── embeddings.ts        # Transformers.js
│   ├── search.ts            # Hybrid search
│   └── helpers.ts           # Helper script execution
└── actions/                 # Server Actions
    ├── issue-actions.ts
    ├── knowledge-actions.ts
    └── persona-actions.ts
```

---

### Decision 3: MCP Architecture ✅

**Chosen:** MCP Server calls Next.js API Routes  
**Rejected:** MCP Server with direct Prisma access

#### Why API Route Pattern?

```
Claude Code (MCP Client)
         │
         │ stdio
         ▼
    MCP Server
         │
         │ HTTP/REST
         ▼
   Next.js API Routes
         │
         │ Prisma Client
         ▼
    PostgreSQL
```

**Benefits:**

1. **Single Source of Truth**: All database logic in Next.js
2. **No Duplication**: Don't replicate Prisma client setup in MCP
3. **Easier Maintenance**: Update API once, both UI and MCP benefit
4. **Better Testing**: Test API independently
5. **Security**: API can enforce permissions

#### MCP Server Responsibilities

```typescript
// mcp-server/src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'create_issue') {
    // Call Next.js API
    const response = await axios.post(`${API_URL}/issues`, {
      title: request.params.arguments.title,
      description: request.params.arguments.description,
      // ...
    });

    return {
      content: [{ type: 'text', text: `Created issue #${response.data.id}` }],
    };
  }
});
```

---

### Decision 4: Search Strategy - Hybrid ✅

**Chosen:** Hybrid search (full-text + semantic)  
**Approach:** Merge and rank results from both

#### Hybrid Search Flow

```typescript
// lib/search.ts
export async function hybridSearch(query: string, options: SearchOptions): Promise<SearchResult[]> {
  // 1. Full-text search (fast, keyword-based)
  const fullTextResults = await prisma.$queryRaw`
    SELECT *, 
           ts_rank(search_vector, plainto_tsquery('english', ${query})) as rank
    FROM issues
    WHERE search_vector @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC
    LIMIT 20;
  `;

  // 2. Semantic search (slower, meaning-based)
  const queryEmbedding = await generateEmbedding(query);
  const semanticResults = await prisma.$queryRaw`
    SELECT *, 
           1 - (embedding <=> ${queryEmbedding}::vector) as similarity
    FROM knowledge_items
    WHERE 1 - (embedding <=> ${queryEmbedding}::vector) > 0.7
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT 20;
  `;

  // 3. Get weights from settings (data-driven per [R-DATA-001])
  const fullTextWeight = await getSetting('search.fullTextWeight', 0.6);
  const semanticWeight = await getSetting('search.semanticWeight', 0.4);

  // 4. Merge and rank
  const merged = mergeResults(fullTextResults, semanticResults, {
    fullTextWeight,
    semanticWeight,
  });

  return merged;
}
```

#### When to Use Each

| Search Type   | Use Case                   | Example Query                     |
| ------------- | -------------------------- | --------------------------------- |
| **Full-text** | Exact keywords, code, IDs  | "FSM authority bug #42"           |
| **Semantic**  | Concepts, similar patterns | "how to implement state machines" |
| **Hybrid**    | General search             | "combat system animation issues"  |

---

### Decision 5: Embeddings - Local (Transformers.js) ✅

**Chosen:** @xenova/transformers (local)  
**Model:** all-MiniLM-L6-v2 (384 dimensions)  
**Rejected:** OpenAI API, Cohere API

#### Why Local Embeddings?

1. **Privacy**: All data stays local, no API calls
2. **Cost**: $0 forever (no usage fees)
3. **Speed**: No network latency
4. **Control**: Fine-tune or swap models easily

#### Implementation

```typescript
// lib/embeddings.ts
import { pipeline } from '@xenova/transformers';

let embedder: any = null;

export async function generateEmbedding(text: string): Promise<number[]> {
  // Lazy load model (only once)
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }

  // Generate embedding
  const output = await embedder(text, {
    pooling: 'mean',
    normalize: true,
  });

  // Convert to array
  return Array.from(output.data);
}

// Usage
const knowledgeItem = await prisma.knowledgeItem.create({
  data: {
    title: 'FSM State Machine Pattern',
    content: '...',
    embedding: await generateEmbedding(title + ' ' + content),
  },
});
```

#### Trade-offs

| Aspect     | Local (chosen) | OpenAI API         |
| ---------- | -------------- | ------------------ |
| Privacy    | ✅ 100% local  | ❌ Sends to API    |
| Cost       | ✅ $0          | ❌ $0.02/1M tokens |
| Quality    | ⚠️ Good (85%)  | ✅ Best (100%)     |
| Speed      | ✅ Fast        | ⚠️ Network latency |
| Dimensions | 384            | 1536               |

**Verdict:** Local wins for solo developer use case

---

### Decision 6: Deployment - Docker Compose ✅

**Chosen:** Docker Compose (two-container setup: web + database)
**Rejected:** Native installation, Kubernetes (over-engineered for solo dev)

#### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: moksha_devhub
      POSTGRES_USER: moksha
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U moksha']
      interval: 10s
      timeout: 5s
      retries: 5

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://moksha:${DB_PASSWORD}@postgres:5432/moksha_devhub
      NEXT_PUBLIC_APP_URL: http://localhost:3000
    ports:
      - '3000:3000'
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped

volumes:
  postgres_data:
```

#### Why Docker Compose?

1. **One Command Start**: `docker-compose up -d`
2. **Isolated Environment**: No conflicts with Unreal Engine
3. **Easy LAN Access**: Expose ports automatically
4. **Consistent Setup**: Same on Windows and Mac
5. **Simple Backup**: Just backup volumes folder

---

### Decision 7: Custom Fields - JSONB ✅

**Approach:** Store flexible fields in JSONB column

#### Why JSONB?

```typescript
// Flexible schema per issue
const issue = await prisma.issue.create({
  data: {
    title: 'Fix Combat FSM',
    status: 'open',
    priority: 'high',
    customFields: {
      epic: 'Combat Overhaul',
      estimatedHours: 8,
      affectedModules: ['Combat', 'Core', 'Animation'],
      sotRuleViolation: 'FSM Authority Rule 3.2',
      relatedPullRequest: 'https://github.com/...',
      // Any custom fields you need!
    },
  },
});

// Query by custom field
const issues = await prisma.issue.findMany({
  where: {
    customFields: {
      path: ['epic'],
      equals: 'Combat Overhaul',
    },
  },
});

// Index custom field for performance
await prisma.$executeRaw`
  CREATE INDEX idx_issues_custom_epic 
  ON issues ((custom_fields->>'epic'));
`;
```

#### Benefits

- **Flexibility**: Add fields without migrations
- **Type-Safety**: Use Zod schema for validation
- **Queryable**: PostgreSQL JSONB operators
- **Indexable**: Create indexes on specific fields

---

### Decision 8: Agent Personas - MCP Prompts ✅

**Approach:** Store personas in database, expose via MCP Prompts

#### Architecture

```
Database (agent_personas table)
         ↓
   Next.js API (/api/personas)
         ↓
   MCP Server (Prompts)
         ↓
   Claude Code (activates persona)
```

#### How It Works

1. **User creates persona** in UI (or uses default)
2. **Persona stored** in database with system prompt
3. **MCP server exposes** persona as MCP Prompt
4. **Claude Code activates** persona via slash command
5. **Persona rules apply** to all responses

#### Example Flow

```bash
# User types in Claude Code:
/code-reviewer src/Combat/CombatFSM.cpp

# Claude Code:
# 1. Calls MCP Prompt: "code-reviewer"
# 2. Gets system prompt from database
# 3. Injects context (file content, SoT rules, open issues)
# 4. Responds as "Code Reviewer" persona with specific rules
```

---

## 🔒 Security Architecture

### Threat Model

**Scope:** Solo developer, local-only use

**Threats:**

1. ❌ Not concerned: Multi-user attacks (no authentication)
2. ❌ Not concerned: Network attacks (LAN only)
3. ✅ Concerned: Code vulnerabilities in game project
4. ✅ Concerned: Accidental data loss

### Security Features

#### 1. Semgrep Integration

```typescript
// lib/security.ts
import { executeSecurely } from './process-executor';

export async function runSemgrepScan(projectPath: string): Promise<SecurityFinding[]> {
  // Validate projectPath is within allowed directory
  const allowedRoot = process.env.MOKSHA_PROJECT_ROOT;
  if (!allowedRoot || !projectPath.startsWith(allowedRoot)) {
    throw new Error('Project path not in allowed directory');
  }

  // Run Semgrep using secure executor (fixes command injection)
  const { stdout } = await executeSecurely('semgrep', ['--config', 'auto', '--json', projectPath], {
    allowedCommands: ['semgrep'],
    timeout: 120000, // 2 minutes
    maxOutputSize: 10 * 1024 * 1024, // 10MB
  });

  const results = JSON.parse(stdout);

  // Parse findings
  const findings = results.results.map((finding: any) => ({
    ruleId: finding.check_id,
    severity: finding.extra.severity,
    message: finding.extra.message,
    filePath: finding.path,
    lineNumber: finding.start.line,
    codeSnippet: finding.extra.lines,
  }));

  // Store in database
  await prisma.securityFinding.createMany({
    data: findings,
  });

  // Optionally auto-create issues for high-severity findings
  for (const finding of findings) {
    if (finding.severity === 'ERROR') {
      await createIssueFromFinding(finding);
    }
  }

  return findings;
}
```

#### 2. Tiered Script Permissions

```typescript
// lib/helpers.ts
enum ScriptTier {
  READ_ONLY = 'read_only', // Can only read files
  CREATE_ISSUES = 'create_issues', // Can create issues
  DIRECT = 'direct', // Can execute directly
}

export async function executeHelperScript(
  scriptPath: string,
  args: string[],
  tier: ScriptTier
): Promise<ScriptResult> {
  // Validate script is in allowed directory
  const allowedDir = process.env.MOKSHA_PROJECT_ROOT;
  if (!allowedDir || !scriptPath.startsWith(allowedDir)) {
    throw new Error('Script not in allowed directory');
  }

  // Validate script extension
  if (!['.py', '.js', '.ts'].some((ext) => scriptPath.endsWith(ext))) {
    throw new Error('Invalid script type. Only .py, .js, .ts allowed');
  }

  // Apply tier restrictions via environment variables
  const env = { ...process.env };
  switch (tier) {
    case ScriptTier.READ_ONLY:
      env.MOKSHA_SCRIPT_MODE = 'read_only';
      break;
    case ScriptTier.CREATE_ISSUES:
      env.MOKSHA_SCRIPT_MODE = 'create_issues';
      break;
    case ScriptTier.DIRECT:
      env.MOKSHA_SCRIPT_MODE = 'direct';
      break;
  }

  // Determine interpreter
  const interpreter = scriptPath.endsWith('.py') ? 'python' : 'node';

  // Execute with secure spawn (fixes command injection)
  const result = await executeSecurely(interpreter, [scriptPath, ...args], {
    allowedCommands: ['python', 'node'],
    timeout: 60000, // 60 seconds
    maxOutputSize: 5 * 1024 * 1024, // 5MB
    env,
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: 0, // executeSecurely only resolves on success
  };
}
```

#### 3. Database Backups

```bash
# Automated backup script (run daily via cron)
docker exec moksha-db pg_dump -U moksha moksha_devhub | gzip > backup_$(date +%Y%m%d).sql.gz
```

---

## 📊 Data Flow

### Issue Creation Flow

```
User (Web UI)
    ↓ [form submission]
Server Action (issue-actions.ts)
    ↓ [server-side validation]
Prisma Client
    ↓ [create issue]
PostgreSQL
    ↓ [return created issue]
Server Action
    ↓ [revalidate page]
User sees new issue
```

### MCP Tool Call Flow

```
Claude Code
    ↓ [MCP tool call: create_issue]
MCP Server
    ↓ [HTTP POST to /api/issues]
Next.js API Route
    ↓ [validate + sanitize]
Prisma Client
    ↓ [create issue]
PostgreSQL
    ↓ [return issue]
API Route
    ↓ [format response]
MCP Server
    ↓ [format MCP response]
Claude Code (shows result)
```

### Semantic Search Flow

```
User types search query
    ↓
Search API Route (/api/search)
    ├─→ Full-text search (PostgreSQL tsvector)
    │       ↓ [20 results]
    └─→ Semantic search
            ↓ [generate embedding with Transformers.js]
            ↓ [pgvector similarity search]
            ↓ [20 results]
    ↓
Merge & rank results
    ↓ [weight: 60% full-text, 40% semantic]
Return top 20
    ↓
Display to user
```

---

## 🧩 Modularity & Extensibility

### Adding New Features

#### Example: Adding "Time Tracking" Feature

1. **Database Schema** (add to Prisma)

```prisma
model TimeEntry {
  id        Int      @id @default(autoincrement())
  issueId   Int
  issue     Issue    @relation(fields: [issueId], references: [id])
  duration  Int      // minutes
  startedAt DateTime
  endedAt   DateTime
  note      String?

  createdAt DateTime @default(now())
}
```

2. **API Route** (add to Next.js)

```typescript
// app/api/time-entries/route.ts
export async function POST(request: Request) {
  const body = await request.json();

  const entry = await prisma.timeEntry.create({
    data: {
      issueId: body.issueId,
      duration: body.duration,
      startedAt: new Date(body.startedAt),
      endedAt: new Date(body.endedAt),
      note: body.note,
    },
  });

  return Response.json(entry);
}
```

3. **UI Component** (add to components)

```typescript
// components/time-tracker/TimeTracker.tsx
export function TimeTracker({ issueId }: { issueId: number }) {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const startTracking = () => {
    setStartTime(new Date());
    setIsTracking(true);
  };

  const stopTracking = async () => {
    const endTime = new Date();
    const duration = Math.floor((endTime - startTime!) / 1000 / 60);

    await fetch('/api/time-entries', {
      method: 'POST',
      body: JSON.stringify({
        issueId,
        duration,
        startedAt: startTime,
        endedAt: endTime,
      }),
    });

    setIsTracking(false);
  };

  return (
    <div>
      {isTracking ? (
        <Button onClick={stopTracking}>Stop Tracking</Button>
      ) : (
        <Button onClick={startTracking}>Start Tracking</Button>
      )}
    </div>
  );
}
```

4. **MCP Tool** (add to MCP server)

```typescript
// mcp-server/src/tools/time-tracking.ts
server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'start_time_tracking') {
    const response = await axios.post(`${API_URL}/time-entries`, {
      issueId: request.params.arguments.issueId,
      startedAt: new Date().toISOString(),
    });

    return {
      content: [{ type: 'text', text: `Started tracking time for issue #${issueId}` }],
    };
  }
});
```

---

## 🎨 UI Architecture Principles

### Design System

**Foundation:** shadcn/ui + Tailwind CSS

**Principles:**

1. **Consistency**: Reuse components across sections
2. **Accessibility**: WCAG 2.1 AA compliance
3. **Performance**: Lazy load components, optimize images
4. **Responsiveness**: Desktop-first, tablet-optimized
5. **Dark Mode**: Default dark, light mode available

### Component Hierarchy

```
├── App Shell
│   ├── Sidebar (navigation)
│   ├── Header (search, user, theme)
│   └── Main Content
│       ├── Page Header (title, actions)
│       └── Page Content
│           ├── Filters (sidebar)
│           ├── List/Grid (main)
│           └── Details (modal/side panel)
```

### Key UI Patterns

#### 1. Command Palette (Cmd+K)

```typescript
// components/command-palette/CommandPalette.tsx
import { Command } from 'cmdk';

export function CommandPalette() {
  return (
    <Command>
      <Command.Input placeholder="Type a command or search..." />
      <Command.List>
        <Command.Group heading="Suggestions">
          <Command.Item onSelect={createIssue}>Create Issue</Command.Item>
          <Command.Item onSelect={openKnowledge}>Knowledge Base</Command.Item>
        </Command.Group>
        <Command.Group heading="Agent Personas">
          <Command.Item onSelect={() => activatePersona('code-reviewer')}>
            🔍 Code Reviewer
          </Command.Item>
          <Command.Item onSelect={() => activatePersona('bug-hunter')}>
            🐛 Bug Hunter
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command>
  );
}
```

#### 2. Slash Commands in Editors

```typescript
// components/editor/SlashCommands.tsx
const COMMANDS = [
  { trigger: '/code-reviewer', action: activatePersona },
  { trigger: '/bug-hunter', action: activatePersona },
  { trigger: '/template', action: insertTemplate },
  { trigger: '/link-issue', action: linkIssue },
];

// TipTap editor integration
editor.registerPlugin({
  name: 'slashCommands',
  // ... plugin implementation
});
```

#### 3. Sidebar Navigation

```typescript
// components/layout/Sidebar.tsx
const navigation = [
  { name: 'Issues', href: '/issues', icon: CheckCircleIcon },
  { name: 'Knowledge', href: '/knowledge', icon: LightBulbIcon },
  { name: 'Wiki', href: '/wiki', icon: BookOpenIcon },
  { name: 'Security', href: '/security', icon: ShieldCheckIcon },
  { name: 'Personas', href: '/personas', icon: UsersIcon },
];
```

---

## 📈 Performance Considerations

### Database Optimization

1. **Indexes** on frequently queried fields

```sql
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_priority ON issues(priority);
CREATE INDEX idx_issues_module ON issues(module);
CREATE INDEX idx_issues_created_at ON issues(created_at DESC);
```

2. **Partial Indexes** for filtered queries

```sql
CREATE INDEX idx_open_issues ON issues(created_at) WHERE status = 'open';
```

3. **JSONB Indexes** for custom fields

```sql
CREATE INDEX idx_issues_custom_epic ON issues ((custom_fields->>'epic'));
```

4. **Vector Indexes** for semantic search

```sql
CREATE INDEX ON knowledge_items USING hnsw (embedding vector_cosine_ops);
```

### Frontend Optimization

1. **Code Splitting**: Lazy load routes
2. **Image Optimization**: Next.js Image component
3. **Data Caching**: SWR with revalidation
4. **Prefetching**: Next.js Link with prefetch
5. **Virtual Scrolling**: For long lists (react-window)

### Caching Strategy

```typescript
// app/issues/page.tsx
export const revalidate = 60; // Revalidate every 60 seconds

export default async function IssuesPage() {
  // This data is cached and revalidated
  const issues = await prisma.issue.findMany();

  return <IssueList issues={issues} />;
}
```

---

## 🔄 State Management

**Approach:** Minimal global state, prefer server state

### Server State (SWR)

```typescript
// hooks/useIssues.ts
import useSWR from 'swr';

export function useIssues(filters?: IssueFilters) {
  const { data, error, mutate } = useSWR(['/api/issues', filters], ([url, filters]) =>
    fetcher(url, { params: filters })
  );

  return {
    issues: data,
    isLoading: !data && !error,
    error,
    mutate, // Revalidate
  };
}
```

### Client State (Zustand - minimal)

```typescript
// store/ui-store.ts
import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  theme: 'dark' | 'light';

  setSidebarOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  commandPaletteOpen: false,
  theme: 'dark',

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setTheme: (theme) => set({ theme }),
}));
```

---

## 🧪 Testing Strategy

### Database Tests

```typescript
// tests/database/issues.test.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeEach(async () => {
  await prisma.issue.deleteMany();
});

test('create issue with custom fields', async () => {
  const issue = await prisma.issue.create({
    data: {
      title: 'Test Issue',
      status: 'open',
      customFields: { epic: 'Test Epic' },
    },
  });

  expect(issue.customFields).toEqual({ epic: 'Test Epic' });
});
```

### API Tests

```typescript
// tests/api/issues.test.ts
import { POST } from '@/app/api/issues/route';

test('POST /api/issues creates issue', async () => {
  const request = new Request('http://localhost:3000/api/issues', {
    method: 'POST',
    body: JSON.stringify({ title: 'Test Issue' }),
  });

  const response = await POST(request);
  const data = await response.json();

  expect(data.title).toBe('Test Issue');
});
```

### Component Tests

```typescript
// tests/components/IssueCard.test.tsx
import { render, screen } from '@testing-library/react';
import { IssueCard } from '@/components/issues/IssueCard';

test('renders issue card', () => {
  const issue = {
    id: 1,
    title: 'Test Issue',
    status: 'open',
  };

  render(<IssueCard issue={issue} />);

  expect(screen.getByText('Test Issue')).toBeInTheDocument();
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/issues.spec.ts
import { test, expect } from '@playwright/test';

test('create issue flow', async ({ page }) => {
  await page.goto('http://localhost:3000/issues');
  await page.click('text=New Issue');
  await page.fill('input[name="title"]', 'Test Issue');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/issues\/\d+/);
});
```

---

## 📦 Monorepo Structure

```
projectpulse/
├── apps/
│   ├── web/                     # Next.js application
│   │   ├── app/                 # App Router
│   │   ├── components/          # React components
│   │   ├── lib/                 # Utilities
│   │   ├── actions/             # Server Actions
│   │   ├── prisma/              # Prisma schema
│   │   ├── public/              # Static assets
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── mcp-server/              # MCP server
│       ├── src/
│       │   ├── index.ts         # Main server
│       │   ├── tools/           # MCP tools
│       │   ├── resources/       # MCP resources
│       │   └── prompts/         # MCP prompts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/                    # Shared packages (future)
│   ├── types/                   # Shared TypeScript types
│   └── utils/                   # Shared utilities
│
├── scripts/                     # Build/deployment scripts
│   ├── setup.sh
│   └── backup.sh
│
├── docker-compose.yml
├── .env.example
├── package.json                 # Workspace root
├── pnpm-workspace.yaml
└── README.md
```

---

## 🎯 Summary

### What Makes This Architecture Great?

1. **Simple**: Single Next.js app, not microservices
2. **Modern**: Latest Next.js 14, App Router, Server Components
3. **Fast**: Hybrid search, optimized database indexes
4. **Private**: 100% local, no cloud dependencies
5. **Extensible**: Easy to add features, modular design
6. **Integrated**: Deep Claude Code integration via MCP
7. **Intelligent**: Agent personas, context injection
8. **Secure**: Semgrep integration, tiered permissions
9. **Complete**: Issue tracker + knowledge + wiki + security

### Technology Choices Summary

| Component  | Technology                | Why                                 |
| ---------- | ------------------------- | ----------------------------------- |
| Frontend   | Next.js 14 (App Router)   | Modern, SSR, unified with backend   |
| Backend    | Next.js API Routes        | Simple, integrated, fewer services  |
| Database   | PostgreSQL 16             | JSONB, pgvector, full-text search   |
| ORM        | Prisma                    | Type-safe, migrations, excellent DX |
| Embeddings | @xenova/transformers      | Local, private, $0 cost             |
| UI         | shadcn/ui + Tailwind      | Modern, accessible, customizable    |
| MCP        | @modelcontextprotocol/sdk | Official SDK, TypeScript            |
| Deployment | Docker Compose            | Simple, consistent, LAN-ready       |

### Core Features Confirmed

✅ Issue Tracker (with custom fields)  
✅ Knowledge Base (with semantic search)  
✅ Documentation Wiki (hierarchical)  
✅ Security Dashboard (Semgrep integration)  
✅ Agent Personas (via MCP Prompts)  
✅ Command Palette (Cmd+K)  
✅ Slash Commands (in editors)  
✅ Helper Script Integration  
✅ Hybrid Search (full-text + semantic)  
✅ Dark/Light themes

---

## 📚 Next Documents

Continue to:

- **02-DATABASE-SCHEMA.md** - Complete Prisma schema
- **03-MCP-SPECIFICATION.md** - All MCP tools/resources/prompts
- **04-UI-ARCHITECTURE.md** - Design system & components
- **05-IMPLEMENTATION-GUIDE.md** - Week-by-week guide
- **06-AGENT-PERSONAS.md** - Persona system deep dive
- **07-QUICK-START.md** - Get running in 30 minutes

---

**Architecture finalized and ready for implementation! 🚀**
