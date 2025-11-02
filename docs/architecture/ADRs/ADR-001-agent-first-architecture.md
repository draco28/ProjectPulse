# ADR-001: Agent-First Architecture

**Status:** Accepted
**Date:** 2025-11-02
**Decision Makers:** ProjectPulse Development Team
**Consulted:** Planning session analysis

---

## Context

Week 1.5 of development completed with UI-first approach:

- 7 UI pages implemented (Dashboard, Issues List/Detail, Knowledge, Wiki, Security, Agents, Command Palette)
- 17 Prisma models with complete CRUD
- Dark Neumorphic Coral theme system
- Focus: Manual interaction via rich UI

Planning session (2025-11-02) revealed opportunities for comprehensive agent automation:

- AI agents (Claude Code, Cursor AI, Codex) can handle 95% of workflows via MCP
- Token efficiency: Skills (92% reduction), Knowledge graph (88% reduction)
- Persistent state tracking enables complete workflow execution without human intervention

**The Question:** Should we continue UI-first development or pivot to agent-first architecture?

## Decision

**Adopt agent-first architecture with 95% MCP automation and 5% UI monitoring.**

**Implications:**

- Primary users: AI Agents (Claude Code, Cursor AI, Codex)
- Secondary users: Solo/small team developers (monitoring, overrides)
- Build order: Agent automation FIRST (MCP tools), UI monitoring SECOND
- UI purpose: Dashboard monitoring, visual representation, manual overrides (not primary interaction)

## Consequences

### Positive

- **Token efficiency:** 92% reduction for skills, 88% for knowledge graph retrieval
- **Automation:** Complete workflows without human intervention (5-step protocol, checkpoints, recovery)
- **Consistency:** Database as source of truth, markdown auto-sync prevents conflicts
- **Preservation:** 40-50% of Week 1.5 work reusable (Issues pages, theme, components)

### Negative

- **Pivot cost:** 2 weeks to restructure documentation (this effort)
- **Learning curve:** Developers must understand MCP + agent workflows
- **UI simplification:** Less emphasis on rich UI features, more on monitoring dashboards

### Neutral

- **Timeline:** 16-week roadmap (vs original estimate unclear)
- **Features:** 8 core features defined (Sprint, Workflow, Issues, Knowledge, Skills, Wiki, Health, Personas)
- **Architecture:** MCP Server → Next.js API → Prisma (3-tier)

## Alternatives Considered

1. **Continue UI-First:**
   - Keep building rich UI with manual interaction
   - Rejected: Doesn't leverage agent capabilities, high manual effort, token inefficient

2. **Hybrid (50/50):**
   - Equal focus on UI and MCP automation
   - Rejected: Dilutes effort, unclear priorities, complex architecture

3. **MCP-Only (100% automation):**
   - No UI, pure MCP server
   - Rejected: Need monitoring dashboards, human overrides for business logic

## References

- Planning session: PLANNING_PHASES_projectpulse-agent-first.md (archived)
- Implementation roadmap: IMPLEMENTATION_ROADMAP_projectpulse.md (archived)
- Week 1.5 completion: [docs/archive/ui-first-phase/](../../archive/ui-first-phase/)
- Product vision: [docs/01-PRD.md](../../01-PRD.md)

---

**Last Updated:** 2025-11-02
**Revision History:**

- 2025-11-02: Initial version (agent-first pivot approved)
