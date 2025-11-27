# Filesystem MCP Pattern: Migration Guide for ProjectPulse

## The Problem

**ProjectPulse has 71 MCP tools registered.**

With traditional MCP, every tool definition loads into context upfront:

```
Traditional MCP Token Usage:
┌─────────────────────────────────────────────────────────────┐
│  71 tools × ~1,000 tokens each = 71,000+ tokens             │
│                                                             │
│  + Every intermediate result passes through model           │
│  + Large data (issues, wikis, etc.) round-trips             │
│                                                             │
│  Total per conversation: 100,000 - 200,000 tokens           │
│  Cost: $$$$ per agent interaction                           │
└─────────────────────────────────────────────────────────────┘
```

**This is unsustainable for production.**

---

## The Solution: Filesystem MCP

Anthropic's November 2025 pattern: **Present MCP tools as files, not loaded definitions.**

```
Filesystem MCP Token Usage:
┌─────────────────────────────────────────────────────────────┐
│  Agent discovers tools on-demand via filesystem             │
│  Only reads tools it needs (~100-200 tokens each)           │
│  Results stay in sandbox, not context                       │
│                                                             │
│  Total per conversation: 2,000 - 5,000 tokens               │
│  Reduction: 98%                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## How It Works

### Before (Traditional MCP)

```typescript
// All 71 tools loaded into context at startup
const tools = [
  { name: "create_project", description: "...", parameters: {...} },
  { name: "update_project", description: "...", parameters: {...} },
  { name: "delete_project", description: "...", parameters: {...} },
  { name: "create_issue", description: "...", parameters: {...} },
  // ... 67 more tools
  // = 71,000+ tokens consumed before agent does ANYTHING
];
```

### After (Filesystem MCP)

```
Virtual Filesystem Structure:
./servers/projectpulse/
├── index.ts                    # "ProjectPulse: 71 tools for project management"
├── projects/
│   ├── create.ts               # createProject(name, description) → Project
│   ├── update.ts               # updateProject(id, data) → Project
│   ├── delete.ts               # deleteProject(id) → void
│   └── list.ts                 # listProjects(filters) → Project[]
├── issues/
│   ├── create.ts               # createIssue(projectId, title, ...) → Issue
│   ├── update.ts               # updateIssue(id, data) → Issue
│   └── list.ts                 # listIssues(projectId, filters) → Issue[]
├── wiki/
│   ├── create.ts
│   ├── update.ts
│   └── search.ts
├── workflows/
│   └── ...
└── knowledge-base/
    └── ...

./workspace/                    # Intermediate results (NOT in context)
├── query_results.json
├── issue_list.json
└── analysis.md

./skills/                       # Reusable agent workflows
├── triage_issues.ts
├── weekly_report.ts
└── onboard_project.ts
```

### Agent Workflow

```typescript
// Step 1: Agent explores filesystem (~50 tokens)
const categories = await fs.readdir('./servers/projectpulse/');
// → ['index.ts', 'projects/', 'issues/', 'wiki/', 'workflows/', 'knowledge-base/']

// Step 2: Agent reads only what it needs (~150 tokens)
const issueTools = await fs.readdir('./servers/projectpulse/issues/');
// → ['create.ts', 'update.ts', 'list.ts']

const createIssueAPI = await fs.readFile('./servers/projectpulse/issues/create.ts');
// → "export async function createIssue(projectId: string, title: string, ...): Promise<Issue>"

// Step 3: Agent writes code (executes in sandbox, not context)
import { listIssues } from './servers/projectpulse/issues/list';
import { updateIssue } from './servers/projectpulse/issues/update';

const issues = await listIssues({ projectId: 'abc', status: 'open' });
// This returns 500 issues - but they DON'T go into context!

// Filter and process in sandbox
const criticalIssues = issues.filter(i => i.priority === 'critical');

// Save to workspace (still not in context)
await fs.writeFile('./workspace/critical_issues.json', JSON.stringify(criticalIssues));

