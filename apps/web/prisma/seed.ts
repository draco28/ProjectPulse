/**
 * Database Seed Script for Moksha DevHub
 *
 * Populates database with realistic development data:
 * - Projects and Issues
 * - Knowledge Base items
 * - Agent Personas
 * - Security Findings
 * - Comments and Labels
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data (in reverse dependency order)
  console.log('🧹 Cleaning existing data...');

  // Clean Sprint Hierarchy (new models)
  await prisma.session.deleteMany();
  await prisma.task.deleteMany();
  await prisma.day.deleteMany();
  await prisma.week.deleteMany();
  await prisma.phase.deleteMany();

  // Clean Moksha DevHub (old models)
  await prisma.agentSession.deleteMany();
  await prisma.agentPersona.deleteMany();
  await prisma.promptTemplate.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.linkedFile.deleteMany();
  await prisma.linkedCommit.deleteMany();
  await prisma.knowledgeLink.deleteMany();
  await prisma.wikiPageLink.deleteMany();
  await prisma.pageLink.deleteMany();
  await prisma.securityFinding.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.label.deleteMany();
  await prisma.knowledgeItem.deleteMany();
  await prisma.wikiPage.deleteMany();
  await prisma.project.deleteMany();
  await prisma.setting.deleteMany();
  console.log('✓ Cleanup complete\n');

  // ========================================================================
  // SPRINT HIERARCHY (5-LEVEL TASK TRACKING)
  // ========================================================================
  console.log('🎯 Creating Sprint 1 hierarchy...');

  const phase = await prisma.phase.create({
    data: {
      title: 'Phase A - Foundation & Core Infrastructure',
      description:
        'Build backend foundation for 5-level hierarchy with progress roll-up and MCP tool scaffold',
      status: 'IN_PROGRESS',
      progress: 20, // Day 2 of ~10 days = 20%
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-15'),
      weeks: {
        create: [
          {
            title: 'Week 1 - Setup & Database',
            description:
              'Environment setup, TypeScript config, Prisma schema design, and initial testing',
            status: 'IN_PROGRESS',
            progress: 40, // Days 1-2 complete, Days 3-5 pending
            startDate: new Date('2025-11-01'),
            endDate: new Date('2025-11-08'),
            days: {
              create: [
                {
                  title: 'Day 1 - Environment Setup',
                  description:
                    'Verify workspace, configure TypeScript strict mode, ESLint, validate Docker',
                  status: 'COMPLETED',
                  progress: 100,
                  startDate: new Date('2025-11-01'),
                  endDate: new Date('2025-11-01'),
                  tasks: {
                    create: [
                      {
                        title: 'Confirm pnpm workspace and lockfile',
                        status: 'COMPLETED',
                        progress: 100,
                        startDate: new Date('2025-11-01T09:00:00Z'),
                        endDate: new Date('2025-11-01T09:15:00Z'),
                      },
                      {
                        title: 'Create base tsconfig with strict mode',
                        status: 'COMPLETED',
                        progress: 100,
                        startDate: new Date('2025-11-01T09:15:00Z'),
                        endDate: new Date('2025-11-01T09:45:00Z'),
                      },
                      {
                        title: 'Create root ESLint configuration',
                        status: 'COMPLETED',
                        progress: 100,
                        startDate: new Date('2025-11-01T09:45:00Z'),
                        endDate: new Date('2025-11-01T10:00:00Z'),
                      },
                      {
                        title: 'Validate Docker PostgreSQL container',
                        status: 'COMPLETED',
                        progress: 100,
                        startDate: new Date('2025-11-01T10:00:00Z'),
                        endDate: new Date('2025-11-01T10:15:00Z'),
                      },
                    ],
                  },
                },
                {
                  title: 'Day 2 - Prisma Schema Design',
                  description:
                    'Design 5-level hierarchy, create migration, generate Prisma Client, seed data',
                  status: 'IN_PROGRESS',
                  progress: 60, // Schema done, seed in progress
                  startDate: new Date('2025-11-06'),
                  endDate: new Date('2025-11-06'),
                  tasks: {
                    create: [
                      {
                        title: 'Consult prisma-expert for schema design',
                        status: 'COMPLETED',
                        progress: 100,
                        startDate: new Date('2025-11-06T10:00:00Z'),
                        endDate: new Date('2025-11-06T10:30:00Z'),
                      },
                      {
                        title: 'Define Phase, Week, Day, Task, Session models',
                        status: 'COMPLETED',
                        progress: 100,
                        startDate: new Date('2025-11-06T10:30:00Z'),
                        endDate: new Date('2025-11-06T11:00:00Z'),
                      },
                      {
                        title: 'Add indexes and foreign key constraints',
                        status: 'COMPLETED',
                        progress: 100,
                        startDate: new Date('2025-11-06T11:00:00Z'),
                        endDate: new Date('2025-11-06T11:15:00Z'),
                      },
                      {
                        title: 'Generate and apply migration',
                        status: 'COMPLETED',
                        progress: 100,
                        startDate: new Date('2025-11-06T11:15:00Z'),
                        endDate: new Date('2025-11-06T11:30:00Z'),
                      },
                      {
                        title: 'Create seed script with Sprint 1 data',
                        status: 'IN_PROGRESS',
                        progress: 50,
                        startDate: new Date('2025-11-06T11:30:00Z'),
                      },
                      {
                        title: 'Test data integrity in Prisma Studio',
                        status: 'NOT_STARTED',
                        progress: 0,
                        startDate: new Date('2025-11-06T12:00:00Z'),
                      },
                    ],
                  },
                },
                {
                  title: 'Day 3 - Schema Validation',
                  description:
                    'Create validation tests, verify progress roll-up logic, test cascade deletes',
                  status: 'NOT_STARTED',
                  progress: 0,
                  startDate: new Date('2025-11-07'),
                },
                {
                  title: 'Day 4-5 - MCP Server Scaffold',
                  description:
                    'Initialize MCP server project, configure stdio, create tool registration system',
                  status: 'NOT_STARTED',
                  progress: 0,
                  startDate: new Date('2025-11-08'),
                  endDate: new Date('2025-11-09'),
                },
              ],
            },
          },
          {
            title: 'Week 2 - MCP Tools Implementation',
            description: 'Implement core MCP tools, progress tracking, integration tests',
            status: 'NOT_STARTED',
            progress: 0,
            startDate: new Date('2025-11-09'),
            endDate: new Date('2025-11-15'),
            days: {
              create: [
                {
                  title: 'Day 6-7 - Core MCP Tools',
                  description:
                    'Implement sprint.phase.create, sprint.getCurrentTask, sprint.checkpoint with unit tests',
                  status: 'NOT_STARTED',
                  progress: 0,
                  startDate: new Date('2025-11-10'),
                  endDate: new Date('2025-11-11'),
                },
                {
                  title: 'Day 8-9 - Progress Tracking',
                  description:
                    'Implement progress roll-up algorithm, integration tests, validate hierarchy',
                  status: 'NOT_STARTED',
                  progress: 0,
                  startDate: new Date('2025-11-12'),
                  endDate: new Date('2025-11-13'),
                },
                {
                  title: 'Day 10 - Sprint 1 Completion',
                  description:
                    'Final testing, validation, Sprint 1 completion document, prepare Sprint 2 planning',
                  status: 'NOT_STARTED',
                  progress: 0,
                  startDate: new Date('2025-11-14'),
                  endDate: new Date('2025-11-15'),
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`✓ Created Sprint 1 hierarchy: Phase A with 2 weeks, 7 days, and sample tasks\n`);

  // ========================================================================
  // FILTER OPTIONS (Phase 4: Dynamic Filters)
  // ========================================================================
  console.log('🎯 Seeding filter options...');

  // STATUS OPTIONS
  const statusOptions = [
    { value: 'open', label: 'Open', order: 0, colorClass: 'text-blue-600' },
    { value: 'in_progress', label: 'In Progress', order: 1, colorClass: 'text-yellow-600' },
    { value: 'closed', label: 'Closed', order: 2, colorClass: 'text-green-600' },
  ];

  for (const option of statusOptions) {
    await prisma.issueStatusOption.upsert({
      where: { value: option.value },
      update: { label: option.label, order: option.order, colorClass: option.colorClass },
      create: option,
    });
  }
  console.log(`✓ Seeded ${statusOptions.length} status options`);

  // PRIORITY OPTIONS
  const priorityOptions = [
    {
      value: 'critical',
      label: 'Critical',
      order: 0,
      dotColorClass: 'bg-red-600',
      badgeColorClass: 'bg-red-100 text-red-800',
    },
    {
      value: 'high',
      label: 'High',
      order: 1,
      dotColorClass: 'bg-orange-600',
      badgeColorClass: 'bg-orange-100 text-orange-800',
    },
    {
      value: 'medium',
      label: 'Medium',
      order: 2,
      dotColorClass: 'bg-yellow-600',
      badgeColorClass: 'bg-yellow-100 text-yellow-800',
    },
    {
      value: 'low',
      label: 'Low',
      order: 3,
      dotColorClass: 'bg-gray-600',
      badgeColorClass: 'bg-gray-100 text-gray-800',
    },
  ];

  for (const option of priorityOptions) {
    await prisma.issuePriorityOption.upsert({
      where: { value: option.value },
      update: {
        label: option.label,
        order: option.order,
        dotColorClass: option.dotColorClass,
        badgeColorClass: option.badgeColorClass,
      },
      create: option,
    });
  }
  console.log(`✓ Seeded ${priorityOptions.length} priority options`);

  // MODULE OPTIONS
  const moduleOptions = [
    { value: 'combat', label: 'Combat', order: 0 },
    { value: 'animation', label: 'Animation', order: 1 },
    { value: 'core', label: 'Core', order: 2 },
    { value: 'ui', label: 'UI', order: 3 },
  ];

  for (const option of moduleOptions) {
    await prisma.issueModuleOption.upsert({
      where: { value: option.value },
      update: { label: option.label, order: option.order },
      create: option,
    });
  }
  console.log(`✓ Seeded ${moduleOptions.length} module options\n`);

  // ========================================================================
  // PROJECTS
  // ========================================================================
  console.log('📦 Creating projects...');
  const project = await prisma.project.create({
    data: {
      name: 'Moksha DevHub',
      description:
        'Unified development hub with issue tracking, knowledge base, and AI agent personas',
      repository: 'https://github.com/draco28/ProjectPulse',
    },
  });
  console.log(`✓ Created project: ${project.name}\n`);

  // ========================================================================
  // LABELS
  // ========================================================================
  console.log('🏷️  Creating labels...');
  const labels = await Promise.all([
    prisma.label.create({ data: { name: 'bug', color: '#d73a4a' } }),
    prisma.label.create({ data: { name: 'enhancement', color: '#a2eeef' } }),
    prisma.label.create({ data: { name: 'documentation', color: '#0075ca' } }),
    prisma.label.create({ data: { name: 'security', color: '#d4c5f9' } }),
    prisma.label.create({ data: { name: 'performance', color: '#fbca04' } }),
    prisma.label.create({ data: { name: 'ui/ux', color: '#d876e3' } }),
  ]);
  console.log(`✓ Created ${labels.length} labels\n`);

  // ========================================================================
  // ISSUES
  // ========================================================================
  console.log('📝 Creating issues...');

  const issues = await Promise.all([
    // Open issues
    prisma.issue.create({
      data: {
        title: 'Implement hybrid search with PostgreSQL tsvector + pgvector',
        description:
          'Add full-text search using tsvector and semantic search using pgvector embeddings for knowledge base articles.',
        status: 'open',
        priority: 'high',
        module: 'Search',
        assignee: 'Developer',
        projectId: project.id,
        labels: { connect: [{ id: labels[1].id }] }, // enhancement
      },
    }),

    prisma.issue.create({
      data: {
        title: 'Add authentication with NextAuth.js',
        description:
          'Implement user authentication and authorization using NextAuth.js with GitHub OAuth provider.',
        status: 'open',
        priority: 'critical',
        module: 'Auth',
        assignee: 'Developer',
        projectId: project.id,
        labels: { connect: [{ id: labels[1].id }, { id: labels[3].id }] }, // enhancement, security
      },
    }),

    prisma.issue.create({
      data: {
        title: 'Dashboard theme switching not working correctly',
        description:
          'Theme CSS variables not applying when switching between Desert, Neon, Earthy, and Coral themes.',
        status: 'in-progress',
        priority: 'high',
        module: 'UI',
        assignee: 'Developer',
        projectId: project.id,
        labels: { connect: [{ id: labels[0].id }, { id: labels[5].id }] }, // bug, ui/ux
      },
    }),

    prisma.issue.create({
      data: {
        title: 'Optimize database queries for issue list page',
        description:
          'Issue list page loading slowly with 100+ issues. Need to add pagination and optimize N+1 queries.',
        status: 'open',
        priority: 'medium',
        module: 'Performance',
        projectId: project.id,
        labels: { connect: [{ id: labels[4].id }] }, // performance
      },
    }),

    prisma.issue.create({
      data: {
        title: 'Add API documentation with OpenAPI/Swagger',
        description:
          'Document all API endpoints using OpenAPI 3.0 specification and generate interactive Swagger UI.',
        status: 'open',
        priority: 'low',
        module: 'Documentation',
        projectId: project.id,
        labels: { connect: [{ id: labels[2].id }] }, // documentation
      },
    }),

    // Closed issues (for completed stat)
    prisma.issue.create({
      data: {
        title: 'Setup Docker PostgreSQL container with pgvector',
        description:
          'Configure PostgreSQL 16 container with pgvector extension for semantic search capabilities.',
        status: 'closed',
        priority: 'high',
        module: 'Infrastructure',
        projectId: project.id,
        closedAt: new Date('2025-10-24T10:30:00Z'),
      },
    }),

    prisma.issue.create({
      data: {
        title: 'Implement 4 theme system (Desert, Neon, Earthy, Coral)',
        description: 'Create 4 unique themes with neumorphic design and CSS custom properties.',
        status: 'closed',
        priority: 'high',
        module: 'UI',
        assignee: 'Developer',
        projectId: project.id,
        closedAt: new Date('2025-10-24T18:45:00Z'),
        labels: { connect: [{ id: labels[5].id }] }, // ui/ux
      },
    }),

    prisma.issue.create({
      data: {
        title: 'Build Dashboard UI with shadcn/ui components',
        description:
          'Implement Dashboard layout with Sidebar, Header, WelcomeBanner, StatCards, and IssueCards.',
        status: 'closed',
        priority: 'critical',
        module: 'UI',
        assignee: 'Developer',
        projectId: project.id,
        closedAt: new Date('2025-10-25T02:00:00Z'),
        labels: { connect: [{ id: labels[1].id }, { id: labels[5].id }] }, // enhancement, ui/ux
      },
    }),
  ]);

  console.log(`✓ Created ${issues.length} issues\n`);

  // ========================================================================
  // COMMENTS
  // ========================================================================
  console.log('💬 Creating comments...');

  await Promise.all([
    prisma.comment.create({
      data: {
        content:
          'I can help with the tsvector implementation. We should use weighted search with title having higher weight than content.',
        author: 'Claude',
        issueId: issues[0].id,
      },
    }),
    prisma.comment.create({
      data: {
        content:
          'Updated CSS specificity from `[data-theme="X"]` to `:root[data-theme="X"]` which fixed the issue!',
        author: 'Developer',
        issueId: issues[2].id,
      },
    }),
    prisma.comment.create({
      data: {
        content:
          'Should we use server-side pagination or cursor-based pagination for infinite scroll?',
        author: 'Developer',
        issueId: issues[3].id,
      },
    }),
  ]);

  console.log('✓ Created comments\n');

  // ========================================================================
  // KNOWLEDGE BASE
  // ========================================================================
  console.log('📚 Creating knowledge base items...');

  const knowledgeItems = await Promise.all([
    prisma.knowledgeItem.create({
      data: {
        title: 'PostgreSQL Full-Text Search Best Practices',
        content: `# PostgreSQL Full-Text Search

## tsvector and tsquery

Use \`to_tsvector()\` to convert text to searchable vectors:

\`\`\`sql
SELECT to_tsvector('english', 'The quick brown fox');
-- Result: 'brown':3 'fox':4 'quick':2
\`\`\`

## Weighted Search

Assign different weights to title vs content:

\`\`\`sql
CREATE INDEX ON issues USING GIN (
  setweight(to_tsvector('english', title), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
);
\`\`\`

## Query Syntax

- \`&\` - AND
- \`|\` - OR
- \`!\` - NOT
- \`<->\` - phrase search`,
        category: 'Database',
        tags: ['postgresql', 'full-text-search', 'tsvector'],
      },
    }),

    prisma.knowledgeItem.create({
      data: {
        title: 'Next.js 14 Server Components vs Client Components',
        content: `# Server vs Client Components

## Server Components (default)

- Fetch data on the server
- Keep large dependencies on server
- No JavaScript sent to client
- Cannot use hooks or interactivity

\`\`\`tsx
// app/page.tsx - Server Component
async function Page() {
  const data = await fetch('...');
  return <div>{data}</div>;
}
\`\`\`

## Client Components

Add \`'use client'\` directive:

\`\`\`tsx
'use client';
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
\`\`\`

## Best Practices

1. Use Server Components by default
2. Move Client Components to leaves of component tree
3. Pass data from Server to Client via props`,
        category: 'Frontend',
        tags: ['nextjs', 'react', 'server-components'],
      },
    }),

    prisma.knowledgeItem.create({
      data: {
        title: 'Prisma Schema Best Practices',
        content: `# Prisma Schema Design

## Indexes

Always index foreign keys and frequently queried fields:

\`\`\`prisma
model Issue {
  id        Int    @id @default(autoincrement())
  projectId Int
  status    String

  @@index([projectId])  // Foreign key
  @@index([status])     // Frequent filter
  @@index([createdAt(sort: Desc)])  // Sorting
}
\`\`\`

## JSONB for Flexible Fields

Use Json type for dynamic fields:

\`\`\`prisma
customFields Json? @db.JsonB

@@index([customFields], type: Gin)
\`\`\`

## Cascading Deletes

Use \`onDelete: Cascade\` to auto-delete related records:

\`\`\`prisma
issue Issue @relation(fields: [issueId], references: [id], onDelete: Cascade)
\`\`\``,
        category: 'Database',
        tags: ['prisma', 'database-design', 'best-practices'],
      },
    }),
  ]);

  console.log(`✓ Created ${knowledgeItems.length} knowledge base items\n`);

  // ========================================================================
  // WIKI PAGES
  // ========================================================================
  console.log('📖 Creating wiki pages...');

  const wikiPages = await Promise.all([
    prisma.wikiPage.create({
      data: {
        title: 'Getting Started',
        path: '/getting-started',
        content: `# Getting Started

Welcome to Moksha DevHub! This guide will help you set up and start using the platform.

## Introduction

Moksha DevHub is a unified development hub that combines issue tracking, knowledge management, wiki documentation, and AI agent assistance in one platform.

## Installation

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- pnpm 8+

### Setup Steps

1. Clone the repository
2. Install dependencies: \`pnpm install\`
3. Set up environment variables
4. Run database migrations: \`pnpm prisma migrate dev\`
5. Seed the database: \`pnpm prisma db seed\`

## Usage

### Dashboard

The dashboard provides an overview of:
- Open issues and their status
- Recent knowledge base articles
- Active AI agents
- Security findings

### Navigation

Use the sidebar to navigate between:
- Issues
- Knowledge Base
- Wiki
- Security
- Agent Personas

Press \`Cmd+K\` (or \`Ctrl+K\`) to open the command palette for quick navigation.`,
      },
    }),

    prisma.wikiPage.create({
      data: {
        title: 'Configuration',
        path: '/configuration',
        content: `# Configuration

Learn how to configure Moksha DevHub for your team.

## Environment Variables

Create a \`.env\` file with the following variables:

\`\`\`bash
DATABASE_URL="postgresql://user:password@localhost:5432/devhub"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
\`\`\`

## Database Setup

The application uses PostgreSQL with the pgvector extension for semantic search.

### Enable Extensions

\`\`\`sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
\`\`\`

## Theme Customization

The Coral neumorphic theme is the default. CSS variables can be customized in \`globals.css\`.`,
      },
    }),
  ]);

  // Create wiki page links (related pages)
  await prisma.pageLink.create({
    data: {
      sourcePageId: wikiPages[0].id, // Getting Started
      targetPageId: wikiPages[1].id, // Configuration
    },
  });

  console.log(`✓ Created ${wikiPages.length} wiki pages\n`);

  // ========================================================================
  // SECURITY FINDINGS
  // ========================================================================
  console.log('🔒 Creating security findings...');

  const securityFindings = await Promise.all([
    prisma.securityFinding.create({
      data: {
        ruleId: 'javascript.express.security.audit.express-check-csrf-before-method-override',
        severity: 'WARNING',
        message:
          'Detected use of method-override middleware before CSRF protection. This can allow attackers to bypass CSRF protection.',
        filePath: 'apps/web/app/api/issues/route.ts',
        lineNumber: 42,
        codeSnippet: 'app.use(methodOverride());',
        status: 'open',
      },
    }),

    prisma.securityFinding.create({
      data: {
        ruleId: 'typescript.react.security.audit.react-dangerouslysetinnerhtml',
        severity: 'ERROR',
        message: 'Detected usage of dangerouslySetInnerHTML. This can lead to XSS vulnerabilities.',
        filePath: 'apps/web/components/KnowledgeArticle.tsx',
        lineNumber: 78,
        codeSnippet: '<div dangerouslySetInnerHTML={{ __html: content }} />',
        status: 'open',
      },
    }),

    prisma.securityFinding.create({
      data: {
        ruleId: 'javascript.lang.security.audit.sqli.node-postgres-sqli',
        severity: 'ERROR',
        message: 'Detected possible SQL injection. Use parameterized queries.',
        filePath: 'apps/web/lib/db.ts',
        lineNumber: 23,
        codeSnippet: 'await pool.query(`SELECT * FROM users WHERE id = ${userId}`)',
        status: 'false_positive',
        fixedAt: new Date('2025-10-24T16:20:00Z'),
      },
    }),
  ]);

  console.log(`✓ Created ${securityFindings.length} security findings\n`);

  // ========================================================================
  // AGENT PERSONAS
  // ========================================================================
  console.log('🤖 Creating agent personas...');

  const personas = await Promise.all([
    prisma.agentPersona.create({
      data: {
        name: 'Code Reviewer',
        slug: 'code-reviewer',
        icon: '🔍',
        description:
          'Expert code reviewer focusing on best practices, security, and maintainability',
        systemPrompt: `You are an expert code reviewer with deep knowledge of:
- Software architecture and design patterns
- Security vulnerabilities and mitigations
- Performance optimization
- Code maintainability and readability

When reviewing code:
1. Check for security vulnerabilities
2. Verify proper error handling
3. Suggest performance improvements
4. Ensure code follows project conventions
5. Recommend tests for edge cases`,
        skills: ['code-review', 'security', 'best-practices'],
        tools: ['create_issue', 'search_knowledge'],
        rules: ['Always cite security best practices', 'Suggest specific improvements'],
        isBuiltIn: true,
        isActive: true,
        expertise: ['TypeScript', 'React', 'Security', 'Performance'],
        personality:
          'Thorough and detail-oriented, focuses on security and best practices. Provides actionable feedback with code examples.',
      },
    }),

    prisma.agentPersona.create({
      data: {
        name: 'Debugging Assistant',
        slug: 'debugger',
        icon: '🐛',
        description: 'Systematic debugging expert using divide-and-conquer approach',
        systemPrompt: `You are a systematic debugging expert. Your approach:

1. **Reproduce** - Understand the exact steps to reproduce
2. **Isolate** - Use binary search to narrow down the problem
3. **Inspect** - Check logs, stack traces, and state
4. **Hypothesize** - Form testable theories about root cause
5. **Test** - Validate hypotheses with minimal changes
6. **Fix** - Apply the simplest solution
7. **Verify** - Confirm fix and add regression tests`,
        skills: ['debugging', 'testing', 'root-cause-analysis'],
        tools: ['search_knowledge', 'create_issue'],
        rules: ['Use divide-and-conquer approach', 'Always suggest regression tests'],
        isBuiltIn: true,
        isActive: true,
        expertise: ['Node.js', 'Testing', 'Debugging', 'System Analysis'],
        personality:
          'Methodical and patient, uses systematic approaches to isolate problems. Explains reasoning clearly.',
      },
    }),

    prisma.agentPersona.create({
      data: {
        name: 'Documentation Writer',
        slug: 'docs-writer',
        icon: '📝',
        description: 'Technical documentation expert focusing on clarity and completeness',
        systemPrompt: `You are a technical documentation expert. You write:

- Clear, concise explanations
- Code examples with comments
- Step-by-step guides
- API documentation with TypeScript types
- Architecture decision records (ADRs)

Format:
- Use markdown with proper headings
- Include code blocks with syntax highlighting
- Add diagrams where helpful (mermaid)
- Provide real-world examples`,
        skills: ['documentation', 'technical-writing', 'api-docs'],
        tools: ['create_wiki_page', 'search_knowledge'],
        rules: ['Always include code examples', 'Use active voice'],
        isBuiltIn: true,
        isActive: true,
        expertise: ['Technical Writing', 'Markdown', 'API Documentation', 'Architecture'],
        personality:
          'Clear and concise communicator, emphasizes practical examples and step-by-step guides. Friendly and approachable.',
      },
    }),
  ]);

  console.log(`✓ Created ${personas.length} agent personas\n`);

  // ========================================================================
  // AGENT SESSIONS (recent activity)
  // ========================================================================
  console.log('📊 Creating agent sessions...');

  await Promise.all([
    prisma.agentSession.create({
      data: {
        personaId: personas[0].id, // Code Reviewer
        activatedBy: 'slash_command',
        duration: 180, // 3 minutes
        toolCalls: 3,
        issuesCreated: 1,
        startedAt: new Date('2025-10-24T14:30:00Z'),
        endedAt: new Date('2025-10-24T14:33:00Z'),
      },
    }),
    prisma.agentSession.create({
      data: {
        personaId: personas[1].id, // Debugger
        activatedBy: 'auto',
        duration: 420, // 7 minutes
        toolCalls: 5,
        issuesCreated: 0,
        startedAt: new Date('2025-10-24T16:15:00Z'),
        endedAt: new Date('2025-10-24T16:22:00Z'),
      },
    }),
    prisma.agentSession.create({
      data: {
        personaId: personas[2].id, // Docs Writer
        activatedBy: 'cmd_k',
        duration: 600, // 10 minutes
        toolCalls: 2,
        issuesCreated: 0,
        startedAt: new Date('2025-10-25T10:00:00Z'),
        endedAt: new Date('2025-10-25T10:10:00Z'),
      },
    }),
  ]);

  console.log('✓ Created agent sessions\n');

  // ========================================================================
  // SUMMARY
  // ========================================================================
  console.log('✅ Database seed complete!\n');
  console.log('📊 Summary:');
  console.log(`   - Projects: 1`);
  console.log(`   - Issues: ${issues.length} (5 open, 3 closed)`);
  console.log(`   - Labels: ${labels.length}`);
  console.log(`   - Knowledge Items: ${knowledgeItems.length}`);
  console.log(`   - Wiki Pages: ${wikiPages.length}`);
  console.log(`   - Security Findings: ${securityFindings.length} (2 open, 1 false positive)`);
  console.log(`   - Agent Personas: ${personas.length}`);
  console.log(`   - Comments: 3`);
  console.log('\n🎉 Ready to use!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
