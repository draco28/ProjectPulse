# {{PROJECT_NAME}} - AI Workflow Guide

**Project ID**: {{PROJECT_ID}}
**MCP Server**: {{MCP_URL}}
**Dashboard**: {{DASHBOARD_URL}}

---

## Quick Start

Just chat naturally with me (Claude Code / Windsurf / Droid):

```
"Implement the user authentication feature"
"Fix the bug in the search API"
"Add tests for the payment module"
```

---

## CRITICAL: Start Every Session Here

### Step 1: Load Context

```
projectpulse_context_load(projectId: {{PROJECT_ID}})
```

This returns:
- All 5 memory banks (project brief, patterns, tech context, active focus, progress)
- Active sessions (check if PAUSED work exists)
- Available resources (personas, skills, SOPs)
- Workflow hints

**If PAUSED session found:** Resume with `projectpulse_agent_session_resume(sessionId)`
**If no session:** Start new with `projectpulse_agent_session_start()`

---

## Daily Workflow

### Morning: Start Work

```
Step 1: Load context
─────────────────────
projectpulse_context_load(projectId: {{PROJECT_ID}})
→ Returns: memory banks, active sessions, available resources

Step 2: Check roadmap position (if using roadmap)
─────────────────────────────────────────────────
projectpulse_sprint_getCurrentPosition(projectId: {{PROJECT_ID}})
→ Returns: phase/sprint/week/day with progress

Step 3: Find tickets for today
──────────────────────────────
projectpulse_ticket_search({
  sprintNumber: 1,
  status: ["open", "in-progress"]
})
→ Returns: Tickets assigned to current sprint

Step 4: Start session with ticket(s)
────────────────────────────────────
projectpulse_agent_session_start({
  projectId: {{PROJECT_ID}},
  name: "Sprint 1 - Feature Implementation",
  activeTicketIds: [42, 43],
  plan: "## Today's Plan\n1. Complete API endpoint\n2. Write tests",
  todos: [
    {content: "Complete API endpoint", status: "pending"},
    {content: "Write tests", status: "pending"}
  ]
})
```

### During Work

```
1. Claim ticket → ticket_update({ ticketId: 42, status: "in-progress" })
2. Add implementation context → ticket_update({ ticketId: 42, customFields: { _implementationContext: {...} } })
3. Work on code → (your normal coding flow)
4. Checkpoint every 15K tokens → agent_session_update({ sessionId: "...", progress: "..." })
5. Add comments → ticket_addComment({ ticketId: 42, content: "Implemented X, Y, Z" })
6. Close ticket → ticket_setStatus({ ticketId: 42, status: "closed" })
```

### End of Day

```
Step 5: Update roadmap progress (if using roadmap)
──────────────────────────────────────────────────
projectpulse_sprint_updateProgress({
  entityType: "day",
  entityId: "<day-uuid>",
  progress: 75  // How much of today's planned work is done
})
→ Auto-propagates: Day → Week → Sprint → Phase

Step 6: Pause or end session
────────────────────────────
# For breaks (lunch, EOD):
projectpulse_agent_session_update({
  sessionId: "...",
  status: "PAUSED",
  progress: "Pausing for end of day. Next: finish validation"
})

# When work is FULLY done:
projectpulse_agent_session_end({
  sessionId: "...",
  progress: "Session complete. Implemented feature X."
})
```

---

## Loading Project Resources (via MCP)

### Personas (Expert Roles)

Personas define expert behaviors and domain knowledge. Load one to adopt its expertise.

```
# List available personas
projectpulse_persona_list(projectId: {{PROJECT_ID}})

# Load a specific persona's system prompt
projectpulse_persona_get(projectId: {{PROJECT_ID}}, slug: "backend-developer")
→ Returns: systemPrompt, expertise, rules, skills, tools
```

**When to Load Personas:**
- Before starting specialized work (API development → load "backend-developer")
- When you need domain expertise and specific rules
- When the project requires a specific communication style

