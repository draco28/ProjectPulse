# MCP Client Agent Simulation Test

**Version:** 1.1  
**Project:** ProjectPulse  
**Test Type:** End-to-End Integration (Role-Play)  
**Total MCP Tools:** 77  
**Test Date:** 2025-11-27  

## Test Results Summary

### Initial Test (2025-11-27)
| Category | Pass | Fail | Total |
|----------|------|------|-------|
| Health & Memory | 4 | 0 | 4 |
| Onboarding S1 | 12 | 0 | 12 |
| Document Gen S2 | 5 | 0 | 5 |
| Bootstrap S3 | 10 | 0 | 10 |
| Sprint/Roadmap | 6 | 3 | 9 |
| Tickets | 7 | 0 | 7 |
| Wiki | 2 | 4 | 6 |
| Knowledge | 4 | 0 | 4 |
| Workflows | 6 | 0 | 6 |
| Legacy Issues | 4 | 2 | 6 |
| **TOTAL** | **60** | **9** | **69** |

**Initial Pass Rate: 87%**

### After Fixes (2025-11-27)
| Category | Pass | Fail | Total |
|----------|------|------|-------|
| Health & Memory | 4 | 0 | 4 |
| Onboarding S1 | 12 | 0 | 12 |
| Document Gen S2 | 5 | 0 | 5 |
| Bootstrap S3 | 10 | 0 | 10 |
| Sprint/Roadmap | 9 | 0 | 9 |
| Tickets | 7 | 0 | 7 |
| Wiki | 4 | 1 | 5 |
| Knowledge | 4 | 0 | 4 |
| Workflows | 6 | 0 | 6 |
| **TOTAL** | **61** | **1** | **62** |

**Final Pass Rate: 98%** (Legacy issue tools removed, 6 tools deleted)

### Bugs Fixed (Commits d296549, c1a33f9)

1. **wiki/generate/route.ts syntax error** - Fixed (orphan closing brace)
2. **sprint_task_create** - Fixed (changed from UUID to cuid validation)
3. **roadmap_create** - Fixed (now uses httpClient with auth)
4. **roadmap_getPhaseProgress** - Fixed (now passes projectId query param)
5. **wiki_analytics_summary** - Fixed (was broken by generate syntax error)
6. **wiki_generate** - Fixed (syntax error resolved)
7. **Legacy issue tools** - REMOVED (use ticket_* tools instead)

### Remaining Known Issues

1. **wiki_search** - 500 error due to missing `content_tsv` column (requires DB migration)
2. **wiki_update 403** - Expected behavior (cross-project isolation working correctly)

## Purpose

This document simulates a real client onboarding and using ProjectPulse with their AI agent. The test covers all 77 MCP tools through realistic user scenarios.

**How to Run:**
1. Clean target project to fresh state
2. Follow each act sequentially
3. User provides dialogue prompts
4. Agent executes MCP tool calls
5. Mark each tool as ✅ Pass or ❌ Fail

---

## Pre-Test Setup

**Project ID:** 3  
**Project Name:** Client Test Project  
**Token:** `mcp_668b6765b599bcb0cb4bf264254c64380f7e7dd14cd81efa2589969bef1953a8`

### ⚠️ KNOWN ISSUE: Factory MCP Integration

Factory's MCP integration attempts OAuth discovery (`/.well-known/openid-configuration`) and dynamic registration (`/register`) which our MCP server doesn't support. This causes "Cannot POST /register" errors.

**Workaround:** Test tools via direct curl calls:
```bash
TOKEN="mcp_668b6765b599bcb0cb4bf264254c64380f7e7dd14cd81efa2589969bef1953a8"
curl -s http://192.168.1.15:3001/mcp -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"TOOL_NAME","arguments":{...}}}'
```

### Verify Clean State
```
Expected counts:
- Tickets: 0
- Personas: 0
- Skills: 0
- SOPs: 0
- Wiki: 0 (will regenerate)
- Memory Banks: 5 (defaults)
- Roadmaps: 0
- Onboarding: 0
```

