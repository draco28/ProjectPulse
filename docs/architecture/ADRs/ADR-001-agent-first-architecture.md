# ADR-001: Agent-First Architecture

**Status:** Accepted
**Date:** 2025-11-02
**Decision Makers:** ProjectPulse Development Team
**Consulted:** Planning session analysis

---

## Context

Sprint 0 (pre-implementation) completed with UI-first approach:

- ✅ 7 UI pages 100% complete (Dashboard, Issues List/Detail, Knowledge, Wiki, Security, Agents)
- ✅ 45+ components built (all styled with neumorphic design)
- ✅ 17 Prisma models with complete CRUD
- ✅ Static Coral theme system (neumorphic design)
- Result: UI foundation ready, Sprints 1-8 focus on backend MCP tools

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
- **Consistency:** Database as source of truth with Web UI + MCP access; markdown export is optional/internal (not required for end users)
- **Preservation:** 100% of Sprint 0 UI work reusable (all 7 pages, 45+ components, theme system complete)

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
- Sprint 0 completion: [docs/archive/completions/2025-11/](../../archive/completions/2025-11/) and [docs/UI_COMPLETION_SUMMARY.md](../../UI_COMPLETION_SUMMARY.md)
- Product vision: [docs/01-PRD.md](../../01-PRD.md)

---

**Last Updated:** 2025-11-02
**Revision History:**

- 2025-11-02: Initial version (agent-first pivot approved)
