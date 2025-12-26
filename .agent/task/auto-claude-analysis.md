# Auto Claude Analysis & ProjectPulse Inspiration

**Date**: 2025-12-26  
**Purpose**: Deep analysis of Auto Claude features for potential ProjectPulse improvements

---

## 1. What is Auto Claude?

Auto Claude is an **open-source desktop application** that transforms Anthropic's Claude Code CLI into an autonomous software engineering agent. It's a wrapper/orchestrator around Claude Code subscriptions (Pro $20/mo or Max $200/mo).

**Repository**: https://github.com/AndyMik90/Auto-Claude

### Core Value Proposition
- **Autonomous execution**: Describe what you want, agents handle planning → coding → validation
- **Parallel development**: Run up to 12 Claude Code instances simultaneously
- **Safe by default**: All work happens in git worktrees, main branch stays clean
- **Self-validating**: Built-in QA agents check work before human review

---

## 2. How It Leverages Claude Subscription

### Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Auto Claude Desktop UI                     │
│                    (Electron + React)                         │
├─────────────────────────────────────────────────────────────┤
│                    Python Backend                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ run.py      │  │spec_runner  │  │ Prompts/Templates   │  │
│  │ Entry point │  │Orchestrator │  │ Agent personas      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│              Claude Code CLI (User's Subscription)           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Terminal 1  │  │ Terminal 2  │  │ Terminal N  │ (up to 12)│
│  │ (Build #1)  │  │ (Build #2)  │  │ (Build #N)  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│                    Memory Layer (FalkorDB)                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Graph Database + Semantic Search (Graphiti library) │    │
│  │ - Codebase patterns                                  │    │
│  │ - Historical context                                 │    │
│  │ - Cross-session insights                            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Key Insight: It's a **Wrapper**, Not a Replacement

Auto Claude does NOT replace Claude Code or use its own AI. Instead:
1. User has Claude Pro/Max subscription → gets Claude Code CLI
2. Auto Claude spawns multiple CLI instances
3. Feeds structured prompts & context to each instance
4. Orchestrates the workflow between instances
5. Collects outputs and manages task lifecycle

**This means**: Auto Claude is essentially an **orchestration layer** that:
- Manages multiple parallel Claude Code sessions
- Provides structured prompts for different phases
- Handles git worktree isolation
- Implements QA validation loops
- Maintains cross-session memory via FalkorDB

---

## 3. Feature Deep Dive

### 3.1 Agent Pipeline (3-Phase Workflow)

**Phase 1: Spec Creation** (3-8 phases based on complexity)
| Step | Description |
|------|-------------|
| Discovery | Analyzes project structure and tech stack |
| Requirements | Interactive conversation for requirements |
| Research | Validates external integrations against docs |
| Context Discovery | Finds relevant files in codebase |
| Spec Writer | Creates comprehensive specification |
| Spec Critic | Self-critiques using extended thinking |
| Planner | Breaks work into subtasks with dependencies |
| Validation | Ensures all outputs valid before proceeding |

**Phase 2: Implementation**
| Step | Description |
|------|-------------|
| Planner Agent | Creates subtask-based implementation plan |
| Coder Agent | Implements subtasks one-by-one with verification |
| QA Reviewer | Validates all acceptance criteria |
| QA Fixer | Self-healing loop (up to 50 iterations) |

**Phase 3: Merge**
| Step | Description |
|------|-------------|
| Conflict Detection | Identifies files modified in both branches |
| 3-Tier Resolution | Git auto-merge → Conflict-only AI → Full-file AI |
| Parallel Merge | Multiple files resolve simultaneously |
| Staged for Review | Changes staged but not committed |

### 3.2 Parallel Agent Terminals
- Up to 12 simultaneous Claude Code sessions
- Context-aware naming for each terminal
- One-click task context injection
- Power users can connect multiple subscriptions

### 3.3 Git Worktree Isolation
- All development in separate git worktrees
- Main branch stays clean and functional
- Test features in isolation before merging
- `.worktrees/auto-claude/` directory

### 3.4 Self-Validating QA Loop
- QA reviewer checks against acceptance criteria
- QA fixer addresses issues automatically
- Up to 50 iterations until code passes
- No human intervention needed for fixes

### 3.5 AI Merge Resolution
- 3-tier approach: git auto-merge → conflict-only AI → full-file AI
- ~98% prompt reduction by processing only conflict regions
- Parallel processing for multiple conflicting files
- Syntax validation before applying

### 3.6 Memory Layer (FalkorDB)
- Graph database with semantic search
- Hybrid RAG system (Graphiti library)
- Cross-session pattern persistence
- Supports OpenAI, Anthropic, Azure OpenAI, Ollama

### 3.7 Additional Features
| Feature | Description |
|---------|-------------|
| **Kanban Board** | Visual task tracking (Planning → Done) |
| **Insights** | ChatGPT-style codebase exploration |
| **Roadmap** | AI-suggested feature prioritization |
| **Ideation** | Discover improvements, vulnerabilities, gaps |
| **Changelog** | Auto-generate release notes from tasks |
| **Context View** | See what AI understands about your project |

---

## 4. Pros & Cons

### Pros
✅ Parallel development (up to 12x throughput)  
✅ Zero risk to main branch (git worktrees)  
✅ ~98% token reduction in merge conflicts  
✅ Built-in QA validation loop  
✅ Cross-session memory persistence  
✅ Context engineering before coding  
✅ Works with any software stack  
✅ Visual progress tracking (Kanban)  

### Cons
❌ Requires Claude Pro ($20/mo) or Max ($200/mo)  
❌ Docker dependency for memory layer  
❌ Complex setup (Python + Docker + Node.js + Claude CLI)  
❌ Git repository requirement  
❌ Long task duration (30+ minutes for complex features)  
❌ Resource intensive (multiple agents = high CPU/RAM)  

---

## 5. Comparison with ProjectPulse

| Capability | Auto Claude | ProjectPulse | Gap/Opportunity |
|------------|-------------|--------------|-----------------|
| **Task Management** | Kanban board | Tickets + Sprints + Hierarchy | ✅ PP is more comprehensive |
| **Agent Sessions** | Parallel terminals (up to 12) | Single session tracking | ⚠️ Could add parallel tracking |
| **Memory/Context** | FalkorDB graph + semantic | 5 Memory Banks + Knowledge Base | ✅ PP has similar capability |
| **QA Validation** | Self-healing loop (50 iterations) | Manual verification | ❌ **INSPIRATION**: Auto QA loop |
| **Git Isolation** | Git worktrees per task | Not built-in | ❌ **INSPIRATION**: Worktree mgmt |
| **Merge Resolution** | AI-powered conflict resolution | Not built-in | ❌ **INSPIRATION**: AI merge |
| **Progress Tracking** | Visual Kanban | Roadmap + Sprint hierarchy | ✅ PP more structured |
| **Codebase Analysis** | Context discovery phase | Code search + wiki | ⚠️ Could enhance auto-discovery |
| **Spec Generation** | Multi-phase spec creation | Onboarding docs | ⚠️ Could add task specs |
| **Roadmap Planning** | AI-suggested priorities | Manual roadmap | ⚠️ Could add AI suggestions |
| **Ideation** | Auto-discover improvements | Not built-in | ❌ **INSPIRATION**: Auto ideation |
| **Changelog** | Auto-generate from tasks | Not built-in | ❌ **INSPIRATION**: Auto changelog |
| **MCP Integration** | None | Full MCP server | ✅ PP unique advantage |
| **Multi-Project** | Single project focus | Multi-project support | ✅ PP more scalable |
| **Personas/Skills** | Generic agent | Role-based personas | ✅ PP more flexible |

---

## 6. Key Inspirations for ProjectPulse

### 🔥 HIGH PRIORITY

#### 6.1 Self-Validating QA Loop
**What**: After implementation, auto-run validation checks iteratively until passing.

**Implementation Idea**:
```typescript
// New MCP tool: projectpulse_qa_validate
interface QAValidationLoop {
  ticketId: number;
  acceptanceCriteria: string[];
  maxIterations: number; // default 10
  validationCommands: string[]; // e.g., ["pnpm test", "pnpm lint"]
}

// Agent flow:
// 1. Implement feature
// 2. Run qa_validate
// 3. If fails, auto-fix based on error output
// 4. Repeat until pass or max iterations
```

**Value**: Reduces human review burden, catches issues early.

#### 6.2 Git Worktree Management
**What**: Auto-create isolated git worktrees per task/ticket.

**Implementation Idea**:
```typescript
// New MCP tool: projectpulse_worktree_create
interface WorktreeManager {
  ticketId: number;
  baseBranch: string; // default "main"
  worktreePath: string; // auto: .worktrees/ticket-{id}
}

// Ticket lifecycle:
// 1. Start ticket → create worktree
// 2. Work in isolation
// 3. Complete ticket → merge or discard worktree
```

**Value**: Safe parallel development, clean main branch.

#### 6.3 AI Merge Resolution
**What**: Intelligent conflict resolution when merging ticket branches.

**Implementation Idea**:
```typescript
// New MCP tool: projectpulse_merge_resolve
interface MergeResolution {
  ticketId: number;
  targetBranch: string;
  strategy: "auto" | "conflict-only" | "full-file";
}

// 3-tier approach:
// 1. Try git auto-merge
// 2. If conflicts, extract only conflict regions
// 3. Use AI to resolve conflicts
// 4. Validate syntax before applying
```

**Value**: Eliminates manual conflict resolution overhead.

### ⚡ MEDIUM PRIORITY

#### 6.4 Auto-Ideation (Codebase Analysis)
**What**: Periodically analyze codebase and suggest improvements.

**Implementation Idea**:
```typescript
// New MCP tool: projectpulse_ideation_analyze
interface IdeationAnalysis {
  projectId: number;
  scope: "all" | "recent-changes" | "module";
  categories: ("refactoring" | "performance" | "security" | "docs" | "ux")[];
}

// Output: Creates tickets for discovered issues
```

**Value**: Proactive quality improvement.

#### 6.5 Auto-Changelog Generation
**What**: Generate release notes from completed tickets.

**Implementation Idea**:
```typescript
// New MCP tool: projectpulse_changelog_generate
interface ChangelogGenerator {
  projectId: number;
  fromDate?: string;
  toDate?: string;
  sprintNumber?: number;
  format: "markdown" | "json";
}

// Aggregates:
// - Completed tickets by category
// - Breaking changes
// - New features
// - Bug fixes
```

**Value**: Professional release communication.

#### 6.6 Task Spec Generation
**What**: Auto-generate detailed specs before implementation.

**Implementation Idea**:
- Enhance ticket creation with spec generation phase
- Include: requirements, file analysis, implementation plan
- Store as customFields._taskSpec

**Value**: Better context for implementation.

### 💡 NICE TO HAVE

#### 6.7 Parallel Session Dashboard
**What**: Track multiple concurrent agent sessions.

**Implementation**: Enhance AgentSession model to show parallel work.

#### 6.8 AI-Suggested Roadmap
**What**: Based on project goals, suggest feature priorities.

**Implementation**: Analyze backlog + user goals → prioritized roadmap.

---

## 7. Recommended Implementation Order

### Phase 1: Foundation (Sprint 14)
1. **QA Validation Loop** - Highest impact, builds on existing ticket system
2. **Auto-Changelog** - Quick win, uses existing ticket data

### Phase 2: Git Integration (Sprint 15)
3. **Git Worktree Management** - Enables safe parallel development
4. **AI Merge Resolution** - Natural extension of worktree feature

### Phase 3: Intelligence (Sprint 16)
5. **Auto-Ideation** - Proactive quality improvement
6. **Task Spec Generation** - Better implementation context

### Phase 4: Enhancement (Sprint 17)
7. **Parallel Session Dashboard** - Multi-agent visibility
8. **AI-Suggested Roadmap** - Strategic planning assistance

---

## 8. Summary

**Auto Claude's Innovation**: Orchestration layer that maximizes Claude Code subscription value through parallelization, automation, and intelligent workflow management.

**ProjectPulse's Advantage**: Already has robust MCP integration, multi-project support, memory banks, and ticket hierarchy. Can adopt Auto Claude's best ideas without the complexity of managing multiple CLI sessions.

**Top 3 Features to Adopt**:
1. 🥇 **Self-Validating QA Loop** - Automate quality checks
2. 🥈 **Git Worktree Management** - Safe isolation
3. 🥉 **AI Merge Resolution** - Eliminate manual conflicts

These features would complement ProjectPulse's existing strengths and create a more autonomous development experience.

---

## 9. Architectural Reality Check

### Auto Claude's Key Advantage

**Auto Claude is a native desktop app** that wraps Claude Code CLI directly:
- ✅ No network latency - direct process control
- ✅ No MCP overhead - spawns CLI instances directly
- ✅ Native file system access
- ✅ Can run 12 parallel sessions locally

**ProjectPulse is a web application** where:
- ❌ User agents connect via MCP over HTTP
- ❌ Every operation has network latency
- ❌ No in-house intelligence (yet) - relies on user's agent
- ❌ Cannot control user's Claude Code directly

### Current Architecture (MCP-Based)

```
┌─────────────────────────────────────────────────────────────┐
│                   User's Machine                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Claude Code / Cursor / Windsurf                    │    │
│  │  (User's AI Agent - has the "brain")                │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          │ MCP Protocol (HTTP)               │
│                          ▼                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
                    [Network Boundary]
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                   Mac Mini (Cloud)                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  ProjectPulse MCP Server                            │    │
│  │  (90+ tools, but NO intelligence)                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Next.js Web App + PostgreSQL                       │    │
│  │  (Data storage, APIs, Knowledge Base)               │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

**Key Limitation**: ProjectPulse is a "dumb server" - it stores data and provides tools, but the intelligence lives in the user's agent on their machine.

---

## 10. Enhancement Ideas for CURRENT Architecture (MCP-Based)

Given the constraint that we can't control the user's agent, these enhancements focus on **enabling** the user's agent to be more autonomous.

### 10.1 QA Validation Framework (MCP Tool Suite)

Instead of running validation ourselves, provide tools that help user's agent validate:

```typescript
// Tool 1: projectpulse_qa_criteria_get
// Returns structured acceptance criteria for a ticket
{
  ticketId: 29,
  criteria: [
    { id: "AC-1", description: "BullMQ job queue processes jobs", testCommand: "pnpm test:jobs" },
    { id: "AC-2", description: "Worker container starts", testCommand: "docker ps | grep worker" },
  ]
}

// Tool 2: projectpulse_qa_result_store
// Store validation results from agent's runs
{
  ticketId: 29,
  criteriaId: "AC-1",
  passed: true,
  output: "5/5 tests passed",
  timestamp: "2025-12-26T09:30:00Z"
}

// Tool 3: projectpulse_qa_status_get
// Check overall validation status
{
  ticketId: 29,
  status: "partial",
  passed: 4,
  failed: 1,
  pending: 2
}
```

**Value**: Structured QA tracking without needing in-house intelligence.

### 10.2 Task Specification Templates

Provide structured spec generation templates via MCP:

```typescript
// Tool: projectpulse_task_spec_generate
// Returns a structured specification template for agent to fill
{
  ticketId: 45,
  template: {
    discovery: {
      techStack: ["Next.js", "Prisma", "S3"],
      relevantFiles: ["apps/web/lib/upload/", "..."],
      existingPatterns: "File uploads use presigned S3 URLs"
    },
    requirements: {
      functional: ["Upload PDF, MD, TXT files", "Max 50MB"],
      nonFunctional: ["< 500ms response for < 5MB files"]
    },
    implementation: {
      steps: [],
      estimatedHours: null
    }
  }
}
```

**Value**: Consistent spec format that agents can follow.

### 10.3 Git Worktree Guidance (Advisory, Not Control)

Since we can't control user's git, provide **advisory tools**:

```typescript
// Tool: projectpulse_git_worktree_suggest
// Suggests worktree commands for the agent to run
{
  ticketId: 45,
  suggestions: {
    createWorktree: "git worktree add .worktrees/ticket-45 main",
    workDirectory: ".worktrees/ticket-45",
    mergeBack: "git checkout main && git merge ticket-45",
    cleanup: "git worktree remove .worktrees/ticket-45"
  }
}

// Tool: projectpulse_git_worktree_status_store
// Agent reports worktree status back
{
  ticketId: 45,
  worktreePath: ".worktrees/ticket-45",
  status: "active",
  branchName: "ticket-45",
  lastCommit: "abc123"
}
```

**Value**: Enables worktree workflow without server-side git control.

### 10.4 Merge Conflict Detection (Advisory)

```typescript
// Tool: projectpulse_merge_check_suggest
// Suggests merge check commands
{
  ticketId: 45,
  baseBranch: "main",
  suggestions: {
    checkConflicts: "git merge-tree $(git merge-base main ticket-45) main ticket-45",
    dryRun: "git merge --no-commit --no-ff main"
  }
}

// Tool: projectpulse_merge_conflict_store
// Agent stores detected conflicts for tracking
{
  ticketId: 45,
  hasConflicts: true,
  conflictingFiles: ["src/lib/upload.ts", "prisma/schema.prisma"],
  resolvedAt: null
}
```

### 10.5 Enhanced Session Context

Provide richer context for agent sessions:

```typescript
// Tool: projectpulse_session_context_full
// Returns everything agent needs for autonomous work
{
  ticket: { id: 45, title: "...", acceptanceCriteria: [...] },
  spec: { discovery: {...}, requirements: {...} },
  worktree: { suggested: true, path: ".worktrees/ticket-45" },
  qaStatus: { passed: 0, pending: 5 },
  relatedTickets: [{ id: 46, title: "RAG Schema", status: "completed" }],
  codebasePatterns: ["S3 upload pattern at lib/s3/...", "..."]
}
```

**Value**: One-shot context load for autonomous work.

---

## 11. Enhancement Ideas for FUTURE Architecture (In-House Agent)

Once Ticket 29 is implemented, ProjectPulse will have:
- ✅ LLM Gateway (OpenRouter - DeepSeek, Mistral, Llama)
- ✅ Worker container for heavy processing
- ✅ Unified RAG with pgvector
- ✅ Chat system

This changes EVERYTHING. Now we CAN be like Auto Claude.

### Future Architecture (Post-Ticket 29)

```
┌─────────────────────────────────────────────────────────────┐
│                   Mac Mini (Cloud)                           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Next.js Web App (Control Plane)                    │    │
│  │  • Chat UI with streaming                           │    │
│  │  • Task management                                  │    │
│  │  • Job dispatch                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌─────────────┬─────────┴─────────┬─────────────┐          │
│  │  MCP Server │    Worker         │ LLM Gateway │          │
│  │  (90+ tools)│    Container      │ (OpenRouter)│          │
│  │             │    • Parse        │ • DeepSeek  │          │
│  │             │    • Chunk        │ • Mistral   │          │
│  │             │    • Embed        │ • Llama 3   │          │
│  │             │    • Validate     │             │          │
│  └─────────────┴───────────────────┴─────────────┘          │
│                          │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  PostgreSQL + pgvector + Redis                      │    │
│  │  • RAG chunks    • Chat sessions    • Job queue     │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### 11.1 Autonomous Task Executor (Like Auto Claude)

With in-house LLM, we can implement the full agent pipeline:

```typescript
// New service: AutonomousTaskExecutor
class AutonomousTaskExecutor {
  async execute(ticketId: number) {
    // Phase 1: Spec Creation
    const discovery = await this.discoverContext(ticketId);
    const requirements = await this.gatherRequirements(ticketId, discovery);
    const spec = await this.generateSpec(ticketId, requirements);
    
    // Phase 2: Implementation Planning
    const plan = await this.createImplementationPlan(spec);
    
    // Phase 3: Code Generation
    for (const step of plan.steps) {
      const code = await this.generateCode(step);
      await this.writeToWorktree(ticketId, code);
    }
    
    // Phase 4: Validation Loop
    let attempts = 0;
    while (attempts < 10) {
      const result = await this.runValidation(ticketId);
      if (result.passed) break;
      await this.fixIssues(ticketId, result.issues);
      attempts++;
    }
    
    return { status: "ready_for_review" };
  }
}
```

**Dependency**: Ticket 50 (OpenRouter LLM Client) + Ticket 51 (Chat System)

### 11.2 QA Validation Loop with Worker

Leverage the Worker container for validation:

```typescript
// New job type: qa_validation
interface QAValidationJob {
  type: "qa_validation";
  ticketId: number;
  worktreePath: string;
  commands: string[]; // ["pnpm test", "pnpm lint", "pnpm build"]
  maxIterations: number;
}

// Worker processes validation
async function processQAValidation(job: QAValidationJob) {
  const results = await runCommands(job.worktreePath, job.commands);
  
  if (allPassed(results)) {
    return { status: "passed", results };
  }
  
  // Use LLM to analyze failures and suggest fixes
  const fixes = await llmGateway.analyzeFix(results.errors);
  
  // Apply fixes and re-queue if under max iterations
  if (job.iteration < job.maxIterations) {
    await applyFixes(job.worktreePath, fixes);
    await enqueue({ ...job, iteration: job.iteration + 1 });
  }
}
```

**Dependency**: Ticket 40 (BullMQ) + Ticket 36 (Worker Container)

### 11.3 Git Integration for Worktree Management

Ticket 43-44 already plan Git Integration. Extend for worktrees:

```typescript
// Part of Git Integration (Ticket 43)
interface GitWorktreeManager {
  create(ticketId: number, baseBranch: string): Promise<Worktree>;
  list(projectId: number): Promise<Worktree[]>;
  merge(ticketId: number, targetBranch: string): Promise<MergeResult>;
  resolveConflicts(ticketId: number): Promise<void>; // Uses LLM
  cleanup(ticketId: number): Promise<void>;
}
```

**Dependency**: Ticket 43 (Git Integration - Repository Management)

### 11.4 AI Merge Resolution with LLM Gateway

```typescript
// New service: AIConflictResolver
class AIConflictResolver {
  async resolve(worktreePath: string, targetBranch: string) {
    // Step 1: Detect conflicts
    const conflicts = await this.detectConflicts(worktreePath, targetBranch);
    
    // Step 2: Extract conflict regions only (98% token reduction)
    const regions = conflicts.map(c => this.extractConflictRegions(c));
    
    // Step 3: Use LLM to resolve each conflict
    for (const region of regions) {
      const resolution = await this.llmGateway.chat([
        { role: "system", content: "You are a merge conflict resolver..." },
        { role: "user", content: `Resolve this conflict:\n${region.content}` }
      ]);
      
      await this.applyResolution(region.file, resolution);
    }
    
    // Step 4: Validate syntax
    const valid = await this.validateSyntax(worktreePath);
    if (!valid) throw new Error("Resolution produced invalid syntax");
  }
}
```

**Dependency**: Ticket 50 (OpenRouter LLM Client) + Ticket 43 (Git Integration)

### 11.5 Ideation Engine (RAG-Powered)

Use Unified RAG to analyze codebase and suggest improvements:

```typescript
// New MCP tool: projectpulse_ideation_analyze
// Leverages RAG to find improvement opportunities

interface IdeationJob {
  type: "ideation_analysis";
  projectId: number;
  scope: "full" | "recent" | "module";
  categories: ("refactor" | "perf" | "security" | "docs" | "ux")[];
}

// Worker process
async function processIdeation(job: IdeationJob) {
  // 1. Query RAG for code patterns
  const chunks = await ragSearch({
    query: "code quality issues, TODO comments, deprecated patterns",
    projectId: job.projectId
  });
  
  // 2. Use LLM to analyze and categorize
  const analysis = await llmGateway.chat([
    { role: "system", content: ideationPrompt },
    { role: "user", content: JSON.stringify(chunks) }
  ]);
  
  // 3. Create tickets for discovered issues
  for (const issue of analysis.issues) {
    await createTicket({
      projectId: job.projectId,
      title: issue.title,
      kind: "tech_debt",
      source: "agent",
      description: issue.description
    });
  }
}
```

**Dependency**: Ticket 46-49 (Unified RAG) + Ticket 50 (LLM Client)

### 11.6 Auto-Changelog from Tickets

```typescript
// New MCP tool: projectpulse_changelog_generate
interface ChangelogRequest {
  projectId: number;
  fromDate?: string;
  sprintNumber?: number;
  version?: string;
}

async function generateChangelog(req: ChangelogRequest) {
  // 1. Query completed tickets
  const tickets = await ticketSearch({
    projectId: req.projectId,
    status: ["completed"],
    createdFrom: req.fromDate
  });
  
  // 2. Categorize by kind
  const grouped = {
    features: tickets.filter(t => t.kind === "feature"),
    bugs: tickets.filter(t => t.kind === "bug"),
    improvements: tickets.filter(t => t.kind === "task")
  };
  
  // 3. Generate prose with LLM
  const changelog = await llmGateway.chat([
    { role: "system", content: changelogPrompt },
    { role: "user", content: JSON.stringify(grouped) }
  ]);
  
  return {
    version: req.version,
    date: new Date().toISOString(),
    content: changelog
  };
}
```

**Dependency**: Ticket 50 (LLM Client) + existing ticket system

---

## 12. Priority Matrix

### Current Architecture (Pre-Ticket 29)

| Enhancement | Effort | Value | Priority |
|-------------|--------|-------|----------|
| QA Criteria Tools | Low | High | **P1** |
| Task Spec Templates | Low | Medium | **P2** |
| Git Worktree Guidance | Low | Medium | **P2** |
| Enhanced Session Context | Low | High | **P1** |
| Merge Conflict Tracking | Low | Low | P3 |

### Future Architecture (Post-Ticket 29)

| Enhancement | Depends On | Effort | Value | Priority |
|-------------|------------|--------|-------|----------|
| Autonomous Task Executor | T50, T51 | High | Very High | **P1** |
| QA Validation Loop | T40, T36 | Medium | Very High | **P1** |
| AI Merge Resolution | T50, T43 | Medium | High | **P2** |
| Ideation Engine | T46-49, T50 | Medium | Medium | **P3** |
| Auto-Changelog | T50 | Low | Medium | **P3** |
| Git Worktree Management | T43 | Low | High | **P2** |

---

## 13. Summary: Two-Track Strategy

### Track 1: Immediate (Current MCP Architecture)
Focus on **enabling user's agent** with better tools:
1. QA criteria storage and tracking
2. Structured spec templates
3. Git worktree guidance (advisory)
4. Rich session context

**No LLM required** - just better data structures and MCP tools.

### Track 2: Post-Ticket 29 (In-House Intelligence)
Once LLM Gateway + Worker are in place, implement **true autonomy**:
1. Full autonomous task execution
2. Self-healing QA validation loops
3. AI-powered merge conflict resolution
4. Proactive ideation analysis

**This is where ProjectPulse can match Auto Claude's capabilities** while maintaining its advantages (multi-project, MCP integration, web accessibility).

---

## 14. Ticket 29 Integration Points

Auto Claude features map directly to planned infrastructure:

| Auto Claude Feature | Ticket 29 Component | Notes |
|---------------------|---------------------|-------|
| Memory Layer | Unified RAG (T46-49) | pgvector + RagChunk |
| Parallel Agents | Worker Container (T36) | Job-based parallelism |
| LLM for QA/Merge | LLM Gateway (T41) | OpenRouter client |
| Git Integration | Git Integration (T43-44) | Repository management |
| Chat Interface | Chat System (T51-52) | ChatSession/Message |

**Ticket 29 already sets the foundation** for implementing Auto Claude-style features.