// Step 4: Only summary goes to model (~100 tokens)
console.log(`Found ${criticalIssues.length} critical issues out of ${issues.length} total`);
console.log(`Top 3: ${criticalIssues.slice(0,3).map(i => i.title).join(', ')}`);
```

---

## Migration Strategy for ProjectPulse

### Phase 1: Categorize Your 71 Tools

Group tools by domain:

```
projectpulse/
├── projects/         # Project CRUD (create, read, update, delete, list)
├── issues/           # Issue management
├── wiki/             # Wiki/documentation
├── workflows/        # Workflow automation
├── knowledge-base/   # KB operations
├── users/            # User management
├── notifications/    # Notification system
├── analytics/        # Reports and analytics
└── integrations/     # External integrations
```

### Phase 2: Generate TypeScript Wrappers

For each MCP tool, generate a `.ts` file:

```typescript
// ./servers/projectpulse/issues/create.ts

/**
 * Create a new issue in a project
 * 
 * @param projectId - The project to create the issue in
 * @param title - Issue title
 * @param description - Issue description (markdown supported)
 * @param priority - 'low' | 'medium' | 'high' | 'critical'
 * @param assignee - User ID to assign (optional)
 * @returns The created Issue object
 */
export async function createIssue(params: {
  projectId: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
}): Promise<Issue> {
  return await mcpCall('projectpulse', 'create_issue', params);
}

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Phase 3: Create Index Files

Each category gets an `index.ts` describing available tools:

```typescript
// ./servers/projectpulse/issues/index.ts

/**
 * Issue Management Tools
 * 
 * Available operations:
 * - create.ts: Create new issues
 * - update.ts: Update existing issues
 * - delete.ts: Delete issues
 * - list.ts: List/search issues with filters
 * - assign.ts: Assign issues to users
 * - transition.ts: Change issue status
 * - comment.ts: Add comments to issues
 * - link.ts: Link related issues
 */
export * from './create';
export * from './update';
export * from './delete';
export * from './list';
// ...
```

### Phase 4: Implement Sandbox Runtime

