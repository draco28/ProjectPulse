/**
 * Sprint 11 Test Fixtures
 *
 * Test data for Client Agent Integration APIs (EPIC-013)
 * - Personas (US-013-01, US-013-02)
 * - SOPs (US-013-05, US-013-06)
 * - Skills (US-013-03, US-013-04)
 */

export const TEST_PROJECT_ID = 999;
export const OTHER_PROJECT_ID = 998;

export const testPersonas = [
  {
    id: 1,
    projectId: TEST_PROJECT_ID,
    name: 'React Expert',
    slug: 'react-expert',
    icon: '⚛️',
    description: 'Specializes in React patterns and performance optimization',
    expertise: ['React', 'Hooks', 'Performance'],
    personality: 'Detail-oriented and methodical',
    systemPrompt:
      'You are a React expert specializing in hooks, component patterns, and performance optimization.',
    skills: ['react-hooks', 'component-patterns'],
    tools: ['create_issue', 'search_knowledge'],
    rules: ['Always use TypeScript', 'Prefer functional components'],
    isActive: true,
    isBuiltIn: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 2,
    projectId: TEST_PROJECT_ID,
    name: 'Prisma Expert',
    slug: 'prisma-expert',
    icon: '🗄️',
    description: 'Database design and Prisma ORM specialist',
    expertise: ['Prisma', 'PostgreSQL', 'Database Design'],
    personality: 'Analytical and thorough',
    systemPrompt: 'You are a Prisma and database expert.',
    skills: ['database-patterns', 'prisma-queries'],
    tools: ['run_query', 'create_migration'],
    rules: ['Always use parameterized queries', 'Add proper indexes'],
    isActive: true,
    isBuiltIn: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 3,
    projectId: TEST_PROJECT_ID,
    name: 'Inactive Agent',
    slug: 'inactive-agent',
    icon: '💤',
    description: 'An inactive test agent',
    expertise: ['Testing'],
    personality: null,
    systemPrompt: 'Inactive agent for testing.',
    skills: [],
    tools: [],
    rules: [],
    isActive: false,
    isBuiltIn: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 4,
    projectId: OTHER_PROJECT_ID,
    name: 'Other Project Agent',
    slug: 'other-project-agent',
    icon: '🔒',
    description: 'Agent belonging to different project (for multi-tenancy tests)',
    expertise: ['Security'],
    personality: null,
    systemPrompt: 'Agent from another project.',
    skills: [],
    tools: [],
    rules: [],
    isActive: true,
    isBuiltIn: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
];

export const testSOPs = [
  {
    id: 1,
    projectId: TEST_PROJECT_ID,
    title: 'Git Workflow Guidelines',
    slug: 'git-workflow',
    description: 'Standard git branching and commit workflow',
    category: 'Development',
    content:
      '# Git Workflow\n\n## Branch Naming\n- feature/XXX\n- fix/XXX\n- hotfix/XXX\n\n## Commit Messages\nUse conventional commits.',
    tags: ['git', 'workflow', 'branching'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 2,
    projectId: TEST_PROJECT_ID,
    title: 'Code Review Process',
    slug: 'code-review',
    description: 'Guidelines for conducting code reviews',
    category: 'Development',
    content:
      '# Code Review\n\n## Checklist\n1. Check for TypeScript errors\n2. Review test coverage\n3. Check security implications',
    tags: ['review', 'quality'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 3,
    projectId: TEST_PROJECT_ID,
    title: 'Deployment Checklist',
    slug: 'deployment-checklist',
    description: 'Pre-deployment verification steps',
    category: 'Deployment',
    content:
      '# Deployment Checklist\n\n1. Run tests\n2. Build production\n3. Verify environment variables',
    tags: ['deployment', 'checklist'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 4,
    projectId: OTHER_PROJECT_ID,
    title: 'Other Project SOP',
    slug: 'other-project-sop',
    description: 'SOP belonging to different project',
    category: 'Testing',
    content: '# Other Project SOP\n\nThis belongs to another project.',
    tags: ['other'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
];

export const testSkills = [
  {
    id: 1,
    projectId: TEST_PROJECT_ID,
    title: 'API Design Patterns',
    slug: 'api-patterns',
    category: 'framework',
    description: 'REST API design patterns for Next.js',
    content:
      '# API Patterns\n\n## Route Structure\n- Use app/api for API routes\n- Validate with Zod\n- Return proper status codes',
    tags: ['api', 'rest', 'nextjs'],
    frameworks: ['Next.js', 'Zod'],
    usageCount: 5,
    lastLoadedAt: new Date('2025-01-15'),
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 2,
    projectId: TEST_PROJECT_ID,
    title: 'React Testing Patterns',
    slug: 'react-testing',
    category: 'testing',
    description: 'Testing React components with RTL and Jest',
    content: '# React Testing\n\n## Tools\n- Jest\n- React Testing Library\n- MSW for mocking',
    tags: ['testing', 'react', 'jest'],
    frameworks: ['React', 'Jest'],
    usageCount: 10,
    lastLoadedAt: new Date('2025-01-20'),
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 3,
    projectId: TEST_PROJECT_ID,
    title: 'Database Optimization',
    slug: 'db-optimization',
    category: 'troubleshooting',
    description: 'PostgreSQL query optimization techniques',
    content:
      '# Database Optimization\n\n## Indexes\n- Add indexes for frequently queried columns\n- Use EXPLAIN ANALYZE',
    tags: ['database', 'performance', 'postgresql'],
    frameworks: ['Prisma', 'PostgreSQL'],
    usageCount: 3,
    lastLoadedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
];

export const personasListResponse = (projectId: number) => ({
  personas: testPersonas
    .filter((p) => p.projectId === projectId)
    .map(({ systemPrompt, skills, tools, rules, personality, ...rest }) => rest),
  count: testPersonas.filter((p) => p.projectId === projectId).length,
  projectId,
});

export const sopsListResponse = (projectId: number) => ({
  sops: testSOPs.filter((s) => s.projectId === projectId).map(({ content, ...rest }) => rest),
  count: testSOPs.filter((s) => s.projectId === projectId).length,
  projectId,
});

export const skillsListResponse = (projectId: number) => ({
  data: {
    skills: testSkills.filter((s) => s.projectId === projectId).map(({ content, ...rest }) => rest),
    pagination: {
      page: 1,
      limit: 20,
      total: testSkills.filter((s) => s.projectId === projectId).length,
      totalPages: 1,
      hasMore: false,
    },
  },
});
