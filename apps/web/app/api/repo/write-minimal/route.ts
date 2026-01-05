/**
 * POST /api/repo/write-minimal
 *
 * Sprint 9 Refactor: Optional write claude.md and agents.md to user repository
 * Sprint 11: Enhanced with dynamic persona/skill/SOP data from database
 * Sprint 14: Comprehensive workflow templates with production URLs
 *
 * Only writes if explicitly requested - keeps repos clean by default
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_MCP_URL = 'https://projectpulsemcp.dracodev.dev/mcp';
const DEFAULT_DASHBOARD_URL = 'https://projectpulse.dracodev.dev/';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const requestSchema = z.object({
  projectId: z.number().int().positive(),
  repoPath: z.string().min(1).max(500),
  mcpUrl: z.string().url().optional(),
  dashboardUrl: z.string().url().optional(),
  // Sprint 14: Add dryRun to support Docker environments where API can't write to host paths
  // When true (default), returns generated content for agent to write using its own tools
  dryRun: z.boolean().optional().default(true),
});

type WriteMinimalRequest = z.infer<typeof requestSchema>;

// ============================================================================
// TEMPLATE GENERATORS (Sprint 14 Enhanced)
// ============================================================================

interface ProjectData {
  projectId: number;
  projectName: string;
  mcpUrl: string;
  dashboardUrl: string;
  personas: Array<{
    name: string;
    slug: string;
    icon?: string | null;
    description?: string | null;
    expertise: string[];
  }>;
  skills: Array<{ title: string; slug: string; category: string; description?: string | null }>;
  sops: Array<{ title: string; slug: string; category: string; description?: string | null }>;
}

function generateClaudeMd(data: ProjectData): string {
  const personaSection =
    data.personas.length > 0
      ? data.personas
          .map(
            (p) =>
              `| ${p.name} | \`${p.slug}\` | ${p.expertise?.join(', ') || 'General'} |`
          )
          .join('\n')
      : '| *(No personas configured yet)* | | |';

  return `# ${data.projectName} - AI Workflow Guide

**Project ID**: ${data.projectId}
**MCP Server**: ${data.mcpUrl}
**Dashboard**: ${data.dashboardUrl}

---

## Quick Start

Just chat naturally with me (Claude Code / Windsurf / Droid):

\`\`\`
"Implement the user authentication feature"
"Fix the bug in the search API"
"Add tests for the payment module"
\`\`\`

---

## CRITICAL: Start Every Session Here

### Step 1: Load Context

\`\`\`
projectpulse_context_load(projectId: ${data.projectId})
\`\`\`

This returns:
- All 5 memory banks (project brief, patterns, tech context, active focus, progress)
- Active sessions (check if PAUSED work exists)
- Available resources (personas, skills, SOPs)
- Workflow hints

**If PAUSED session found:** Resume with \`projectpulse_agent_session_resume(sessionId)\`
**If no session:** Start new with \`projectpulse_agent_session_start()\`

---

## Daily Workflow

### Morning: Start Work

\`\`\`
Step 1: Load context
─────────────────────
projectpulse_context_load(projectId: ${data.projectId})
→ Returns: memory banks, active sessions, available resources

Step 2: Check roadmap position (if using roadmap)
─────────────────────────────────────────────────
projectpulse_sprint_getCurrentPosition(projectId: ${data.projectId})
→ Returns: phase/sprint with progress

Step 3: Find "todo" tickets to work on (Sprint 16)
──────────────────────────────────────────────────
projectpulse_ticket_search({
  sprintNumber: 1,
  status: ["todo"]  // Only "todo" tickets can be claimed
})
→ Returns: Tickets ready to be claimed by session

Step 4: Start session WITH tickets (Sprint 16: auto-claims)
───────────────────────────────────────────────────────────
projectpulse_agent_session_start({
  projectId: ${data.projectId},
  name: "Sprint 1 - Feature Implementation",
  activeTicketIds: [42, 43],  // MUST be "todo" status
  plan: "## Today's Plan\\n1. Complete API endpoint\\n2. Write tests",
  todos: [
    {content: "Complete API endpoint", status: "pending"},
    {content: "Write tests", status: "pending"}
  ]
})
→ System: tickets move to "in-progress", assignee="Claude Code"
\`\`\`

### During Work

\`\`\`
1. Work on code → (your normal coding flow - tickets already claimed by session_start)
2. Checkpoint every 15K tokens → agent_session_update({ progress: "..." })
3. Add comments → ticket_addComment({ ticketId: 42, content: "Implemented X, Y, Z" })
\`\`\`

Note: Tickets were auto-claimed when session started. Don't manually change status.

### End of Day

\`\`\`
Option A: Session complete → tickets go to in-review for user verification
──────────────────────────────────────────────────────────────────────────
projectpulse_agent_session_end({
  sessionId: "...",
  progress: "Completed API endpoint and tests"
})
→ System: linked tickets auto-move to "in-review"
→ User can verify and drag "in-review" → "done" in Kanban

Option B: Taking a break → tickets stay in-progress
──────────────────────────────────────────────────
projectpulse_agent_session_update({
  sessionId: "...",
  status: "PAUSED"
})
→ Tickets stay in "in-progress", can resume tomorrow
\`\`\`

### Kanban Drag Rules (Sprint 16)

| User CAN Drag | User CANNOT Drag |
|---------------|------------------|
| backlog → todo | todo → in-progress |
| in-review → done | in-progress → anywhere |

**Why?** Agent sessions control the middle columns to ensure proper work tracking.

---

## Loading Project Resources (via MCP)

### Personas (Expert Roles)

\`\`\`
# List available personas
projectpulse_persona_list(projectId: ${data.projectId})

# Load a specific persona
projectpulse_persona_get(projectId: ${data.projectId}, slug: "backend-developer")
\`\`\`

### Skills (Coding Patterns)

\`\`\`
# List available skills
projectpulse_skill_list(projectId: ${data.projectId}, category: "framework")

# Load a skill
projectpulse_skill_get(projectId: ${data.projectId}, slug: "react-hooks-patterns")
\`\`\`

### SOPs (Procedures)

\`\`\`
# List available SOPs
projectpulse_sop_list(projectId: ${data.projectId}, category: "Development")

# Load an SOP
projectpulse_sop_get(projectId: ${data.projectId}, slug: "git-workflow")
\`\`\`

---

## Available Personas

| Persona | Slug | Expertise |
|---------|------|-----------|
${personaSection}

---

## Roadmap Workflow (Optional)

**Use roadmap for multi-week projects with phases. Skip for single fixes.**

### When to Use Roadmap

- ✅ Greenfield projects with timeline structure
- ✅ Multi-sprint initiatives
- ❌ Single bug fixes (just use tickets)
- ❌ Small improvements (tickets-only is fine)

### Roadmap Tools

| Tool | When to Use |
|------|-------------|
| \`roadmap_create\` | Once per project, after onboarding |
| \`getCurrentPosition\` | Start of each work day |
| \`getPhaseProgress\` | See full phase tree |
| \`kanban_moveTicket\` | Move tickets across columns (auto-cascades progress) |
| \`kanban_getBoard\` | Get sprint's Kanban board with all tickets |

### Ticket Scheduling

\`\`\`
projectpulse_ticket_create({
  projectId: ${data.projectId},
  title: "Implement feature X",
  kind: "feature",
  sprintNumber: 1,    // Sprint for Kanban board
  estimatedDays: 2    // Estimated duration
})
\`\`\`

---

## Ticket Workflow

### Ticket Kinds

| User Says | Ticket Kind |
|-----------|-------------|
| "Add feature X" | \`feature\` |
| "Do X", "Set up X" | \`task\` |
| "X is broken" | \`bug\` |
| "X needs refactoring" | \`tech_debt\` |
| "Concerned about X" | \`issue\` |

### Complete Workflow (6 steps)

| Step | Action | MCP Tool |
|------|--------|----------|
| 1 | Create ticket | \`ticket_create\` |
| 2 | Add plan | \`ticket_update({ customFields: { _implementationContext: {...} } })\` |
| 3 | Claim ticket | \`ticket_update({ status: "in-progress" })\` |
| 4 | Implement | (code tools) |
| 5 | Add comment | \`ticket_addComment("Implemented X, Y, Z")\` |
| 6 | Close after testing | \`ticket_setStatus("closed")\` |

---

## Agent Session Lifecycle

### Session States

| Status | Use For |
|--------|---------|
| \`IN_PROGRESS\` | Actively working |
| \`PAUSED\` | Breaks, EOD, context compaction |
| \`COMPLETED\` | Work fully done (CANNOT resume!) |

**CRITICAL**: COMPLETED sessions CANNOT be resumed. Use PAUSED for breaks!

---

## Knowledge & Wiki

### Knowledge Items

\`\`\`
# Search for existing knowledge
projectpulse_knowledge_search(projectId: ${data.projectId}, query: "authentication")

# Store new knowledge
projectpulse_knowledge_create(projectId: ${data.projectId}, title: "...", content: "...", category: "...")
\`\`\`

### Wiki Pages

\`\`\`
# Search wiki
projectpulse_wiki_search(query: "API reference")

# Get wiki page
projectpulse_wiki_get(path: "/guides/api-reference")
\`\`\`

---

## MCP Tools Reference

| Category | Tools |
|----------|-------|
| **Context** | \`context_load\`, \`context_lookup\`, \`context_update\` |
| **Sessions** | \`agent_session_start\`, \`agent_session_update\`, \`agent_session_resume\`, \`agent_session_end\` |
| **Tickets** | \`ticket_create\`, \`ticket_search\`, \`ticket_update\`, \`ticket_setStatus\`, \`ticket_addComment\`, \`ticket_get\` |
| **Kanban** | \`kanban_moveTicket\`, \`kanban_getBoard\` |
| **Roadmap** | \`roadmap_create\`, \`getCurrentPosition\`, \`getPhaseProgress\`, \`updateProgress\` |
| **Knowledge** | \`knowledge_create\`, \`knowledge_search\`, \`knowledge_get\` |
| **Wiki** | \`wiki_search\`, \`wiki_get\`, \`wiki_create\`, \`wiki_update\` |
| **Resources** | \`persona_list\`, \`persona_get\`, \`skill_list\`, \`skill_get\`, \`sop_list\`, \`sop_get\` |
| **Workflows** | \`workflow_list\`, \`workflow_start\`, \`workflow_executeStep\`, \`workflow_getStatus\` |

---

## Daily Checklist

- [ ] Loaded context via \`context_load(projectId: ${data.projectId})\`
- [ ] Resumed PAUSED session OR started new session
- [ ] Checked roadmap position (if using roadmap)
- [ ] Found tickets for current sprint/week
- [ ] Working on feature branch (not main/master)

---

## Dashboard

View all project resources: ${data.dashboardUrl}projects/${data.projectId}
`;
}

function generateAgentsMd(data: ProjectData): string {
  // Group skills by category
  const skillsByCategory: Record<string, typeof data.skills> = {};
  for (const skill of data.skills) {
    const cat = skill.category || 'General';
    if (!skillsByCategory[cat]) skillsByCategory[cat] = [];
    skillsByCategory[cat].push(skill);
  }

  const skillsSection =
    Object.keys(skillsByCategory).length > 0
      ? Object.entries(skillsByCategory)
          .map(([cat, skills]) => {
            const skillLines = skills
              .map((s) => `| ${s.title} | \`${s.slug}\` | ${s.description || 'Skill'} |`)
              .join('\n');
            return `#### ${cat}\n\n| Title | Slug | Description |\n|-------|------|-------------|\n${skillLines}`;
          })
          .join('\n\n')
      : '_No skills configured yet_';

  // Group SOPs by category
  const sopsByCategory: Record<string, typeof data.sops> = {};
  for (const sop of data.sops) {
    const cat = sop.category || 'General';
    if (!sopsByCategory[cat]) sopsByCategory[cat] = [];
    sopsByCategory[cat].push(sop);
  }

  const sopsSection =
    Object.keys(sopsByCategory).length > 0
      ? Object.entries(sopsByCategory)
          .map(([cat, sops]) => {
            const sopLines = sops
              .map((s) => `| ${s.title} | \`${s.slug}\` | ${s.description || 'Procedure'} |`)
              .join('\n');
            return `#### ${cat}\n\n| Title | Slug | Description |\n|-------|------|-------------|\n${sopLines}`;
          })
          .join('\n\n')
      : '_No SOPs configured yet_';

  const personasSection =
    data.personas.length > 0
      ? data.personas
          .map((p) => {
            const expertiseList = p.expertise?.length > 0 ? p.expertise.join(', ') : 'General';
            return `### ${p.name} ${p.icon || ''}\n\n**Slug**: \`${p.slug}\`  \n**Expertise**: ${expertiseList}\n\n${p.description || '_No description_'}`;
          })
          .join('\n\n')
      : '_No personas configured yet_';

  return `# ${data.projectName} - AI Agent Resources

**Project ID**: ${data.projectId}
**MCP Server**: ${data.mcpUrl}
**Dashboard**: ${data.dashboardUrl}

---

## Overview

This document catalogs all AI agent resources available for ${data.projectName} via ProjectPulse MCP.

Resources are loaded on-demand to save tokens. Use \`list\` tools to discover what's available, then \`get\` tools to load specific resources when needed.

---

## Available Personas

Personas define expert behaviors and domain knowledge. Load one to adopt its expertise.

### How to Use Personas

\`\`\`
# List all available personas
projectpulse_persona_list(projectId: ${data.projectId})

# Load a specific persona
projectpulse_persona_get(projectId: ${data.projectId}, slug: "<persona-slug>")
→ Returns: name, systemPrompt, expertise, rules, skills, tools
\`\`\`

### Persona Catalog

${personasSection}

---

## Available Skills

Skills contain reusable coding patterns, templates, and conventions for the project.

### How to Use Skills

\`\`\`
# List all skills
projectpulse_skill_list(projectId: ${data.projectId})

# Filter by category
projectpulse_skill_list(projectId: ${data.projectId}, category: "framework")

# Load a specific skill
projectpulse_skill_get(projectId: ${data.projectId}, slug: "<skill-slug>")
→ Returns: Full content with code examples
\`\`\`

### Skills by Category

${skillsSection}

---

## Standard Operating Procedures (SOPs)

SOPs provide step-by-step procedures for common tasks.

### How to Use SOPs

\`\`\`
# List all SOPs
projectpulse_sop_list(projectId: ${data.projectId})

# Filter by category
projectpulse_sop_list(projectId: ${data.projectId}, category: "Development")

# Load a specific SOP
projectpulse_sop_get(projectId: ${data.projectId}, slug: "<sop-slug>")
→ Returns: Full procedure with steps and checklists
\`\`\`

### SOPs by Category

${sopsSection}

---

## Workflow Templates

Workflow templates define multi-step processes for common tasks.

### How to Use Workflows

\`\`\`
# List available workflows
projectpulse_workflow_list(projectId: ${data.projectId})

# Start a workflow
projectpulse_workflow_start({
  templateId: 1,
  projectId: ${data.projectId},
  initialContext: { featureName: "auth" }
})

# Execute current step
projectpulse_workflow_executeStep({ runId: 123, stepResult: {...} })

# Check status
projectpulse_workflow_getStatus({ runId: 123 })
\`\`\`

---

## Knowledge Base

Project knowledge items store decisions, discoveries, and solutions.

### How to Access Knowledge

\`\`\`
# Search knowledge
projectpulse_knowledge_search({
  projectId: ${data.projectId},
  query: "authentication",
  mode: "hybrid"
})

# Get full item
projectpulse_knowledge_get({
  projectId: ${data.projectId},
  itemId: 123
})
\`\`\`

---

## Wiki

Project documentation in wiki format.

### How to Access Wiki

\`\`\`
# Search wiki
projectpulse_wiki_search({ query: "API reference" })

# Get page by path
projectpulse_wiki_get({ path: "/guides/api-reference" })
\`\`\`

---

## Token-Efficient Loading Pattern

To minimize token usage, follow this pattern:

\`\`\`
1. Start with context_load (all memory banks)
   → Get project brief, patterns, tech context

2. List resources when needed
   → persona_list, skill_list, sop_list return metadata only (~100 tokens each)

3. Load full content on-demand
   → persona_get, skill_get, sop_get return full content

4. Search before creating
   → knowledge_search, wiki_search to find existing info
\`\`\`

---

## Dashboard

View and manage all resources:

- **Overview**: ${data.dashboardUrl}projects/${data.projectId}
- **Personas**: ${data.dashboardUrl}projects/${data.projectId}/personas
- **Skills**: ${data.dashboardUrl}projects/${data.projectId}/skills
- **SOPs**: ${data.dashboardUrl}projects/${data.projectId}/sops
- **Knowledge**: ${data.dashboardUrl}projects/${data.projectId}/knowledge
`;
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  log.info({}, 'Writing minimal repo files');

  try {
    // 1. Validate request
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      log.warn({ error: validation.error }, 'Validation failed');

      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { projectId, repoPath, mcpUrl, dashboardUrl, dryRun }: WriteMinimalRequest = validation.data;

    log.info({ projectId, repoPath, mcpUrl: mcpUrl || DEFAULT_MCP_URL, dashboardUrl: dashboardUrl || DEFAULT_DASHBOARD_URL, dryRun }, 'Request validated');

    // 2. Query database for project data (Sprint 11 enhancement)
    const [project, personas, skills, sops] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true },
      }),
      prisma.agentPersona.findMany({
        where: { projectId, isActive: true },
        select: { name: true, slug: true, icon: true, description: true, expertise: true },
        orderBy: { name: 'asc' },
      }),
      prisma.skill.findMany({
        where: { projectId },
        select: { title: true, slug: true, category: true, description: true },
        orderBy: { category: 'asc' },
      }),
      prisma.sOP.findMany({
        where: { projectId },
        select: { title: true, slug: true, category: true, description: true },
        orderBy: { category: 'asc' },
      }),
    ]);

    const projectData: ProjectData = {
      projectId,
      projectName: project?.name || `Project ${projectId}`,
      mcpUrl: mcpUrl || DEFAULT_MCP_URL,
      dashboardUrl: dashboardUrl || DEFAULT_DASHBOARD_URL,
      personas,
      skills,
      sops,
    };

    log.info({ projectId, projectName: projectData.projectName, personaCount: personas.length, skillCount: skills.length, sopCount: sops.length }, 'Fetched project data');

    // 3. Generate enhanced template content
    const claudeContent = generateClaudeMd(projectData);
    const agentsContent = generateAgentsMd(projectData);

    // 4. If dryRun, return content without writing files
    // This is the default behavior for MCP calls from Docker containers
    // which can't access host filesystem paths
    if (dryRun) {
      log.info({}, 'DryRun mode - returning content for agent to write');
      return NextResponse.json({
        success: true,
        dryRun: true,
        projectId,
        repoPath,
        message: 'Generated CLAUDE.md and AGENTS.md content. Use your file writing tools to save them.',
        files: [
          { filename: 'CLAUDE.md', path: join(repoPath, 'CLAUDE.md'), content: claudeContent },
          { filename: 'AGENTS.md', path: join(repoPath, 'AGENTS.md'), content: agentsContent },
        ],
        hint: 'Write each file using your Write tool (e.g., Write tool in Claude Code)',
      });
    }

    // 5. Write files to repository (only if dryRun=false)
    const filesWritten: string[] = [];

    try {
      await writeFile(join(repoPath, 'CLAUDE.md'), claudeContent, 'utf-8');
      filesWritten.push('CLAUDE.md');
      log.info({}, 'Wrote CLAUDE.md');
    } catch (error) {
      log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to write CLAUDE.md');
      throw new Error(
        `Failed to write CLAUDE.md: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    try {
      await writeFile(join(repoPath, 'AGENTS.md'), agentsContent, 'utf-8');
      filesWritten.push('AGENTS.md');
      log.info({}, 'Wrote AGENTS.md');
    } catch (error) {
      log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to write AGENTS.md');
      throw new Error(
        `Failed to write AGENTS.md: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    log.info({ projectId, filesWritten, repoPath }, 'Files written successfully');

    return NextResponse.json({
      success: true,
      projectId,
      filesWritten,
      repoPath,
      message: `Optional files written to repo ✅ (${filesWritten.join(', ')})`,
    });
  } catch (error) {
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to write minimal repo files');

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to write minimal repo files', message: errorMessage },
      { status: 500 }
    );
  }
}
