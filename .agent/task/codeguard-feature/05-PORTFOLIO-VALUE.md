# CodeGuard Portfolio Value

## For AI Agent Developer Roles

This project demonstrates the exact skills companies are looking for in AI agent developers.

## Key Selling Points

### 1. MCP Protocol Expertise

**What you built:**
- Complete MCP tool suite (10+ tools) following the protocol specification
- Proper input/output schemas with validation
- Resource URIs for agent context
- Integration with multiple MCP clients

**Interview talking point:**
> "I built an infrastructure layer that enables any AI agent to perform intelligent code analysis through MCP. The system exposes 10+ tools covering scanning, analysis, pattern matching, and issue management. I designed the tools to be agent-agnostic — they work with Claude Code, Cursor, and any MCP-enabled environment."

### 2. Agent Architecture Understanding

**What you built:**
- Infrastructure that empowers agents without replacing their intelligence
- Clear separation: deterministic analysis (infrastructure) vs. semantic reasoning (agent's LLM)
- Context aggregation optimized for LLM consumption

**Interview talking point:**
> "The key insight was that we don't need another LLM — we need infrastructure that makes existing agents smarter. CodeGuard provides structured data and deterministic checks, while the agent's LLM does semantic reasoning. This architecture means zero LLM cost for the platform while leveraging the user's existing agent capabilities."

### 3. LLM Context Management

**What you built:**
- Token-aware context bundling (stays within LLM limits)
- Relevance scoring for code selection
- Cross-file dependency tracing
- Suggested focus areas for LLM analysis

**Interview talking point:**
> "One of the hardest problems was giving agents enough context without exceeding token limits. I built a context aggregator that traces imports, scores relevance, and bundles related code — all while respecting configurable token budgets. The system even suggests what the LLM should focus on."

### 4. Code Analysis Depth

**What you built:**
- AST parsing (TypeScript/JavaScript)
- Symbol extraction (functions, classes, imports)
- Pattern matching (security, async, null-safety)
- Complexity metrics (cyclomatic, cognitive)
- Semantic search via embeddings

**Interview talking point:**
> "CodeGuard performs both static analysis and enables semantic analysis. The static layer catches deterministic issues like hardcoded secrets and unhandled promises using AST patterns. The semantic layer provides rich context for the agent's LLM to catch deeper logic bugs that rule-based tools miss."

### 5. Database Design

**What you built:**
- Normalized schema for scans, issues, patterns
- pgvector for code embeddings
- Efficient indexing for similarity search
- Proper cascade deletes and referential integrity

**Interview talking point:**
> "The database design supports both operational queries and vector similarity search. I used pgvector with HNSW indexing for fast code similarity lookup. The schema tracks issue lifecycle from detection through resolution, with automatic linking to the project management system."

### 6. System Integration

**What you built:**
- Integrates with ProjectPulse (tickets, projects)
- Integrates with Ollama (embeddings)
- Integrates with git (.gitignore, file changes)
- Works with any MCP client

**Interview talking point:**
> "CodeGuard isn't standalone — it's part of a larger ecosystem. Detected issues automatically create tickets in the project management system. It uses the existing Ollama integration for embeddings. And because it's MCP-based, it works with any compliant client without modification."

---

## Technical Achievements

### Quantifiable Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Tools Implemented | 10+ | Complete MCP tool coverage |
| Pattern Rules | 15+ | Built-in security/quality rules |
| Response Time | <5s | For most operations |
| Context Efficiency | 80% | Relevance of bundled context |
| Test Coverage | >80% | Comprehensive test suite |

### Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **No embedded LLM** | Let agents use their own LLM — more flexible, zero cost |
| **AST + Patterns** | Deterministic detection complements LLM reasoning |
| **pgvector** | Production-ready vector search without external dependencies |
| **MCP protocol** | Standard interface for any agent ecosystem |
| **Modular tools** | Each tool does one thing well, composable workflows |

---

## Interview Q&A Prep

### "Why not just use SonarQube/ESLint?"

> "Those tools are rule-based and catch surface-level issues. CodeGuard enables semantic analysis — an agent can reason about code intent vs. behavior. For example, ESLint can catch unused variables, but it can't tell you 'this function claims to validate emails but the regex allows invalid formats.' That requires LLM reasoning with proper context, which is what CodeGuard enables."

### "How do you handle large codebases?"

> "Three strategies: First, incremental analysis — we track file changes and only re-analyze what's modified. Second, intelligent chunking — we split code into meaningful units (functions, classes) rather than arbitrary token limits. Third, relevance scoring — when building context for LLM analysis, we prioritize code that's actually related to the target, not just everything imported."

### "What's the hardest problem you solved?"

> "Context aggregation. The challenge is giving an LLM enough information to understand the code without exceeding token limits. I built a system that traces import dependencies, scores each file's relevance to the analysis target, and bundles only what's needed. It even generates 'suggested focus' hints telling the LLM what to pay attention to. This required understanding both code structure (AST) and LLM capabilities (context windows)."

### "How is this different from GitHub Copilot?"

> "Copilot is inline code completion — it suggests the next line. CodeGuard is project-wide analysis — it scans your entire codebase for issues. They're complementary. Copilot helps you write code faster; CodeGuard helps you find problems in code you've already written. Plus, CodeGuard integrates with project management, creating tickets for issues and tracking their resolution."

### "Why MCP instead of a REST API?"

> "MCP is the emerging standard for AI agent integration. By using MCP, CodeGuard works with Claude Code, Cursor, and any future MCP-enabled tool without any changes. A REST API would require each agent to implement custom integration. MCP also provides structured tool schemas, which helps agents understand what tools are available and how to use them."

---

## Demo Script

### 2-Minute Demo

1. **Show the problem** (30s)
   - "Traditional linters catch syntax issues but miss semantic bugs"
   - "AI agents can reason about code but need structured data"

2. **Show the solution** (60s)
   - Run `codeguard_scan_workspace` — show scan completing
   - Run `codeguard_check_patterns` — show pattern-based findings
   - Run `codeguard_get_analysis_context` — show context bundling
   - "Now the agent's LLM can reason about this code"

3. **Show the value** (30s)
   - Show auto-created ticket in ProjectPulse
   - "From scan to ticket in seconds, no manual triage"
   - "Works with any MCP-enabled agent"

### 5-Minute Demo

All of the above, plus:
- Show similar code search (embeddings)
- Show fix validation and application
- Show analytics dashboard
- Show integration with Claude Code
- Walk through architecture diagram

---

## GitHub README Structure

```markdown
# CodeGuard

AI-powered code analysis infrastructure for MCP-enabled agents.

## Features
- 🔍 Project-wide code scanning
- 🌳 AST parsing (TypeScript/JavaScript)
- 🔒 Security pattern detection
- 🧠 Context bundling for LLM analysis
- 🎫 Auto-ticket creation
- 🔗 Semantic code search

## Quick Start
[Installation and first scan]

## How It Works
[Architecture diagram]

## MCP Tools
[Tool reference]

## Why CodeGuard?
[Comparison with alternatives]

## For AI Agent Developers
[Integration guide]
```

---

## Portfolio Positioning

### Target Roles

1. **AI Agent Developer** — Direct match
2. **AI/ML Engineer** — Shows practical LLM integration
3. **Full-Stack Developer** — Shows system design skills
4. **DevTools Engineer** — Shows developer tooling expertise

### Key Differentiators

1. **Real product, not a toy** — Integrated into a larger system
2. **MCP expertise** — Emerging standard, few people know it well
3. **Agent-first thinking** — Understands agent architecture
4. **Production quality** — Tests, documentation, deployment

### Resume Bullet Points

- Built AI-assisted code analysis infrastructure enabling semantic bug detection through MCP protocol
- Designed agent-empowering architecture: deterministic analysis + LLM reasoning, zero platform LLM cost
- Implemented token-aware context aggregation with relevance scoring for optimal LLM consumption
- Integrated pgvector for semantic code search with HNSW indexing for sub-second similarity queries
- Created 10+ MCP tools covering scanning, analysis, pattern matching, and issue management
