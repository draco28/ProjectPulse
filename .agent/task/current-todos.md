# Sprint 2 Task List

**Sprint**: Sprint 2 - Markdown Sync Foundation + Workflow Start
**Total Points**: 54 points
**Progress**: 0/54 (0%)

---

## Week 1: Markdown Sync Foundation (26 points)

### Days 1-2: Database Schema + Template Engine (8 points)
- [ ] Design MarkdownFile Prisma model (generic schema) - 2 points
- [ ] Create Template Engine class with plugin registration - 3 points
- [ ] Create Data Extractor Registry class - 2 points
- [ ] Run migration and verify zero TypeScript errors - 1 point

### Days 3-4: Sync Service + Templates (10 points)
- [ ] Implement MarkdownSyncService (path-agnostic) - 3 points
- [ ] Create STATUS.md template + data extractor - 3 points
- [ ] Create DEVELOPMENT_PLAN.md template + data extractor - 3 points
- [ ] Performance test: <500ms per file - 1 point

### Days 5-6: Git Hooks + MCP Tool (6 points)
- [ ] Create .agent/generated-files.json registry - 1 point
- [ ] Implement pre-commit hook (dynamic validation) - 2 points
- [ ] Test git hooks on Windows - 1 point
- [ ] Implement projectpulse.markdown.sync MCP tool - 2 points

### Day 7: Week 1 Checkpoint (2 points)
- [ ] Integration testing: Full sync workflow - 1 point
- [ ] Update API catalog documentation - 1 point

---

## Week 2: Workflow Foundation (28 points)

### Days 8-9: Workflow Database Schema (8 points)
- [ ] Design Workflow/WorkflowStep/WorkflowExecution models - 3 points
- [ ] Create migration - 1 point
- [ ] Seed 5-Step Protocol workflow - 2 points
- [ ] Verify database schema - 2 points

### Days 10-11: Workflow MCP Tools (10 points)
- [ ] Implement projectpulse.workflow.start tool - 3 points
- [ ] Implement projectpulse.workflow.completeStep tool - 4 points
- [ ] Implement projectpulse.workflow.getState tool - 2 points
- [ ] Test step validation logic - 1 point

### Days 12-13: State Persistence + Recovery (8 points)
- [ ] Implement resume workflow logic - 3 points
- [ ] Integration testing: Session interruption scenarios - 3 points
- [ ] Verify state persistence across sessions - 2 points

### Day 14: Sprint 2 Closure (2 points)
- [ ] Update docs/13-Project-Plan.md - 1 point
- [ ] Update .agent/progress.md - 1 point
- [ ] Commit documentation and code - 0 points (administrative)

---

## Architectural Validation Checklist

**Before Sprint 2 Completion**:
- [ ] MarkdownFile schema supports unlimited categories (no enum)
- [ ] Template engine accepts dynamic registration
- [ ] Data extractor registry extensible
- [ ] Sync service works with any file path (tested with 3 paths)
- [ ] Git hooks read .agent/generated-files.json
- [ ] Workflow state persists across sessions
- [ ] Performance: <500ms markdown sync
- [ ] Zero TypeScript errors

---

**Last Updated**: 2025-11-09 14:30
**Status**: Planning complete, ready to begin
