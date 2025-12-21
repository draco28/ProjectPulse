/**
 * Skills Creation for Session 3 Onboarding
 *
 * Purpose: Create 5-10 Skill records based on detected tech stack
 * Used by: Bootstrap API route
 *
 * Architecture: Template-based (NO AI generation)
 * - Pre-defined skill content templates (markdown)
 * - Conditional logic based on tech stack detection
 */

import { prisma } from '@/lib/prisma';
import type { TechStackInfo } from './tech-stack-detection';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SkillDefinition {
  slug: string;
  title: string;
  category: 'frontend' | 'backend' | 'database' | 'testing' | 'devops' | 'general';
  description: string;
  content: string; // Markdown content
  tags: string[];
  frameworks: string[];
}

// ============================================================================
// PRE-DEFINED SKILL TEMPLATES
// ============================================================================

const API_PATTERNS_SKILL: SkillDefinition = {
  slug: 'api-patterns',
  title: 'API Design Patterns',
  category: 'backend',
  description: 'REST API design patterns, validation, and error handling',
  content: `
# API Design Patterns

## Overview
Best practices for designing REST APIs with proper validation and error handling.

## Patterns

### 1. Request Validation
Use Zod for input validation:
\`\`\`typescript
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  age: z.number().int().min(18).optional()
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = createUserSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.errors },
      { status: 400 }
    );
  }
  
  // Use validated data (TypeScript types inferred!)
  const user = await createUser(validation.data);
  return NextResponse.json(user, { status: 201 });
}
\`\`\`

### 2. Error Handling
Standardized error responses:
\`\`\`typescript
// Success response
return NextResponse.json({ data: result }, { status: 200 });

// Validation error
return NextResponse.json(
  { error: 'Validation failed', details: errors },
  { status: 400 }
);

// Not found
return NextResponse.json(
  { error: 'Resource not found' },
  { status: 404 }
);

// Server error
return NextResponse.json(
  { error: 'Internal server error' },
  { status: 500 }
);
\`\`\`

### 3. Pagination
Implement cursor-based pagination:
\`\`\`typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  
  const items = await prisma.item.findMany({
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' }
  });
  
  const hasMore = items.length > limit;
  const results = hasMore ? items.slice(0, -1) : items;
  const nextCursor = hasMore ? results[results.length - 1].id : null;
  
  return NextResponse.json({
    items: results,
    pagination: {
      nextCursor,
      hasMore,
      limit
    }
  });
}
\`\`\`

## Best Practices
- Always validate input with Zod
- Use proper HTTP status codes
- Return consistent error formats
- Implement pagination for lists
- Use TypeScript for type safety
  `.trim(),
  tags: ['api', 'validation', 'error-handling', 'rest', 'pagination'],
  frameworks: ['Next.js', 'Express', 'Fastify'],
};

const NEXTJS_SERVER_COMPONENTS_SKILL: SkillDefinition = {
  slug: 'nextjs-server-components',
  title: 'Next.js Server Components',
  category: 'frontend',
  description: 'Server Component patterns, data fetching, and streaming',
  content: `
# Next.js Server Components

## Overview
Use Server Components by default for better performance and developer experience.

## Patterns

### 1. Server Component by Default
\`\`\`typescript
// app/page.tsx (Server Component - no "use client")
export default async function Page() {
  const data = await fetchData(); // Direct DB/API call
  return <div>{data.title}</div>;
}
\`\`\`

**Benefits:**
- Direct database access (no API layer needed)
- Zero JavaScript sent to client
- Automatic code splitting
- SEO-friendly by default

### 2. Client Components When Needed
Use \`"use client"\` only when you need:
- useState, useEffect, or other hooks
- Event listeners (onClick, onChange)
- Browser APIs (localStorage, window)
- Third-party libraries that use hooks

\`\`\`typescript
// app/Counter.tsx (Client Component)
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
\`\`\`

### 3. Composition Pattern
Server Components can render Client Components:
\`\`\`typescript
// app/page.tsx (Server Component)
import ClientCounter from './Counter';

export default async function Page() {
  const data = await fetchData(); // Server-side fetch
  
  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.description}</p>
      <ClientCounter /> {/* Client Component */}
    </div>
  );
}
\`\`\`

### 4. Data Fetching
\`\`\`typescript
// Server Component - fetch directly
export default async function Page() {
  // Fetch is automatically cached and deduped
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 } // Revalidate every 60 seconds
  });
  
  return <div>{/* render data */}</div>;
}
\`\`\`

## Best Practices
- Default to Server Components
- Use Client Components only when needed
- Pass data from Server to Client via props
- Avoid prop drilling - use composition
- Leverage automatic code splitting
  `.trim(),
  tags: ['nextjs', 'server-components', 'react', 'app-router'],
  frameworks: ['Next.js', 'React'],
};

