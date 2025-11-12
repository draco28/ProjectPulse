# ProjectPulse Vision Clarification

**Created**: 2025-01-12
**Purpose**: Eliminate all confusion about what ProjectPulse IS and what it is NOT

---

## 🎯 What ProjectPulse IS

ProjectPulse is a **complete AI-powered project management platform** that serves as the central hub for AI-assisted software development.

### Core Identity

**ProjectPulse = GitHub + Jira + Confluence + AI Context Management**

It's a web application that end users (developers and their AI agents) use to manage THEIR projects, NOT a tool for building ProjectPulse itself.

### Complete Feature Set (ALL for End Users)

1. **Project Management Suite**
   - **Issues**: Bug tracking, feature requests, improvements (like Jira)
   - **Tasks/Sessions**: Sprint work items with hierarchical tracking (Phase→Week→Day→Task→Session)
   - **Sprints**: Development cycles with phases, weeks, days
   - **Progress Tracking**: Visual dashboards and metrics
   - **🔮 Phase 2**: Memory bank snapshots for task context resumption (Sprint 10+)

2. **AI Infrastructure (Cloud-Based)**
   - **Memory Banks**: Virtual `.agent/` folder stored in database
     - project-brief (requirements, goals)
     - system-patterns (architecture, conventions)
     - tech-context (stack, configuration)
     - active-context (current work)
     - progress (tracking, metrics)
   - **Agent Personas**: Specialized sub-agents preserved in database
   - **Skills Library**: Reusable patterns and knowledge
   - **SOPs**: Standard operating procedures
   - **Workflow Orchestration**: 12+ predefined workflows (5-Step Protocol, etc.)

3. **Knowledge System**
   - **RAG**: Retrieval-Augmented Generation with semantic search
   - **Knowledge Graph**: Connected information with 2-hop traversal
   - **Wiki**: Structured documentation (like Confluence)
   - **Knowledge Base**: Searchable project information
   - **Semantic + Full-text Search**: Hybrid search capabilities

4. **Developer Experience**
   - **3-Session Onboarding**: Guided project setup
   - **MCP Integration**: 41+ tools for agent interaction
   - **Web UI**: Beautiful interface for human monitoring
   - **Progress Visualization**: Sprint boards, burndown charts
   - **Clean Repositories**: NO local AI files ever

5. **Planning & Tracking**
   - **current-plan**: Implementation plans (database-backed)
   - **current-todos**: Task lists with state tracking
   - **Session Management**: Context preservation across restarts
   - **Checkpoint Recovery**: Resume from any interruption
   - **Hierarchical Progress**: Session → Task → Day → Week → Phase

---

## ❌ What ProjectPulse is NOT

1. **NOT internal tooling** for building ProjectPulse itself
2. **NOT a simple file backup system** for .agent/ folders
3. **NOT requiring local files** in user repositories
4. **NOT just cloud storage** - it's active project management
5. **NOT limited to AI context** - full project management suite

---

## 🔄 The Innovation

### Traditional AI Development (Problems)

```
Developer's Machine:
├── my-project/
│   ├── .agent/           ← Dozens of markdown files
│   ├── .claude/          ← More configuration files
│   ├── STATUS.md         ← Manual tracking files
│   └── src/              ← Actual code (buried)
│
├── Jira                  ← Separate issue tracking
├── Confluence            ← Separate documentation
├── GitHub                ← Separate version control
└── Manual coordination   ← Context switching nightmare
```

### With ProjectPulse (Solution)

```
Developer's Machine:
├── my-project/
│   └── src/              ← ONLY source code! Clean!

ProjectPulse Cloud:
├── All Issues            ← Integrated issue tracking
├── All Documentation     ← Integrated wiki/knowledge
├── All AI Context        ← Integrated memory banks
├── All Progress          ← Integrated tracking
└── All Workflows         ← Integrated orchestration

Access via: Web UI + MCP Tools + REST API
```

---

## 🎮 How End Users Use ProjectPulse

### Example: E-commerce Developer Starting New Project

**Day 1: Project Setup**
1. Creates new project in ProjectPulse
2. Runs 3-session onboarding with their AI agent
3. Agent creates all documentation IN ProjectPulse (not local files)
4. Repository stays clean - just source code

**Week 1: Active Development**
1. Agent connects via MCP: `mcp.connect('projectpulse')`
2. Agent loads context: `memory.read('project-brief')`
3. Agent picks ticket: `ticket.getCurrent()`
4. Agent implements feature in clean repo
5. Agent updates progress: `progress.update()`
6. Human monitors via web UI: `projectpulse.com/projects/123`

**Month 2: Team Scaling**
1. New developer joins project
2. Their agent connects to SAME ProjectPulse project
3. Instantly has all context, history, patterns
4. No onboarding friction - everything in cloud
5. Multiple agents coordinate via shared database

**Key Points:**
- **Zero local AI files** - repository stays pristine
- **Everything in cloud** - accessible from anywhere
- **Multiple agents** - can share same project context
- **Full history** - never lose progress or context
- **One platform** - no tool switching needed

