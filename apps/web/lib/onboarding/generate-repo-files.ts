/**
 * Repository Files Generation for Session 3 Onboarding
 *
 * Purpose: Generate CLAUDE.md and AGENTS.md for user's repository
 * Used by: Bootstrap API route
 *
 * Architecture: Template-based (variable substitution, NO AI generation)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createLogger } from '@/lib/logger';

const log = createLogger({ module: 'Onboarding:RepoFiles' });

/**
 * Minimal interface for agent persona data used in repo file generation
 */
interface AgentPersonaForRepoFiles {
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  skills: string[];
  tools: string[];
  activationConditions: { triggers?: string[] } | null;
}

// ============================================================================
// CLAUDE.md TEMPLATE GENERATION
// ============================================================================

/**
 * Generate CLAUDE.md content
 *
 * @param projectName - Project name
 * @param agentPersonas - Array of agent personas
 * @returns Markdown content for CLAUDE.md
 */
export function generateCLAUDEmd(projectName: string, agentPersonas: AgentPersonaForRepoFiles[]): string {
  const agentsList = agentPersonas
    .map((agent) => `- **${agent.name}** (\`${agent.slug}\`) ${agent.icon} - ${agent.description}`)
    .join('\n');

  return `
# ${projectName} - Claude Code Integration Guide

**Last Updated**: ${new Date().toISOString().split('T')[0]}

This project uses **ProjectPulse** for AI-assisted development workflow.

---

## Quick Start

Just chat naturally with me (Claude Code):

\`\`\`
"Implement POST /api/users endpoint"
"Write tests for the authentication service"
"Debug the search feature"
\`\`\`

I'll automatically:
- Track work in ProjectPulse database
- Consult expert agents when needed
- Follow your project's patterns and conventions
- Save progress and generate documentation

---

## Available Agent Personas

Your project has ${agentPersonas.length} specialized agent experts:

${agentsList}

**How to use agents:**
\`\`\`typescript
// I'll automatically consult agents when needed, or you can request:
"Ask the React expert how to optimize this component"
"Get the API design expert's opinion on this endpoint"
\`\`\`

---

## 5-Step Development Protocol

**Every development session follows this workflow:**

### Step 1: Start Session
\`\`\`typescript
// I automatically call this when starting work
projectpulse.session.start({
  description: "Implement user authentication"
})
\`\`\`

### Step 2: Create Plan
- I create an implementation plan
- Save to ProjectPulse database
- Get your approval before proceeding

### Step 3: Consult Experts
- I invoke relevant agent personas
- Get architectural guidance
- Follow best practices

### Step 4: Implement
- Write code following patterns
- Run tests continuously
- Track progress in ProjectPulse

### Step 5: Complete & Document
- Update ProjectPulse records
- Generate documentation if needed
- Commit changes with proper message

---

## ProjectPulse MCP Tools

I have access to these MCP tools:

### Session Management
\`\`\`typescript
projectpulse.session.start()      // Start new development session
projectpulse.session.checkpoint()  // Save progress
projectpulse.session.complete()    // Mark session complete
\`\`\`

### Task Management
\`\`\`typescript
projectpulse.task.create()         // Create new task
projectpulse.task.update()         // Update task progress
projectpulse.task.list()           // List all tasks
\`\`\`

### Agent Invocation
\`\`\`typescript
projectpulse.agent.list()          // List available agents
projectpulse.agent.invoke()        // Invoke specific agent
\`\`\`

### Documentation
\`\`\`typescript
projectpulse.docs.list()           // List all documents
projectpulse.docs.read()           // Read specific document
projectpulse.wiki.generate()       // Generate wiki article
\`\`\`

### Roadmap
\`\`\`typescript
projectpulse.roadmap.getCurrentPosition()  // Get current phase/week/day
projectpulse.roadmap.list()                // List all roadmap items
\`\`\`

### Skills
\`\`\`typescript
projectpulse.skills.list()         // List available skills
projectpulse.skills.load()         // Load specific skill
\`\`\`

---

## Memory Bank System

All project context stored in ProjectPulse database:

### Project Context
- Tech stack and dependencies
- Architecture patterns
- Coding conventions
- Quality standards

**Access via:**
\`\`\`typescript
projectpulse.memory.read({ type: 'project-brief' })
projectpulse.memory.read({ type: 'system-patterns' })
projectpulse.memory.read({ type: 'tech-context' })
\`\`\`

### Current Work
- What you're working on right now
- Current week and day from roadmap
- Active todos

**Access via:**
\`\`\`typescript
projectpulse.roadmap.getCurrentPosition()
projectpulse.task.list({ status: 'in_progress' })
\`\`\`

---

## Best Practices

### ✅ Do:
- Let me track work in ProjectPulse automatically
- Request specific agents when you need expertise
- Follow the 5-step protocol
- Keep commits focused and atomic
- Write tests for all features

### ❌ Don't:
- Create local \`.agent/\` folders (use ProjectPulse DB)
- Skip testing
- Hardcode values
- Commit secrets
- Bypass security validation

---

## File Organization

**Your repository stays CLEAN** - no agent tracking files!

\`\`\`
your-project/
├── src/                  # Your application code
├── tests/                # Your tests
├── CLAUDE.md            # This file (agent integration guide)
├── AGENTS.md            # Agent personas list
├── README.md            # Project documentation
└── .gitignore           # Excludes .env, node_modules, etc.
\`\`\`

**NO .agent/ folder** - All tracking in ProjectPulse database!

---

## Getting Help

**Documentation:**
\`\`\`typescript
projectpulse.docs.list()                    // List all docs
projectpulse.docs.read({ slug: 'api-ref' }) // Read specific doc
\`\`\`

**Agent Experts:**
\`\`\`typescript
projectpulse.agent.list()                   // See all available agents
projectpulse.agent.invoke({                 // Ask agent for help
  agentSlug: 'react-expert',
  question: 'How should I optimize this component?'
})
\`\`\`

**Skills:**
\`\`\`typescript
projectpulse.skills.list()                  // See all skills
projectpulse.skills.load({ slug: 'api-patterns' })
\`\`\`

**Workflows:**
\`\`\`typescript
projectpulse.workflow.list()                // See workflow templates
\`\`\`

---

## Example Workflow

**User**: "Implement user authentication"

**Me (Claude)**:
1. ✅ Start session in ProjectPulse
2. ✅ Create implementation plan
3. ✅ Consult Security Expert and API Design Expert
4. ✅ Implement auth endpoints with validation
5. ✅ Write tests
6. ✅ Update ProjectPulse records
7. ✅ Commit with proper message
8. ✅ Mark session complete

**Result**: Feature implemented, tracked, tested, and documented!

---

**Ready to code!** 🚀

Use ProjectPulse to track your development journey and leverage AI agents for expert guidance.
  `.trim();
}