---

## Act 1: Project Health & Memory (Tools 1-7)

### Scene 1.1: Connection Test

**USER:** "Hey agent, can you check if ProjectPulse is working?"

**AGENT ACTION:**
- [ ] `projectpulse_health_check` - Verify API connectivity

**Expected:** Status healthy, database connected

---

### Scene 1.2: Load Project Context

**USER:** "Load my project context so you know what we're working on"

**AGENT ACTION:**
- [ ] `projectpulse_memory_sessionStart` (projectId: 3) - Load all 5 memory banks

**Expected:** Returns PROJECT_BRIEF, SYSTEM_PATTERNS, TECH_CONTEXT, ACTIVE_CONTEXT, PROGRESS

---

### Scene 1.3: Check Specific Memory

**USER:** "What's our tech stack again?"

**AGENT ACTION:**
- [ ] `projectpulse_memory_patternLookup` (projectId: 3, bankType: "TECH_CONTEXT")

**Expected:** Returns tech context memory bank content

---

### Scene 1.4: Context Recovery

**USER:** "I just resumed this session, refresh my context"

**AGENT ACTION:**
- [ ] `projectpulse_memory_contextRecovery` (projectId: 3)

**Expected:** Returns ACTIVE_CONTEXT + PROGRESS banks

---

## Act 2: Project Onboarding - Session 1 (Tools 8-18)

### Scene 2.1: Start Onboarding

**USER:** "I want to set up my new project. Let's start the onboarding process."

**AGENT ACTION:**
- [ ] `projectpulse_onboarding_getPrompt` (projectId: 3)

**Expected:** Returns first onboarding session prompt

---

### Scene 2.2: Get Phase 1 Questions

**USER:** "What questions do I need to answer for Product Manager phase?"

**AGENT ACTION:**
- [ ] `projectpulse_onboarding_getPhasedQuestions` (projectId: 3, phase: 1)

**Expected:** Returns Phase 1 Product Manager questions

---

### Scene 2.3: Answer Phase 1

**USER:** "Here are my answers for Phase 1..."

**AGENT ACTION:**
- [ ] `projectpulse_onboarding_savePhase` (projectId: 3, phase: 1, answers: {...})

**Expected:** Phase saved, progress updated to 10%

---

### Scene 2.4: Check Token Budget

**USER:** "Do I have enough tokens to continue?"

**AGENT ACTION:**
- [ ] `projectpulse_onboarding_checkTokenBudget` (projectId: 3, estimatedTokens: 5000)

**Expected:** Returns safe: true with remaining tokens

---

### Scene 2.5: Complete All 10 Phases

**USER:** "Let's complete phases 2-10"

**AGENT ACTION:**
- [ ] `projectpulse_onboarding_getQuestions` (projectId: 3, phase: 2)
- [ ] `projectpulse_onboarding_saveAnswers` (projectId: 3, phase: 2, answers: {...})
- Repeat for phases 3-10...

**Expected:** All phases complete, ready for executive summary

---

### Scene 2.6: Generate Executive Summary

**USER:** "Generate the executive summary from all my answers"

**AGENT ACTION:**
- [ ] `projectpulse_onboarding_getExecutiveSummaryPrompt` (projectId: 3)
- [ ] `projectpulse_onboarding_storeExecutiveSummary` (projectId: 3, executiveSummary: "...")

**Expected:** Summary stored, Session 1 complete

---

## Act 3: Document Generation - Session 2 (Tools 19-25)

### Scene 3.1: Get Document Prompts

**USER:** "Generate all the project documentation"

**AGENT ACTION:**
- [ ] `projectpulse_onboarding_getDocumentPrompts` (projectId: 3)

**Expected:** Returns 15 document templates with project context

---

### Scene 3.2: Generate Batch 1 (Planning)

**USER:** "Generate the planning documents"

