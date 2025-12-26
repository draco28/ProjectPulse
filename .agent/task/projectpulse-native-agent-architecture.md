# ProjectPulse Native Agent Architecture

**Date**: 2025-12-26  
**Status**: Design Proposal  
**Vision**: Split architecture with Web PM + Native Agent App

---

## 1. The Vision: Two-Product Strategy

### Product Split

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ProjectPulse Ecosystem                               │
├─────────────────────────────────────┬───────────────────────────────────────┤
│      ProjectPulse Web (Cloud)       │       ProjectPulse Agent (Native)     │
│      ─────────────────────          │       ────────────────────────        │
│      Traditional PM Features:        │       AI Agent Features:              │
│      • Ticket system                │       • Claude Code CLI wrapper       │
│      • Sprint planning              │       • Conversational memory         │
│      • Roadmap management           │       • Production RAG pipeline       │
│      • Backlog & traceability       │       • Reflection system             │
│      • Team collaboration           │       • ReAct/Plan/Spec agents        │
│      • Wiki & documentation         │       • Codebase understanding        │
│      • Onboarding workflows         │       • Multi-session management      │
│                                     │                                       │
│      Tech: Next.js + PostgreSQL     │       Tech: Electron/Tauri + Rust     │
│      Deploy: Mac mini (cloud)       │       Deploy: User's machine          │
└─────────────────────────────────────┴───────────────────────────────────────┘
                                    │
                                    │ Sync API
                                    │ (REST + WebSocket)
                                    ▼
                    ┌───────────────────────────────┐
                    │   Shared Data Layer           │
                    │   • Tickets ↔ Agent Sessions  │
                    │   • Progress sync             │
                    │   • Knowledge base access     │
                    └───────────────────────────────┘