// ============================================================================
// AGENTS.md TEMPLATE GENERATION
// ============================================================================

/**
 * Generate AGENTS.md content
 *
 * @param projectName - Project name
 * @param agentPersonas - Array of agent personas
 * @returns Markdown content for AGENTS.md
 */
export function generateAGENTSmd(projectName: string, agentPersonas: AgentPersonaForRepoFiles[]): string {
  const agentSections = agentPersonas
    .map(
      (agent) => `
### ${agent.icon} ${agent.name}

**Slug**: \`${agent.slug}\`
**Description**: ${agent.description}

**Skills**: ${agent.skills.join(', ')}
**Tools**: ${agent.tools.join(', ')}

**When to invoke**:
${(agent.activationConditions?.triggers || []).map((trigger: string) => `- ${trigger}`).join('\n')}

**How to use**:
\`\`\`typescript
projectpulse.agent.invoke({
  agentSlug: '${agent.slug}',
  question: 'Your question here...'
})
\`\`\`
  `
    )
    .join('\n---\n');

  return `
# ${projectName} - Available Agent Personas

**Last Updated**: ${new Date().toISOString().split('T')[0]}

This project uses **ProjectPulse** for agent management. All agent personas are stored in the ProjectPulse database.

---

## Overview

You have **${agentPersonas.length} specialized agent experts** configured for this project.

Claude Code automatically consults these agents during development, or you can invoke them explicitly.

---

## How to Use Agents

### Automatic Invocation
Claude Code automatically consults agents when appropriate:
- React Expert for component questions
- API Design Expert for endpoint design
- Security Expert before deployment
- Testing Expert for test strategies

### Manual Invocation
Request specific agents explicitly:

\`\`\`typescript
// List all available agents
const agents = await mcp.call('projectpulse.agent.list', { projectId: 1 });

// Invoke specific agent
const response = await mcp.call('projectpulse.agent.invoke', {
  agentSlug: 'react-expert',
  question: 'How should I structure this component?'
});
\`\`\`

---

## Available Agents

${agentSections}

---

## Agent Workflow

1. **Identify need**: "I need help with [topic]"
2. **Find agent**: Check list above or use \`projectpulse.agent.list()\`
3. **Invoke agent**: Call \`projectpulse.agent.invoke()\` with agent slug
4. **Apply guidance**: Follow agent's implementation recommendations
5. **Track work**: Progress saved in ProjectPulse database

---

## Adding Custom Agents

You can add custom agents via the ProjectPulse UI:

1. Navigate to **/agents**
2. Click **"New Agent"**
3. Fill in:
   - Name and description
   - System prompt (agent's expertise)
   - Skills to reference
   - Activation triggers

Your custom agents will be available immediately!

---

**All agents configured in ProjectPulse database** - No local agent files needed!

For more information, see **CLAUDE.md** in this repository.
  `.trim();
}

// ============================================================================
// FILE WRITING
// ============================================================================

/**
 * Write CLAUDE.md and AGENTS.md to user's repository
 *
 * @param repoPath - Absolute path to user's repository
 * @param projectName - Project name
 * @param agentPersonas - Array of agent personas
 * @returns Object with success flags for each file
 */
export async function writeRepoFiles(
  repoPath: string,
  projectName: string,
  agentPersonas: AgentPersonaForRepoFiles[]
): Promise<{ claudeMd: boolean; agentsMd: boolean }> {
  log.info({ repoPath, projectName, agentCount: agentPersonas.length }, 'Writing repo files');

  const results = {
    claudeMd: false,
    agentsMd: false,
  };

  try {
    // Generate content
    const claudeContent = generateCLAUDEmd(projectName, agentPersonas);
    const agentsContent = generateAGENTSmd(projectName, agentPersonas);

    // Write CLAUDE.md
    try {
      const claudePath = path.join(repoPath, 'CLAUDE.md');
      await fs.writeFile(claudePath, claudeContent, 'utf-8');
      results.claudeMd = true;
      log.info({ path: claudePath }, 'CLAUDE.md written successfully');
    } catch (error) {
      log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to write CLAUDE.md');
    }

    // Write AGENTS.md
    try {
      const agentsPath = path.join(repoPath, 'AGENTS.md');
      await fs.writeFile(agentsPath, agentsContent, 'utf-8');
      results.agentsMd = true;
      log.info({ path: agentsPath }, 'AGENTS.md written successfully');
    } catch (error) {
      log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to write AGENTS.md');
    }

    log.info({ results }, 'Repo files written');
    return results;
  } catch (error) {
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to write repo files');
    return results;
  }
}