const PRISMA_SCHEMA_DESIGN_SKILL: SkillDefinition = {
  slug: 'prisma-schema-design',
  title: 'Prisma Schema Design',
  category: 'database',
  description: 'Database schema design patterns and best practices',
  content: `
# Prisma Schema Design

## Overview
Best practices for designing Prisma schemas with proper relations and constraints.

## Patterns

### 1. One-to-Many Relations
\`\`\`prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  posts Post[]
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  userId   Int
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}
\`\`\`

### 2. Many-to-Many Relations
\`\`\`prisma
model Post {
  id    Int    @id @default(autoincrement())
  title String
  tags  PostTag[]
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts PostTag[]
}

model PostTag {
  postId Int
  tagId  Int
  post   Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([postId, tagId])
  @@index([postId])
  @@index([tagId])
}
\`\`\`

### 3. Self-Referential Relations
\`\`\`prisma
model Comment {
  id        Int       @id @default(autoincrement())
  content   String
  parentId  Int?
  parent    Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies   Comment[] @relation("CommentReplies")
  
  @@index([parentId])
}
\`\`\`

### 4. Enums and Defaults
\`\`\`prisma
enum Status {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model Task {
  id        Int      @id @default(autoincrement())
  title     String
  status    Status   @default(PENDING)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([status])
  @@index([createdAt])
}
\`\`\`

## Best Practices
- Use \`@index\` on foreign keys
- Use \`onDelete: Cascade\` for dependent data
- Use \`@unique\` for uniqueness constraints
- Use enums for fixed value sets
- Add \`createdAt\` and \`updatedAt\` timestamps
  `.trim(),
  tags: ['prisma', 'database', 'schema', 'relations'],
  frameworks: ['Prisma', 'PostgreSQL', 'MySQL'],
};

const TESTING_PATTERNS_SKILL: SkillDefinition = {
  slug: 'testing-patterns',
  title: 'Testing Patterns',
  category: 'testing',
  description: 'Unit testing, integration testing, and E2E testing patterns',
  content: `
# Testing Patterns

## Overview
Comprehensive testing strategies for modern web applications.

## Unit Testing (Jest/Vitest)

### 1. Component Testing
\`\`\`typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    screen.getByText('Click me').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
\`\`\`

### 2. API Testing
\`\`\`typescript
import { POST } from './route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn()
    }
  }
}));

describe('POST /api/users', () => {
  it('creates user with valid input', async () => {
    const mockUser = { id: 1, email: 'test@example.com', name: 'Test' };
    (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
    
    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', name: 'Test' })
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data).toEqual(mockUser);
  });
});
\`\`\`

## E2E Testing (Playwright)

### 1. User Flow Testing
\`\`\`typescript
import { test, expect } from '@playwright/test';

test('user can create an issue', async ({ page }) => {
  await page.goto('/issues');
  
  // Click "New Issue" button
  await page.click('text=New Issue');
  
  // Fill form
  await page.fill('input[name="title"]', 'Test Issue');
  await page.fill('textarea[name="description"]', 'Test description');
  await page.selectOption('select[name="priority"]', 'high');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Verify redirect
  await expect(page).toHaveURL(/\\/issues\\/\\d+/);
  
  // Verify issue created
  await expect(page.locator('h1')).toContainText('Test Issue');
});
\`\`\`

## Best Practices
- Write tests before fixing bugs (TDD)
- Test user behavior, not implementation
- Use data-testid for stable selectors
- Mock external dependencies
- Aim for 80%+ coverage
  `.trim(),
  tags: ['testing', 'jest', 'vitest', 'playwright', 'tdd'],
  frameworks: ['Jest', 'Vitest', 'Playwright', 'Cypress'],
};

const GIT_WORKFLOW_SKILL: SkillDefinition = {
  slug: 'git-workflow',
  title: 'Git Workflow',
  category: 'general',
  description: 'Branch management and commit conventions',
  content: `
# Git Workflow

## Branching Strategy

### Branch Types
- \`master\` / \`main\`: Production-ready code
- \`feature/*\`: New features
- \`fix/*\`: Bug fixes
- \`hotfix/*\`: Emergency production fixes
- \`refactor/*\`: Code refactoring
- \`docs/*\`: Documentation updates

### Creating Branches
\`\`\`bash
# Create feature branch
git checkout -b feature/user-authentication

# Create fix branch
git checkout -b fix/login-validation
\`\`\`

## Commit Conventions

Use conventional commits for clear history:

\`\`\`
feat: add user authentication
fix: resolve login validation issue
docs: update API documentation
test: add tests for user service
refactor: simplify authentication logic
chore: update dependencies
\`\`\`

### Good Commit Messages
✅ \`feat: add password reset functionality\`
✅ \`fix: prevent duplicate email registration\`
✅ \`refactor: extract validation logic to utils\`

### Bad Commit Messages
❌ \`fix stuff\`
❌ \`wip\`
❌ \`update\`

## Workflow

### 1. Start New Feature
\`\`\`bash
git checkout master
git pull origin master
git checkout -b feature/my-feature
\`\`\`

### 2. Make Changes
\`\`\`bash
# Make changes to files
git add .
git commit -m "feat: add new feature"
\`\`\`

### 3. Push and Create PR
\`\`\`bash
git push origin feature/my-feature
# Create pull request on GitHub/GitLab
\`\`\`

### 4. Merge After Review
\`\`\`bash
# After PR approved
git checkout master
git pull origin master
git branch -d feature/my-feature
\`\`\`

## Best Practices
- Commit often, push regularly
- Write descriptive commit messages
- Keep commits focused (one change per commit)
- Review your changes before committing
- Never commit secrets or credentials
- Use \`.gitignore\` properly
  `.trim(),
  tags: ['git', 'workflow', 'branching', 'commits'],
  frameworks: [],
};

