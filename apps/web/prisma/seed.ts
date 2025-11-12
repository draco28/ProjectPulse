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
                        sessions: {
                          create: [
                            {
                              title: 'Initial schema planning session',
                              status: 'COMPLETED',
                              progress: 100,
                              startDate: new Date('2025-11-06T10:00:00Z'),
                              endDate: new Date('2025-11-06T10:15:00Z'),
                            },
                            {
                              title: 'Expert consultation session',
                              status: 'COMPLETED',
                              progress: 100,
                              startDate: new Date('2025-11-06T10:15:00Z'),
                              endDate: new Date('2025-11-06T10:30:00Z'),
                            },
                            {
                              title: 'Schema review and refinement',
                              status: 'COMPLETED',
                              progress: 100,
                              startDate: new Date('2025-11-06T10:30:00Z'),
                            },
                          ],
                        },
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
  await prisma.onboardingSession.deleteMany();
  await prisma.onboardingTemplate.deleteMany();
  const onboardingTemplates = [
    {
      sessionNumber: 1,
      name: 'Executive Summary',
      promptTemplate: `# ProjectPulse - New Project Onboarding (Session 1/3)

Welcome! Let's initialize your project with a quick onboarding session.

## Executive Summary Collection

Please answer these 10 questions to help me understand your project:

1. Project Name: What are you building?
2. Target Users: Who will use this product?
3. Problem Statement: What problem does it solve?
4. Tech Stack: What technologies are you using? (languages, frameworks, databases)
5. Project Phase: Where are you in development? (planning, active development, maintenance, refactoring)
6. Team Size: How many developers?
7. Timeline: Development timeline or deadline?
8. Key Features: Top 3 most important features?
9. Technical Constraints: Any limitations? (budget, hosting, compliance requirements)
10. Success Criteria: How will you measure success?`,
      variables: { expectedVariables: ['project_name', 'target_users', 'problem_statement', 'tech_stack', 'project_phase', 'team_size', 'timeline', 'key_features', 'technical_constraints', 'success_criteria'] },
      isActive: true,
    },
    {
      sessionNumber: 2,
      name: 'Industry Documentation',
      promptTemplate: `# ProjectPulse - New Project Onboarding (Session 2/3)

Based on your executive summary:

Project: {project_name}
Problem: {problem_statement}
Users: {target_users}
Tech Stack: {tech_stack}

## Documentation Generation Task

Please generate the following industry-standard documents:

1) Product Requirements Document (PRD)
2) System Requirements Specification (SRS)
3) Architecture Overview`,
      variables: { expectedVariables: ['project_name', 'problem_statement', 'target_users', 'tech_stack', 'key_features', 'success_criteria', 'technical_constraints'] },
      isActive: true,
    },
    {
      sessionNumber: 3,
      name: 'AI Workflow Blueprint',
      promptTemplate: `# ProjectPulse - New Project Onboarding (Session 3/3)

Based on your project documentation (PRD, SRS, Architecture), create your AI workflow blueprint with Memory Bank files, SOPs, and Agent Skills.`,
      variables: { expectedVariables: ['tech_stack', 'project_name', 'target_users', 'key_features', 'project_phase'] },
      isActive: true,
    },
  ];
  for (const t of onboardingTemplates) {
    await prisma.onboardingTemplate.upsert({
      where: { sessionNumber_isActive: { sessionNumber: t.sessionNumber, isActive: true } },
      update: {
        name: t.name,
        promptTemplate: t.promptTemplate,
        variables: t.variables,
        isActive: true,
        updatedAt: new Date(),
      },
      create: t,
    });
  }
  console.log(`✓ Seeded ${onboardingTemplates.length} onboarding templates\n`);

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

  // ROOT LEVEL PAGES
  const rootPages = await Promise.all([
    // 1. Getting Started (root, getting-started category)
    prisma.wikiPage.create({
      data: {
        title: 'Getting Started with ProjectPulse',
        path: '/getting-started',
        category: 'getting-started',
        orderIndex: 0,
        content: `# Getting Started with ProjectPulse

Welcome to ProjectPulse! This guide will help you set up and start using the platform.

## What is ProjectPulse?

ProjectPulse is a comprehensive project management and development hub that combines:
- **Issue Tracking**: Manage bugs, features, and tasks with customizable workflows
- **Knowledge Base**: Store and search technical documentation with AI-powered semantic search
- **Wiki**: Create hierarchical documentation with full-text search
- **Sprint Planning**: Track phases, weeks, days, tasks, and sessions in a 5-level hierarchy
- **Security Scanning**: Integrate with security tools to track vulnerabilities
- **Agent Personas**: Use AI assistants specialized for code review, debugging, and documentation

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 16.x with pgvector extension ([Installation Guide](/guides/docker-setup))
- **pnpm** 8.x or higher (\`npm install -g pnpm\`)
- **Git** for version control

## Installation Steps

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/draco28/ProjectPulse.git
cd ProjectPulse
\`\`\`

### 2. Install Dependencies

\`\`\`bash
pnpm install
\`\`\`

### 3. Set Up Environment Variables

Create a \`.env\` file in the \`apps/web\` directory:

\`\`\`bash
# Database
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Authentication (optional for MVP)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
\`\`\`

> **Note**: For production, generate a secure random secret with: \`openssl rand -base64 32\`

### 4. Start PostgreSQL

Using Docker Compose:

\`\`\`bash
docker-compose up -d
\`\`\`

Verify PostgreSQL is running:

\`\`\`bash
docker ps
# Should show: postgres:16-alpine container running on port 5432
\`\`\`

### 5. Run Database Migrations

\`\`\`bash
cd apps/web
pnpm prisma migrate dev
\`\`\`

### 6. Seed the Database

\`\`\`bash
pnpm prisma db seed
\`\`\`

This creates:
- Sample Sprint 1 hierarchy (Phase, Weeks, Days, Tasks, Sessions)
- Sample issues with labels and comments
- Knowledge base articles
- Wiki pages (you're reading one!)
- Agent personas

### 7. Start Development Server

\`\`\`bash
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Quick Start Guide

### Create Your First Project

1. Navigate to **Projects** in the sidebar
2. Click **"New Project"**
3. Enter project details:
   - **Name**: Your project name
   - **Description**: Brief overview
   - **Repository**: GitHub URL (optional)
4. Click **"Create Project"**

### Create Your First Issue

1. Navigate to **Issues** in the sidebar
2. Click **"New Issue"**
3. Fill in issue details:
   - **Title**: Brief description
   - **Status**: open, in_progress, or closed
   - **Priority**: critical, high, medium, or low
   - **Module**: Component/area affected
   - **Assignee**: Team member (optional)
4. Click **"Create Issue"**

### Search the Knowledge Base

1. Navigate to **Knowledge Base** in the sidebar
2. Use the search bar to find articles by:
   - **Keyword search**: Full-text search using PostgreSQL tsvector
   - **Category filter**: Database, Frontend, Backend, etc.
   - **Tag filter**: Select multiple tags

### Browse Wiki Documentation

1. Navigate to **Wiki** in the sidebar
2. Browse hierarchical documentation tree
3. Use search to find specific pages
4. Click links to navigate between related pages

## Next Steps

- [Configuration Guide](/configuration) - Configure environment and settings
- [API Documentation](/reference/api) - Learn about REST API endpoints
- [Docker Setup Guide](/guides/docker-setup) - Set up PostgreSQL with Docker
- [Troubleshooting](/troubleshooting) - Common issues and solutions

## Getting Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/draco28/ProjectPulse/issues)
- **Wiki**: Browse documentation in the Wiki section
- **Knowledge Base**: Search for technical articles

---

**Last Updated**: 2025-11-10
**Version**: 1.0`,
      },
    }),

    // 2. Configuration (root, getting-started category)
    prisma.wikiPage.create({
      data: {
        title: 'Configuration',
        path: '/configuration',
        category: 'getting-started',
        orderIndex: 1,
        content: `# Configuration

Learn how to configure ProjectPulse for your team and environment.

## Environment Variables

ProjectPulse uses environment variables for configuration. Create a \`.env\` file in \`apps/web/\`:

### Required Variables

\`\`\`bash
# Database Connection
DATABASE_URL="postgresql://username:password@host:port/database"

# Example (local development)
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev"

# Example (production with SSL)
DATABASE_URL="postgresql://user:pass@production-host:5432/projectpulse_prod?sslmode=require"
\`\`\`

### Optional Variables

\`\`\`bash
# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Authentication (NextAuth.js)
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# GitHub OAuth (optional)
GITHUB_CLIENT_ID="your-github-oauth-app-id"
GITHUB_CLIENT_SECRET="your-github-oauth-app-secret"

# PostgreSQL Connection Pool
DATABASE_CONNECTION_LIMIT="10"
DATABASE_POOL_TIMEOUT="20"
\`\`\`

## Database Setup

ProjectPulse requires PostgreSQL 16+ with the **pgvector** extension for semantic search.

### Enable Required Extensions

Connect to your database and run:

\`\`\`sql
-- Enable vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable trigram similarity for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable full-text search (pre-installed)
-- tsvector and tsquery are built-in
\`\`\`

### Verify Extensions

\`\`\`sql
SELECT * FROM pg_extension WHERE extname IN ('vector', 'pg_trgm');

-- Should return:
-- extname | extversion
-- --------+-----------
-- vector  | 0.5.1
-- pg_trgm | 1.6
\`\`\`

### Connection Pooling

For production, configure connection pooling:

\`\`\`bash
# .env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=30"
\`\`\`

**Recommended Settings**:
- **Development**: \`connection_limit=5\`
- **Production**: \`connection_limit=20-50\` (based on server capacity)

## Theme Customization

ProjectPulse uses the **Coral Neumorphic** theme by default with CSS custom properties.

### Theme Variables

Edit \`apps/web/app/globals.css\`:

\`\`\`css
:root[data-theme="coral"] {
  /* Background Colors */
  --background: #fff7ed;
  --foreground: #44403c;

  /* Neumorphic Shadows */
  --neu-light: #ffffff;
  --neu-dark: #e8c8b0;

  /* Accent Colors */
  --primary: #f97316;
  --primary-foreground: #ffffff;

  /* ... more variables */
}
\`\`\`

### Custom Theme

To create a custom theme:

1. Add theme definition in \`globals.css\`
2. Update theme selector in Settings page
3. Restart development server

## Prisma Configuration

### Generate Client

After schema changes:

\`\`\`bash
pnpm prisma generate
\`\`\`

### Migration Workflow

**Development**:
\`\`\`bash
# Create and apply migration
pnpm prisma migrate dev --name add_new_field

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset
\`\`\`

**Production**:
\`\`\`bash
# Apply pending migrations
pnpm prisma migrate deploy

# Rollback is manual - create new migration to revert
\`\`\`

### Prisma Studio

Explore database with GUI:

\`\`\`bash
pnpm prisma studio
\`\`\`

Opens [http://localhost:5555](http://localhost:5555)

## TypeScript Configuration

ProjectPulse uses **strict mode** TypeScript:

\`\`\`json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
\`\`\`

### Type Generation

Generate types from Prisma schema:

\`\`\`bash
pnpm prisma generate
\`\`\`

Types available at:
\`\`\`typescript
import { Issue, WikiPage, KnowledgeItem } from '@prisma/client';
\`\`\`

## Next Steps

- [Docker Setup Guide](/guides/docker-setup) - Set up PostgreSQL with Docker
- [Database Migrations Guide](/guides/database-migrations) - Learn migration workflow
- [API Documentation](/reference/api) - Configure API access

---

**Last Updated**: 2025-11-10
**Version**: 1.0`,
      },
    }),

    // 3. Development Guides (parent page)
    prisma.wikiPage.create({
      data: {
        title: 'Development Guides',
        path: '/guides',
        category: 'guides',
        orderIndex: 2,
        content: `# Development Guides

Comprehensive guides for developing with ProjectPulse.

## Available Guides

### Getting Started
- [Docker Setup](/guides/docker-setup) - Set up PostgreSQL with Docker Compose
- [Database Migrations](/guides/database-migrations) - Prisma migration workflow

### Advanced Topics
- API Development (Coming Soon)
- Testing Strategies (Coming Soon)
- Deployment Guide (Coming Soon)

## Contributing

Want to add a guide? See our [Contributing Guidelines](https://github.com/draco28/ProjectPulse/blob/master/CONTRIBUTING.md).

---

**Last Updated**: 2025-11-10
**Version**: 1.0`,
      },
    }),

    // 4. API Documentation (root, reference category)
    prisma.wikiPage.create({
      data: {
        title: 'API Documentation',
        path: '/reference/api',
        category: 'reference',
        orderIndex: 3,
        content: `# API Documentation

ProjectPulse provides a RESTful API for programmatic access to issues, knowledge base, and wiki pages.

## Base URL

\`\`\`
http://localhost:3000/api
\`\`\`

**Production**: Replace with your deployed domain

## Authentication

Currently, API endpoints are **unauthenticated** (MVP phase).

**Planned**: NextAuth.js integration with JWT bearer tokens:

\`\`\`bash
Authorization: Bearer <your-jwt-token>
\`\`\`

## Response Format

All API responses follow this structure:

**Success Response**:
\`\`\`json
{
  "data": { /* response payload */ },
  "error": null
}
\`\`\`

**Error Response**:
\`\`\`json
{
  "data": null,
  "error": "Error message"
}
\`\`\`

## Endpoints

### Issues API

#### GET /api/issues

Get all issues with optional filtering.

**Query Parameters**:
- \`status\` (optional): Filter by status (open, in_progress, closed)
- \`priority\` (optional): Filter by priority (critical, high, medium, low)
- \`module\` (optional): Filter by module name

**Example Request**:
\`\`\`bash
curl http://localhost:3000/api/issues?status=open&priority=high
\`\`\`

**Example Response**:
\`\`\`json
{
  "data": [
    {
      "id": 1,
      "title": "Add authentication with NextAuth.js",
      "status": "open",
      "priority": "critical",
      "module": "Auth",
      "assignee": "Developer",
      "projectId": 1,
      "createdAt": "2025-10-24T10:00:00.000Z",
      "updatedAt": "2025-10-24T10:00:00.000Z",
      "closedAt": null,
      "labels": [
        { "id": 1, "name": "enhancement", "color": "#a2eeef" }
      ]
    }
  ],
  "error": null
}
\`\`\`

#### POST /api/issues

Create a new issue.

**Request Body**:
\`\`\`json
{
  "title": "Issue title",
  "description": "Detailed description (optional)",
  "status": "open",
  "priority": "high",
  "module": "UI",
  "assignee": "Developer (optional)",
  "projectId": 1
}
\`\`\`

**Example Request**:
\`\`\`bash
curl -X POST http://localhost:3000/api/issues \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Fix button styling",
    "status": "open",
    "priority": "low",
    "module": "UI",
    "projectId": 1
  }'
\`\`\`

**Example Response**:
\`\`\`json
{
  "data": {
    "id": 10,
    "title": "Fix button styling",
    "status": "open",
    "priority": "low",
    "module": "UI",
    "assignee": null,
    "projectId": 1,
    "createdAt": "2025-11-10T14:30:00.000Z",
    "updatedAt": "2025-11-10T14:30:00.000Z"
  },
  "error": null
}
\`\`\`

#### GET /api/issues/:id

Get a single issue by ID.

**Example Request**:
\`\`\`bash
curl http://localhost:3000/api/issues/1
\`\`\`

**Example Response**:
\`\`\`json
{
  "data": {
    "id": 1,
    "title": "Add authentication with NextAuth.js",
    "description": "Implement user authentication...",
    "status": "open",
    "priority": "critical",
    "module": "Auth",
    "labels": [...],
    "comments": [...]
  },
  "error": null
}
\`\`\`

### Wiki API

#### GET /api/wiki

Get all wiki pages.

**Query Parameters**:
- \`category\` (optional): Filter by category

**Example Request**:
\`\`\`bash
curl http://localhost:3000/api/wiki?category=guides
\`\`\`

#### GET /api/wiki/:path

Get wiki page by path (URL-encoded).

**Example Request**:
\`\`\`bash
curl http://localhost:3000/api/wiki/getting-started
\`\`\`

### Knowledge Base API

#### GET /api/knowledge

Get all knowledge base items.

**Query Parameters**:
- \`category\` (optional): Filter by category
- \`q\` (optional): Full-text search query

**Example Request**:
\`\`\`bash
curl http://localhost:3000/api/knowledge?q=postgresql&category=Database
\`\`\`

## Error Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Bad Request (invalid input) |
| 404 | Not Found |
| 500 | Internal Server Error |

## Rate Limiting

**Currently**: No rate limiting (MVP)

**Planned**: 100 requests per minute per IP address

## Pagination

**Currently**: All results returned (MVP)

**Planned**: Cursor-based pagination:
\`\`\`
GET /api/issues?cursor=<last-id>&limit=20
\`\`\`

## Next Steps

- [Troubleshooting Guide](/troubleshooting) - Common API errors
- [Configuration](/configuration) - API environment setup

---

**Last Updated**: 2025-11-10
**Version**: 1.0`,
      },
    }),

    // 5. Troubleshooting (root, troubleshooting category)
    prisma.wikiPage.create({
      data: {
        title: 'Troubleshooting',
        path: '/troubleshooting',
        category: 'troubleshooting',
        orderIndex: 4,
        content: `# Troubleshooting

Common issues and solutions for ProjectPulse.

## Database Connection Issues

### Problem: "Connection refused" or "ECONNREFUSED"

**Symptoms**:
\`\`\`
Error: P1001: Can't reach database server at localhost:5432
\`\`\`

**Causes**:
- PostgreSQL container not running
- Wrong database URL in \`.env\`
- Port 5432 already in use

**Solutions**:

1. **Check PostgreSQL is running**:
   \`\`\`bash
   docker ps
   # Should show: postgres:16-alpine container
   \`\`\`

2. **Start PostgreSQL**:
   \`\`\`bash
   docker-compose up -d
   \`\`\`

3. **Verify DATABASE_URL**:
   \`\`\`bash
   # apps/web/.env
   DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev"
   \`\`\`

4. **Check port availability**:
   \`\`\`bash
   # Windows
   netstat -ano | findstr :5432

   # Mac/Linux
   lsof -i :5432
   \`\`\`

---

## Migration Issues

### Problem: "Migration failed" or "Schema out of sync"

**Symptoms**:
\`\`\`
Error: P3006: Migration failed to apply cleanly to the shadow database
\`\`\`

**Solutions**:

1. **Reset development database** (⚠️ deletes all data):
   \`\`\`bash
   pnpm prisma migrate reset
   \`\`\`

2. **Apply migrations manually**:
   \`\`\`bash
   pnpm prisma migrate dev
   \`\`\`

3. **Regenerate Prisma Client**:
   \`\`\`bash
   pnpm prisma generate
   \`\`\`

---

## pgvector Extension Not Found

### Problem: "Extension 'vector' does not exist"

**Symptoms**:
\`\`\`
ERROR: extension "vector" is not available
\`\`\`

**Solution**:

1. **Connect to database**:
   \`\`\`bash
   docker exec -it projectpulse-db-1 psql -U postgres -d projectpulse_dev
   \`\`\`

2. **Create extension**:
   \`\`\`sql
   CREATE EXTENSION IF NOT EXISTS vector;
   \\dx  -- List extensions to verify
   \`\`\`

3. **Restart Docker container**:
   \`\`\`bash
   docker-compose restart
   \`\`\`

---

## TypeScript Type Errors

### Problem: "Type 'X' is not assignable to type 'Y'"

**Symptoms**:
\`\`\`
Type 'Issue | null' is not assignable to type 'Issue'
\`\`\`

**Solutions**:

1. **Regenerate Prisma Client**:
   \`\`\`bash
   pnpm prisma generate
   \`\`\`

2. **Check for null safety**:
   \`\`\`typescript
   // ❌ Wrong
   const issue = await prisma.issue.findUnique({ where: { id: 1 } });
   console.log(issue.title); // Error: issue might be null

   // ✅ Correct
   const issue = await prisma.issue.findUnique({ where: { id: 1 } });
   if (!issue) throw new Error('Issue not found');
   console.log(issue.title); // Safe
   \`\`\`

3. **Restart TypeScript server** (VS Code):
   - \`Cmd+Shift+P\` (Mac) or \`Ctrl+Shift+P\` (Windows)
   - Type: "TypeScript: Restart TS Server"

---

## Port Already in Use

### Problem: "Port 3000 already in use"

**Symptoms**:
\`\`\`
Error: listen EADDRINUSE: address already in use :::3000
\`\`\`

**Solutions**:

1. **Find process using port 3000**:
   \`\`\`bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F

   # Mac/Linux
   lsof -i :3000
   kill -9 <PID>
   \`\`\`

2. **Change port**:
   \`\`\`bash
   # apps/web/package.json
   "dev": "next dev -p 3001"
   \`\`\`

---

## Seed Script Fails

### Problem: "Unique constraint failed"

**Symptoms**:
\`\`\`
Error: Unique constraint failed on the fields: ('value')
\`\`\`

**Solution**:

Seed script tries to create duplicate data. Reset database:

\`\`\`bash
pnpm prisma migrate reset
# This runs migrations AND seed script automatically
\`\`\`

---

## API Returns 500 Error

### Problem: API endpoint returns 500 Internal Server Error

**Debugging Steps**:

1. **Check terminal logs** (where \`pnpm dev\` runs)
2. **Check Prisma query logs**:
   \`\`\`typescript
   // lib/db.ts
   const prisma = new PrismaClient({
     log: ['query', 'error', 'warn'],
   });
   \`\`\`

3. **Verify database schema matches code**:
   \`\`\`bash
   pnpm prisma db pull  # Pull schema from database
   pnpm prisma generate  # Regenerate client
   \`\`\`

---

## Next Steps

- [Configuration](/configuration) - Environment setup
- [Docker Setup Guide](/guides/docker-setup) - Container configuration
- [API Documentation](/reference/api) - API endpoint reference

---

**Last Updated**: 2025-11-10
**Version**: 1.0`,
      },
    }),
  ]);

  console.log(`✓ Created ${rootPages.length} root-level wiki pages\n`);

  // HIERARCHICAL PAGES (children of "Development Guides")
  const guidesParent = rootPages[2]; // Development Guides

  const childPages = await Promise.all([
    // Docker Setup Guide (child of Development Guides)
    prisma.wikiPage.create({
      data: {
        title: 'Docker Setup Guide',
        path: '/guides/docker-setup',
        category: 'guides',
        orderIndex: 0,
        parentId: guidesParent.id, // Set parent relationship
        content: `# Docker Setup Guide

Set up PostgreSQL 16 with pgvector extension using Docker Compose.

## Prerequisites

- Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))
- Docker Compose CLI (included in Docker Desktop)

## docker-compose.yml

Create \`docker-compose.yml\` in project root:

\`\`\`yaml
version: '3.8'

services:
  postgres:
    image: ankane/pgvector:latest
    container_name: projectpulse-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
      POSTGRES_DB: projectpulse_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
\`\`\`

## Start PostgreSQL

\`\`\`bash
docker-compose up -d
\`\`\`

**Flags**:
- \`-d\`: Run in detached mode (background)

## Verify Setup

\`\`\`bash
# Check container status
docker ps

# Check logs
docker logs projectpulse-db

# Connect to database
docker exec -it projectpulse-db psql -U postgres -d projectpulse_dev
\`\`\`

## Enable Extensions

\`\`\`sql
-- Enable pgvector (semantic search)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_trgm (fuzzy search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Verify extensions
\\dx
\`\`\`

## Stop PostgreSQL

\`\`\`bash
docker-compose down
\`\`\`

**Preserve data**:
\`\`\`bash
docker-compose down  # Keeps volumes
\`\`\`

**Delete data**:
\`\`\`bash
docker-compose down -v  # Removes volumes
\`\`\`

## Troubleshooting

See [Troubleshooting Guide](/troubleshooting) for common Docker issues.

---

**Last Updated**: 2025-11-10
**Version**: 1.0`,
      },
    }),

    // Database Migrations Guide (child of Development Guides)
    prisma.wikiPage.create({
      data: {
        title: 'Database Migrations Guide',
        path: '/guides/database-migrations',
        category: 'guides',
        orderIndex: 1,
        parentId: guidesParent.id,
        content: `# Database Migrations Guide

Learn how to manage database schema changes with Prisma Migrate.

## Overview

Prisma Migrate tracks schema changes as migration files in \`prisma/migrations/\`.

## Development Workflow

### 1. Modify Schema

Edit \`prisma/schema.prisma\`:

\`\`\`prisma
model Issue {
  id          Int      @id @default(autoincrement())
  title       String
  description String?  @db.Text

  // Add new field
  estimatedHours Int? // New field
}
\`\`\`

### 2. Create Migration

\`\`\`bash
pnpm prisma migrate dev --name add_estimated_hours
\`\`\`

**What happens**:
1. Generates SQL migration file
2. Applies migration to database
3. Regenerates Prisma Client

### 3. Review Migration SQL

Check \`prisma/migrations/YYYYMMDDHHMMSS_add_estimated_hours/migration.sql\`:

\`\`\`sql
-- AlterTable
ALTER TABLE "issues" ADD COLUMN "estimatedHours" INTEGER;
\`\`\`

### 4. Commit Migration

\`\`\`bash
git add prisma/migrations
git commit -m "feat: add estimatedHours to Issue model"
\`\`\`

## Production Workflow

### Apply Migrations

\`\`\`bash
pnpm prisma migrate deploy
\`\`\`

**Use in**:
- CI/CD pipelines
- Production deployments
- Staging environments

### Rollback

Prisma does NOT support automatic rollback. To rollback:

1. Create new migration that reverts changes
2. Apply new migration

**Example** (remove field):
\`\`\`prisma
model Issue {
  // Remove estimatedHours field
}
\`\`\`

\`\`\`bash
pnpm prisma migrate dev --name remove_estimated_hours
\`\`\`

## Common Operations

### Reset Database (Development Only)

⚠️ **WARNING**: Deletes ALL data

\`\`\`bash
pnpm prisma migrate reset
\`\`\`

**What happens**:
1. Drops database
2. Recreates database
3. Applies all migrations
4. Runs seed script

### Prototype Mode (No Migration Files)

For rapid prototyping:

\`\`\`bash
pnpm prisma db push
\`\`\`

**Use when**:
- Testing schema changes
- Prototyping features
- NOT for production

### View Migration Status

\`\`\`bash
pnpm prisma migrate status
\`\`\`

## Best Practices

1. ✅ **Always review generated SQL** before committing
2. ✅ **Test migrations on staging** before production
3. ✅ **Backup production database** before major migrations
4. ✅ **Use descriptive migration names**
5. ❌ **Never edit applied migrations**
6. ❌ **Never use \`migrate reset\` in production**

## Next Steps

- [Configuration](/configuration) - Database connection setup
- [Troubleshooting](/troubleshooting) - Migration error solutions

---

**Last Updated**: 2025-11-10
**Version**: 1.0`,
      },
    }),
  ]);

  console.log(`✓ Created ${childPages.length} child pages under "Development Guides"\n`);

  // CREATE CROSS-LINKS BETWEEN PAGES
  console.log('🔗 Creating page links...');

  await prisma.pageLink.createMany({
    data: [
      // Getting Started → Configuration
      {
        sourcePageId: rootPages[0].id,
        targetPageId: rootPages[1].id,
      },
      // Getting Started → Docker Setup
      {
        sourcePageId: rootPages[0].id,
        targetPageId: childPages[0].id,
      },
      // Configuration → Docker Setup
      {
        sourcePageId: rootPages[1].id,
        targetPageId: childPages[0].id,
      },
      // Configuration → Database Migrations
      {
        sourcePageId: rootPages[1].id,
        targetPageId: childPages[1].id,
      },
      // API Documentation → Troubleshooting
      {
        sourcePageId: rootPages[3].id,
        targetPageId: rootPages[4].id,
      },
      // Troubleshooting → Configuration
      {
        sourcePageId: rootPages[4].id,
        targetPageId: rootPages[1].id,
      },
      // Troubleshooting → Docker Setup
      {
        sourcePageId: rootPages[4].id,
        targetPageId: childPages[0].id,
      },
    ],
  });

  console.log(`✓ Created 7 page links\n`);

  console.log(`✓ Wiki seeding complete: ${rootPages.length + childPages.length} pages total\n`);

  console.log('[wiki] Capturing initial wiki revisions...');
  const allWikiPages = await prisma.wikiPage.findMany();

  await prisma.$transaction(
    allWikiPages.map((page) =>
      prisma.wikiRevision.create({
        data: {
          wikiPageId: page.id,
          version: page.version,
          title: page.title,
          excerpt: page.excerpt,
          content: page.content,
          diffSummary: 'Initial import from seed script',
          createdBy: 'seed-script',
          createdByType: 'system',
        },
      })
    )
  );

  await prisma.$transaction(
    allWikiPages.map((page) =>
      prisma.wikiPage.update({
        where: { id: page.id },
        data: {
          lastEditedBy: 'Seed Script',
          lastEditedAt: page.updatedAt,
        },
      })
    )
  );

  console.log(`✓ Seeded ${allWikiPages.length} wiki revisions\n`);

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
  // WORKFLOW TEMPLATES (Sprint 3)
  // ========================================================================
  console.log('🔄 Creating workflow templates...');

  const workflowTemplates = [
    {
      name: 'Feature Implementation',
      description: 'Complete workflow for implementing a new feature from planning to deployment',
      category: 'development',
      steps: [
        { stepNumber: 1, name: 'Create Feature Branch', description: 'Create new git branch for feature', mcpTool: null, preconditions: ['git status is clean'], postconditions: ['branch exists', 'checked out to new branch'] },
        { stepNumber: 2, name: 'Run Onboarding Session', description: 'Gather feature context via onboarding', mcpTool: 'onboarding.getPrompt', mcpToolArgs: { sessionNumber: 1 }, preconditions: ['project exists'], postconditions: ['context gathered'] },
        { stepNumber: 3, name: 'Create Wiki Page', description: 'Document feature requirements and design', mcpTool: 'wiki.create', mcpToolArgs: { title: '{featureName} Documentation', category: 'features' }, preconditions: ['feature context ready'], postconditions: ['wiki page created'] },
        { stepNumber: 4, name: 'Create Sprint Task', description: 'Track feature in sprint system', mcpTool: 'sprint.task.create', mcpToolArgs: { title: '{featureName}', dayId: '{currentDayId}' }, preconditions: ['dayId exists'], postconditions: ['taskId returned'] },
        { stepNumber: 5, name: 'Implement Feature Code', description: 'Write implementation code', mcpTool: null, preconditions: ['task created'], postconditions: ['code committed'] },
        { stepNumber: 6, name: 'Run Tests', description: 'Execute unit and integration tests', mcpTool: null, preconditions: ['code committed'], postconditions: ['all tests pass'] },
        { stepNumber: 7, name: 'Create Checkpoint', description: 'Save progress checkpoint', mcpTool: 'sprint.checkpoint.create', mcpToolArgs: { sessionId: '{sessionId}' }, preconditions: ['tests passing'], postconditions: ['checkpoint created'] },
        { stepNumber: 8, name: 'Create Pull Request', description: 'Open PR for code review', mcpTool: null, preconditions: ['branch pushed'], postconditions: ['PR created'] },
        { stepNumber: 9, name: 'Update Wiki', description: 'Update wiki with implementation details', mcpTool: 'wiki.update', mcpToolArgs: { id: '{wikiPageId}' }, preconditions: ['PR merged'], postconditions: ['wiki updated'] },
        { stepNumber: 10, name: 'Complete Task', description: 'Mark sprint task as complete', mcpTool: 'sprint.updateProgress', mcpToolArgs: { taskId: '{taskId}', progress: 100 }, preconditions: ['PR merged'], postconditions: ['task completed'] },
      ],
    },
    {
      name: 'Bug Fix',
      description: 'Systematic workflow for investigating and fixing bugs',
      category: 'development',
      steps: [
        { stepNumber: 1, name: 'Create Bug Fix Branch', description: 'Create new git branch for bug fix', mcpTool: null, preconditions: ['git status is clean'], postconditions: ['branch exists'] },
        { stepNumber: 2, name: 'Investigate Issue', description: 'Reproduce bug and analyze root cause', mcpTool: null, preconditions: ['issue reported'], postconditions: ['root cause identified'] },
        { stepNumber: 3, name: 'Document Investigation', description: 'Create or update wiki with findings', mcpTool: 'wiki.create', mcpToolArgs: { title: 'Bug: {bugTitle}', category: 'troubleshooting' }, preconditions: ['investigation complete'], postconditions: ['documentation created'] },
        { stepNumber: 4, name: 'Create Sprint Task', description: 'Track bug fix in sprint', mcpTool: 'sprint.task.create', mcpToolArgs: { title: 'Fix: {bugTitle}' }, preconditions: ['investigation done'], postconditions: ['task created'] },
        { stepNumber: 5, name: 'Implement Fix', description: 'Write fix code with tests', mcpTool: null, preconditions: ['root cause known'], postconditions: ['fix committed'] },
        { stepNumber: 6, name: 'Run Tests', description: 'Verify fix and regression tests', mcpTool: null, preconditions: ['fix committed'], postconditions: ['all tests pass'] },
        { stepNumber: 7, name: 'Create Pull Request', description: 'Open PR with fix', mcpTool: null, preconditions: ['tests pass'], postconditions: ['PR created'] },
        { stepNumber: 8, name: 'Complete Task', description: 'Mark bug fix complete', mcpTool: 'sprint.updateProgress', mcpToolArgs: { taskId: '{taskId}', progress: 100 }, preconditions: ['PR merged'], postconditions: ['task completed'] },
      ],
    },
    {
      name: 'Refactoring',
      description: 'Safe refactoring workflow with comprehensive testing',
      category: 'development',
      steps: [
        { stepNumber: 1, name: 'Create Refactoring Branch', description: 'Create new git branch', mcpTool: null, preconditions: ['git status is clean'], postconditions: ['branch exists'] },
        { stepNumber: 2, name: 'Analyze Code', description: 'Identify refactoring opportunities', mcpTool: null, preconditions: ['target code identified'], postconditions: ['analysis complete'] },
        { stepNumber: 3, name: 'Create Sprint Task', description: 'Track refactoring work', mcpTool: 'sprint.task.create', mcpToolArgs: { title: 'Refactor: {target}' }, preconditions: ['analysis done'], postconditions: ['task created'] },
        { stepNumber: 4, name: 'Refactor Code', description: 'Apply refactoring changes', mcpTool: null, preconditions: ['tests exist'], postconditions: ['refactoring done'] },
        { stepNumber: 5, name: 'Run Tests', description: 'Verify behavior unchanged', mcpTool: null, preconditions: ['refactoring done'], postconditions: ['all tests pass'] },
        { stepNumber: 6, name: 'Create Pull Request', description: 'Open PR for review', mcpTool: null, preconditions: ['tests pass'], postconditions: ['PR created'] },
        { stepNumber: 7, name: 'Complete Task', description: 'Mark refactoring complete', mcpTool: 'sprint.updateProgress', mcpToolArgs: { taskId: '{taskId}', progress: 100 }, preconditions: ['PR merged'], postconditions: ['task completed'] },
      ],
    },
    {
      name: 'Documentation Update',
      description: 'Workflow for creating or updating project documentation',
      category: 'development',
      steps: [
        { stepNumber: 1, name: 'Create Docs Branch', description: 'Create new git branch for documentation', mcpTool: null, preconditions: ['git status is clean'], postconditions: ['branch exists'] },
        { stepNumber: 2, name: 'Create/Update Wiki Page', description: 'Write documentation content', mcpTool: 'wiki.create', mcpToolArgs: { title: '{docTitle}', category: '{docCategory}' }, preconditions: ['content prepared'], postconditions: ['wiki page saved'] },
        { stepNumber: 3, name: 'Review Content', description: 'Proofread and validate accuracy', mcpTool: null, preconditions: ['draft complete'], postconditions: ['review done'] },
        { stepNumber: 4, name: 'Create Pull Request', description: 'Submit documentation for review', mcpTool: null, preconditions: ['review passed'], postconditions: ['PR created'] },
        { stepNumber: 5, name: 'Complete Task', description: 'Finalize documentation', mcpTool: 'sprint.updateProgress', mcpToolArgs: { taskId: '{taskId}', progress: 100 }, preconditions: ['PR merged'], postconditions: ['docs published'] },
      ],
    },
    {
      name: 'Test Coverage Improvement',
      description: 'Systematic workflow for improving test coverage',
      category: 'development',
      steps: [
        { stepNumber: 1, name: 'Create Testing Branch', description: 'Create new git branch', mcpTool: null, preconditions: ['git status is clean'], postconditions: ['branch exists'] },
        { stepNumber: 2, name: 'Identify Coverage Gaps', description: 'Analyze coverage report', mcpTool: null, preconditions: ['coverage report exists'], postconditions: ['gaps identified'] },
        { stepNumber: 3, name: 'Create Sprint Task', description: 'Track testing work', mcpTool: 'sprint.task.create', mcpToolArgs: { title: 'Test Coverage: {target}' }, preconditions: ['gaps known'], postconditions: ['task created'] },
        { stepNumber: 4, name: 'Write Tests', description: 'Implement missing tests', mcpTool: null, preconditions: ['test plan ready'], postconditions: ['tests written'] },
        { stepNumber: 5, name: 'Verify Coverage', description: 'Run coverage report and validate improvement', mcpTool: null, preconditions: ['tests written'], postconditions: ['coverage increased'] },
        { stepNumber: 6, name: 'Create Pull Request', description: 'Submit tests for review', mcpTool: null, preconditions: ['coverage verified'], postconditions: ['PR created'] },
      ],
    },
    {
      name: 'Database Migration',
      description: 'Safe database schema migration workflow',
      category: 'development',
      steps: [
        { stepNumber: 1, name: 'Create Migration Branch', description: 'Create new git branch', mcpTool: null, preconditions: ['git status is clean'], postconditions: ['branch exists'] },
        { stepNumber: 2, name: 'Update Prisma Schema', description: 'Modify schema.prisma file', mcpTool: null, preconditions: ['requirements clear'], postconditions: ['schema updated'] },
        { stepNumber: 3, name: 'Generate Migration', description: 'Run prisma migrate dev', mcpTool: null, preconditions: ['schema valid'], postconditions: ['migration created'] },
        { stepNumber: 4, name: 'Test Migration', description: 'Apply migration to test database', mcpTool: null, preconditions: ['migration generated'], postconditions: ['migration tested'] },
        { stepNumber: 5, name: 'Update Seed Script', description: 'Add seed data for new models', mcpTool: null, preconditions: ['migration tested'], postconditions: ['seed updated'] },
        { stepNumber: 6, name: 'Deploy Migration', description: 'Apply to production database', mcpTool: null, preconditions: ['testing complete'], postconditions: ['migration deployed'] },
        { stepNumber: 7, name: 'Verify Deployment', description: 'Check production database', mcpTool: null, preconditions: ['migration deployed'], postconditions: ['deployment verified'] },
        { stepNumber: 8, name: 'Create Pull Request', description: 'Submit schema changes', mcpTool: null, preconditions: ['deployment verified'], postconditions: ['PR created'] },
        { stepNumber: 9, name: 'Complete Task', description: 'Mark migration complete', mcpTool: 'sprint.updateProgress', mcpToolArgs: { taskId: '{taskId}', progress: 100 }, preconditions: ['PR merged'], postconditions: ['task completed'] },
      ],
    },
    {
      name: 'Sprint Planning',
      description: 'Setup new sprint with phases, weeks, days, and tasks',
      category: 'project-management',
      steps: [
        { stepNumber: 1, name: 'Create Sprint Phase', description: 'Initialize new phase', mcpTool: 'sprint.phase.create', mcpToolArgs: { title: '{sprintTitle}', description: '{sprintDescription}' }, preconditions: ['planning complete'], postconditions: ['phase created'] },
        { stepNumber: 2, name: 'Create Week 1', description: 'Create first week', mcpTool: 'sprint.week.create', mcpToolArgs: { phaseId: '{phaseId}', title: 'Week 1' }, preconditions: ['phase exists'], postconditions: ['week 1 created'] },
        { stepNumber: 3, name: 'Create Week 2', description: 'Create second week', mcpTool: 'sprint.week.create', mcpToolArgs: { phaseId: '{phaseId}', title: 'Week 2' }, preconditions: ['week 1 exists'], postconditions: ['week 2 created'] },
        { stepNumber: 4, name: 'Create Days', description: 'Create day entries for each week', mcpTool: 'sprint.day.create', mcpToolArgs: { weekId: '{weekId}' }, preconditions: ['weeks created'], postconditions: ['days created'] },
        { stepNumber: 5, name: 'Assign Tasks', description: 'Create and assign tasks to days', mcpTool: 'sprint.task.create', mcpToolArgs: { dayId: '{dayId}' }, preconditions: ['days exist'], postconditions: ['tasks assigned'] },
        { stepNumber: 6, name: 'Set Sprint Goals', description: 'Document sprint objectives', mcpTool: 'wiki.create', mcpToolArgs: { title: '{sprintTitle} Goals', category: 'planning' }, preconditions: ['tasks assigned'], postconditions: ['goals documented'] },
      ],
    },
    {
      name: 'Sprint Review',
      description: 'Complete sprint review and generate completion report',
      category: 'project-management',
      steps: [
        { stepNumber: 1, name: 'Gather Sprint Metrics', description: 'Collect completion statistics', mcpTool: 'sprint.getCurrentTask', mcpToolArgs: {}, preconditions: ['sprint complete'], postconditions: ['metrics gathered'] },
        { stepNumber: 2, name: 'Create Completion Document', description: 'Generate sprint summary', mcpTool: 'wiki.create', mcpToolArgs: { title: '{sprintTitle} Completion', category: 'retrospective' }, preconditions: ['metrics ready'], postconditions: ['document created'] },
        { stepNumber: 3, name: 'Update Progress Tracker', description: 'Update project progress', mcpTool: 'sprint.updateProgress', mcpToolArgs: { phaseId: '{phaseId}', progress: 100 }, preconditions: ['review done'], postconditions: ['progress updated'] },
        { stepNumber: 4, name: 'Sprint Demo', description: 'Present completed work', mcpTool: null, preconditions: ['document ready'], postconditions: ['demo completed'] },
        { stepNumber: 5, name: 'Archive Sprint', description: 'Archive sprint artifacts', mcpTool: null, preconditions: ['demo done'], postconditions: ['sprint archived'] },
      ],
    },
    {
      name: 'Progress Checkpoint',
      description: 'Create progress checkpoint during active work',
      category: 'project-management',
      steps: [
        { stepNumber: 1, name: 'Query Current Task', description: 'Get current task context', mcpTool: 'sprint.getCurrentTask', mcpToolArgs: {}, preconditions: ['session active'], postconditions: ['context retrieved'] },
        { stepNumber: 2, name: 'Create Checkpoint', description: 'Save progress snapshot', mcpTool: 'sprint.checkpoint.create', mcpToolArgs: { sessionId: '{sessionId}' }, preconditions: ['context ready'], postconditions: ['checkpoint saved'] },
        { stepNumber: 3, name: 'Update Progress', description: 'Update task progress', mcpTool: 'sprint.updateProgress', mcpToolArgs: { taskId: '{taskId}', progress: '{currentProgress}' }, preconditions: ['checkpoint created'], postconditions: ['progress updated'] },
        { stepNumber: 4, name: 'Save Session Log', description: 'Document session notes', mcpTool: null, preconditions: ['progress updated'], postconditions: ['log saved'] },
      ],
    },
    {
      name: 'Wiki Page Creation',
      description: 'Structured workflow for creating comprehensive wiki pages',
      category: 'knowledge',
      steps: [
        { stepNumber: 1, name: 'Gather Context', description: 'Run onboarding to collect information', mcpTool: 'onboarding.getPrompt', mcpToolArgs: { sessionNumber: 1 }, preconditions: ['topic chosen'], postconditions: ['context gathered'] },
        { stepNumber: 2, name: 'Draft Content', description: 'Write initial wiki content', mcpTool: null, preconditions: ['context ready'], postconditions: ['draft complete'] },
        { stepNumber: 3, name: 'Create Wiki Page', description: 'Save page via MCP', mcpTool: 'wiki.create', mcpToolArgs: { title: '{pageTitle}', category: '{pageCategory}' }, preconditions: ['draft reviewed'], postconditions: ['page created'] },
        { stepNumber: 4, name: 'Review Content', description: 'Proofread and validate', mcpTool: null, preconditions: ['page created'], postconditions: ['review complete'] },
        { stepNumber: 5, name: 'Publish Page', description: 'Make page visible', mcpTool: null, preconditions: ['review passed'], postconditions: ['page published'] },
      ],
    },
    {
      name: 'Knowledge Search',
      description: 'Comprehensive search across multiple knowledge sources',
      category: 'knowledge',
      steps: [
        { stepNumber: 1, name: 'Define Search Requirements', description: 'Clarify what information is needed', mcpTool: null, preconditions: ['query provided'], postconditions: ['requirements clear'] },
        { stepNumber: 2, name: 'Search Wiki', description: 'Search wiki pages', mcpTool: 'wiki.search', mcpToolArgs: { query: '{searchQuery}' }, preconditions: ['requirements defined'], postconditions: ['wiki results returned'] },
        { stepNumber: 3, name: 'Search Codebase', description: 'Search code and documentation', mcpTool: null, preconditions: ['wiki searched'], postconditions: ['code results returned'] },
        { stepNumber: 4, name: 'Synthesize Results', description: 'Combine and summarize findings', mcpTool: null, preconditions: ['searches complete'], postconditions: ['summary created'] },
      ],
    },
    {
      name: 'Onboarding New Project',
      description: 'Complete 3-session project onboarding workflow',
      category: 'knowledge',
      steps: [
        { stepNumber: 1, name: 'Executive Summary Session', description: 'Collect high-level project info', mcpTool: 'onboarding.getPrompt', mcpToolArgs: { sessionNumber: 1 }, preconditions: ['project started'], postconditions: ['session 1 complete'] },
        { stepNumber: 2, name: 'Industry Documentation Session', description: 'Generate PRD, SRS, Architecture', mcpTool: 'onboarding.getPrompt', mcpToolArgs: { sessionNumber: 2 }, preconditions: ['session 1 done'], postconditions: ['session 2 complete'] },
        { stepNumber: 3, name: 'AI Workflow Blueprint Session', description: 'Setup memory bank and SOPs', mcpTool: 'onboarding.getPrompt', mcpToolArgs: { sessionNumber: 3 }, preconditions: ['session 2 done'], postconditions: ['session 3 complete'] },
        { stepNumber: 4, name: 'Create Project Wiki', description: 'Initialize project documentation', mcpTool: 'wiki.create', mcpToolArgs: { title: '{projectName} Overview', category: 'projects' }, preconditions: ['onboarding complete'], postconditions: ['wiki created'] },
        { stepNumber: 5, name: 'Create Sprint Phase', description: 'Setup initial sprint', mcpTool: 'sprint.phase.create', mcpToolArgs: { title: 'Phase 1: Foundation' }, preconditions: ['wiki created'], postconditions: ['phase created'] },
        { stepNumber: 6, name: 'Setup Progress Tracking', description: 'Initialize tracking systems', mcpTool: null, preconditions: ['phase created'], postconditions: ['tracking active'] },
        { stepNumber: 7, name: 'Create Checkpoint', description: 'Save onboarding checkpoint', mcpTool: 'sprint.checkpoint.create', mcpToolArgs: { sessionId: '{sessionId}' }, preconditions: ['setup complete'], postconditions: ['checkpoint saved'] },
      ],
    },
  ];

  for (const template of workflowTemplates) {
    await prisma.workflowTemplate.upsert({
      where: { name: template.name },
      update: {
        description: template.description,
        category: template.category,
        steps: template.steps,
        isActive: true,
      },
      create: template,
    });
  }

  console.log(`✓ Created ${workflowTemplates.length} workflow templates\n`);

  // ========================================================================
  // SUMMARY
  // ========================================================================
  console.log('✅ Database seed complete!\n');
  console.log('📊 Summary:');
  console.log(`   - Projects: 1`);
  console.log(`   - Issues: ${issues.length} (5 open, 3 closed)`);
  console.log(`   - Labels: ${labels.length}`);
  console.log(`   - Knowledge Items: ${knowledgeItems.length}`);
  console.log(`   - Wiki Pages: ${rootPages.length + childPages.length}`);
  console.log(`   - Security Findings: ${securityFindings.length} (2 open, 1 false positive)`);
  console.log(`   - Agent Personas: ${personas.length}`);
  console.log(`   - Workflow Templates: ${workflowTemplates.length}`);
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
