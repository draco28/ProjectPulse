# CodeGuard + Git Integration Feature

**Status:** Planning Complete
**Timeline:** 12-14 weeks (Production-Ready)
**Owner:** Draco

## Overview

**CodeGuard** is an AI-assisted code analysis system that replaces the placeholder Health feature in ProjectPulse. It requires **Git Integration** as a foundation to provide repository access for scanning.

**Key Architecture Decision:** ProjectPulse clones GitHub repos to Mac mini server, enabling server-side code scanning without requiring users to send code via MCP.

## Key Insight

The agent's LLM does semantic reasoning. CodeGuard provides:
- **Infrastructure** — File scanning, AST parsing, pattern matching
- **Data** — Structured code information for the agent to reason about
- **Storage** — Persist findings, track fixes, trend analysis
- **Deterministic Checks** — Rule-based patterns (security, anti-patterns)

## Architecture Layers

```
Layer 1: Git Integration (Foundation)
  └── GitHub App → Clone → Webhooks → Cleanup

Layer 2: CodeGuard (Analysis Engine)
  └── Scanner → AST → Patterns → Context → Issues → MCP Tools

Layer 3: Health Page (UI - Reuse existing)
  └── Scores → Grades → Trends → Findings Table
```

## Documentation Structure

```
codeguard-feature/
├── README.md                       # This file - overview
├── 00-GIT-INTEGRATION.md           # NEW: Git Integration foundation
├── 01-ARCHITECTURE.md              # System architecture
├── 02-MCP-TOOLS.md                 # MCP tool specifications
├── 03-DATABASE-SCHEMA.md           # Prisma schema additions
├── 04-IMPLEMENTATION-PHASES.md     # Phase-by-phase breakdown
└── 05-PORTFOLIO-VALUE.md           # Portfolio/interview talking points
```

## Timeline

| Phase | Weeks | Focus |
|-------|-------|-------|
| **Phase 0** | 1-2 | Git Integration (GitHub App, Clone, Webhooks) |
| **Phase 1** | 3-5 | CodeGuard Core (Scanner, AST, Patterns) |
| **Phase 2** | 6-8 | Context + Issues + Embeddings |
| **Phase 3** | 9-11 | Agent Workflow + Health UI Integration |
| **Phase 4** | 12-14 | Polish, Testing, Portfolio |

## Key Decisions

| Decision | Choice |
|----------|--------|
| Repo Access | Clone to Mac mini server |
| GitHub Auth | GitHub App (not OAuth App) |
| Storage | `/var/repos` filesystem, <50GB budget |
| Scan Triggers | Webhook + On-demand |
| Health UI | Reuse existing components |
| axe-core/Lighthouse | Dropped (web testing ≠ code analysis) |

## Quick Links

- [Git Integration](./00-GIT-INTEGRATION.md) - Foundation layer
- [Architecture](./01-ARCHITECTURE.md) - System design
- [MCP Tools](./02-MCP-TOOLS.md) - Tool specifications
- [Database Schema](./03-DATABASE-SCHEMA.md) - Data models
- [Implementation Phases](./04-IMPLEMENTATION-PHASES.md) - Timeline
- [Portfolio Value](./05-PORTFOLIO-VALUE.md) - Interview prep

## Full Plan

See `/Users/draco/.claude/plans/sparkling-dancing-aho.md` for the complete approved plan.

## Status

- [x] Initial brainstorming
- [x] Architecture decision (clone-to-server approach)
- [x] Git Integration planning
- [x] Health page integration planning
- [x] Complete plan approved
- [ ] Phase 0: Git Integration implementation
- [ ] Phase 1: CodeGuard Core implementation
- [ ] Phase 2: Context + Issues implementation
- [ ] Phase 3: UI Integration
- [ ] Phase 4: Production release