### Skills (Coding Patterns)

Skills contain reusable coding patterns, templates, and conventions for the project.

```
# List available skills
projectpulse_skill_list(projectId: {{PROJECT_ID}}, category: "framework")

# Load a skill's content
projectpulse_skill_get(projectId: {{PROJECT_ID}}, slug: "react-hooks-patterns")
→ Returns: Full content with code examples
```

**Skill Categories:**
- `framework` - Framework-specific patterns (React, Next.js, etc.)
- `testing` - Testing patterns and strategies
- `workflow` - Development workflow patterns
- `troubleshooting` - Debugging and problem-solving guides

### SOPs (Standard Operating Procedures)

SOPs provide step-by-step procedures for common tasks.

```
# List available SOPs
projectpulse_sop_list(projectId: {{PROJECT_ID}}, category: "Development")

# Load an SOP
projectpulse_sop_get(projectId: {{PROJECT_ID}}, slug: "git-workflow")
→ Returns: Full procedure with steps and checklists
```

**SOP Categories:**
- `Development` - Coding procedures
- `Testing` - Testing procedures
- `Deployment` - Deployment procedures
- `Operations` - Operational procedures

---

## Roadmap Workflow (Optional)

**Use roadmap for multi-week projects with phases. Skip for single fixes.**

### When to Use Roadmap

| Scenario | Use Roadmap? | Why |
|----------|--------------|-----|
| Greenfield project | Yes | Need timeline structure, progress tracking |
| Multi-sprint initiative | Yes | Track progress across weeks |
| Single bug fix | No | Create ticket, fix, close |
| Small improvement | No | Tickets-only is fine |

### Roadmap Tools Reference

| Tool | When to Use |
|------|-------------|
| `roadmap_create` | Once per project, after onboarding |
| `getCurrentPosition` | Start of each work day |
| `getPhaseProgress` | See full phase tree |
| `queryHierarchy` | Find low-progress or blocked items |
| `updateProgress` | End of day (cascades up automatically) |

### Ticket Scheduling to Roadmap

```
projectpulse_ticket_create({
  projectId: {{PROJECT_ID}},
  title: "Implement feature X",
  kind: "feature",
  source: "agent",
  sprintNumber: 1,
  scheduledWeekId: "<week-uuid>",        // Link to roadmap week
  scheduledDays: ["Monday", "Tuesday"],  // Which days within the week
  estimatedDays: 2                       // Estimated duration
})
```

### Progress Auto-Propagation

```
When you update a Day's progress:

  Day (Monday): 100% ────┐
  Day (Tuesday): 75% ────┼──→ Week recalculates automatically
  Day (Wednesday): 0% ───┘
                              │
                              ↓
                         Sprint recalculates
                              │
                              ↓
                         Phase recalculates

You only need to update Day progress. Everything else cascades automatically.
```

---

## Ticket Workflow

### Ticket Kinds

| User Says | Ticket Kind |
|-----------|-------------|
| "Add feature X", "We need X" | `feature` |
| "Do X", "Set up X", "Implement X" | `task` |
| "X is broken", "X doesn't work" | `bug` |
| "X needs refactoring", "Clean up X" | `tech_debt` |
| "I'm concerned about X", "X seems off" | `issue` |

### Complete Workflow (6 steps)

| Step | Action | MCP Tool |
|------|--------|----------|
| 1 | Create ticket | `ticket_create` |
| 2 | Add implementation plan | `ticket_update({ customFields: { _implementationContext: {...} } })` |
| 3 | Claim ticket | `ticket_update({ status: "in-progress" })` |
| 4 | Implement | (code tools) |
| 5 | Add comment | `ticket_addComment("Implemented X, Y, Z")` |
| 6 | Close after testing | `ticket_setStatus("closed")` |

### Workflow Example

