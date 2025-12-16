# Context File Workflow - Test Scenario

**Created**: 2025-10-26
**Purpose**: Validate that the context file workflow system works correctly
**Status**: Ready for testing

---

## Test Scenario 1: Session Start with Context File Creation

### Objective
Verify that Claude creates a current-session.md file at session start with proper content.

### Steps
1. Start new session
2. User says: "Read STATUS.md, DEVELOPMENT_PLAN.md and continue"
3. Claude should:
   - Read STATUS.md and extract current phase
   - Create `.agent/task/current-session-[timestamp].md`
   - Document phase, goals, requirements in the file

### Success Criteria
- ✅ File created at `.agent/task/current-session-[YYYYMMDD-HHMM].md`
- ✅ File contains: Phase name, goals, requirements
- ✅ Timestamp format is correct: YYYYMMDD-HHMM (e.g., 20251026-1430)
- ✅ Claude references this file when planning work

### Expected File Content
```markdown
# Current Session: [timestamp]

## Phase
Phase 3.1: Issue Management API

## Goals
- Implement POST /api/issues endpoint
- Add Zod validation
- Test endpoint functionality

## Requirements (from DEVELOPMENT_PLAN.md)
- Follow API patterns from .agent/system/api-catalog.md
- Use Prisma for database operations
- Return standardized response format

## Progress
- [ ] Research existing API patterns
- [ ] Implement endpoint
- [ ] Write tests
- [ ] Update documentation
```

---

## Test Scenario 2: Sub-Agent Invocation with Context File

### Objective
Verify that Claude passes context file to sub-agents and reads their reports.

### Steps
1. Continue from Scenario 1
2. Phase requires understanding existing architecture
3. Claude should invoke analyze-architecture sub-agent
4. Claude should:
   - Tell sub-agent: "Read .agent/task/current-session-[timestamp].md first"
   - Wait for sub-agent to create report
   - Read the report file
   - Use report to guide implementation

### Success Criteria
- ✅ Claude explicitly mentions passing context file to sub-agent
- ✅ Sub-agent creates report at `.agent/task/architecture-[topic]-[timestamp].md`
- ✅ Claude reads the report file (not just the message)
- ✅ Claude references specific findings from the report
- ✅ Implementation follows recommendations from report

### Expected Messages
```
Claude: "Invoking analyze-architecture sub-agent to understand existing API patterns...
         Passing context file: .agent/task/current-session-20251026-1430.md"

[Sub-agent works...]

Claude: "Sub-agent complete. Reading report: .agent/task/architecture-api-20251026-1445.md

         Key insights from report:
         - All API routes use Zod validation
         - Response format: { data, error }
         - Prisma client imported from @/lib/db

         Implementing POST /api/issues following these patterns..."
```

---

## Test Scenario 3: Context File Updates Throughout Session

### Objective
Verify that Claude updates current-session.md as work progresses.

### Steps
1. Continue from Scenario 2
2. After invoking sub-agent and reading report
3. After implementing feature
4. After invoking synthesize-docs sub-agent

### Success Criteria
- ✅ current-session.md updated after sub-agent invocation
- ✅ current-session.md updated after implementation
- ✅ current-session.md updated after documentation generation
- ✅ File shows complete session history

### Expected File Updates

**After sub-agent invocation:**
```markdown
## Progress
- [x] Research existing API patterns
  - Report: .agent/task/architecture-api-20251026-1445.md
  - Key findings: Zod validation, { data, error } format
- [ ] Implement endpoint
- [ ] Write tests
- [ ] Update documentation
```

**After implementation:**
```markdown
## Progress
- [x] Research existing API patterns
- [x] Implement endpoint
  - Created: app/api/issues/route.ts
  - Validation: Zod schema for issue creation
  - Database: Prisma Issue.create()
- [ ] Write tests
- [ ] Update documentation
```

**After synthesize-docs:**
```markdown
## Progress
- [x] Research existing API patterns
- [x] Implement endpoint
- [x] Write tests
- [x] Update documentation
  - Created: .agent/sops/api-endpoint-creation.md
```

---

## Test Scenario 4: Sub-Agent Report File Format

### Objective
Verify that sub-agent reports are properly formatted and saved.

### Steps
1. Invoke any sub-agent (explore-codebase, analyze-architecture, synthesize-docs, map-system)
2. Check the report file created by sub-agent

### Success Criteria
- ✅ File exists at `.agent/task/[agent]-[topic]-[timestamp].md`
- ✅ File contains detailed findings (not just 1-2 sentences)
- ✅ File includes: Summary, Findings, Recommendations, File References
- ✅ File is formatted in markdown
- ✅ Sub-agent's final message references this file path

### Expected Report Structure

**explore-codebase report:**
```markdown
# Exploration Report: API Patterns

**Agent**: explore-codebase
**Created**: 2025-10-26 14:45
**Topic**: API patterns in existing codebase

## Summary
Found 5 API endpoints across 3 route files. All use consistent patterns:
Zod validation, Prisma queries, { data, error } response format.

## Findings

### Pattern 1: Zod Validation
- Location: app/api/preferences/[userId]/route.ts:15-25
- All endpoints define input schema with Zod
- Validation happens before database operations

### Pattern 2: Response Format
- All successful responses: { data: T }
- All error responses: { error: string }, status code
- Consistent across all endpoints

## Recommendations
1. Follow Zod validation pattern from preferences endpoint
2. Use { data, error } response format
3. Import Prisma client from @/lib/db

## File References
- [app/api/preferences/[userId]/route.ts:15](app/api/preferences/[userId]/route.ts#L15)
- [lib/db.ts](lib/db.ts) - Prisma client singleton
```