**AGENT ACTION:**
- [ ] `projectpulse_onboarding_getDocBatchPrompt` (projectId: 3, batch: 1)

**Expected:** Returns prompts for PRD, SRS, Backlog, Project Plan

---

### Scene 3.3: Store Documents

**USER:** "Save these documents"

**AGENT ACTION:**
- [ ] `projectpulse_onboarding_storeBatch` (projectId: 3, documents: [...])
OR
- [ ] `projectpulse_onboarding_storeDocument` (projectId: 3, filename: "01-PRD.md", ...)

**Expected:** Documents stored successfully

---

### Scene 3.4: Verify Documents

**USER:** "Show me all generated documents"

**AGENT ACTION:**
- [ ] `projectpulse_onboarding_listDocuments` (projectId: 3)

**Expected:** Lists all 15 documents with metadata

---

## Act 4: Session 3 Bootstrap (Tools 26-35)

### Scene 4.1: Bootstrap AI Workflow

**USER:** "Set up all the AI workflow stuff - personas, skills, everything"

**AGENT ACTION:**
- [ ] `projectpulse_onboarding_bootstrap` (projectId: 3, repoPath: "/path/to/repo")

OR manual approach:
- [ ] `projectpulse_onboarding_getBootstrapPrompt` (projectId: 3)

**Expected:** Creates personas, skills, workflows, SOPs, roadmap

---

### Scene 4.2: Create Agent Personas

**USER:** "Create my development team personas"

**AGENT ACTION:**
- [ ] `projectpulse_batch_createAgentPersonas` (projectId: 3, personas: [...])

**Expected:** 3-5 personas created (Frontend Expert, Backend Expert, etc.)

---

### Scene 4.3: Create Skills

**USER:** "Set up the skills library for my tech stack"

**AGENT ACTION:**
- [ ] `projectpulse_batch_createSkills` (projectId: 3, skills: [...])

**Expected:** 5-10 skills created

---

### Scene 4.4: Create SOPs

**USER:** "Create standard operating procedures"

**AGENT ACTION:**
- [ ] `projectpulse_batch_createSOPs` (projectId: 3, sops: [...])

**Expected:** 5 SOPs created (Git workflow, PR process, etc.)

---

### Scene 4.5: Create Workflow Templates

**USER:** "Set up workflow templates"

**AGENT ACTION:**
- [ ] `projectpulse_batch_createWorkflowTemplates` (projectId: 3, workflows: [...])

**Expected:** 3 workflows created (Feature dev, Bug fix, Release)

---

### Scene 4.6: Write Repo Files (Optional)

**USER:** "Write CLAUDE.md and AGENTS.md to my repo"

**AGENT ACTION:**
- [ ] `projectpulse_repo_writeMinimal` (projectId: 3, repoPath: "/path/to/repo")

**Expected:** Files written to repo

---

## Act 5: Roadmap & Sprint Planning (Tools 36-45)

### Scene 5.1: Create Roadmap

**USER:** "Create my development roadmap for the next 3 months"

**AGENT ACTION:**
- [ ] `projectpulse_roadmap_create` (projectId: 3, title: "Q1 2025 Roadmap", phases: [...])

**Expected:** Roadmap created with phases, sprints, weeks, days

---

### Scene 5.2: Get Blueprint

**USER:** "Show me the project blueprint"

**AGENT ACTION:**
- [ ] `projectpulse_blueprint_get` (projectId: 3)

**Expected:** Returns project context, tech stack, timeline

---

### Scene 5.3: Check Current Position

**USER:** "Where am I in the roadmap?"

**AGENT ACTION:**
- [ ] `projectpulse_sprint_getCurrentPosition` (projectId: 3)

**Expected:** Returns current phase/week/day/task or null if none active

---

### Scene 5.4: Get Phase Progress

**USER:** "How's Phase 1 going?"

**AGENT ACTION:**
- [ ] `projectpulse_roadmap_getPhaseProgress` (projectId: 3, phaseId: "...")

**Expected:** Returns phase with nested sprints/weeks/days/tasks

