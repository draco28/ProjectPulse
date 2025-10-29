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
