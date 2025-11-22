import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const SYSTEM_PROJECT_NAME = 'System Wiki Templates';
const SYSTEM_PROJECT_SLUG = 'system-wiki-templates';

// Initial Bootstrap Content
const INITIAL_TEMPLATES = [
  {
    title: 'MCP Configuration Guide',
    path: `/${SYSTEM_PROJECT_SLUG}/mcp-configuration`,
    category: 'getting-started',
    content: `# MCP Configuration Guide

Learn how to configure the Model Context Protocol (MCP) to connect your AI agents to ProjectPulse.

## 1. Generate Bearer Token
To securely authenticate your local agents:
1.  Go to **Settings** > **Agent Tokens**.
2.  Click **"Generate Token"**.
3.  Give it a name (e.g., "Cursor", "Claude Desktop").
4.  **Copy the token** immediately (it won't be shown again).

## 2. Configure Your Client

### Claude Desktop
Edit \`~/.claude/claude_desktop_config.json\`:

\`\`\`json
{
  "mcpServers": {
    "projectpulse": {
      "command": "docker",
      "args": [
        "exec",
        "-i",
        "projectpulse-web-1",
        "node",
        "apps/mcp-server/dist/index.js"
      ],
      "env": {
        "MCP_API_KEY": "your-bearer-token-here"
      }
    }
  }
}
\`\`\`

### Windsurf / Cursor
Update your MCP configuration file (usually \`~/.codeium/windsurf/mcp_config.json\` or similar):

\`\`\`json
{
  "mcpServers": {
    "projectpulse": {
      "command": "node",
      "args": ["/path/to/projectpulse/apps/mcp-server/dist/index.js"],
      "env": {
        "MCP_API_KEY": "your-bearer-token-here"
      }
    }
  }
}
\`\`\`

## 3. Verify Connection
Run the health check tool to ensure everything is working:
- **Tool**: \`projectpulse_health_check\`
- **Expected Output**: \`{"status": "healthy", "database": "connected"}\`

## Troubleshooting
- **401 Unauthorized**: Check your Bearer Token.
- **Connection Refused**: Ensure Docker containers are running.
`,
  },
  {
    title: 'Getting Started with ProjectPulse',
    path: `/${SYSTEM_PROJECT_SLUG}/getting-started`,
    category: 'getting-started',
    content: `# Getting Started with ProjectPulse

Welcome to ProjectPulse! This platform is designed to be the central nervous system for your AI-driven development.

## Core Features

### 1. Sprint Hierarchy
We track work in a 5-level hierarchy:
- **Phase**: Major milestone (e.g., "MVP Launch").
- **Sprint**: 2-week cycle.
- **Week**: Weekly goals.
- **Day**: Daily tasks.
- **Task**: Specific work item.
- **Session**: Granular work units with AI checkpoints.

### 2. Issue Tracking
Manage bugs and features with rich context. Issues can be linked to:
- **Wiki Pages**: For documentation.
- **Knowledge Items**: For technical context.
- **Code Files**: For implementation details.

### 3. Knowledge Base & Wiki
- **Wiki**: Hierarchical project documentation (like this page).
- **Knowledge Base**: Semantic search for snippets, patterns, and error logs.

## Navigation Tips
- **Cmd+K**: Open the command palette to jump anywhere.
- **Sidebar**: Quick access to all modules.
- **Dashboard**: Your daily command center with "Current Work" tracking.

## Next Steps
1.  Complete the **Onboarding Guide** to set up your project strategy.
2.  Configure **MCP** to enable your AI agents.
`,
  },
  {
    title: 'Onboarding Guide',
    path: `/${SYSTEM_PROJECT_SLUG}/onboarding-guide`,
    category: 'guides',
    content: `# Project Onboarding Workflow

ProjectPulse uses a unique 3-session AI onboarding process to set up new projects.

## Session 1: Strategic Planning
**Goal**: Define *what* we are building.
- **Process**: The AI interviews you (Product Manager persona).
- **Output**: 96 Q&A pairs covering Architecture, DevOps, UX, and more.
- **Result**: A comprehensive **Executive Summary**.

## Session 2: Industry Documentation
**Goal**: Generate standard documentation artifacts.
- **Process**: The AI generates 15 core documents in batches:
    1.  **Planning**: PRD, SRS, Backlog.
    2.  **Architecture**: System Design, API Spec, Data Model.
    3.  **Implementation**: Testing Strategy, Security Plan.
    4.  **Operations**: Deployment Guide, SRE Plan.
- **Output**: Markdown files stored in the database.

## Session 3: AI Workflow Blueprint
**Goal**: Configure the AI for this specific project.
- **Process**: The AI parses the Project Plan.
- **Output**:
    -   **Agent Personas**: Custom experts (e.g., "React Expert").
    -   **Skills Library**: Reusable patterns.
    -   **Workflows**: Standard Operating Procedures (SOPs).
    -   **Roadmap**: Materialized Sprint/Week/Day hierarchy.

## How to Start
Use the **Onboarding** tab in your Project Dashboard to begin Session 1.
`,
  },
  {
    title: 'Development Workflow',
    path: `/${SYSTEM_PROJECT_SLUG}/development-workflow`,
    category: 'guides',
    content: `# Development Workflow

Follow these guidelines to maintain velocity and quality.

## Git Workflow
- **Main Branch**: \`master\` (Protected).
- **Feature Branches**: \`feature/ticket-id-description\`.
- **Commits**: Use semantic commits (e.g., \`feat: add user auth\`, \`fix: resolve login bug\`).

## Agent Persona Usage
Don't just use generic AI. Select the right specialist for the job:
- **React Expert**: For component design and hooks.
- **Next.js Expert**: For App Router and Server Components.
- **Prisma Expert**: For schema changes and complex queries.
- **Testing Agent**: For writing Jest/Playwright tests.

## Checkpoints (Critical)
To prevent context loss, your AI agent must create checkpoints:
- **Frequency**: Every 15,000 tokens.
- **Tool**: \`projectpulse_sprint_checkpoint\`.
- **Benefit**: Allows you to resume complex tasks even if the LLM context window resets.

## Wiki Documentation
- **When to write**: Whenever you make a significant architectural decision.
- **Where to write**: Create a new Wiki Page in the appropriate category.
- **System Pages**: Pages marked "System" (like this one) are defaults. You can edit them to fit your project!
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