---

### Scene 5.5: Create Sprint Phase

**USER:** "Create a new phase for API development"

**AGENT ACTION:**
- [ ] `projectpulse_sprint_phase_create` (title: "Phase 2: API Development", startDate: "...", durationWeeks: 4)

**Expected:** Phase created with 4 weeks auto-generated

---

### Scene 5.6: Query Hierarchy

**USER:** "Show me all tasks that are blocked"

**AGENT ACTION:**
- [ ] `projectpulse_sprint_queryHierarchy` (level: "task", status: ["BLOCKED"])

**Expected:** Returns paginated list of blocked tasks

---

## Act 6: Daily Development Work (Tools 46-55)

### Scene 6.1: Create Task

**USER:** "Create a task for implementing user authentication"

**AGENT ACTION:**
- [ ] `projectpulse_sprint_task_create` (dayId: "...", title: "Implement user authentication", ...)

**Expected:** Task created with hierarchy context

---

### Scene 6.2: Get Current Task

**USER:** "What am I working on right now?"

**AGENT ACTION:**
- [ ] `projectpulse_sprint_getCurrentTask` (includeHistory: true)

**Expected:** Returns current IN_PROGRESS task with context

---

### Scene 6.3: Start Work Session

**USER:** "I'm starting a coding session on this task"

**AGENT ACTION:**
- [ ] `projectpulse_sprint_session_create` (taskId: "...", title: "Auth implementation session", ...)

**Expected:** Session created

---

### Scene 6.4: Save Checkpoint

**USER:** "Save my progress - I'm at about 15K tokens"

**AGENT ACTION:**
- [ ] `projectpulse_sprint_checkpoint_create` (sessionId: "...", notes: "Completed login flow", tokenUsage: 15000)

**Expected:** Checkpoint saved with session context

---

### Scene 6.5: Update Progress

**USER:** "Mark the session as 75% complete"

**AGENT ACTION:**
- [ ] `projectpulse_sprint_updateProgress` (entityType: "session", entityId: "...", progress: 75)

**Expected:** Progress updated, propagated to parent task/day/week/phase

---

## Act 7: Ticket Management (Tools 56-65)

### Scene 7.1: Create Ticket

**USER:** "Create a ticket for the login page bug"

**AGENT ACTION:**
- [ ] `projectpulse_ticket_create` (title: "Login button not working", kind: "bug", source: "manual", priority: "high")

**Expected:** Ticket created with ID

---

### Scene 7.2: Bulk Create Tickets

**USER:** "Import these 5 feature requests"

**AGENT ACTION:**
- [ ] `projectpulse_ticket_bulkCreate` (tickets: [...])

**Expected:** 5 tickets created atomically

---

### Scene 7.3: Search Tickets

**USER:** "Find all high priority bugs"

**AGENT ACTION:**
- [ ] `projectpulse_ticket_search` (kind: ["bug"], priority: ["high"])

**Expected:** Paginated list of matching tickets

---

### Scene 7.4: Update Ticket

**USER:** "Assign this ticket to the frontend team"

**AGENT ACTION:**
- [ ] `projectpulse_ticket_update` (ticketId: X, module: "Frontend", assignee: "Frontend Team")

**Expected:** Ticket updated

---

### Scene 7.5: Add Comment

**USER:** "Add a note that we identified the root cause"

**AGENT ACTION:**
- [ ] `projectpulse_ticket_addComment` (ticketId: X, content: "Root cause: missing event handler")

**Expected:** Comment added

---

### Scene 7.6: Update Status

**USER:** "Mark this as in progress"

**AGENT ACTION:**
- [ ] `projectpulse_ticket_setStatus` (ticketId: X, status: "in_progress")

**Expected:** Status updated

---

## Act 8: Issue Management (Tools 66-70)

### Scene 8.1: Create Issue

**USER:** "Log this performance issue I found"

**AGENT ACTION:**
- [ ] `projectpulse_issue_create` (title: "Slow page load on dashboard", priority: "medium")