```
# 1. Create ticket
projectpulse_ticket_create({
  projectId: {{PROJECT_ID}},
  title: "Add user authentication",
  kind: "feature",
  source: "agent",
  priority: "high",
  assignee: "Claude Code"
})
→ Returns: { id: 42, ... }

# 2. Add implementation plan
projectpulse_ticket_update({
  ticketId: 42,
  customFields: {
    _implementationContext: {
      implementationBlueprint: "## Plan\n1. Create auth routes\n2. Add JWT validation..."
    }
  }
})

# 3. Claim ticket
projectpulse_ticket_update({ ticketId: 42, status: "in-progress" })

# 4. Implement (your coding work)

# 5. Add comment
projectpulse_ticket_addComment({
  ticketId: 42,
  content: "Implemented JWT authentication. Created routes at /api/auth/*"
})

# 6. Close after testing passes
projectpulse_ticket_setStatus({ ticketId: 42, status: "closed" })
```

### NEVER close a ticket until testing is complete!
- After implementation: Add comment describing what was done
- After testing passes: Then close the ticket
- If no testing possible: Note in comment, get user approval to close

---

## Agent Session Lifecycle

### Session States

| Status | Use For |
|--------|---------|
| `IN_PROGRESS` | Actively working |
| `PAUSED` | Breaks, EOD, context compaction |
| `COMPLETED` | Work fully done (CANNOT resume!) |

### Pause vs End - Critical Distinction

| Use PAUSED for | Use END for |
|----------------|-------------|
| Lunch break | Feature fully complete |
| End of day | Milestone reached |
| Switching tasks temporarily | Ready for next feature |
| Context compaction imminent | All tickets closed |

**CRITICAL**: COMPLETED sessions CANNOT be resumed. Use PAUSED for breaks!

### Example Session

```
# Start session
projectpulse_agent_session_start({
  projectId: {{PROJECT_ID}},
  name: "Implementing feature X",
  plan: "## Plan\n1. Do X\n2. Do Y\n3. Test everything",
  todos: [
    {content: "Do X", status: "pending"},
    {content: "Do Y", status: "pending"},
    {content: "Test everything", status: "pending"}
  ],
  activeTicketIds: [25, 26]
})
→ Returns: sessionId: "abc123..."

# Checkpoint (every 15K tokens)
projectpulse_agent_session_update({
  sessionId: "abc123...",
  todos: [
    {content: "Do X", status: "completed"},
    {content: "Do Y", status: "in_progress"},
    {content: "Test everything", status: "pending"}
  ],
  progress: "Checkpoint: Completed X, now working on Y"
})

# Pause for break
projectpulse_agent_session_update({
  sessionId: "abc123...",
  status: "PAUSED",
  progress: "Pausing for lunch. Next: finish Y"
})

# Resume after break
projectpulse_context_load(projectId: {{PROJECT_ID}})
→ Returns: PAUSED session found!

projectpulse_agent_session_resume({sessionId: "abc123..."})
→ Returns: full plan, todos, progress

# End when done
projectpulse_agent_session_end({
  sessionId: "abc123...",
  progress: "Session complete. Feature X implemented and tested."
})
→ Auto-syncs to memory banks
```

---

## Knowledge & Wiki

### Knowledge Items

Store and retrieve project knowledge (decisions, discoveries, solutions).

```
# Search for existing knowledge
projectpulse_knowledge_search({
  projectId: {{PROJECT_ID}},
  query: "authentication",
  mode: "hybrid"
})

# Get full knowledge item
projectpulse_knowledge_get({
  projectId: {{PROJECT_ID}},
  itemId: 123
})

# Store new knowledge
projectpulse_knowledge_create({
  projectId: {{PROJECT_ID}},
  title: "Authentication Decision: JWT vs Sessions",
  content: "## Decision\nWe chose JWT because...",
  category: "Architecture",
  tags: ["auth", "jwt", "decision"]
})
```

