# Workflow Templates Catalog

**Last Updated**: 2025-11-12
**Status**: Sprint 3 complete - 12 templates seeded
**Database**: `WorkflowTemplate` model

---

## Overview

This catalog documents all 12 workflow templates available in ProjectPulse. Templates provide structured, repeatable processes for common development and project management tasks.

### Template Categories

- **Development** (6 templates): Feature implementation, bug fixes, refactoring, documentation, testing, migrations
- **Project Management** (3 templates): Sprint planning, sprint review, progress checkpoints
- **Knowledge** (3 templates): Wiki creation, knowledge search, project onboarding

---

## Development Workflows

### 1. Feature Implementation (10 steps)

**Category**: development
**Description**: Complete workflow for implementing a new feature from planning to deployment

**Steps**:

1. **Create Feature Branch** - Create new git branch for feature
2. **Run Onboarding Session** - Gather feature context via onboarding (MCP: `onboarding.getPrompt`)
3. **Create Wiki Page** - Document feature requirements and design (MCP: `wiki.create`)
4. **Create Sprint Task** - Track feature in sprint system (MCP: `sprint.task.create`)
5. **Implement Feature Code** - Write implementation code
6. **Run Tests** - Execute unit and integration tests
7. **Create Checkpoint** - Save progress checkpoint (MCP: `sprint.checkpoint.create`)
8. **Create Pull Request** - Open PR for code review
9. **Update Wiki** - Update wiki with implementation details (MCP: `wiki.update`)
10. **Complete Task** - Mark sprint task as complete (MCP: `sprint.updateProgress`)

**Use When**:
- Starting new feature development
- Need structured approach to feature implementation
- Want to ensure all steps (planning, coding, testing, documentation) are completed

**MCP Command**:
```typescript
// Start feature implementation workflow
projectpulse.workflow.start({
  templateId: 1,
  initialContext: {
    featureName: 'User Authentication',
    targetBranch: 'feature/auth'
  }
});
```

---

### 2. Bug Fix (8 steps)

**Category**: development
**Description**: Systematic workflow for investigating and fixing bugs

**Steps**:

1. **Create Bug Fix Branch** - Create new git branch for bug fix
2. **Investigate Issue** - Reproduce bug and analyze root cause
3. **Document Investigation** - Create or update wiki with findings (MCP: `wiki.create`)
4. **Create Sprint Task** - Track bug fix in sprint (MCP: `sprint.task.create`)
5. **Implement Fix** - Write fix code with tests
6. **Run Tests** - Verify fix and regression tests
7. **Create Pull Request** - Open PR with fix
8. **Complete Task** - Mark bug fix complete (MCP: `sprint.updateProgress`)

**Use When**:
- Fixing production or development bugs
- Need systematic investigation approach
- Want to document root cause and solution

**MCP Command**:
```typescript
// Start bug fix workflow
projectpulse.workflow.start({
  templateId: 2,
  initialContext: {
    bugTitle: 'Fix login timeout',
    issueNumber: 123
  }
});
```

---

### 3. Refactoring (7 steps)

**Category**: development
**Description**: Safe refactoring workflow with comprehensive testing

**Steps**:

1. **Create Refactoring Branch** - Create new git branch
2. **Analyze Code** - Identify refactoring opportunities
3. **Create Sprint Task** - Track refactoring work (MCP: `sprint.task.create`)
4. **Refactor Code** - Apply refactoring changes
5. **Run Tests** - Verify behavior unchanged
6. **Create Pull Request** - Open PR for review
7. **Complete Task** - Mark refactoring complete (MCP: `sprint.updateProgress`)

**Use When**:
- Improving code quality without changing behavior
- Reducing technical debt
- Preparing codebase for new features

---

### 4. Documentation Update (5 steps)

**Category**: development
**Description**: Workflow for creating or updating project documentation

**Steps**:

1. **Create Docs Branch** - Create new git branch for documentation
2. **Create/Update Wiki Page** - Write documentation content (MCP: `wiki.create`)
3. **Review Content** - Proofread and validate accuracy
4. **Create Pull Request** - Submit documentation for review
5. **Complete Task** - Finalize documentation (MCP: `sprint.updateProgress`)

**Use When**:
- Adding new documentation pages
- Updating outdated documentation
- Documenting new features or processes

---

### 5. Test Coverage Improvement (6 steps)

**Category**: development
**Description**: Systematic workflow for improving test coverage

**Steps**:

1. **Create Testing Branch** - Create new git branch
2. **Identify Coverage Gaps** - Analyze coverage report
3. **Create Sprint Task** - Track testing work (MCP: `sprint.task.create`)
4. **Write Tests** - Implement missing tests
5. **Verify Coverage** - Run coverage report and validate improvement
6. **Create Pull Request** - Submit tests for review