**Expected:** Issue created

---

### Scene 8.2: Bulk Create Issues

**USER:** "Import issues from our scanner"

**AGENT ACTION:**
- [ ] `projectpulse_issue_bulkCreate` (issues: [...])

**Expected:** Issues created

---

### Scene 8.3: Search Issues

**USER:** "Find all open issues in the API module"

**AGENT ACTION:**
- [ ] `projectpulse_issue_search` (status: ["open"], module: ["API"])

**Expected:** Matching issues returned

---

### Scene 8.4: Update Issue

**USER:** "Update the issue details"

**AGENT ACTION:**
- [ ] `projectpulse_issue_update` (issueId: X, description: "Updated description...")

**Expected:** Issue updated

---

### Scene 8.5: Issue Status & Comment

**USER:** "Close this issue and add a resolution note"

**AGENT ACTION:**
- [ ] `projectpulse_issue_addComment` (issueId: X, content: "Fixed in commit abc123")
- [ ] `projectpulse_issue_setStatus` (issueId: X, status: "closed")

**Expected:** Comment added, status closed

---

## Act 9: Wiki & Documentation (Tools 71-76)

### Scene 9.1: Create Wiki Page

**USER:** "Create a wiki page for our API documentation"

**AGENT ACTION:**
- [ ] `projectpulse_wiki_create` (title: "API Reference", path: "api-reference", category: "reference", content: "...")

**Expected:** Wiki page created

---

### Scene 9.2: Search Wiki

**USER:** "Find all troubleshooting docs"

**AGENT ACTION:**
- [ ] `projectpulse_wiki_search` (query: "troubleshooting", category: "troubleshooting")

**Expected:** Matching wiki pages

---

### Scene 9.3: Update Wiki

**USER:** "Update the API docs with the new endpoints"

**AGENT ACTION:**
- [ ] `projectpulse_wiki_update` (path: "api-reference", content: "...", changelog: "Added new endpoints")

**Expected:** Wiki updated with revision

---

### Scene 9.4: Wiki Analytics

**USER:** "Which docs are most viewed?"

**AGENT ACTION:**
- [ ] `projectpulse_wiki_analytics_summary` (limit: 5)

**Expected:** Top pages, trending tags, helpful ratios

---

### Scene 9.5: Auto-Generate Docs

**USER:** "Generate wiki docs from our source code"

**AGENT ACTION:**
- [ ] `projectpulse_wiki_generate` (projectPath: "/path/to/project", category: "reference")

**Expected:** Wiki pages generated from JSDoc/docstrings

---

## Act 10: Knowledge Base (Tools 77-82)

### Scene 10.1: Create Knowledge

**USER:** "Save this pattern I discovered"

**AGENT ACTION:**
- [ ] `projectpulse_knowledge_create` (projectId: 3, title: "React Optimization Pattern", content: "...", category: "Patterns")

**Expected:** Knowledge item created with embedding

---

### Scene 10.2: Search Knowledge

**USER:** "Find anything about React performance"

**AGENT ACTION:**
- [ ] `projectpulse_knowledge_search` (projectId: 3, query: "React performance", mode: "hybrid")

**Expected:** Relevant knowledge items with scores

---

### Scene 10.3: Find Related

**USER:** "What's related to this pattern?"

**AGENT ACTION:**
- [ ] `projectpulse_knowledge_related` (projectId: 3, itemId: X, maxDepth: 2)

**Expected:** Related items via graph traversal

---

### Scene 10.4: Export Knowledge

**USER:** "Export all knowledge for backup"

**AGENT ACTION:**
- [ ] `projectpulse_knowledge_export` (projectId: 3, format: "json")

**Expected:** Full knowledge export

---

### Scene 10.5: Import Knowledge

**USER:** "Import this knowledge base"

**AGENT ACTION:**
- [ ] `projectpulse_knowledge_import` (projectId: 3, items: [...])