```typescript
// Runtime that executes agent code in sandbox
import { VM } from 'vm2'; // or Deno

const sandbox = new VM({
  timeout: 30000,
  sandbox: {
    fs: virtualFilesystem,           // Virtual FS with MCP wrappers
    console: capturedConsole,        // Captures output for model
    mcpCall: mcpCallImplementation,  // Actual MCP call bridge
  }
});

// Agent writes code, we execute it
const agentCode = `
  import { listIssues } from './servers/projectpulse/issues/list';
  const issues = await listIssues({ status: 'open' });
  console.log(\`Found \${issues.length} open issues\`);
`;

const result = await sandbox.run(agentCode);
// Only console.log output goes back to model
```

---

## Token Comparison for ProjectPulse

| Scenario | Traditional MCP | Filesystem MCP |
|----------|-----------------|----------------|
| Tool definitions (71 tools) | 71,000 tokens | 0 (on-demand) |
| Discovering tools | N/A | ~200 tokens |
| Reading 3 tool APIs | N/A | ~450 tokens |
| Fetching 500 issues | 50,000 tokens | 0 (in sandbox) |
| Processing results | 10,000 tokens | 0 (in sandbox) |
| Summary to model | N/A | ~200 tokens |
| **Total** | **131,000 tokens** | **~850 tokens** |

**Reduction: 99.3%**

---

## Implementation Options

### Option 1: Wrapper Layer (Minimal Changes)

Add a filesystem abstraction on top of existing MCP:

```
Client Agent
     ↓
Filesystem MCP Layer (new)
     ↓
Existing ProjectPulse MCP Server (unchanged)
```

### Option 2: Server-Side Generation

Generate TypeScript wrappers from your MCP tool definitions:

```typescript
// Build script that reads your MCP tools and generates .ts files
for (const tool of mcpTools) {
  const wrapper = generateWrapper(tool);
  await writeFile(`./servers/projectpulse/${tool.category}/${tool.name}.ts`, wrapper);
}
```

### Option 3: Hybrid Approach

Keep traditional MCP for simple tools, use filesystem for complex operations:

```
Simple operations (< 5 tools needed): Traditional MCP
Complex operations (many tools, large data): Filesystem MCP
```

---

## Quick Win: Skills Directory

Even before full migration, implement `./skills/` for common workflows:

```typescript
// ./skills/weekly_project_report.ts

/**
 * Generate weekly project report
 * Combines: listProjects, listIssues, getAnalytics, generateSummary
 */
export async function weeklyReport(projectId: string): Promise<string> {
  const project = await getProject(projectId);
  const issues = await listIssues({ projectId, updatedAfter: oneWeekAgo() });
  const analytics = await getAnalytics({ projectId, period: 'week' });
  
  // Process in sandbox
  const summary = {
    newIssues: issues.filter(i => i.createdAt > oneWeekAgo()).length,
    closedIssues: issues.filter(i => i.status === 'closed').length,
    velocity: analytics.velocity,
  };
  
  // Save full report to workspace
  await fs.writeFile('./workspace/weekly_report.json', JSON.stringify({ project, issues, analytics }));
  
  // Return only summary to model
  return `Weekly Report for ${project.name}: ${summary.newIssues} new, ${summary.closedIssues} closed, velocity: ${summary.velocity}`;
}
```

Agent just calls: `import { weeklyReport } from './skills/weekly_project_report'; await weeklyReport('proj-123');`

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Client Agent                                       │
│                                   │                                             │
│                    ┌──────────────▼──────────────┐                              │
│                    │     Code Execution Sandbox   │                              │
│                    │         (Deno / VM2)         │                              │
│                    └──────────────┬──────────────┘                              │
│                                   │                                             │
│  ┌────────────────────────────────┼────────────────────────────────────────┐   │
│  │                    Virtual Filesystem                                   │   │
│  │                                                                         │   │
│  │  ./servers/projectpulse/                                                │   │
│  │  ├── projects/   (5 tools)     Agent reads                              │   │
│  │  ├── issues/     (8 tools)     only what ────────► ~200 tokens          │   │
│  │  ├── wiki/       (6 tools)     it needs                                 │   │
│  │  ├── workflows/  (12 tools)                                             │   │
│  │  ├── kb/         (10 tools)                                             │   │
│  │  ├── users/      (8 tools)                                              │   │
│  │  ├── notifications/ (7 tools)                                           │   │
│  │  ├── analytics/  (9 tools)                                              │   │
│  │  └── integrations/ (6 tools)                                            │   │
│  │                    = 71 tools total                                     │   │
│  │                                                                         │   │
│  │  ./workspace/                  Results stay ────────► 0 tokens          │   │
│  │  └── *.json                    here, not in                             │   │
│  │                                context                                  │   │
│  │  ./skills/                     Reusable                                 │   │
│  │  └── *.ts                      workflows                                │   │
│  │                                                                         │   │
│  └─────────────────────────────────┬───────────────────────────────────────┘   │
│                                    │                                            │
│                    ┌───────────────▼───────────────┐                           │
│                    │   MCP Bridge (mcpCall())      │                           │
│                    │   Translates to actual MCP    │                           │
│                    └───────────────┬───────────────┘                           │
│                                    │                                            │
└────────────────────────────────────┼────────────────────────────────────────────┘
                                     │
                      ┌──────────────▼──────────────┐
                      │  ProjectPulse MCP Server    │
                      │       (Unchanged)           │
                      │                             │
                      │  71 tools still work        │
                      │  via JSON-RPC               │
                      └─────────────────────────────┘
```

---

## References

- **Anthropic Blog:** https://www.anthropic.com/engineering/code-execution-with-mcp
- **98% Token Reduction Case Study:** https://github.com/orgs/modelcontextprotocol/discussions/629
- **MCP Specification:** https://modelcontextprotocol.io

---

## Next Steps for Claude Code

1. **Audit current MCP tools** - List all 71 tools and categorize them
2. **Identify high-token operations** - Which tools return large data?
3. **Design filesystem structure** - Group tools logically
4. **Prototype with 1 category** - Start with issues or projects
5. **Measure token reduction** - Compare before/after
6. **Roll out to all categories** - Full migration

---

## Quick Reference Card

```
BEFORE (Traditional MCP):
┌─────────────────────────────────┐
│ Load 71 tools = 71,000 tokens   │
│ Call tool = result in context   │
│ Call another = more context     │
│ Total: 100,000+ tokens          │
└─────────────────────────────────┘

AFTER (Filesystem MCP):
┌─────────────────────────────────┐
│ ls ./servers/ = 50 tokens       │
│ cat tool.ts = 100 tokens        │
│ Execute code = 0 tokens (sandbox)│
│ console.log = 100 tokens        │
│ Total: ~500 tokens              │
└─────────────────────────────────┘

KEY PRINCIPLE:
"Agent writes code, code calls MCP, 
 results stay in sandbox, 
 only summary goes to model"
```

---

*This pattern is especially valuable for ProjectPulse because:*
- *71 tools = massive upfront token cost*
- *Project data (issues, wikis) can be large*
- *Agent-first architecture means frequent MCP calls*
- *Production costs will be significantly reduced*