**Use When**:
- Improving code coverage metrics
- Adding tests to legacy code
- Ensuring comprehensive test suite

---

### 6. Database Migration (9 steps)

**Category**: development
**Description**: Safe database schema migration workflow

**Steps**:

1. **Create Migration Branch** - Create new git branch
2. **Update Prisma Schema** - Modify schema.prisma file
3. **Generate Migration** - Run prisma migrate dev
4. **Test Migration** - Apply migration to test database
5. **Update Seed Script** - Add seed data for new models
6. **Deploy Migration** - Apply to production database
7. **Verify Deployment** - Check production database
8. **Create Pull Request** - Submit schema changes
9. **Complete Task** - Mark migration complete (MCP: `sprint.updateProgress`)

**Use When**:
- Adding new database models or fields
- Changing existing schema structure
- Performing complex database migrations

---

## Project Management Workflows

### 7. Sprint Planning (4 steps)

**Category**: project-management
**Description**: Setup new sprint with Kanban board (Sprint 15: simplified 2-level hierarchy)

**Steps**:

1. **Validate Traceability** - Parse backlog items (MCP: `traceability.validateDocuments`)
2. **Create Roadmap** - Create Phase → Sprint hierarchy (MCP: `roadmap.create` with materialize: true)
3. **Create Sprint Tickets** - From backlog items (MCP: `ticket.create` with sprintNumber, backlogRefs)
4. **Set Sprint Goals** - Document sprint objectives (MCP: `wiki.create`)

> **Note (Sprint 15)**: Week/Day models were removed. Work is now tracked via Kanban boards at `/roadmap/sprint/[sprintNumber]`.

**Use When**:
- Starting new sprint or phase
- Planning multi-sprint development cycle
- Setting up sprint structure and goals

**MCP Command**:
```typescript
// Start sprint planning workflow
projectpulse.workflow.start({
  templateId: 7,
  initialContext: {
    sprintTitle: 'Sprint 4: Performance Improvements',
    sprintDescription: 'Focus on API optimization and caching'
  }
});
```

---

### 8. Sprint Review (5 steps)

**Category**: project-management
**Description**: Complete sprint review and generate completion report

**Steps**:

1. **Gather Sprint Metrics** - Collect completion statistics (MCP: `sprint.getCurrentPosition`, `kanban.getBoard`)
2. **Create Completion Document** - Generate sprint summary (MCP: `wiki.create`)
3. **Review Kanban Board** - Check all tickets are in "done" column (MCP: `kanban.getBoard`)
4. **Sprint Demo** - Present completed work
5. **Archive Sprint** - Archive sprint artifacts

**Use When**:
- Completing a sprint
- Generating sprint completion reports
- Reviewing sprint accomplishments

---

### 9. Progress Checkpoint (4 steps)

**Category**: project-management
**Description**: Create progress checkpoint during active work

**Steps**:

1. **Query Current Position** - Get current Phase/Sprint context (MCP: `sprint.getCurrentPosition`)
2. **Move Tickets** - Update ticket status via Kanban (MCP: `kanban.moveTicket`)
3. **Update Session** - Save session progress (MCP: `agent.session.update`)
4. **Save Session Log** - Document session notes

> **Note (Sprint 15)**: Task/Checkpoint models were removed. Progress is now tracked via ticket status in Kanban boards.

**Use When**:
- Every 15K tokens during AI session
- Before context compaction
- When pausing work for extended period
- Creating recovery points

**MCP Command**:
```typescript
// Create progress checkpoint
projectpulse.workflow.start({
  templateId: 9,
  initialContext: {
    sessionId: 'clxEFGH9876543210ABC',
    tokenUsage: 45000
  }
});
```

---

## Knowledge Workflows

### 10. Wiki Page Creation (5 steps)

**Category**: knowledge
**Description**: Structured workflow for creating comprehensive wiki pages

**Steps**:

1. **Gather Context** - Run onboarding to collect information (MCP: `onboarding.getPrompt`)
2. **Draft Content** - Write initial wiki content
3. **Create Wiki Page** - Save page via MCP (MCP: `wiki.create`)
4. **Review Content** - Proofread and validate
5. **Publish Page** - Make page visible

**Use When**:
- Creating new wiki documentation
- Documenting new processes or features
- Building knowledge base

---

### 11. Knowledge Search (4 steps)

**Category**: knowledge
**Description**: Comprehensive search across multiple knowledge sources

**Steps**:

1. **Define Search Requirements** - Clarify what information is needed
2. **Search Wiki** - Search wiki pages (MCP: `wiki.search`)
3. **Search Codebase** - Search code and documentation
4. **Synthesize Results** - Combine and summarize findings

**Use When**:
- Looking for existing documentation
- Researching solutions to problems
- Finding related knowledge articles

---

### 12. Onboarding New Project (7 steps)

**Category**: knowledge
**Description**: Complete 3-session project onboarding workflow

**Steps**:

1. **Executive Summary Session** - Collect high-level project info (MCP: `onboarding.getPrompt`)
2. **Industry Documentation Session** - Generate PRD, SRS, Architecture (MCP: `onboarding.getPrompt`)
3. **AI Workflow Blueprint Session** - Setup memory bank and SOPs (MCP: `onboarding.getPrompt`)
4. **Create Project Wiki** - Initialize project documentation (MCP: `wiki.create`)
5. **Create Sprint Phase** - Setup initial sprint (MCP: `sprint.phase.create`)
6. **Setup Progress Tracking** - Initialize tracking systems
7. **Create Checkpoint** - Save onboarding checkpoint (MCP: `sprint.checkpoint.create`)

**Use When**:
- Starting new project
- Onboarding new team member to project
- Initializing project structure and documentation

---

## Template Statistics

| Category | Templates | Total Steps | Avg Steps/Template |
|----------|-----------|-------------|--------------------|
| Development | 6 | 51 | 8.5 |
| Project Management | 3 | 13 | 4.3 |
| Knowledge | 3 | 16 | 5.3 |
| **Total** | **12** | **80** | **6.7** |

> **Note**: Sprint 15 simplified Project Management workflows by removing Week/Day-level tracking. Progress is now tracked via Kanban boards.

---

## Using Workflows

### Starting a Workflow

```typescript
// 1. List available templates
projectpulse.workflow.list({ category: 'development' });

// 2. Start workflow
projectpulse.workflow.start({
  templateId: 1,
  initialContext: { featureName: 'User Auth' }
});
// Returns: { runId: 123, nextStepName: 'Create Feature Branch' }

// 3. Execute steps
projectpulse.workflow.executeStep({
  runId: 123,
  stepResult: { success: true, branchName: 'feature/auth' }
});

// 4. Check status
projectpulse.workflow.getStatus({ runId: 123 });
```

### Workflow State Machine

```
pending → running → completed
                  ↘ failed
                  ↘ paused → resumed (back to running)
```

**Valid Transitions**:
- `pending` → `running` (first step execution)
- `running` → `running` (between steps)
- `running` → `completed` (after last step)
- `running` → `paused` (manual pause)
- `paused` → `running` (manual resume)
- Any state → `failed` (error occurred)

**Blocked Transitions**:
- Cannot execute step when status is `completed`, `failed`, or `paused`
- Must use `workflow.resume` to continue from `paused` state

---

## MCP Tools Reference

All workflow operations use these MCP tools:

- `projectpulse.workflow.list` - List available templates
- `projectpulse.workflow.start` - Start new workflow run
- `projectpulse.workflow.executeStep` - Execute current step
- `projectpulse.workflow.getStatus` - Check workflow status
- `projectpulse.workflow.pause` - Pause workflow
- `projectpulse.workflow.resume` - Resume paused workflow
- `projectpulse.workflow.complete` - Manually mark complete

See [mcp-tools-guide.md](mcp-tools-guide.md) for complete tool documentation.

---

## API Endpoints Reference

All workflow operations use these API endpoints:

- `GET /api/workflows` - List templates
- `POST /api/workflows/run` - Start workflow
- `GET /api/workflows/run/:id` - Get status
- `POST /api/workflows/run/:id/step` - Execute step

See [api-catalog.md](api-catalog.md) for complete API documentation.

---

## Database Schema

Workflows use these database models:

- **WorkflowTemplate** - Template definitions with step arrays (JSONB)
- **WorkflowRun** - Active workflow instances with execution context
- **WorkflowStep** - Individual step records with status and results

See [database-schema.md](database-schema.md) for complete schema documentation.

---

**Maintenance**:
- Update this catalog when adding new templates
- Keep step descriptions current
- Document any template changes
- Version templates if breaking changes occur

**Related**:
- [MCP Tools Guide](mcp-tools-guide.md) - Workflow tool usage
- [API Catalog](api-catalog.md) - Workflow API endpoints
- [Database Schema](database-schema.md) - Workflow models

---

**Last Updated**: 2025-11-12
**Total Templates**: 12
**Total Steps**: 82
**Status**: Sprint 3 complete
