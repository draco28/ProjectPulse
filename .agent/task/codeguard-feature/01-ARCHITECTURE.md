# CodeGuard Architecture

## The Correct Mental Model

ProjectPulse is a "dumb" infrastructure layer that enables intelligent agents. It doesn't have its own LLM — it provides tools that agents (like Claude Code) use. The intelligence comes from the agent, not the platform.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        THE AGENT                                 │
│              (Claude Code, Cursor, etc.)                         │
│                                                                  │
│    ┌──────────────────────────────────────────────────────────┐ │
│    │                   LLM (Claude)                            │ │
│    │  • Understands code semantics                             │ │
│    │  • Reasons about bugs                                     │ │
│    │  • Generates fixes                                        │ │
│    │  • Makes decisions                                        │ │
│    └──────────────────────────────────────────────────────────┘ │
│                            ↓ uses                                │
│    ┌──────────────────────────────────────────────────────────┐ │
│    │                   MCP Tools                               │ │
│    │  • projectpulse_ticket_create                             │ │
│    │  • projectpulse_knowledge_search                          │ │
│    │  • codeguard_scan_workspace    ← NEW                      │ │
│    │  • codeguard_analyze_file      ← NEW                      │ │
│    │  • codeguard_report_issue      ← NEW                      │ │
│    └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓ MCP protocol
┌─────────────────────────────────────────────────────────────────┐
│                    PROJECTPULSE + CODEGUARD                      │
│                    (Infrastructure Layer)                        │
│                                                                  │
│    ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐  │
│    │ Project Mgmt   │  │  Code Analysis │  │   Data Storage  │  │
│    │                │  │   (CodeGuard)  │  │                 │  │
│    │ • Tickets      │  │ • File Scanner │  │ • PostgreSQL    │  │
│    │ • Sprints      │  │ • AST Parser   │  │ • Issues DB     │  │
│    │ • Phases       │  │ • Pattern      │  │ • Scan Results  │  │
│    │ • Wiki         │  │   Matcher      │  │ • Embeddings    │  │
│    └────────────────┘  └────────────────┘  └─────────────────┘  │
│                                                                  │
│    NO LLM HERE - Just infrastructure + deterministic analysis    │
└─────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### What CodeGuard Provides (No LLM Needed)

| Component | What It Does | Why It's Useful |
|-----------|--------------|-----------------|
| **File Scanner** | Traverses codebase, respects gitignore, chunks files | Gives agent organized code context |
| **AST Parser** | Parses TS/JS into syntax tree | Gives agent structured code data |
| **Symbol Mapper** | Maps functions, imports, exports across files | Helps agent understand connections |
| **Pattern Matcher** | Rule-based detection (security, anti-patterns) | Catches obvious issues without LLM |
| **Context Aggregator** | Bundles related code for analysis | Helps agent reason about full context |
| **Issue Storage** | Persists findings in database | Tracks issues across sessions |
| **Embeddings** (Ollama) | Semantic code search | Find similar code patterns |

### What The Agent's LLM Does

| Capability | How It Works |
|------------|--------------|
| **Semantic Bug Detection** | Agent reads structured code from CodeGuard, reasons about logic |
| **Explanation Generation** | Agent explains WHY something is a bug |
| **Fix Suggestion** | Agent generates fix based on context |
| **Priority Assessment** | Agent determines severity based on project context |

## Data Flow

```
┌──────────────┐   ┌──────────────┐   ┌─────────────┐
│ File Scanner │ → │ AST Parser   │ → │ Issue Store │
│              │   │ (tree-sitter │   │             │
│ • gitignore  │   │  or ts-ast)  │   │ • by file   │
│ • file types │   │              │   │ • by type   │
│ • chunking   │   │ • symbols    │   │ • by sev.   │
└──────────────┘   │ • imports    │   └─────────────┘
                   │ • functions  │          ↓
                   └──────────────┘   ┌─────────────┐
                          ↓           │ MCP Tools   │
                   ┌──────────────┐   │             │
                   │ LLM Reasoner │   │ • scan_*    │
                   │ (AGENT SIDE) │   │ • get_*     │
                   │              │   │ • fix_*     │
                   │ • Claude API │   └─────────────┘
                   │ • Chunked    │          ↑
                   │   analysis   │   ┌─────────────┐
                   └──────────────┘   │ Patch Gen   │
                          ↓           │             │
                   ┌──────────────┐   │ • diff gen  │
                   │ Pattern      │   │ • validation│
                   │ Matcher      │   └─────────────┘
                   │              │
                   │ • Security   │
                   │ • Anti-pat.  │
                   └──────────────┘
```

## Integration Points

### With Existing ProjectPulse Features

1. **Tickets** - Auto-create tickets for detected issues
2. **Wiki** - Store code analysis documentation
3. **Sessions** - Track scan sessions
4. **Projects** - Scope scans to specific projects

### With External Systems

1. **Git** - Read .gitignore, track file changes
2. **Ollama** - Generate code embeddings for semantic search
3. **CI/CD** - Trigger scans on push/PR (future)

## Why This Architecture?

1. **No additional LLM costs** for ProjectPulse
2. **Users use their existing agent's LLM**
3. **Agent can reason about project context** it already has
4. **Fits the existing "agent-first" architecture**
5. **Portable** - any MCP-enabled agent can use it