**analyze-architecture report:**
```markdown
# Architecture Analysis: Issue Management Flow

**Agent**: analyze-architecture
**Created**: 2025-10-26 14:50
**Topic**: Data flow for issue management

## Data Flow Diagram

UI (IssueForm)
    ↓ POST /api/issues
API Route (route.ts)
    ↓ validate with Zod
    ↓ Prisma.issue.create()
Database (PostgreSQL)
    ↓ return issue
API Route
    ↓ { data: issue }
UI (displays issue)

## Integration Points
- Form validation: react-hook-form + Zod
- API validation: Zod schema.parse()
- Database: Prisma ORM
- Response: NextResponse.json()

## Recommendations
1. Reuse Zod schema for both client and server validation
2. Include relations in Prisma query (creator, assignee)
3. Use try/catch for Prisma errors
```

---

## Test Scenario 5: Multiple Sub-Agent Invocations in One Session

### Objective
Verify that multiple sub-agents can work in the same session with shared context.

### Steps
1. Session starts, current-session.md created
2. Invoke explore-codebase → creates report
3. Invoke analyze-architecture → reads current-session.md, creates report
4. Invoke synthesize-docs → reads current-session.md, creates SOP

### Success Criteria
- ✅ All sub-agents read the same current-session.md file
- ✅ All sub-agents create separate report files with unique timestamps
- ✅ current-session.md updated after each sub-agent completes
- ✅ Later sub-agents can reference earlier sub-agent findings (from context file)
- ✅ No file naming conflicts

### Expected File Structure
```
.agent/task/
├── current-session-20251026-1430.md         (created at start, updated throughout)
├── explore-api-20251026-1445.md             (1st sub-agent)
├── architecture-issues-20251026-1502.md     (2nd sub-agent)
└── synthesize-sop-20251026-1530.md          (3rd sub-agent)
```

---

## Test Scenario 6: Context File Persistence Across Context Compaction

### Objective
Verify that when context window fills and compacts, file-based reports remain accessible.

### Steps
1. Session with heavy token usage (approaching 200K limit)
2. Context compacts (conversation summarized)
3. Later in session, need to reference earlier sub-agent findings

### Success Criteria
- ✅ Files in `.agent/task/` directory are NOT affected by context compaction
- ✅ Claude can still read report files after compaction
- ✅ current-session.md retains all session history
- ✅ No information loss from compaction

### Expected Behavior
```
Before Compaction:
- Full conversation in context (150K tokens)
- All sub-agent reports in .agent/task/

After Compaction:
- Summarized conversation (30K tokens)
- All sub-agent reports STILL in .agent/task/ (unchanged)
- Claude can read any report file to recover details
```

---

## Validation Checklist

Use this checklist to validate the context file workflow:

### Session Start
- [ ] current-session-[timestamp].md created automatically
- [ ] File contains phase, goals, requirements
- [ ] Timestamp format correct (YYYYMMDD-HHMM)

### Sub-Agent Invocation
- [ ] Claude mentions passing context file
- [ ] Sub-agent reads current-session.md first
- [ ] Sub-agent creates detailed report file
- [ ] Report file has correct naming: [agent]-[topic]-[timestamp].md
- [ ] Sub-agent final message references report file path

### Report Reading
- [ ] Claude reads report file (not just message)
- [ ] Claude references specific findings from report
- [ ] Implementation follows report recommendations

### Context Updates
- [ ] current-session.md updated after sub-agent work
- [ ] current-session.md updated after implementation
- [ ] File shows complete progress tracking

### File Persistence
- [ ] All report files remain after context compaction
- [ ] Claude can read old reports anytime
- [ ] No information loss

---

## Common Issues to Check

### Issue 1: Claude doesn't create current-session.md
**Symptom**: Session starts but no context file created
**Fix**: Remind Claude via Memory MCP or re-read CLAUDE.md section on context workflow

### Issue 2: Sub-agent doesn't read context file
**Symptom**: Sub-agent works but doesn't reference current session context
**Fix**: Check sub-agent definition has "ALWAYS read .agent/task/current-session.md FIRST" rule

### Issue 3: Report files not created
**Symptom**: Sub-agent returns message but doesn't save report file
**Fix**: Check sub-agent CRITICAL RULES section specifies file save requirements

### Issue 4: Claude doesn't read report files
**Symptom**: Sub-agent creates report but Claude doesn't reference it
**Fix**: Check CLAUDE.md "Context File Workflow" section specifies reading reports

### Issue 5: Timestamp format inconsistent
**Symptom**: Files named with different timestamp formats
**Fix**: Enforce YYYYMMDD-HHMM format in all agent definitions

---

## Success Metrics

**Phase 1 Context Workflow is successful if:**

1. **100% of sessions** create current-session.md file
2. **100% of sub-agent invocations** pass context file
3. **100% of sub-agents** create report files
4. **100% of implementations** reference sub-agent reports
5. **0% information loss** after context compaction

---

**Status**: Ready to test in next session
**Next**: Run Test Scenario 1 at start of next session
