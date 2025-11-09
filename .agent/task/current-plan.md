# Sprint 2 Implementation Plan

**Sprint**: Sprint 2 - Markdown Sync Foundation + Workflow Start
**Duration**: 2 weeks (14 days)
**Story Points**: 54 points
**Created**: 2025-11-09 14:30

---

## Overview

Sprint 2 builds the **markdown documentation generation platform** with generic, extensible architecture to enable EPIC-012 (13-document suite) later WITHOUT refactoring.

**Net Savings**: 45 story points (avoiding refactoring in EPIC-012)

---

## Week 1: Markdown Sync Foundation (Days 1-7)

### Days 1-2: Database Schema + Template Engine Core

**Deliverables**:

1. **MarkdownFile Prisma Model** (Generic Design)
   - String fields (NO enums) for unlimited doc types
   - Supports ANY file path (root, docs/, .agent/)
   - Category field for filtering ('tracking', 'industry_doc', 'memory_bank')

2. **Template Engine Architecture**
   - Plugin-based registration (NOT switch statement)
   - Map-based storage for dynamic templates
   - Render method accepts templateId + data

3. **Data Extractor Registry**
   - Plugin-based registration for extractors
   - Async extraction methods
   - Project-scoped data extraction

**Acceptance Criteria**:
- ✅ MarkdownFile schema has NO enums (all string fields)
- ✅ Template engine supports dynamic registration
- ✅ Data extractor registry supports dynamic registration
- ✅ Migration applied successfully
- ✅ Zero TypeScript errors

### Days 3-4: Sync Service + First 2 Templates

**Deliverables**:

1. **Path-Agnostic Sync Service**
   - Accepts ANY file path parameter
   - Content hash tracking (prevent unnecessary rewrites)
   - Database upsert after successful write

2. **STATUS.md Template**
   - Extracts: Current phase, active tasks, progress percentages
   - Renders: Handlebars template → STATUS.md

3. **DEVELOPMENT_PLAN.md Template**
   - Extracts: Sprint breakdown, story points, timeline
   - Renders: Handlebars template → DEVELOPMENT_PLAN.md

**Acceptance Criteria**:
- ✅ Sync service works with ANY file path (tested with root/, docs/, .agent/)
- ✅ STATUS.md generates in <500ms
- ✅ DEVELOPMENT_PLAN.md generates in <500ms
- ✅ Content hash prevents unnecessary rewrites

### Days 5-6: Git Hooks + Dynamic Validation

**Deliverables**:

1. **Generated Files Registry** (`.agent/generated-files.json`)
   - JSON array of generated file paths
   - Source attribution (database, external, etc.)

2. **Pre-Commit Hook**
   - Reads from .agent/generated-files.json (NOT hardcoded)
   - Blocks commits of auto-generated files
   - Windows-compatible bash script

3. **MCP Tool**: `projectpulse.markdown.sync`
   - Input: `{ projectId, category?, slug? }`
   - Output: Synced files list
   - Performance: <500ms per file

**Acceptance Criteria**:
- ✅ Git hooks block manual edits (tested on Windows)
- ✅ Hooks read from .agent/generated-files.json (NOT hardcoded)
- ✅ MCP tool syncs documents successfully
- ✅ Category filtering works (sync only 'tracking' docs)

### Day 7: Week 1 Checkpoint

- Integration testing: Full sync workflow end-to-end
- Performance validation: <500ms per document
- Documentation: Update API catalog with markdown.sync tool

---

## Week 2: Workflow Foundation (Days 8-14)

### Days 8-9: Workflow Database Schema

**Deliverables**:

1. **Workflow Prisma Models**
   - Workflow: name, description, category
   - WorkflowStep: order, name, isRequired
   - WorkflowExecution: state tracking across sessions

2. **Seed Data**: 5-Step Protocol workflow
   - Step 1: Initialize session
   - Step 2: Create plan
   - Step 3: Consult experts
   - Step 4: Progress checkpoints
   - Step 5: Post-completion

**Acceptance Criteria**:
- ✅ Workflow/WorkflowStep models created
- ✅ WorkflowExecution tracks state across sessions
- ✅ 5-Step Protocol seeded successfully
- ✅ Migration applied

### Days 10-11: Workflow MCP Tools

**Deliverables**:

1. **MCP Tool**: `projectpulse.workflow.start`
   - Starts workflow execution
   - Returns executionId and first step

2. **MCP Tool**: `projectpulse.workflow.completeStep`
   - Validates step completion
   - Increments currentStep
   - Prevents skipping required steps

3. **MCP Tool**: `projectpulse.workflow.getState`
   - Returns current workflow state
   - Returns next required step

**Acceptance Criteria**:
- ✅ Can start 5-Step Protocol via MCP
- ✅ Can complete steps sequentially
- ✅ Step validation prevents skipping required steps
- ✅ State query returns current position

### Days 12-13: State Persistence + Recovery

**Deliverables**:

1. **Resume Workflow Logic**
   - Query existing execution state
   - Return next step to complete
   - Handle session interruptions

2. **Integration Testing**
   - Start workflow → Interrupt → Resume → Verify state
   - Test all 5 steps of protocol
   - Validate required step enforcement

**Acceptance Criteria**:
- ✅ Workflow state persists in database
- ✅ Can resume after session interruption
- ✅ Integration tests passing

### Day 14: Sprint 2 Closure

- Complete STEP 5: Post-completion workflow
- Update docs/13-Project-Plan.md (Sprint 2 complete)
- Update .agent/progress.md
- Commit documentation, then code

---

## Architectural Validation Checklist

Before Sprint 2 completion, verify ALL requirements met:

- [ ] MarkdownFile schema supports unlimited categories (no enum)
- [ ] Template engine accepts dynamic registration (verified with mock template)
- [ ] Data extractor registry extensible (verified with mock extractor)
- [ ] Sync service works with any file path (tested with 3 paths)
- [ ] Git hooks read .agent/generated-files.json (not hardcoded)
- [ ] Workflow state persists across sessions
- [ ] Performance: <500ms markdown sync
- [ ] Zero TypeScript errors

---

## Success Criteria

**Functional**:
- ✅ Markdown sync <500ms per file
- ✅ Git hooks block manual edits (dynamic validation)
- ✅ Workflow state persists in database
- ✅ 5-step protocol enforceable

**Architectural** (CRITICAL for EPIC-012):
- ✅ Generic schema (no enums)
- ✅ Plugin-based templates
- ✅ Extensible extractors
- ✅ Path-agnostic sync
- ✅ Dynamic git hooks

**Quality**:
- ✅ Zero TypeScript errors
- ✅ All integration tests passing
- ✅ Performance targets met

---

## Dependencies

- Sprint 1 complete (5-level hierarchy exists)
- Mac mini services running at http://192.168.1.15:3000
- .agent/generated-files.json created

---

## Risks

1. **Git hooks Windows compatibility**
   - Mitigation: Test early (Day 5), fallback to manual validation

2. **Template complexity**
   - Mitigation: Start simple (Handlebars), iterate

3. **Over-engineering**
   - Mitigation: All requirements validated against EPIC-012 needs

---

**Plan Created**: 2025-11-09 14:30
**Status**: Approved, ready for expert consultation
