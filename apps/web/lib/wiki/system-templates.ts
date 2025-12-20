import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const SYSTEM_PROJECT_NAME = 'System Wiki Templates';
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
If you want CLAUDE.md and AGENTS.md in your repository:
- Use your AI's file write tools
- Reference the personas created in Session 3
- Follow your project's conventions

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

Guidelines for AI-assisted development with ProjectPulse.

## Git Workflow

- **Main Branch**: \`master\` (protected)
- **Feature Branches**: \`feature/ticket-id-description\`
- **Commits**: Semantic format (\`feat:\`, \`fix:\`, \`chore:\`, etc.)

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
  ticketIds: ["TICKET-123"]
})
# Returns: sessionId for tracking
\`\`\`

### During Development

| Action | MCP Tool | When to Use |
|--------|----------|-------------|
| Create issue | \`projectpulse_ticket_create\` | Found bug, need feature |
| Log progress | \`projectpulse_agent_session_update\` | Every 15-20 minutes |
| Search docs | \`projectpulse_wiki_search\` | Need reference info |
| Add knowledge | \`projectpulse_knowledge_create\` | Discovered pattern/solution |
| Get persona | \`projectpulse_persona_get\` | Need specialized guidance |
| Load skill | \`projectpulse_skill_get\` | Need code pattern |

### Checkpoints (Critical)

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

### Ending a Session

\`\`\`
projectpulse_agent_session_end({
  sessionId: "...",
  summary: "Completed user login form with validation",
  completedTicketIds: ["TICKET-123"]
})
# Auto-syncs PROGRESS and ACTIVE_CONTEXT memory banks
\`\`\`

## Using Agent Personas

Select the right specialist for the task:

\`\`\`
# List available personas
projectpulse_persona_list({ projectId: YOUR_ID })

# Load specific persona guidance
projectpulse_persona_get({ personaId: "react-expert" })
\`\`\`

**Common Personas** (after onboarding):
- **React Expert**: Component design, hooks, state management
- **Next.js Expert**: App Router, Server Components, data fetching
- **Prisma Expert**: Schema design, migrations, query optimization
- **Testing Expert**: Jest, Playwright, test strategies

## Using Skills

Skills are token-efficient code patterns:

\`\`\`
# List skills by category
projectpulse_skill_list({ projectId: YOUR_ID, category: "api" })

# Load full skill content
projectpulse_skill_get({ skillId: "api-endpoint-pattern" })
\`\`\`

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

## Context Recovery

If your agent loses context (session reset, compaction):

\`\`\`
# Reload everything
projectpulse_context_load({ projectId: YOUR_ID })

# Check for active session
# If found, resume work on existing todos
# If not, start new session
\`\`\`

## System Pages

Pages marked "System" (like this one) are defaults from templates. You can:
- Edit them to fit your project
- Refresh them via **Settings → Wiki Templates** if templates improve
`,
  },
];

/**
 * Ensures the System Template Project exists and is populated.
 * Implements the "Prototype Pattern" - this project serves as the master copy.
 */
async function ensureSystemProject() {
  // 1. Try to find existing system project
  let systemProject = await prisma.project.findUnique({
    where: { name: SYSTEM_PROJECT_NAME },
    include: { wikiPages: true },
  });

  // 2. If exists, return it
  if (systemProject) {
    // Optional: Check if we need to re-seed missing default pages (idempotency)
    // For now, we assume if it exists, the admin is managing it.
    return systemProject;
  }

  console.log('🛠️ Bootstrapping System Wiki Templates project...');

  // 3. Create System Project
  // We need an owner. We'll pick the first admin user or the user creating the current project.
  // For bootstrapping, we'll try to find *any* user to assign ownership to.
  const adminUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });

  if (!adminUser) {
    console.warn('⚠️ No users found. Cannot bootstrap System Project yet.');
    return null;
  }

  systemProject = await prisma.project.create({
    data: {
      name: SYSTEM_PROJECT_NAME,
      description: 'Master templates for default project documentation. Edit these pages to update defaults for new projects.',
      ownerId: adminUser.id,
      repository: '', // No repo needed
    },
    include: { wikiPages: true },
  });

  // 4. Seed Initial Templates
  console.log('📄 Seeding default wiki templates...');
  await prisma.wikiPage.createMany({
    data: INITIAL_TEMPLATES.map((t) => ({
      projectId: systemProject!.id,
      title: t.title,
      path: t.path,
      category: t.category,
      content: t.content,
      autoGenerated: true, // Mark as system content
      version: 1,
      lastEditedBy: 'System Bootstrap',
    })),
    skipDuplicates: true,
  });

  // Return refreshed project with pages
  return prisma.project.findUnique({
    where: { id: systemProject.id },
    include: { wikiPages: true },
  });
}

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
      const newPath = template.path.replace(/^\/[^\/]+/, `/${targetSlug}`);

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