---

## 🏗️ Current Implementation Status

### What Exists Now (Dogfooding)

For building ProjectPulse itself, we currently use:
- Local `.agent/` folder (traditional approach)
- Local `.claude/` folder (skills and configs)
- CLAUDE.md (integration guide)
- Manual workflows and protocols

### What We're Building (The Product)

The actual ProjectPulse product that end users will use:
- Database-backed (PostgreSQL + pgvector)
- Web UI (Next.js 14 App Router)
- MCP Server (41 tools via stdio)
- REST API (for integrations)
- All features listed above

### Why This Matters

We're **eating our own dog food** - using the traditional approach (.agent/ folders) to build the solution that eliminates the need for .agent/ folders. Once ProjectPulse is complete, even we will migrate to using ProjectPulse for developing ProjectPulse!

---

## 📊 Success Metrics

ProjectPulse succeeds when:

1. **Clean Repos**: User repositories contain ONLY source code
2. **Zero Friction**: Agents connect and start working immediately
3. **Context Preserved**: Never lose work between sessions
4. **Token Efficient**: 75-90% reduction in token usage
5. **Tool Consolidation**: Replace 4-5 separate tools
6. **Team Scalable**: Multiple agents coordinate seamlessly

---

## 🚀 The Vision Statement

> **"ProjectPulse is the operating system for AI-assisted development - managing issues, context, and workflows in the cloud so repositories stay clean, agents stay synchronized, and developers stay productive."**

### The Promise to End Users

**"Your repo stays clean. Your AI stays smart. Your project stays organized."**

No more:
- Cluttered repositories with AI files
- Lost context between sessions
- Manual progress tracking
- Disconnected tools
- Token budget explosions

Just:
- Clean code repositories
- Persistent AI memory
- Automated tracking
- Unified platform
- Efficient token usage

---

## 🎯 Key Differentiators

| Feature | Traditional Tools | ProjectPulse |
|---------|------------------|--------------|
| AI Context | Local .agent/ folders | Cloud database |
| Issue Tracking | Separate tool (Jira) | Integrated |
| Documentation | Separate tool (Confluence) | Integrated |
| Progress Tracking | Manual STATUS.md | Automated + Web UI |
| Agent Coordination | None | Built-in via shared DB |
| Repository State | Cluttered with AI files | Clean (code only) |
| Context Switching | High friction | Seamless |
| Token Usage | Wasteful (reload everything) | Efficient (targeted queries) |

---

## ✅ Summary

**ProjectPulse IS:**
- A complete AI-powered project management platform
- For end users (developers and their AI agents)
- Cloud-based (no local AI files ever)
- Replacing multiple disconnected tools
- The future of AI-assisted development

**ProjectPulse is NOT:**
- Internal tooling for building itself
- Simple file storage
- Requiring local .agent/ folders
- Just another project management tool

**The Core Innovation:**
- Everything that traditionally requires local files (.agent/, .claude/, STATUS.md) lives in the cloud
- Accessed via Web UI (humans) and MCP tools (agents)
- Repositories stay completely clean
- Full project management suite integrated with AI context management

---

## 📝 Resolution: Task vs Ticket Terminology (2025-11-13)

**Issue**: Earlier versions of this document and PRD Section 4.2.12 created confusion by referring to "Tickets" as sprint work items with memory bank snapshots, without clarifying their relationship to the existing Task/Session system.

**Investigation Findings**:
- ✅ **Task/Session entities ARE correct product features** - Implemented and working (243 story points tracked)
- ✅ **Properly documented** - PRD Section 4.2.1, Data Model Section 3.1, Backlog EPIC-001 all describe them correctly
- ⚠️ **"Ticket" terminology created confusion** - Appeared to be a replacement rather than an enhancement

**Resolution**:
1. **MVP (Sprint 1-9)**: Task/Session system as implemented
   - 5-level hierarchy: Phase → Week → Day → Task → Session
   - Progress tracking with auto-rollup
   - Session checkpoints at 15K tokens
   - MCP tools: `task.create()`, `session.start()`, `session.checkpoint()`

2. **Phase 2 (Sprint 10+)**: Memory Bank Snapshot Enhancement
   - NOT a new entity, but an enhancement to existing Task model
   - Adds optional `MemoryBankSnapshot` relation to Task
   - Fully backward compatible (non-breaking change)
   - New MCP tools: `task.captureSnapshot()`, `task.getContextSnapshot()`

**Updated Documentation**:
- PRD Section 4.2.12: Now clearly marked as "Phase 2 Enhancement (Post-MVP)"
- PRD Feature Priority Table: Changed from P0 to P3 (Phase 2)
- Project Plan Sprint 10: Added with non-breaking implementation strategy
- This document: Updated to use "Tasks/Sessions" terminology for MVP features

**Key Takeaway**: This investigation confirmed the current architecture is correct. Task/Session are properly designed product features for end users. Memory bank snapshots will be added as an optional enhancement in Sprint 10, not as a replacement system.

---

**End of Vision Clarification**