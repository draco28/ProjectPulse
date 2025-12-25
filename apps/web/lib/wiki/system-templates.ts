import { prisma } from '@/lib/prisma';

const SYSTEM_PROJECT_SLUG = 'system-wiki-templates';

// Initial Bootstrap Content - Production Ready (Updated 2025-12-17)
// Exported for use by wiki refresh API
export const INITIAL_TEMPLATES = [
  {
    title: 'MCP Configuration Guide',
    path: `/${SYSTEM_PROJECT_SLUG}/mcp-configuration`,
    category: 'getting-started',
    content: `# MCP Configuration Guide

Connect your AI agents to ProjectPulse using the Model Context Protocol (MCP).

## Prerequisites

- An active ProjectPulse project
- Agent token (generated in Settings → Agent Tokens)

## Step 1: Generate Your Agent Token

1. Navigate to **Settings** → **Agent Tokens**
2. Click **"Generate New Token"**
3. Name it descriptively (e.g., "Claude-Code-Main", "Windsurf-Dev")
4. **Copy immediately** - tokens are shown only once!

## Step 2: Configure Your AI Agent

### Claude Code

Edit \`~/.claude/settings.json\`:

\`\`\`json
{
  "mcpServers": {
    "projectpulse": {
      "type": "http",
      "url": "https://projectpulsemcp.dracodev.dev/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
      }
    }
  }
}
\`\`\`

### Windsurf

Edit \`~/.codeium/windsurf/mcp_config.json\`:

\`\`\`json
{
  "mcpServers": {
    "projectpulse": {
      "serverUrl": "https://projectpulsemcp.dracodev.dev/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
      }
    }
  }
}
\`\`\`

### Cursor

Go to **Settings → MCP → Add Server**:
- **Name**: projectpulse
- **Type**: HTTP
- **URL**: \`https://projectpulsemcp.dracodev.dev/mcp\`
- **Headers**: \`Authorization: Bearer YOUR_TOKEN_HERE\`

## Step 3: Verify Connection

Ask your agent to run the health check:

\`\`\`
Use the projectpulse_health_check tool
\`\`\`

**Expected Response**:
\`\`\`json
{"status": "healthy", "database": "connected", "toolCount": 73}
\`\`\`

## Step 4: Load Project Context

After connecting, your agent should call:

\`\`\`
projectpulse_context_load({ projectId: YOUR_PROJECT_ID })
\`\`\`

This loads memory banks, checks onboarding status, and provides workflow hints.

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid or expired token | Generate a new token in Settings |
| 403 Forbidden | Token revoked | Check token status, generate new one |
| Connection refused | Network issue | Check internet connection |
| Timeout | Server restarting | Wait 30 seconds, retry |

## Security Best Practices

- **One token per agent** - Makes revocation granular
- **Rotate tokens** - Regenerate every 90 days
- **Revoke on compromise** - Immediate action in Settings → Agent Tokens
- **Never commit tokens** - Use environment variables or secure storage
`,
  },
  {
    title: 'Getting Started with ProjectPulse',
    path: `/${SYSTEM_PROJECT_SLUG}/getting-started`,
    category: 'getting-started',
    content: `# Getting Started with ProjectPulse

Welcome! ProjectPulse is your AI-powered project management system designed for seamless agent integration.

## What is ProjectPulse?

ProjectPulse provides:
- **Sprint Tracking**: 5-level hierarchy (Phase → Week → Day → Task → Session)
- **MCP Integration**: 73+ tools for AI agents to read/write project data
- **Knowledge Base**: Semantic search across documentation and code patterns
- **Issue Tracking**: Full-featured ticketing with AI auto-categorization

## Quick Start Checklist

### ✅ Step 1: Configure MCP Connection

See [[MCP Configuration Guide]] for detailed setup:
1. Generate agent token in Settings
2. Add MCP config to your agent (Claude Code, Windsurf, or Cursor)
3. Verify with \`projectpulse_health_check\`

### ✅ Step 2: Complete Onboarding (New Projects)

For new projects, your agent should complete 3 onboarding sessions:

\`\`\`
# First, load context to check status
projectpulse_context_load({ projectId: YOUR_ID })

# The hints will tell you to start onboarding:
projectpulse_onboarding_start({ sessionNumber: 1 })
\`\`\`

See [[Onboarding Guide]] for details on each session.

### ✅ Step 3: Start Working (After Onboarding)

When starting work, your agent should:

\`\`\`
1. projectpulse_context_load({ projectId: YOUR_ID })
   → Loads memory banks, active session, workflow hints

2. projectpulse_agent_session_start({ projectId: YOUR_ID, name: "Feature X" })
   → Creates work session for tracking

3. [Do your work...]

4. projectpulse_agent_session_end({ sessionId: "...", summary: "..." })
   → Saves progress, auto-syncs memory banks
\`\`\`

## Core Features

### Sprint Hierarchy
Track work at 5 levels:
- **Phase**: Major milestones (e.g., "MVP Launch")
- **Week**: Weekly goals and focus
- **Day**: Daily tasks and priorities
- **Task**: Specific work items
- **Session**: Granular work units with AI checkpoints

### Issue Tracking
Manage bugs and features with rich context:
- Link issues to wiki pages, knowledge items, and code
- Auto-categorization with AI tagging
- Bulk operations for efficient management

### Knowledge Base
- **Wiki**: Hierarchical documentation (like this page)
- **Knowledge Graph**: Semantic search for patterns and solutions
- **Memory Banks**: Token-efficient context for agents

## Navigation Tips

- **Cmd/Ctrl+K**: Command palette for quick navigation
- **Dashboard**: Your daily command center
- **Wiki**: Project documentation hub
- **Issues**: Bug and feature tracking

## Next Steps

1. Complete [[Onboarding Guide]] to set up your project
2. Configure MCP with [[MCP Configuration Guide]]
3. Review [[Development Workflow]] for team conventions
`,
  },
  {
    title: 'Onboarding Guide',
    path: `/${SYSTEM_PROJECT_SLUG}/onboarding-guide`,
    category: 'guides',
    content: `# Onboarding Guide

## Overview

ProjectPulse uses a 3-session onboarding process followed by post-onboarding setup.

| Session | Focus | Output |
|---------|-------|--------|
| 1 | Strategic Planning | Executive summary, 96 Q&A pairs |
| 2 | Documentation | 15 industry-standard documents |
| 3 | AI Workflow Setup | Personas, skills, workflows, SOPs |
| Post | Traceability + Roadmap | Validated coverage, materialized roadmap |

---

## Session 1: Strategic Planning

### Step-by-Step Flow
1. \`projectpulse_onboarding_getPhasedQuestions({ phase: 1 })\` - Get questions
2. Ask user the questions from phase
3. \`projectpulse_onboarding_savePhase({ phase: 1, answers: {...} })\` - Save
4. Repeat for phases 2-10
5. Session auto-completes after phase 10

### Tools Used
- \`projectpulse_onboarding_getPhasedQuestions\` - Get questions for a phase
- \`projectpulse_onboarding_savePhase\` - Save phase answers

---

## Session 2: Document Generation

### Step-by-Step Flow
1. \`projectpulse_onboarding_getDocBatchPrompt({ batch: 1 })\` - Get prompts
2. Generate documents using YOUR AI provider
3. \`projectpulse_onboarding_storeBatch({ batch: 1, documents: [...] })\` - Store
4. Repeat for batches 2-4
5. Session auto-completes at 15 documents

### Batch Structure
| Batch | Documents |
|-------|-----------|
| 1 | PRD, SRS, Backlog, Project-Plan |
| 2 | Architecture, Data-Model, API-Spec |
| 3 | UI-UX, Security, Testing |
| 4 | Deployment, Observability, Performance, Team-Onboarding, Maintenance |

### Tools Used
- \`projectpulse_onboarding_getDocBatchPrompt\` - Get batch prompts with context
- \`projectpulse_onboarding_storeBatch\` - Store generated documents
- \`projectpulse_onboarding_listDocuments\` - Check progress

---

## Session 3: AI Workflow Setup

### Step-by-Step Flow
1. \`projectpulse_batch_createAgentPersonas({ personas: [...] })\` - Create 1-10 personas
2. [Optional] \`projectpulse_batch_createSkills({ skills: [...] })\` - Create skills
3. [Optional] \`projectpulse_batch_createWorkflowTemplates({ workflows: [...] })\` - Create workflows
4. [Optional] \`projectpulse_batch_createSOPs({ sops: [...] })\` - Create SOPs
5. \`projectpulse_onboarding_syncSession3()\` - Mark session complete

### What Each Tool Creates
- **Personas**: Custom AI experts (React Expert, Prisma Expert, etc.)
- **Skills**: Reusable code patterns and conventions
- **Workflows**: Step-by-step development procedures
- **SOPs**: Standard operating procedures for common tasks

### Tools Used
- \`projectpulse_batch_createAgentPersonas\` - Bulk create personas
- \`projectpulse_batch_createSkills\` - Bulk create skills
- \`projectpulse_batch_createWorkflowTemplates\` - Bulk create workflows
- \`projectpulse_batch_createSOPs\` - Bulk create SOPs
- \`projectpulse_onboarding_syncSession3\` - Mark onboarding complete

---

## Post-Onboarding Setup

After all 3 sessions complete, run these steps:

### Step 1: Validate Traceability & Populate Backlog
\`\`\`
projectpulse_traceability_validate_documents()
\`\`\`
- Validates SRS→Backlog→Project-Plan coverage
- Identifies gaps (untraced requirements, unmapped features)
- **Stores backlog items in database** (enables sprint queries)
- Creates gap analysis as Knowledge Item

### Step 1b: Query Backlog Items

After traceability validation, you can query backlog items:

**Get features for a specific sprint:**
\`\`\`
projectpulse_backlog_getBySprint({ projectId: YOUR_ID, sprintNumber: 1 })
\`\`\`
- Returns items with itemId, title, epicRef, frTraces
- Use when starting work on a sprint
- Data ready for \`projectpulse_ticket_create()\`

**View all backlogs across all sprints:**
\`\`\`
projectpulse_backlog_list({ projectId: YOUR_ID })
\`\`\`
- Returns items grouped by sprint
- Shows unassigned items
- Use for product backlog overview
- Optional: filter by epicRef

### Step 2: Create Roadmap
\`\`\`
projectpulse_roadmap_create({
  projectId: YOUR_ID,
  title: "Project Roadmap",
  materialize: true,
  phases: [...] // From Project-Plan document
})
\`\`\`
- Parses 13-Project-Plan.md structure
- Creates Phase → Sprint → Week → Day hierarchy
- Enables progress tracking

### Step 3: [Optional] Generate Repo Files
Generate CLAUDE.md and AGENTS.md workflow guides for your repository:

\`\`\`
projectpulse_repo_writeMinimal({
  projectId: YOUR_ID,
  repoPath: "/absolute/path/to/your/repo"
})
\`\`\`

This creates:
- **CLAUDE.md**: AI workflow guide with daily routines, ticket handling, session lifecycle
- **AGENTS.md**: Resource catalog listing your personas, skills, SOPs

Files are pre-populated with your project's actual data from Session 3.

---

## Starting Development

After post-onboarding setup, your agent workflow is:

1. \`projectpulse_context_load({ projectId: YOUR_ID })\` - Load context + hints
2. \`projectpulse_agent_session_start({ name: "Feature X" })\` - Start work session
3. [Do your development work]
4. \`projectpulse_agent_session_end({ summary: "..." })\` - End session

See [[Development Workflow]] for detailed development patterns.
`,
  },
  {
    title: 'Development Workflow',
    path: `/${SYSTEM_PROJECT_SLUG}/development-workflow`,
    category: 'guides',
    content: `# Development Workflow

Comprehensive guide for AI-assisted development with ProjectPulse.

## Post-Onboarding Setup

After completing Sessions 1-3, run these steps to start development:

### Step 1: Validate Traceability
\`\`\`
projectpulse_traceability_validate_documents()
\`\`\`
- Validates PRD → SRS → Backlog → Project Plan coverage
- Populates BacklogItem table for sprint queries
- Creates coverage report as Knowledge Item

### Step 2: Create Roadmap
\`\`\`
projectpulse_roadmap_create({
  projectId: YOUR_ID,
  title: "Project Roadmap",
  startDate: "2025-01-01",
  materialize: true,
  phases: [...] // From 13-Project-Plan.md
})
\`\`\`
- Creates Phase → Sprint → Week → Day hierarchy
- Enables progress tracking via MCP tools

### Step 3: Query Sprint Backlog
\`\`\`
projectpulse_backlog_getBySprint({ projectId: YOUR_ID, sprintNumber: 1 })
\`\`\`
- Returns user stories with frTraces, epicRef
- Use backlog items to create tickets

---

## Daily Development Workflow

### Morning Routine
\`\`\`
# 1. Load context and check for paused work
projectpulse_context_load({ projectId: YOUR_ID })

# 2. Know where you are in the roadmap
projectpulse_sprint_getCurrentPosition({ projectId: YOUR_ID })

# 3. Find work for your sprint
projectpulse_ticket_search({ sprintNumber: 1, status: ["open"] })
\`\`\`

### During Work
\`\`\`
# Start tracking (if not resuming)
projectpulse_agent_session_start({ name: "Feature X", ticketIds: [123] })

# Checkpoint every 15K tokens
projectpulse_agent_session_update({ progress: "Completed X, working on Y" })

# Claim tickets you're working on
projectpulse_ticket_update({ ticketId: 123, status: "in-progress" })
\`\`\`

### End of Day
\`\`\`
# Update roadmap progress (cascades to parent entities)
projectpulse_sprint_updateProgress({ entityType: "day", entityId: "...", progress: 75 })

# PAUSE session (NOT end!) - preserves context for next day
projectpulse_agent_session_update({ sessionId: "...", status: "PAUSED" })
\`\`\`

---

## Ticket Lifecycle

| Step | Tool | Description |
|------|------|-------------|
| Search | \`ticket_search\` | Find existing tickets for your sprint |
| Create | \`ticket_create\` | From backlog items with backlogRefs |
| Claim | \`ticket_update\` | Set status: "in-progress", assignee |
| Work | \`ticket_addComment\` | Log progress, decisions |
| Test | - | Verify implementation works |
| Close | \`ticket_setStatus\` | Set status: "closed" AFTER testing |

**⚠️ Never close tickets until testing is complete!**

### Creating Tickets from Backlog
\`\`\`
projectpulse_ticket_create({
  title: "Implement user auth",
  kind: "feature",
  source: "agent",
  sprintNumber: 1,
  backlogRefs: ["US-001", "US-002"], // From backlog_getBySprint
  epicRef: "Epic 1: User Management"
})
\`\`\`

---

## Roadmap & Progress Tracking

| Tool | When to Use |
|------|-------------|
| \`sprint_getCurrentPosition\` | Start of day - know where you are |
| \`sprint_updateProgress\` | End of day - update day/week progress |
| \`sprint_queryHierarchy\` | Find blocked items, low-progress work |
| \`roadmap_getPhaseProgress\` | See full phase with nested entities |

**Progress cascades automatically**: Day → Week → Sprint → Phase

---

## Git Workflow

- **Main Branch**: \`master\` (protected)
- **Feature Branches**: \`feature/ticket-id-description\`
- **Commits**: Semantic format (\`feat:\`, \`fix:\`, \`chore:\`, etc.)

---

## Session Lifecycle

### Starting a Work Session
\`\`\`
# 1. Load project context
projectpulse_context_load({ projectId: YOUR_ID })
# Returns: memory banks, active session, workflow hints

# 2. Start tracking your work
projectpulse_agent_session_start({
  projectId: YOUR_ID,
  name: "Implementing user auth",
  ticketIds: [123, 124]
})
\`\`\`

### PAUSED vs COMPLETED Sessions

| Use PAUSED for | Use COMPLETED for |
|----------------|-------------------|
| Lunch break | Feature fully done |
| End of day | Ready for next feature |
| Switching tasks temporarily | All tests passing |
| Context compaction imminent | PR merged |

**⚠️ COMPLETED sessions cannot be resumed. Use PAUSED for breaks!**

### Ending a Session
\`\`\`
# Only when work is TRULY complete
projectpulse_agent_session_end({
  sessionId: "...",
  summary: "Completed user login with validation"
})
# Auto-syncs PROGRESS and ACTIVE_CONTEXT memory banks
\`\`\`

---

## Checkpoints (Critical)

**Why**: Prevents context loss when AI sessions reset.

\`\`\`
projectpulse_agent_session_update({
  sessionId: "...",
  progress: "Implemented login form, working on validation",
  todos: [
    { content: "Add password validation", status: "in_progress" },
    { content: "Connect to auth API", status: "pending" }
  ]
})
\`\`\`

**Frequency**: Every 15K tokens or ~20 minutes of work.

---

## Using Agent Personas

Select the right specialist for the task:

\`\`\`
# List available personas
projectpulse_persona_list({ projectId: YOUR_ID })

# Load specific persona guidance
projectpulse_persona_get({ slug: "react-expert" })
\`\`\`

**Common Personas** (after onboarding):
- **React Expert**: Component design, hooks, state management
- **Next.js Expert**: App Router, Server Components, data fetching
- **Prisma Expert**: Schema design, migrations, query optimization
- **Testing Expert**: Jest, Playwright, test strategies

---

## Using Skills

Skills are token-efficient code patterns:

\`\`\`
# List skills by category
projectpulse_skill_list({ projectId: YOUR_ID, category: "api" })

# Load full skill content
projectpulse_skill_get({ slug: "api-endpoint-pattern" })
\`\`\`

---

## Using SOPs

Standard Operating Procedures for common tasks:

\`\`\`
# List available procedures
projectpulse_sop_list({ projectId: YOUR_ID })

# Load specific procedure
projectpulse_sop_get({ slug: "git-workflow" })
\`\`\`

SOPs contain step-by-step checklists generated during onboarding Session 3.

---

## Using Workflow Templates

Pre-built development workflows:

\`\`\`
# List available workflows
projectpulse_workflow_list({ category: "development" })

# Start a workflow
projectpulse_workflow_start({ templateId: 1, projectId: YOUR_ID })

# Execute next step
projectpulse_workflow_executeStep({ runId: 123 })

# Check progress
projectpulse_workflow_getStatus({ runId: 123 })
\`\`\`

**Available templates**: Feature Development, Bug Fix, Refactoring, Code Review, etc.

---

## Knowledge Management

### Search BEFORE Asking
\`\`\`
projectpulse_knowledge_search({ projectId: YOUR_ID, query: "auth pattern" })
\`\`\`
Always check if an answer exists before asking the user!

### Find Related Knowledge
\`\`\`
projectpulse_knowledge_related({ projectId: YOUR_ID, itemId: 5 })
\`\`\`
Discovers connected topics via graph traversal.

### Store Discoveries
\`\`\`
projectpulse_knowledge_create({
  projectId: YOUR_ID,
  title: "JWT Auth Pattern",
  content: "...",
  category: "Architecture",
  tags: ["auth", "jwt", "pattern"]
})
\`\`\`
Save patterns, decisions, and solutions for future reference.

---

## Wiki Documentation

**When to Write**:
- Architectural decisions
- API design choices
- Bug root cause analysis
- Reusable patterns

**MCP Tool**:
\`\`\`
projectpulse_wiki_create({
  projectId: YOUR_ID,
  title: "Auth Flow Decision",
  category: "architecture",
  content: "# Auth Flow\\n\\nWe chose JWT because..."
})
\`\`\`

---

## Context Recovery

If your agent loses context (session reset, compaction):

\`\`\`
# Reload everything
projectpulse_context_load({ projectId: YOUR_ID })

# Check for active/paused session
# If PAUSED session found: Resume it
projectpulse_agent_session_resume({ sessionId: "..." })

# If no session: Start new one
projectpulse_agent_session_start({ name: "..." })
\`\`\`

---

## System Pages

Pages marked "System" (like this one) are defaults from templates. You can:
- Edit them to fit your project
- Refresh them via **Settings → Wiki Templates** if templates improve
`,
  },
];

