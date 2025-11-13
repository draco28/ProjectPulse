# Sprint 7 Starter Prompt

**Copy-paste this entire prompt into your new chat session to begin Sprint 7 planning.**

---

## 📋 Sprint 7: Wiki + Health Monitoring - Planning Phase

**Branch**: `feature/sprint-7-wiki-health` (already created and pushed)
**Current Status**: Ready to begin planning
**Previous Sprint**: Sprint 6 complete (51/51 points, merged to master)
**Overall Progress**: 315/505 points (62% complete)

---

### Context Summary

**What We Just Completed (Sprint 6)**:
- ✅ Knowledge Graph + Skills System (51 points)
- ✅ 15 API endpoints (Skills + Knowledge)
- ✅ 15 MCP tools (Skills + Knowledge integration)
- ✅ Token efficiency: 97.2% reduction (list), 91.2% (full)
- ✅ LRU cache: 5-min TTL, 100 entries, 92% hit rate
- ✅ Comprehensive test suite: 10 files, 4,650+ lines
- ✅ Documentation: Skills system guide (770 lines)

**What's Working**:
- Knowledge Base: Hybrid search (semantic + full-text)
- Skills System: Lazy-loading with bidirectional linking
- Issues: Full CRUD with MCP tools
- Wiki: Basic CRUD exists (Sprint 1) - needs enhancement
- Agents: Persona management exists

**Project Status**:
- Version: 1.4.0
- Sprints Complete: 0, 1, 2, 3, 4, 5, 5.5, 6
- Sprints Remaining: 7, 8
- Timeline: On track for 16-week completion

---

### Sprint 7 Goals (from docs/13-Project-Plan.md)

**Primary Objectives**:
1. **Wiki Auto-Generation** - Generate wiki pages from JSDoc/docstrings
2. **Git-Backed Versioning** - Track wiki changes in git (same as code)
3. **Health Dashboard** - Security + Quality + Accessibility + Tech Debt scores
4. **Scanner Integration** - Semgrep, ESLint, Lighthouse, axe-core

**Story Points**: ~50 points (estimated)

**Key Features**:
- Wiki enhancement (not from scratch - Sprint 1 has basic CRUD)
- Code documentation → wiki pages automation
- Multi-scanner health monitoring
- Automated issue creation from scanner findings

---

### Your Task

**Please help me plan Sprint 7 with the following steps:**

1. **Review Current State**:
   - Read `docs/13-Project-Plan.md` (Sprint 7 section)
   - Read `docs/12-Backlog.md` (find Sprint 7 user stories)
   - Check existing wiki implementation (`app/wiki/**`)
   - Review health monitoring requirements

2. **Create Implementation Plan**:
   - Break down Sprint 7 into user stories with story points
   - Identify existing code to build upon (Wiki already has CRUD)
   - Define acceptance criteria for each story
   - Estimate complexity and dependencies

3. **Technical Design**:
   - Wiki auto-generation architecture (JSDoc → markdown)
   - Git integration strategy (track wiki changes)
   - Health dashboard data model (4 scanner types)
   - Scanner integration approach (Semgrep, ESLint, Lighthouse, axe)

4. **Output Planning Artifacts**:
   - Create `.agent/task/sprint-7-plan.md` with detailed breakdown
   - Update `.agent/active-context.md` with Sprint 7 focus
   - Prepare task list for implementation

5. **Consider**:
   - Wiki already exists - what enhancements are needed?
   - Health monitoring → auto-create issues (integration with existing Issues system)
   - Scanner tools may need Docker/external integration
   - Git integration for wiki versioning

---

### Key Documentation References

**Project Documentation**:
- `docs/13-Project-Plan.md` - Sprint 7 details (line ~224)
- `docs/12-Backlog.md` - User stories for wiki + health
- `docs/03-Architecture.md` - System architecture
- `docs/01-PRD.md` - Product requirements

**Current Implementation**:
- `app/wiki/**` - Existing wiki pages and API routes (Sprint 1)
- `app/issues/**` - Issues system (for scanner integration)
- `docs/features/api-reference.md` - Current API endpoints
- `docs/features/mcp-tools-guide.md` - Current MCP tools

**Agent Context**:
- `.agent/progress.md` - Current progress tracking
- `.agent/active-context.md` - Current work focus
- `.agent/system/` - Internal development references

---

### Expected Deliverables from This Session

By the end of this planning session, I expect:

1. **Sprint 7 Plan Document** (`.agent/task/sprint-7-plan.md`):
   - User stories with story points
   - Technical design overview
   - Dependency analysis
   - Risk assessment

2. **Task Breakdown**:
   - Prioritized list of implementation tasks
   - Estimated complexity for each
   - Clear acceptance criteria

3. **Updated Context Files**:
   - `.agent/active-context.md` updated for Sprint 7
   - Todo list created with high-level tasks

4. **Ready to Code**:
   - Clear understanding of what to build
   - Technical approach defined
   - First task identified

---

### Important Notes

**What Already Exists**:
- ✅ Wiki CRUD operations (Sprint 1)
- ✅ Wiki search functionality
- ✅ Wiki MCP tools (create, update, search)
- ✅ Issues system with auto-creation capability

**What's New in Sprint 7**:
- 🆕 Auto-generation from code comments
- 🆕 Git-backed versioning
- 🆕 Health monitoring dashboard
- 🆕 Scanner integrations (4 types)

**Key Decisions Needed**:
1. Which JSDoc parser to use?
2. How to integrate git for wiki versioning?
3. Which health scanners to prioritize?
4. How to schedule automated scans?

---

### Success Criteria

This planning session is successful when:
- ✅ Sprint 7 fully broken down into user stories
- ✅ Story points estimated (target: ~50 points)
- ✅ Technical approach documented
- ✅ First implementation task ready to start
- ✅ All dependencies identified
- ✅ Risk mitigation strategies defined

---

**Ready to begin Sprint 7 planning! Let's build Wiki Auto-Generation and Health Monitoring.**

---

## 📝 Notes for Claude Code

- Work on branch: `feature/sprint-7-wiki-health`
- Sprint 6 merged to master (clean starting point)
- Focus on planning first, then implementation
- Use ExitPlanMode when plan is ready for approval
- Invoke expert agents as needed (next-js-expert, prisma-expert, react-expert)

---

**Start Date**: 2025-11-13 (after Sprint 6 completion)
**Sprint Duration**: 2 weeks (Weeks 13-14)
**Target Completion**: End of Week 14
