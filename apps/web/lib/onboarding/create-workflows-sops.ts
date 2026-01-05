/**
 * Workflows & SOPs Creation for Session 3 Onboarding
 *
 * Purpose: Create WorkflowTemplate and SOP records (STATIC templates)
 * Used by: Bootstrap API route
 *
 * Architecture: Static templates (NO AI generation, NO tech stack detection)
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const log = createLogger({ module: 'Onboarding:WorkflowsSOPs' });

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface WorkflowTemplateDefinition {
  name: string;
  description: string;
  category: string;
  steps: {
    name: string;
    action: string;
    description: string;
  }[];
}

interface SOPDefinition {
  title: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  content: string; // Markdown content
}

// ============================================================================
// WORKFLOW TEMPLATES (STATIC)
// ============================================================================

const FEATURE_DEVELOPMENT_WORKFLOW: WorkflowTemplateDefinition = {
  name: 'Feature Development',
  description: 'End-to-end feature development workflow',
  category: 'development',
  steps: [
    {
      name: 'Create plan',
      action: 'session.create',
      description: 'Initialize session and create implementation plan',
    },
    {
      name: 'Consult experts',
      action: 'agent.invoke',
      description: 'Get architectural guidance from expert personas',
    },
    {
      name: 'Implement',
      action: 'file.edit',
      description: 'Write code following patterns and conventions',
    },
    {
      name: 'Test',
      action: 'test.run',
      description: 'Run unit and integration tests',
    },
    {
      name: 'Commit',
      action: 'git.commit',
      description: 'Commit changes with descriptive message',
    },
  ],
};

const BUG_FIX_WORKFLOW: WorkflowTemplateDefinition = {
  name: 'Bug Fix',
  description: 'Systematic bug investigation and fix workflow',
  category: 'debugging',
  steps: [
    {
      name: 'Reproduce',
      action: 'test.reproduce',
      description: 'Reproduce the bug consistently',
    },
    {
      name: 'Root cause analysis',
      action: 'search.code',
      description: 'Find the root cause using systematic debugging',
    },
    {
      name: 'Fix',
      action: 'file.edit',
      description: 'Implement the fix',
    },
    {
      name: 'Regression test',
      action: 'test.create',
      description: 'Add test to prevent regression',
    },
    {
      name: 'Commit',
      action: 'git.commit',
      description: 'Commit fix with regression test',
    },
  ],
};

const CODE_REVIEW_WORKFLOW: WorkflowTemplateDefinition = {
  name: 'Code Review',
  description: 'Systematic code review process',
  category: 'quality',
  steps: [
    {
      name: 'Read changes',
      action: 'git.diff',
      description: 'Review all changes in the PR',
    },
    {
      name: 'Check tests',
      action: 'test.run',
      description: 'Verify all tests pass',
    },
    {
      name: 'Security audit',
      action: 'security.scan',
      description: 'Check for security vulnerabilities',
    },
    {
      name: 'Performance check',
      action: 'performance.analyze',
      description: 'Analyze performance impact',
    },
    {
      name: 'Approve or request changes',
      action: 'review.complete',
      description: 'Provide feedback and approval status',
    },
  ],
};

// ============================================================================
// SOP TEMPLATES (STATIC)
// ============================================================================

const GIT_WORKFLOW_SOP: SOPDefinition = {
  title: 'Git Workflow',
  slug: 'git-workflow',
  description: 'Branch management and commit conventions',
  category: 'Development',
  tags: ['git', 'workflow', 'branching'],
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
# Always start from master
git checkout master
git pull origin master

# Create feature branch
git checkout -b feature/user-authentication

# Create fix branch
git checkout -b fix/login-validation
\`\`\`

## Commit Conventions

Use conventional commits for clear history:

### Format
\`\`\`
<type>: <description>

[optional body]

[optional footer]
\`\`\`

### Types
- \`feat:\` New feature
- \`fix:\` Bug fix
- \`docs:\` Documentation only
- \`test:\` Adding or updating tests
- \`refactor:\` Code refactoring (no functional changes)
- \`chore:\` Maintenance tasks (dependencies, configs)
- \`perf:\` Performance improvements
- \`style:\` Code style changes (formatting, no logic changes)

### Examples
✅ Good:
\`\`\`
feat: add password reset functionality
fix: prevent duplicate email registration
docs: update API documentation for user endpoints
test: add unit tests for authentication service
refactor: extract validation logic to utils
\`\`\`

❌ Bad:
\`\`\`
fix stuff
wip
update
changes
\`\`\`

## Development Workflow

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

# Make more changes
git add .
git commit -m "test: add tests for new feature"
\`\`\`

### 3. Push and Create PR
\`\`\`bash
git push origin feature/my-feature
# Create pull request on GitHub/GitLab
\`\`\`

### 4. Update PR After Review
\`\`\`bash
# Make requested changes
git add .
git commit -m "refactor: address code review comments"
git push origin feature/my-feature
\`\`\`

### 5. Merge After Approval
\`\`\`bash
# After PR approved and merged
git checkout master
git pull origin master
git branch -d feature/my-feature
\`\`\`

## Best Practices

### Do:
✅ Commit often, push regularly
✅ Write descriptive commit messages
✅ Keep commits focused (one logical change per commit)
✅ Review your changes before committing (\`git diff\`)
✅ Pull latest changes before starting new work
✅ Use \`.gitignore\` properly

### Don't:
❌ Never commit secrets or credentials
❌ Never commit \`.env\` files
❌ Never commit \`node_modules/\`
❌ Never force push to master
❌ Never commit debug code (\`console.log\`)
❌ Never commit commented-out code

## Pre-Commit Checklist
- [ ] All tests pass
- [ ] No console.logs or debug code
- [ ] No secrets in code
- [ ] Commit message follows convention
- [ ] Changes are focused and atomic
  `.trim(),
};

const SECURITY_CHECKLIST_SOP: SOPDefinition = {
  title: 'Security Checklist',
  slug: 'security-checklist',
  description: 'Pre-deployment security validation',
  category: 'Security',
  tags: ['security', 'checklist', 'deployment'],
  content: `
# Security Checklist

## Pre-Deployment Validation

### Input Validation
- [ ] All user inputs validated with Zod
- [ ] SQL injection prevented (Prisma parameterized queries only)
- [ ] XSS prevented (React escapes by default, no \`dangerouslySetInnerHTML\` with user content)
- [ ] CSRF tokens implemented (if using sessions)
- [ ] File uploads validated (type, size, content)

### Authentication & Authorization
- [ ] Passwords hashed with bcrypt (min 10 rounds)
- [ ] JWT secrets are strong and secure
- [ ] Authorization checked on all protected routes
- [ ] Session management secure (httpOnly, secure, sameSite cookies)
- [ ] Password reset tokens expire after use
- [ ] Rate limiting on authentication endpoints

### Data Protection
- [ ] HTTPS enforced in production
- [ ] Sensitive data encrypted at rest
- [ ] API keys in environment variables (NOT in code)
- [ ] No secrets in git history
- [ ] Database credentials secure
- [ ] Proper CORS configuration

### Dependencies
- [ ] \`npm audit\` passes with no high/critical vulnerabilities
- [ ] Dependencies up to date
- [ ] No known vulnerabilities in dependencies
- [ ] Unused dependencies removed

### API Security
- [ ] Rate limiting implemented
- [ ] Request size limits enforced
- [ ] Proper error messages (no stack traces in production)
- [ ] API keys validated
- [ ] CORS configured properly

### Code Security
- [ ] No \`eval()\` usage
- [ ] No \`dangerouslySetInnerHTML\` with user content
- [ ] No raw SQL string interpolation
- [ ] No hardcoded secrets
- [ ] Environment variables for all configuration

## Security Testing

### Manual Tests
1. Try SQL injection in all input fields
2. Try XSS payloads in text inputs
3. Test authentication bypass attempts
4. Test authorization boundaries
5. Test file upload restrictions

### Automated Tests
\`\`\`bash
# Dependency vulnerability scan
npm audit

# Security linting
npm run lint:security

# Run all tests
npm test
\`\`\`

## Incident Response Plan

### If Security Issue Found:
1. **Assess severity** (Critical, High, Medium, Low)
2. **Document issue** (what, where, impact)
3. **Fix immediately** if critical
4. **Test fix thoroughly**
5. **Deploy fix**
6. **Review related code** for similar issues
7. **Add regression test**
8. **Update security checklist** if needed

## Resources
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Next.js Security: https://nextjs.org/docs/app/building-your-application/security
- Prisma Security: https://www.prisma.io/docs/concepts/components/prisma-client/security
  `.trim(),
};

const API_DEVELOPMENT_SOP: SOPDefinition = {
  title: 'API Development SOP',
  slug: 'api-development',
  description: 'Standard procedure for creating REST API endpoints',
  category: 'Development',
  tags: ['api', 'backend', 'rest'],
  content: `
# API Development SOP

## Creating New API Endpoint

### Step 1: Define Requirements
Document:
- Endpoint path (\`/api/users\`)
- HTTP method (\`GET\`, \`POST\`, \`PUT\`, \`DELETE\`)
- Request body schema
- Response format
- Authentication requirements
- Authorization rules

### Step 2: Create Route File
Next.js App Router: \`app/api/[resource]/route.ts\`

\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Define request schema
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100)
});

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate input
    const body = await request.json();
    const validation = createUserSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    // 2. Check authentication (if needed)
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 3. Check authorization (if needed)
    if (!canCreateUser(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // 4. Business logic
    const user = await prisma.user.create({
      data: validation.data
    });
    
    // 5. Return response
    return NextResponse.json(user, { status: 201 });
    
  } catch (error) {
    console.error('[POST /api/users] Error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
\`\`\`

### Step 3: Write Tests
\`\`\`typescript
import { POST } from './route';

describe('POST /api/users', () => {
  it('creates user with valid input', async () => {
    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', name: 'Test' })
    });
    
    const response = await POST(request);
    expect(response.status).toBe(201);
  });
  
  it('returns 400 for invalid input', async () => {
    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid', name: 'T' })
    });
    
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
\`\`\`

### Step 4: Document API
Update OpenAPI spec or API documentation:
\`\`\`yaml
/api/users:
  post:
    summary: Create user
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              email:
                type: string
                format: email
              name:
                type: string
                minLength: 2
                maxLength: 100
    responses:
      201:
        description: User created successfully
      400:
        description: Validation failed
\`\`\`

## API Best Practices

### Request Validation
- Always validate with Zod
- Return detailed validation errors
- Sanitize user input

### Error Handling
- Use proper HTTP status codes
- Return consistent error format
- Log errors server-side
- Never expose stack traces in production

### Response Format
\`\`\`typescript
// Success response
{ data: {...} }

// Error response
{ error: "message", details: [...] }

// List response (with pagination)
{ 
  data: [...],
  pagination: {
    total: 100,
    page: 1,
    limit: 20,
    hasMore: true
  }
}
\`\`\`

### Performance
- Use database indexes
- Implement pagination
- Use caching where appropriate
- Optimize queries (avoid N+1)

## Checklist
- [ ] Request validation with Zod
- [ ] Proper error handling
- [ ] Authentication checked (if needed)
- [ ] Authorization checked (if needed)
- [ ] Tests written and passing
- [ ] API documented
- [ ] Performance tested
- [ ] Security reviewed
  `.trim(),
};

const TESTING_WORKFLOW_SOP: SOPDefinition = {
  title: 'Testing Workflow',
  slug: 'testing-workflow',
  description: 'Comprehensive testing strategy and execution',
  category: 'Quality',
  tags: ['testing', 'qa', 'tdd'],
  content: `
# Testing Workflow

## Testing Strategy

### Test Pyramid
\`\`\`
       /\\
      /  \\      E2E Tests (10%)
     /    \\     Few, slow, expensive
    /------\\
   /        \\   Integration Tests (30%)
  /          \\  Some, medium speed
 /------------\\
/______________\\ Unit Tests (60%)
  Many, fast, cheap
\`\`\`

## Unit Testing

### What to Test
- Pure functions
- Utility functions
- Business logic
- React components (behavior, not implementation)

### Example
\`\`\`typescript
describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
  });
  
  it('handles zero', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });
  
  it('handles negative', () => {
    expect(formatCurrency(-100, 'USD')).toBe('-$100.00');
  });
});
\`\`\`

## Integration Testing

### What to Test
- API endpoints
- Database operations
- External service integrations
- Multi-component interactions

### Example
\`\`\`typescript
describe('POST /api/issues', () => {
  beforeEach(async () => {
    await prisma.issue.deleteMany();
  });
  
  it('creates issue and returns 201', async () => {
    const response = await fetch('http://localhost:3000/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Issue',
        description: 'Test description',
        priority: 'high'
      })
    });
    
    expect(response.status).toBe(201);
    const issue = await response.json();
    expect(issue.title).toBe('Test Issue');
    
    // Verify database
    const dbIssue = await prisma.issue.findUnique({ where: { id: issue.id } });
    expect(dbIssue).toBeTruthy();
  });
});
\`\`\`

## E2E Testing (Playwright)

### What to Test
- Critical user flows
- Happy paths
- Key business scenarios

### Example
\`\`\`typescript
import { test, expect } from '@playwright/test';

test('user can create and view issue', async ({ page }) => {
  // Navigate to issues page
  await page.goto('/issues');
  
  // Click "New Issue"
  await page.click('text=New Issue');
  
  // Fill form
  await page.fill('input[name="title"]', 'Test Issue');
  await page.fill('textarea[name="description"]', 'Test description');
  await page.selectOption('select[name="priority"]', 'high');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Verify redirect
  await expect(page).toHaveURL(/\\/issues\\/\\d+/);
  
  // Verify issue displayed
  await expect(page.locator('h1')).toContainText('Test Issue');
  await expect(page.locator('.priority')).toContainText('high');
});
\`\`\`

## Test-Driven Development (TDD)

### Red-Green-Refactor Cycle

1. **Red**: Write failing test
\`\`\`typescript
it('adds two numbers', () => {
  expect(add(2, 3)).toBe(5); // Fails - function doesn't exist
});
\`\`\`

2. **Green**: Write minimal code to pass
\`\`\`typescript
function add(a: number, b: number): number {
  return a + b;
}
\`\`\`

3. **Refactor**: Improve code quality
\`\`\`typescript
const add = (a: number, b: number): number => a + b;
\`\`\`

## Running Tests

### Commands
\`\`\`bash
# Run all tests
npm test

# Run specific test file
npm test -- user.test.ts

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e
\`\`\`

### Coverage Goals
- Overall: 80%+
- Critical paths: 100%
- Edge cases: Well covered

## Pre-Commit Checklist
- [ ] All tests pass
- [ ] New tests for new features
- [ ] Regression tests for bugs
- [ ] Coverage remains above 80%
- [ ] No skipped tests (\`.skip\`)

## Best Practices
- Write tests before fixing bugs
- Test behavior, not implementation
- Use descriptive test names
- Keep tests fast and isolated
- Mock external dependencies
- Clean up test data
- Use test fixtures for complex data
  `.trim(),
};

const DEPLOYMENT_SOP: SOPDefinition = {
  title: 'Deployment SOP',
  slug: 'deployment',
  description: 'Pre-deployment checklist and deployment procedure',
  category: 'Operations',
  tags: ['deployment', 'production', 'checklist'],
  content: `
# Deployment SOP

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests pass (\`npm test\`)
- [ ] Linting passes (\`npm run lint\`)
- [ ] Type checking passes (\`npm run type-check\`)
- [ ] Build succeeds (\`npm run build\`)
- [ ] No console.logs or debug code

### Security
- [ ] Security checklist complete (see Security Checklist SOP)
- [ ] No secrets in code
- [ ] Environment variables documented
- [ ] \`npm audit\` passes

### Performance
- [ ] Lighthouse score > 90
- [ ] Bundle size acceptable
- [ ] Database queries optimized
- [ ] Caching configured

### Documentation
- [ ] README updated
- [ ] API documentation current
- [ ] CHANGELOG updated
- [ ] Deployment notes documented

## Deployment Procedure

### 1. Prepare Release
\`\`\`bash
# Ensure on master branch
git checkout master
git pull origin master

# Run full test suite
npm test
npm run lint
npm run type-check
npm run build

# Tag release
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
\`\`\`

### 2. Deploy (Vercel Example)
\`\`\`bash
# Deploy to production
vercel --prod

# Or push to master (auto-deploy)
git push origin master
\`\`\`

### 3. Run Migrations (if needed)
\`\`\`bash
# Production database migration
npm run prisma:migrate:deploy
\`\`\`

### 4. Verify Deployment
- [ ] Application loads
- [ ] Authentication works
- [ ] API endpoints respond
- [ ] Database connection works
- [ ] Critical user flows work

### 5. Monitor
- [ ] Check error logs
- [ ] Monitor performance metrics
- [ ] Watch for alerts

## Rollback Procedure

If deployment fails:

1. **Immediate**: Revert to previous version
\`\`\`bash
# Vercel rollback
vercel rollback

# Or git revert
git revert HEAD
git push origin master
\`\`\`

2. **Investigate**: Check logs and errors
3. **Fix**: Create hotfix branch
4. **Test**: Verify fix locally
5. **Deploy**: Follow deployment procedure

## Environment Variables

Document all required environment variables:

\`\`\`
# Database
DATABASE_URL="postgresql://..."

# Authentication
JWT_SECRET="..."

# External Services
API_KEY="..."
\`\`\`

## Post-Deployment

- [ ] Smoke test critical features
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Update status page
- [ ] Notify team

## Emergency Contacts

- DevOps: [contact]
- Database Admin: [contact]
- Security: [contact]
  `.trim(),
};

// ============================================================================
// DATABASE CREATION
// ============================================================================

/**
 * Create workflows and SOPs in database
 *
 * @param projectId - Project ID
 * @returns Object with counts of created workflows and SOPs
 */