/**
 * Clones wiki templates from INITIAL_TEMPLATES to a new User Project.
 * Sprint 14: Use INITIAL_TEMPLATES directly instead of System Project DB records
 * to ensure new projects always get the latest wiki content (Ticket #22).
 * Handles path namespacing to ensure global uniqueness.
 */
export async function cloneWikiTemplates(targetProjectId: number, targetProjectName: string) {
  try {
    if (INITIAL_TEMPLATES.length === 0) {
      console.warn('⚠️ No wiki templates defined. Skipping wiki cloning.');
      return;
    }

    const targetSlug = targetProjectName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Sprint 14: Map directly from INITIAL_TEMPLATES instead of System Project DB
    // This ensures new projects always get the latest wiki content
    const newPages = INITIAL_TEMPLATES.map((template) => {
      // Transform path: /system-wiki-templates/foo -> /my-new-project/foo
      const newPath = template.path.replace(/^\/[^/]+/, `/${targetSlug}`);

      return {
        projectId: targetProjectId,
        title: template.title,
        category: template.category,
        path: newPath,
        content: template.content,
        autoGenerated: true, // Mark as system-derived
        version: 1,
        lastEditedBy: 'System Clone',
      };
    });

    console.log(`🔄 Cloning ${newPages.length} wiki pages to project ${targetProjectId}...`);

    await prisma.wikiPage.createMany({
      data: newPages,
      skipDuplicates: true, // Safety net against collisions
    });

    console.log('✅ Wiki cloning complete.');
  } catch (error) {
    console.error('❌ Wiki cloning failed:', error);
    // We do NOT throw here. Project creation should succeed even if wiki seeding fails.
  }
}