const SECURITY_PATTERNS_SKILL: SkillDefinition = {
  slug: 'security-patterns',
  title: 'Security Patterns',
  category: 'general',
  description: 'Security best practices and vulnerability prevention',
  content: `
# Security Patterns

## Overview
Essential security practices for web applications.

## Input Validation

### 1. Always Validate Input
\`\`\`typescript
import { z } from 'zod';

const userInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  age: z.number().int().min(18).max(120)
});

// Validate before processing
const result = userInputSchema.safeParse(input);
if (!result.success) {
  throw new Error('Invalid input');
}
\`\`\`

## SQL Injection Prevention

### 1. Use Parameterized Queries (Prisma)
✅ **SAFE** - Parameterized
\`\`\`typescript
await prisma.$queryRaw\`
  SELECT * FROM users WHERE email = \${userEmail}
\`;
\`\`\`

❌ **UNSAFE** - String interpolation
\`\`\`typescript
await prisma.$queryRawUnsafe(\`
  SELECT * FROM users WHERE email = '\${userEmail}'
\`);
\`\`\`

## XSS Prevention

React automatically escapes content, but be careful with:

❌ **UNSAFE** - dangerouslySetInnerHTML
\`\`\`typescript
<div dangerouslySetInnerHTML={{ __html: userContent }} />
\`\`\`

✅ **SAFE** - Let React escape
\`\`\`typescript
<div>{userContent}</div>
\`\`\`

## Authentication & Authorization

### 1. Hash Passwords
\`\`\`typescript
import bcrypt from 'bcrypt';

// Hash password before storing
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(inputPassword, hashedPassword);
\`\`\`

### 2. Protect API Routes
\`\`\`typescript
export async function POST(request: NextRequest) {
  const session = await getSession(request);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Proceed with authenticated request
}
\`\`\`

## Secrets Management

### 1. Use Environment Variables
\`\`\`typescript
// .env.local (NEVER commit to git!)
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
API_KEY="your-api-key"
\`\`\`

\`\`\`typescript
// Access in code
const dbUrl = process.env.DATABASE_URL;
\`\`\`

### 2. Add to .gitignore
\`\`\`
.env
.env.local
.env.*.local
\`\`\`

## Best Practices
- Validate ALL user input
- Use parameterized queries (Prisma)
- Hash passwords with bcrypt
- Store secrets in environment variables
- Never commit secrets to git
- Use HTTPS in production
- Implement rate limiting
- Keep dependencies updated
  `.trim(),
  tags: ['security', 'validation', 'authentication', 'xss', 'sql-injection'],
  frameworks: [],
};

// ============================================================================
// SELECTION LOGIC
// ============================================================================

/**
 * Get skills based on detected tech stack
 *
 * @param techStack - Detected tech stack info
 * @returns Array of skill definitions to create
 */
export function getSkillsForTechStack(techStack: TechStackInfo): SkillDefinition[] {
  const skills: SkillDefinition[] = [];

  // Core skills (always included)
  skills.push(API_PATTERNS_SKILL);
  skills.push(TESTING_PATTERNS_SKILL);
  skills.push(GIT_WORKFLOW_SKILL);
  skills.push(SECURITY_PATTERNS_SKILL);

  // Tech stack-specific skills
  if (techStack.frontend === 'Next.js') {
    skills.push(NEXTJS_SERVER_COMPONENTS_SKILL);
  }

  if (techStack.orm === 'Prisma') {
    skills.push(PRISMA_SCHEMA_DESIGN_SKILL);
  }

  return skills;
}

// ============================================================================
// DATABASE CREATION
// ============================================================================

/**
 * Create skills in database
 *
 * @param projectId - Project ID
 * @param projectType - Project type (from project-context.json)
 * @param techStack - Detected tech stack info
 * @returns Number of skills created
 */
export async function createSkills(
  projectId: number,
  projectType: string,
  techStack: TechStackInfo
): Promise<number> {
  const skillDefs = getSkillsForTechStack(techStack);

  console.log('[Session 3] Creating skills', {
    projectId,
    projectType,
    techStack,
    count: skillDefs.length,
  });

  let created = 0;

  for (const def of skillDefs) {
    try {
      await prisma.skill.create({
        data: {
          projectId,
          slug: def.slug,
          title: def.title,
          category: def.category,
          description: def.description,
          content: def.content,
          tags: def.tags,
          frameworks: def.frameworks,
          usageCount: 0,
        },
      });
      created++;
      console.log(`[Session 3] Created skill: ${def.title}`);
    } catch (error) {
      console.error(`[Session 3] Failed to create skill ${def.title}:`, error);
      // Continue with other skills even if one fails
    }
  }

  console.log(`[Session 3] Skills created: ${created}/${skillDefs.length}`);

  return created;
}