**When to Store Knowledge:**
- Important discoveries during development
- Decisions made that affect future work
- Solutions to recurring problems
- When user explicitly asks to remember something

**When to Retrieve Knowledge:**
- Before starting unfamiliar tasks
- When confused about project context
- Before making significant decisions
- **Proactively**: Search knowledge before asking user

### Wiki Pages

Access project documentation stored in wiki format.

```
# Search wiki
projectpulse_wiki_search({ query: "API reference" })

# Get wiki page by path
projectpulse_wiki_get({ path: "/guides/api-reference" })

# Create wiki page
projectpulse_wiki_create({
  title: "API Guidelines",
  path: "guides/api-guidelines",
  content: "## API Guidelines\n...",
  category: "guides"
})
```

---

## MCP Tools Reference

| Category | Tools |
|----------|-------|
| **Context** | `context_load`, `context_lookup`, `context_update` |
| **Sessions** | `agent_session_start`, `agent_session_update`, `agent_session_resume`, `agent_session_end` |
| **Tickets** | `ticket_create`, `ticket_search`, `ticket_update`, `ticket_setStatus`, `ticket_addComment`, `ticket_get`, `ticket_getChildren`, `ticket_getHierarchy`, `ticket_bulkCreate` |
| **Roadmap** | `roadmap_create`, `roadmap_delete`, `getCurrentPosition`, `getPhaseProgress`, `updateProgress`, `queryHierarchy` |
| **Knowledge** | `knowledge_create`, `knowledge_search`, `knowledge_get`, `knowledge_import`, `knowledge_export` |
| **Wiki** | `wiki_search`, `wiki_get`, `wiki_create`, `wiki_update` |
| **Resources** | `persona_list`, `persona_get`, `skill_list`, `skill_get`, `sop_list`, `sop_get` |
| **Workflows** | `workflow_list`, `workflow_start`, `workflow_executeStep`, `workflow_getStatus`, `workflow_pause`, `workflow_resume` |
| **Traceability** | `traceability_generate`, `traceability_validate_documents` |
| **Backlog** | `backlog_list`, `backlog_getBySprint` |

---

## Memory Banks

All 5 memory banks are loaded automatically via `context_load`.

| Bank | Content | Token Budget |
|------|---------|--------------|
| **PROJECT_BRIEF** | What we're building, goals, success criteria | 3K |
| **SYSTEM_PATTERNS** | Architecture patterns, coding conventions | 2K |
| **TECH_CONTEXT** | Technical stack, dependencies, constraints | 2K |
| **ACTIVE_CONTEXT** | Current focus, recent changes | 1K |
| **PROGRESS** | What's done, milestones, velocity | 2K |

```
# Load all banks at session start
projectpulse_context_load(projectId: {{PROJECT_ID}})
→ Returns: memoryBanks { projectBrief, systemPatterns, techContext, activeContext, progress }

# Load specific bank only (token-efficient)
projectpulse_context_lookup({
  projectId: {{PROJECT_ID}},
  bankType: "SYSTEM_PATTERNS"
})

# Update a bank (user-explicit only)
projectpulse_context_update({
  projectId: {{PROJECT_ID}},
  bankType: "PROGRESS",
  content: "## Latest Progress\n...",
  mode: "append"
})
```

**Auto-Sync**: PROGRESS and ACTIVE_CONTEXT banks are auto-updated when you call `session_end`.

---

## Daily Checklist

```markdown
- [ ] Loaded context via `context_load(projectId: {{PROJECT_ID}})`
- [ ] Resumed PAUSED session OR started new session
- [ ] Checked roadmap position (if using roadmap)
- [ ] Found tickets for current sprint/week
- [ ] Working on feature branch (not main/master)
```

---

## Dashboard

View all project resources, tickets, and progress:

**{{DASHBOARD_URL}}projects/{{PROJECT_ID}}**