export async function createWorkflowsAndSOPs(
  projectId: number
): Promise<{ workflows: number; sops: number }> {
  log.info({ projectId }, 'Creating workflows and SOPs');

  // Create workflows
  const workflowDefs = [FEATURE_DEVELOPMENT_WORKFLOW, BUG_FIX_WORKFLOW, CODE_REVIEW_WORKFLOW];

  let workflowsCreated = 0;

  for (const def of workflowDefs) {
    try {
      await prisma.workflowTemplate.create({
        data: {
          projectId,
          name: def.name,
          description: def.description,
          category: def.category,
          steps: def.steps,
          isActive: true,
        },
      });
      workflowsCreated++;
      log.info({ workflowName: def.name }, 'Created workflow');
    } catch (error) {
      log.error({ workflowName: def.name, error: error instanceof Error ? error.message : String(error) }, 'Failed to create workflow');
    }
  }

  // Create SOPs
  const sopDefs = [
    GIT_WORKFLOW_SOP,
    SECURITY_CHECKLIST_SOP,
    API_DEVELOPMENT_SOP,
    TESTING_WORKFLOW_SOP,
    DEPLOYMENT_SOP,
  ];

  let sopsCreated = 0;

  for (const def of sopDefs) {
    try {
      await prisma.sOP.create({
        data: {
          projectId,
          title: def.title,
          slug: def.slug,
          description: def.description,
          category: def.category,
          tags: def.tags,
          content: def.content,
        },
      });
      sopsCreated++;
      log.info({ sopTitle: def.title }, 'Created SOP');
    } catch (error) {
      log.error({ sopTitle: def.title, error: error instanceof Error ? error.message : String(error) }, 'Failed to create SOP');
    }
  }

  log.info({ created: workflowsCreated, total: workflowDefs.length }, 'Workflows created');
  log.info({ created: sopsCreated, total: sopDefs.length }, 'SOPs created');

  return {
    workflows: workflowsCreated,
    sops: sopsCreated,
  };
}