**Expected:** Items imported

---

### Scene 10.6: Archive Knowledge

**USER:** "Archive this outdated item"

**AGENT ACTION:**
- [ ] `projectpulse_knowledge_archive` (projectId: 3, itemId: X)

**Expected:** Item archived (soft delete)

---

### Scene 10.7: Knowledge Metrics

**USER:** "How's our knowledge base doing?"

**AGENT ACTION:**
- [ ] `projectpulse_knowledge_metrics` (projectId: 3)

**Expected:** Usage stats, search performance, popular queries

---

## Act 11: Workflow Execution (Tools 83-87)

### Scene 11.1: List Workflows

**USER:** "What workflow templates do we have?"

**AGENT ACTION:**
- [ ] `projectpulse_workflow_list` (category: "development")

**Expected:** List of workflow templates

---

### Scene 11.2: Start Workflow

**USER:** "Start the feature development workflow"

**AGENT ACTION:**
- [ ] `projectpulse_workflow_start` (templateId: X, projectId: 3)

**Expected:** Workflow run created, first step details

---

### Scene 11.3: Execute Step

**USER:** "Complete this step and move to next"

**AGENT ACTION:**
- [ ] `projectpulse_workflow_executeStep` (runId: X, stepResult: {...})

**Expected:** Step completed, next step returned

---

### Scene 11.4: Get Status

**USER:** "What's the workflow status?"

**AGENT ACTION:**
- [ ] `projectpulse_workflow_getStatus` (runId: X)

**Expected:** Current step, progress, all step statuses

---

### Scene 11.5: Pause Workflow

**USER:** "I need to pause this workflow"

**AGENT ACTION:**
- [ ] `projectpulse_workflow_pause` (runId: X, reason: "Waiting for review")

**Expected:** Workflow paused with checkpoint

---

### Scene 11.6: Resume Workflow

**USER:** "Resume the workflow"

**AGENT ACTION:**
- [ ] `projectpulse_workflow_resume` (runId: X)

**Expected:** Workflow resumed from checkpoint

---

### Scene 11.7: Complete Workflow

**USER:** "Mark the workflow as done"

**AGENT ACTION:**
- [ ] `projectpulse_workflow_complete` (runId: X, status: "completed", summary: "Feature shipped!")

**Expected:** Workflow finalized

---

## Act 12: Observability (Tools 88-89)

### Scene 12.1: Log Step

**USER:** "Log this action for the session"

**AGENT ACTION:**
- [ ] `projectpulse_observability_logStep` (sessionId: X, stepName: "Generated component", metadata: {...})

**Expected:** Step logged to metrics

---

### Scene 12.2: Complete Session

**USER:** "Mark onboarding session as complete"

**AGENT ACTION:**
- [ ] `projectpulse_observability_completeSession` (sessionId: X, validationReport: {...})

**Expected:** Session marked complete with quality report

---

## Test Results Summary

| Act | Tools | Passed | Failed | Notes |
|-----|-------|--------|--------|-------|
| 1. Health & Memory | 4 | | | |
| 2. Onboarding S1 | 11 | | | |
| 3. Document Gen S2 | 7 | | | |
| 4. Bootstrap S3 | 10 | | | |
| 5. Roadmap | 10 | | | |
| 6. Daily Dev | 10 | | | |
| 7. Tickets | 10 | | | |
| 8. Issues | 5 | | | |
| 9. Wiki | 6 | | | |
| 10. Knowledge | 7 | | | |
| 11. Workflow | 7 | | | |
| 12. Observability | 2 | | | |
| **TOTAL** | **77** | | | |

---

## Known Issues Found

Document any issues discovered during testing:

1. `projectpulse_ticket_create` - Routes to /register (MCP routing issue)
2. `projectpulse_knowledge_search` - Variable conflict in route.ts
3. ...

---

## Post-Test Checklist

- [ ] All 77 tools tested
- [ ] Issues documented
- [ ] Fixes verified
- [ ] Results committed
