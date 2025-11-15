/**
 * E2E Test Seed Data
 *
 * Seeds database with exact data that E2E tests expect.
 * Run with: DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" npx tsx prisma/seed-e2e.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding E2E test data...');

  // Clean existing data (in correct order to handle foreign keys)
  console.log('🗑️  Cleaning existing data...');
  await prisma.$transaction([
    prisma.comment.deleteMany(),
    prisma.attachment.deleteMany(),
    prisma.linkedFile.deleteMany(),
    prisma.linkedCommit.deleteMany(),
    prisma.issue.deleteMany(),
    prisma.label.deleteMany(),
    prisma.knowledgeItem.deleteMany(),
    prisma.securityFinding.deleteMany(),
    prisma.agentPersona.deleteMany(),
    prisma.project.deleteMany(),
  ]);

  // Create test project
  const project = await prisma.project.create({
    data: {
      id: 1,
      name: 'Test Project',
      description: 'E2E Test Project',
      repository: 'https://github.com/test/test',
    },
  });

  // Create labels
  const labels = await Promise.all([
    prisma.label.create({ data: { name: 'bug', color: '#FF0055' } }),
    prisma.label.create({ data: { name: 'feature', color: '#00D4FF' } }),
    prisma.label.create({ data: { name: 'enhancement', color: '#FFD600' } }),
  ]);

  // Create issues with EXACT titles tests expect
  console.log('📝 Creating issues...');

  const issue1 = await prisma.issue.create({
    data: {
      title: 'Authentication flow not handling session timeout',
      description: 'Session timeout not being handled correctly in auth flow',
      status: 'open',
      priority: 'critical',
      module: 'Authentication',
      projectId: project.id,
      assignee: 'Test User',
      labels: {
        connect: [{ id: labels[0].id }],
      },
    },
  });

  // Create 11 more issues for dashboard (total 12 for "Open Issues" stat)
  const issuesData = [
    { title: 'Add dark mode toggle', priority: 'high', module: 'UI' },
    { title: 'Fix pagination bug', priority: 'medium', module: 'Core' },
    { title: 'Optimize database queries', priority: 'high', module: 'Performance' },
    { title: 'Add unit tests', priority: 'low', module: 'Testing' },
    { title: 'Update dependencies', priority: 'medium', module: 'Maintenance' },
    { title: 'Fix CSS layout issue', priority: 'low', module: 'UI' },
    { title: 'Add API documentation', priority: 'medium', module: 'Documentation' },
    { title: 'Implement caching', priority: 'high', module: 'Performance' },
    { title: 'Fix memory leak', priority: 'critical', module: 'Core' },
    { title: 'Add logging', priority: 'low', module: 'Monitoring' },
    { title: 'Refactor auth module', priority: 'medium', module: 'Authentication' },
  ];

  for (const data of issuesData) {
    await prisma.issue.create({
      data: {
        title: data.title,
        description: `Description for ${data.title}`,
        status: 'open',
        priority: data.priority,
        module: data.module,
        projectId: project.id,
        assignee: 'Test User',
      },
    });
  }

  // Create 28 closed issues for "Completed" stat
  console.log('✅ Creating completed issues...');
  for (let i = 1; i <= 28; i++) {
    await prisma.issue.create({
      data: {
        title: `Completed issue ${i}`,
        description: `Completed task ${i}`,
        status: 'closed',
        priority: i % 2 === 0 ? 'high' : 'medium',
        module: 'General',
        projectId: project.id,
        assignee: 'Test User',
      },
    });
  }

  // Create 47 knowledge items for "Knowledge Items" stat
  console.log('📚 Creating knowledge items...');
  // Create a zero vector with 768 dimensions for test data
  const zeroVector = '[' + Array(768).fill(0).join(',') + ']';

  for (let i = 1; i <= 47; i++) {
    // Use raw SQL to bypass vector/tsvector requirements
    await prisma.$executeRaw`
      INSERT INTO knowledge_items (title, content, category, tags, embedding, "contentTsvector", "createdAt", "updatedAt")
      VALUES (
        ${`Knowledge item ${i}`},
        ${`Knowledge content ${i}`},
        ${i % 3 === 0 ? 'guides' : i % 3 === 1 ? 'api' : 'tutorials'},
        ARRAY['test', 'e2e']::text[],
        ${zeroVector}::vector(768),
        to_tsvector('english', ${`Knowledge item ${i} Knowledge content ${i}`}),
        NOW(),
        NOW()
      )
    `;
  }

  // Create 3 security findings for "Security Findings" stat
  console.log('🔒 Creating security findings...');
  for (let i = 1; i <= 3; i++) {
    await prisma.securityFinding.create({
      data: {
        ruleId: `SEC-${i}`,
        severity: i === 1 ? 'high' : 'medium',
        message: `Security finding ${i}`,
        filePath: `/test/file${i}.ts`,
        lineNumber: i * 10,
        status: 'open',
      },
    });
  }

  // Create agent personas (with exact names tests expect)
  console.log('🤖 Creating agent personas...');
  await Promise.all([
    prisma.agentPersona.create({
      data: {
        name: 'Code Reviewer',
        slug: 'code-reviewer',
        description: 'Code review and quality expert',
        systemPrompt: 'You are a code review expert',
        isBuiltIn: true,
        isActive: true,
      },
    }),
    prisma.agentPersona.create({
      data: {
        name: 'Bug Hunter',
        slug: 'bug-hunter',
        description: 'Bug detection and fixing expert',
        systemPrompt: 'You are a bug hunting expert',
        isBuiltIn: true,
        isActive: true,
      },
    }),
    prisma.agentPersona.create({
      data: {
        name: 'DevHub Architect',
        slug: 'devhub-architect',
        description: 'Architecture and design expert',
        systemPrompt: 'You are an architecture expert',
        isBuiltIn: true,
        isActive: true,
      },
    }),
  ]);

  console.log('✅ E2E test data seeded successfully!');
  console.log(`📊 Created:
  - 1 project
  - 3 labels
  - 40 issues (12 open, 28 closed)
  - 47 knowledge items
  - 3 security findings
  - 3 agent personas`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding E2E data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
