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
    content: `# Project Onboarding Workflow

ProjectPulse uses a 3-session onboarding process to configure AI-driven development for your project.

## Overview

| Session | Duration | Focus | Output |
|---------|----------|-------|--------|
| 1 | 60-90 min | Strategic Planning | Executive summary, 96 Q&A pairs |
| 2 | 30-60 min | Documentation | 15 industry-standard documents |
| 3 | 15-30 sec | AI Configuration | Personas, skills, roadmap |

## Session 1: Strategic Planning

**Goal**: Define what you're building and why.

**Process**:
1. AI interviews you across 10 phases (Product, Architecture, DevOps, etc.)
2. You answer 96 questions covering all aspects of your project
3. AI generates an executive summary

**MCP Tools for Agents**:
\`\`\`
# Start Session 1
projectpulse_onboarding_start({ sessionNumber: 1 })

# Get questions for current phase
projectpulse_onboarding_getQuestions({ sessionNumber: 1, phase: 1 })

# Save answers for a phase
projectpulse_onboarding_saveAnswers({
  sessionNumber: 1,
  phase: 1,
  answers: { "q1": "answer1", "q2": "answer2" }
})

# Generate executive summary (after all phases)
projectpulse_onboarding_generateSummary({ sessionNumber: 1 })

# Complete Session 1
projectpulse_onboarding_complete({ sessionNumber: 1 })
\`\`\`

**Tips for Best Results**:
- Be specific and detailed in answers
- Include technical constraints and preferences
- Mention integrations and dependencies
- Describe target users and use cases

## Session 2: Documentation Generation

**Goal**: Generate industry-standard documentation.

**Documents Generated** (15 total):

| Category | Documents |
|----------|-----------|
| Planning | PRD, SRS, Backlog, Project Plan, Budget |
| Architecture | System Design, Data Model, API Spec |
| Implementation | UI/UX, Security Plan, Testing Strategy |
| Operations | Infrastructure, Observability, Success Metrics |

**MCP Tools for Agents**:
\`\`\`
# Start Session 2
projectpulse_onboarding_start({ sessionNumber: 2 })

# Get prompt for a specific document
projectpulse_onboarding_getDocumentPrompt({ documentType: "PRD" })

# Store generated document
projectpulse_onboarding_storeDocument({
  documentType: "PRD",
  content: "# PRD\\n\\n..."
})

# Check progress
projectpulse_onboarding_getDocumentStatus()

# Complete Session 2 (after all 15 docs)
projectpulse_onboarding_complete({ sessionNumber: 2 })
\`\`\`

## Session 3: AI Workflow Bootstrap

**Goal**: Configure AI agents for your specific project.

**What Gets Created**:
- **Agent Personas**: Custom experts (React Expert, Prisma Expert, etc.)
- **Skills Library**: Reusable code patterns and conventions
- **Workflows**: Standard operating procedures
- **SOPs**: Step-by-step guides for common tasks
- **Roadmap**: Materialized Phase/Week/Day hierarchy from Project Plan

**MCP Tools for Agents**:
\`\`\`
# Start Session 3 (one-shot bootstrap)
projectpulse_onboarding_start({ sessionNumber: 3 })

# Bootstrap creates everything automatically
# Wait for completion confirmation

# Verify bootstrap results
projectpulse_persona_list({ projectId: YOUR_ID })
projectpulse_skill_list({ projectId: YOUR_ID })
\`\`\`

## Starting Onboarding

### For Agents (Recommended)

\`\`\`
# 1. Load context first
response = projectpulse_context_load({ projectId: YOUR_ID })

# 2. Check onboardingStatus in response
# If not complete, follow hints to start onboarding

# 3. Start appropriate session
projectpulse_onboarding_start({ sessionNumber: 1 })
\`\`\`

### For Users (Web UI)

Navigate to: **Project Dashboard → Onboarding Tab → Start Session 1**

## After Onboarding

Once all 3 sessions are complete:
1. \`projectpulse_context_load\` will show "onboarding complete"
2. Agents can start work sessions with \`projectpulse_agent_session_start\`
3. Memory banks are populated with project context
4. Personas and skills are available for specialized guidance
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
 * Clones wiki templates from the System Project to a new User Project.
 * Handles path namespacing to ensure global uniqueness.
 */
export async function cloneWikiTemplates(targetProjectId: number, targetProjectName: string) {
  try {
    const systemProject = await ensureSystemProject();

    if (!systemProject || systemProject.wikiPages.length === 0) {
      console.warn('⚠️ System Project not ready or empty. Skipping wiki cloning.');
      return;
    }

    const targetSlug = targetProjectName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newPages = systemProject.wikiPages.map((page) => {
      // Transform path: /system-wiki-templates/foo -> /my-new-project/foo
      // We replace the first path segment (the system slug) with the new project slug
      const newPath = page.path.replace(/^\/[^\/]+/, `/${targetSlug}`);

      return {
        projectId: targetProjectId,
        title: page.title,
        category: page.category,
        path: newPath,
        content: page.content,
        excerpt: page.excerpt,
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