```

### Why This Split Makes Sense

| Concern | Web App (Cloud) | Native App (Local) |
|---------|-----------------|-------------------|
| **Network** | Always requires internet | Works offline, zero latency for local ops |
| **AI Control** | Can't control user's agent | Direct Claude Code CLI control |
| **File Access** | Limited (upload only) | Full filesystem access |
| **Parallel Sessions** | Server resources shared | Uses local machine resources |
| **LLM Costs** | Pay per API call | Leverage user's Claude subscription |
| **Privacy** | Data on cloud | Code stays local |

---

## 2. Native Agent App Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ProjectPulse Agent (Native Desktop App)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Agent UI Layer                               │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │ Chat Panel   │  │ Terminals    │  │ Context      │               │    │
│  │  │ (Streaming)  │  │ (Up to 12)   │  │ Viewer       │               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │ Session      │  │ Memory       │  │ Sync         │               │    │
│  │  │ Manager      │  │ Explorer     │  │ Status       │               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│  ┌─────────────────────────────────┴───────────────────────────────────┐    │
│  │                         Agent Core Engine                            │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │                    Agent Orchestrator                        │    │    │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │    │    │
│  │  │  │ ReAct    │  │ Plan &   │  │ Spec     │  │ Reflect  │     │    │    │
│  │  │  │ Agent    │  │ Execute  │  │ Agent    │  │ Agent    │     │    │    │
│  │  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                      │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │                    Memory System                              │   │    │
│  │  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │   │    │
│  │  │  │ Conversational │  │ Episodic       │  │ Semantic       │  │   │    │
│  │  │  │ Memory         │  │ Memory         │  │ Memory         │  │   │    │
│  │  │  │ (Chat history) │  │ (Past sessions)│  │ (Knowledge)    │  │   │    │
│  │  │  └────────────────┘  └────────────────┘  └────────────────┘  │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  │                                                                      │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │                    RAG Pipeline                               │   │    │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐  │   │    │
│  │  │  │Codebase │  │Repo     │  │Tech     │  │Hybrid           │  │   │    │
│  │  │  │Indexer  │  │Docs     │  │Docs     │  │Retriever        │  │   │    │
│  │  │  │         │  │Crawler  │  │Fetcher  │  │(BM25 + Vector)  │  │   │    │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘  │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│  ┌─────────────────────────────────┴───────────────────────────────────┐    │
│  │                         Execution Layer                              │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │ Claude Code  │  │ Git          │  │ Validation   │               │    │
│  │  │ CLI Manager  │  │ Worktree     │  │ Runner       │               │    │
│  │  │ (Sessions)   │  │ Manager      │  │ (Tests/Lint) │               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│  ┌─────────────────────────────────┴───────────────────────────────────┐    │
│  │                         Local Data Layer                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │ SQLite       │  │ Vector Store │  │ Graph Store  │               │    │
│  │  │ (Sessions,   │  │ (Qdrant/     │  │ (Knowledge   │               │    │
│  │  │  Memories)   │  │  LanceDB)    │  │  Graph)      │               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Components Deep Dive

### 3.1 Agent Orchestrator

The brain that decides which agent strategy to use and coordinates execution.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         Agent Orchestrator                                │
│                                                                          │
│   User Input                                                             │
│       │                                                                  │
│       ▼                                                                  │
│   ┌─────────────────────────────────────────────────────────┐           │
│   │              Intent Classifier                           │           │
│   │   • Simple Query → Direct Response                       │           │
│   │   • Code Task → ReAct Agent                             │           │
│   │   • Complex Feature → Plan & Execute                     │           │
│   │   • New Feature → Spec-Driven Agent                      │           │
│   │   • Review/Improve → Reflection Agent                    │           │
│   └─────────────────────────────────────────────────────────┘           │
│                              │                                           │
│       ┌──────────────────────┼──────────────────────┐                   │
│       ▼                      ▼                      ▼                   │
│   ┌────────┐          ┌────────────┐          ┌─────────────┐          │
│   │ ReAct  │          │ Plan &     │          │ Spec-Driven │          │
│   │ Agent  │          │ Execute    │          │ Agent       │          │
│   └────────┘          └────────────┘          └─────────────┘          │
│       │                      │                      │                   │
│       └──────────────────────┼──────────────────────┘                   │
│                              ▼                                           │
│                     ┌────────────────┐                                  │
│                     │ Reflection     │ ◄── Triggered after each cycle   │
│                     │ Agent          │                                  │
│                     └────────────────┘                                  │
│                              │                                           │
│                              ▼                                           │
│                     ┌────────────────┐                                  │
│                     │ Memory Update  │                                  │
│                     └────────────────┘                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Agent Types

| Agent Type | When Used | Description |
|------------|-----------|-------------|
| **ReAct** | Simple code tasks | Reason → Act → Observe loop. Fast, iterative. |
| **Plan & Execute** | Multi-step tasks | Create plan upfront, execute steps, adapt if needed. |
| **Spec-Driven** | New features | Discovery → Requirements → Spec → Implementation. |
| **Reflection** | After each cycle | Evaluate output, suggest improvements, learn. |

### 3.2 Memory System

Three-tier memory architecture inspired by human cognition.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Memory System                                  │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                  Conversational Memory                          │    │
│  │                  (Short-term, Current Session)                  │    │
│  │                                                                 │    │
│  │  • Full chat history (user + assistant messages)               │    │
│  │  • Rolling window with summarization (keep last N turns)       │    │
│  │  • Tool call history                                           │    │
│  │  • Current context (active files, git status)                  │    │
│  │                                                                 │    │
│  │  Storage: In-memory + SQLite (session table)                   │    │
│  │  Retention: Current session only                               │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                              │                                          │
│                              │ Summarize & Extract                      │
│                              ▼                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                  Episodic Memory                                │    │
│  │                  (Medium-term, Past Sessions)                   │    │
│  │                                                                 │    │
│  │  • Session summaries (what was done, key decisions)            │    │
│  │  • Discovered patterns (code patterns, user preferences)       │    │
│  │  • Mistakes and corrections (what went wrong, how fixed)       │    │
│  │  • Tool usage patterns (which tools work best for what)        │    │
│  │                                                                 │    │
│  │  Storage: SQLite + Vector embeddings                           │    │
│  │  Retention: Rolling window (last 100 sessions) + important     │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                              │                                          │
│                              │ Consolidate & Generalize                 │
│                              ▼                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                  Semantic Memory                                │    │
│  │                  (Long-term, Persistent Knowledge)              │    │
│  │                                                                 │    │
│  │  • Project facts (tech stack, architecture, conventions)       │    │
│  │  • Codebase knowledge graph (modules, dependencies, patterns)  │    │
│  │  • User preferences (coding style, review preferences)         │    │
│  │  • Domain knowledge (business logic, terminology)              │    │
│  │                                                                 │    │
│  │  Storage: Knowledge Graph (FalkorDB) + Vector Store            │    │
│  │  Retention: Permanent, updated continuously                    │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 RAG Pipeline (Production-Grade)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Production RAG Pipeline                            │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Ingestion Layer                              │   │
│  │                                                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │   │
│  │  │ Codebase    │  │ Repository  │  │ Tech Documentation      │  │   │
│  │  │ Watcher     │  │ Docs        │  │ Fetcher                 │  │   │
│  │  │             │  │             │  │                         │  │   │
│  │  │ • File watch│  │ • README    │  │ • MDN, React docs       │  │   │
│  │  │ • Git hooks │  │ • Wiki      │  │ • Framework guides      │  │   │
│  │  │ • On-demand │  │ • Issues    │  │ • API references        │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Processing Layer                             │   │
│  │                                                                  │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │              Content-Aware Chunking                      │    │   │
│  │  │                                                          │    │   │
│  │  │  Code Files:                                             │    │   │
│  │  │    • AST-based chunking (tree-sitter)                   │    │   │
│  │  │    • Function/class level chunks                         │    │   │
│  │  │    • Preserve imports and type definitions               │    │   │
│  │  │                                                          │    │   │
│  │  │  Documentation:                                          │    │   │
│  │  │    • Semantic chunking (headers, sections)              │    │   │
│  │  │    • Preserve code blocks with context                   │    │   │
│  │  │                                                          │    │   │
│  │  │  Config Files:                                           │    │   │
│  │  │    • Keep whole file (usually small)                     │    │   │
│  │  │    • Extract key-value relationships                     │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │                              │                                   │   │
│  │                              ▼                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │              Enrichment & Embedding                      │    │   │
│  │  │                                                          │    │   │
│  │  │  • Generate embeddings (local: Ollama/sentence-trans)    │    │   │
│  │  │  • Extract metadata (language, imports, exports)         │    │   │
│  │  │  • Build relationships (calls, imports, extends)         │    │   │
│  │  │  • Calculate importance scores                           │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Storage Layer                                │   │
│  │                                                                  │   │
│  │  ┌──────────────────┐  ┌──────────────────┐                     │   │
│  │  │ Vector Store     │  │ Knowledge Graph  │                     │   │
│  │  │ (LanceDB/Qdrant) │  │ (FalkorDB)       │                     │   │
│  │  │                  │  │                  │                     │   │
│  │  │ • Embeddings     │  │ • File→Function  │                     │   │
│  │  │ • Fast ANN       │  │ • Import→Export  │                     │   │
│  │  │ • Metadata       │  │ • Call graphs    │                     │   │
│  │  └──────────────────┘  └──────────────────┘                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Retrieval Layer                              │   │
│  │                                                                  │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │              Hybrid Retriever                            │    │   │
│  │  │                                                          │    │   │
│  │  │  Query Processing:                                       │    │   │
│  │  │    1. Query expansion (add synonyms, related terms)      │    │   │
│  │  │    2. Intent detection (code vs docs vs concept)         │    │   │
│  │  │                                                          │    │   │
│  │  │  Retrieval Strategy:                                     │    │   │
│  │  │    • BM25 (keyword match) - weight: 0.3                  │    │   │
│  │  │    • Vector (semantic) - weight: 0.5                     │    │   │
│  │  │    • Graph (relationships) - weight: 0.2                 │    │   │
│  │  │                                                          │    │   │
│  │  │  Post-Processing:                                        │    │   │
│  │  │    • Rerank with cross-encoder                          │    │   │
│  │  │    • Deduplicate overlapping chunks                      │    │   │
│  │  │    • Expand with graph neighbors                         │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Reflection System

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Reflection System                                  │
│                                                                         │
│  Triggered: After each agent action cycle                               │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Self-Critique Loop                            │   │
│  │                                                                  │   │
│  │   Agent Output ──► Critique Prompt ──► Evaluation ──► Decision  │   │
│  │                                                                  │   │
│  │   Evaluation Dimensions:                                         │   │
│  │     • Correctness: Does it solve the problem?                   │   │
│  │     • Completeness: Are all requirements addressed?             │   │
│  │     • Quality: Is the code clean, tested, documented?           │   │
│  │     • Safety: Any security issues or breaking changes?          │   │
│  │                                                                  │   │
│  │   Decision Outcomes:                                            │   │
│  │     • ACCEPT: Output is satisfactory                            │   │
│  │     • REVISE: Output needs improvement (specific feedback)      │   │
│  │     • REJECT: Start over with different approach                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Learning Loop                                 │   │
│  │                                                                  │   │
│  │   After ACCEPT:                                                 │   │
│  │     • Extract successful patterns → Semantic Memory             │   │
│  │     • Update tool usage statistics                              │   │
│  │     • Record time-to-completion metrics                         │   │
│  │                                                                  │   │
│  │   After REVISE/REJECT:                                          │   │
│  │     • Record mistake patterns → Episodic Memory                 │   │
│  │     • Update approach preferences                               │   │
│  │     • Adjust future prompts based on failures                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Meta-Reflection (Periodic)                    │   │
│  │                                                                  │   │
│  │   Every N sessions, analyze overall performance:                │   │
│  │     • Which agent types work best for which tasks?              │   │
│  │     • Common failure patterns to avoid                          │   │
│  │     • User satisfaction signals (explicit + implicit)           │   │
│  │     • Suggestions for workflow improvements                     │   │
│  │                                                                  │   │
│  │   Output: Updated agent routing weights, improved prompts       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Claude Code CLI Integration

### 4.1 Session Manager

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Claude Code CLI Manager                               │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Session Pool                                  │   │
│  │                                                                  │   │
│  │   ┌─────────┐ ┌─────────┐ ┌─────────┐     ┌─────────┐          │   │
│  │   │Session 1│ │Session 2│ │Session 3│ ... │Session N│          │   │
│  │   │ (Idle)  │ │ (Active)│ │ (Active)│     │ (Idle)  │          │   │
│  │   └─────────┘ └─────────┘ └─────────┘     └─────────┘          │   │
│  │                                                                  │   │
│  │   Pool Size: Configurable (default: 4, max: 12)                 │   │
│  │   Allocation: Round-robin or priority-based                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Session Lifecycle                             │   │
│  │                                                                  │   │
│  │   1. SPAWN                                                      │   │
│  │      • Create Claude Code process in PTY                        │   │
│  │      • Set working directory (project or worktree)              │   │
│  │      • Inject CLAUDE.md for context                             │   │
│  │                                                                  │   │
│  │   2. CONFIGURE                                                  │   │
│  │      • Set memory context from RAG                              │   │
│  │      • Load task-specific instructions                          │   │
│  │      • Configure tool permissions                               │   │
│  │                                                                  │   │
│  │   3. EXECUTE                                                    │   │
│  │      • Send prompts via PTY input                               │   │
│  │      • Stream output, detect completion                         │   │
│  │      • Handle tool calls                                        │   │
│  │                                                                  │   │
│  │   4. TEARDOWN                                                   │   │
│  │      • Extract session summary                                  │   │
│  │      • Update memories                                          │   │
│  │      • Return to pool or terminate                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Context Injection                             │   │
│  │                                                                  │   │
│  │   Before each session:                                          │   │
│  │     • Write .claude/context.md with:                            │   │
│  │       - Task description                                        │   │
│  │       - Relevant RAG chunks                                     │   │
│  │       - Memory context (recent decisions, patterns)             │   │
│  │       - Acceptance criteria                                     │   │
│  │                                                                  │   │
│  │     • Configure settings.local.json for:                        │   │
│  │       - Allowed tools                                           │   │
│  │       - File permissions                                        │   │
│  │       - Auto-run rules                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Git Worktree Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Git Worktree Manager                                  │
│                                                                         │
│  Project Root: /Users/dev/my-project                                    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │   Main Worktree                                                  │   │
│  │   /Users/dev/my-project                                          │   │
│  │   Branch: main (protected)                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │   Task Worktrees (Isolated)                                      │   │
│  │                                                                  │   │
│  │   /Users/dev/my-project/.worktrees/                              │   │
│  │     ├── task-45/           # Feature: Add auth                  │   │
│  │     │   └── Branch: feature/task-45-auth                        │   │
│  │     ├── task-46/           # Bug: Fix login redirect            │   │
│  │     │   └── Branch: fix/task-46-redirect                        │   │
│  │     └── task-47/           # Refactor: Extract utils            │   │
│  │         └── Branch: refactor/task-47-utils                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Operations:                                                            │
│    • create(taskId) → git worktree add .worktrees/task-{id} main       │
│    • merge(taskId) → git checkout main && git merge task-{id}          │
│    • cleanup(taskId) → git worktree remove .worktrees/task-{id}        │
│    • sync(taskId) → git fetch && git rebase main                       │
│    • resolveConflicts(taskId) → AI-powered resolution                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Integration with ProjectPulse Web

### 5.1 Sync Protocol

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Web ↔ Native Sync Protocol                            │
│                                                                         │
│  ┌─────────────────────────────────┐  ┌───────────────────────────────┐│
│  │   ProjectPulse Web (Cloud)      │  │  ProjectPulse Agent (Native)  ││
│  │                                 │  │                               ││
│  │   ┌─────────────────────────┐   │  │  ┌─────────────────────────┐  ││
│  │   │ Tickets                 │◄──┼──┼─►│ Local Task Cache        │  ││
│  │   │ Sprints                 │   │  │  │ Agent Sessions          │  ││
│  │   │ Roadmap                 │   │  │  │ Progress Updates        │  ││
│  │   └─────────────────────────┘   │  │  └─────────────────────────┘  ││
│  │              │                  │  │              │                ││
│  │              ▼                  │  │              ▼                ││
│  │   ┌─────────────────────────┐   │  │  ┌─────────────────────────┐  ││
│  │   │ Sync API                │   │  │  │ Sync Client             │  ││
│  │   │                         │   │  │  │                         │  ││
│  │   │ POST /api/sync/pull     │◄──┼──┼──│ Pull changes from web   │  ││
│  │   │ POST /api/sync/push     │◄──┼──┼──│ Push progress to web    │  ││
│  │   │ WS   /api/sync/realtime │◄─►│  │  │ Real-time updates       │  ││
│  │   └─────────────────────────┘   │  │  └─────────────────────────┘  ││
│  └─────────────────────────────────┘  └───────────────────────────────┘│
│                                                                         │
│  Sync Flow:                                                             │
│                                                                         │
│  1. Agent starts session for Ticket #45                                │
│     → POST /api/sync/session/start { ticketId: 45 }                    │
│     ← { sessionId: "abc123", ticket: {...}, context: {...} }           │
│                                                                         │
│  2. Agent updates progress                                              │
│     → POST /api/sync/session/update { sessionId: "abc123", progress }  │
│     ← { ack: true }                                                     │
│                                                                         │
│  3. Agent completes task                                                │
│     → POST /api/sync/session/complete { sessionId: "abc123", result }  │
│     ← { ticketStatus: "review", syncedAt: "..." }                      │
│                                                                         │
│  4. Real-time (optional)                                                │
│     ← WS: { type: "ticket_updated", ticketId: 45, changes: {...} }     │
│     → WS: { type: "progress", sessionId: "abc123", percent: 75 }       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Data Ownership

| Data Type | Primary Location | Synced To | Notes |
|-----------|------------------|-----------|-------|
| Tickets | Web | Native | Read-only on native |
| Sprints | Web | Native | Read-only on native |
| Agent Sessions | Native | Web | Progress synced to web |
| Memories | Native | - | Local only (privacy) |
| RAG Index | Native | - | Local only (performance) |
| Code | Native | - | Never leaves machine |
| QA Results | Native | Web | Summary synced to web |

---

## 6. Technology Stack

### Native App

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Framework** | Tauri (Rust + WebView) | Lightweight, secure, cross-platform |
| **Frontend** | React + TailwindCSS | Reuse skills from web app |
| **Local DB** | SQLite (via rusqlite) | Sessions, memories, cache |
| **Vector Store** | LanceDB | Embedded, fast, Rust-native |
| **Graph Store** | FalkorDB or SurrealDB | Knowledge graph, relationships |
| **Embeddings** | Ollama (local) | Privacy, offline capable |
| **Terminal** | xterm.js | Claude Code session display |

### Why Tauri over Electron?

| Aspect | Tauri | Electron |
|--------|-------|----------|
| Bundle size | ~3-5 MB | ~150+ MB |
| Memory | ~50 MB | ~300+ MB |
| Security | Rust sandbox | Node.js |
| Native APIs | Excellent | Good |
| Learning curve | Higher | Lower |

Given we need to run multiple Claude Code sessions + RAG pipeline, **memory efficiency matters**.

---

## 7. Implementation Roadmap

### Phase 1: Foundation (4 weeks)

| Week | Deliverable |
|------|-------------|
| 1 | Tauri app scaffold, basic UI shell, Claude Code CLI spawn |
| 2 | Session manager (spawn, terminate, output streaming) |
| 3 | SQLite setup, basic conversational memory |
| 4 | Sync client (pull tickets from PP Web) |

### Phase 2: RAG Pipeline (4 weeks)

| Week | Deliverable |
|------|-------------|
| 5 | Codebase watcher, file ingestion pipeline |
| 6 | AST-based chunking (tree-sitter) |
| 7 | LanceDB vector store, embedding generation |
| 8 | Hybrid retrieval (BM25 + vector) |

### Phase 3: Agent System (4 weeks)

| Week | Deliverable |
|------|-------------|
| 9 | ReAct agent implementation |
| 10 | Plan & Execute agent |
| 11 | Spec-Driven agent |
| 12 | Agent orchestrator, intent classification |

### Phase 4: Memory & Reflection (3 weeks)

| Week | Deliverable |
|------|-------------|
| 13 | Episodic memory (session summaries, patterns) |
| 14 | Semantic memory (knowledge graph) |
| 15 | Reflection system, self-critique loop |

### Phase 5: Advanced Features (3 weeks)

| Week | Deliverable |
|------|-------------|
| 16 | Git worktree manager |
| 17 | Multi-session parallel execution |
| 18 | QA validation loop, AI merge resolution |

### Total: ~18 weeks (4.5 months)

---

## 8. Open Questions

1. **Monetization**: Free native app + PP Web subscription? Or separate pricing?
2. **Offline Mode**: Should native app work fully offline with local LLM?
3. **Multi-repo**: Support multiple projects with separate RAG indexes?
4. **Team Sync**: Share memories/patterns across team members?
5. **Custom Models**: Support for OpenRouter/local models in addition to Claude?

---

## 9. Summary

### The Split

| Product | Focus | Advantage |
|---------|-------|-----------|
| **PP Web** | Project management | Team collaboration, web access, data persistence |
| **PP Agent** | AI coding | No latency, local control, Claude CLI integration |

### What PP Agent Brings

- **Native performance**: Zero network latency for local operations
- **Claude Code control**: Direct CLI wrapper, parallel sessions
- **Production RAG**: Local codebase indexing, hybrid retrieval
- **Advanced memory**: Conversational + Episodic + Semantic
- **Smart agents**: ReAct/Plan/Spec with reflection
- **Safe isolation**: Git worktrees per task

### Integration

- Web defines work (tickets, sprints)
- Agent executes work (sessions, code)
- Sync keeps both in harmony

This architecture gives you the **best of both worlds**: Auto Claude-style native power + ProjectPulse's project management sophistication.
