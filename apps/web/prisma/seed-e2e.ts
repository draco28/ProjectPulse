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
  // Sprint 10: Use Ticket model names
  console.log('🗑️  Cleaning existing data...');
  await prisma.$transaction([
    prisma.ticketComment.deleteMany(),
    prisma.ticketAttachment.deleteMany(),
    prisma.ticketLinkedFile.deleteMany(),
    prisma.ticketLinkedCommit.deleteMany(),
    prisma.ticket.deleteMany(),
    prisma.label.deleteMany(),
    prisma.knowledgeItem.deleteMany(),
    prisma.securityFinding.deleteMany(),
    prisma.agentPersona.deleteMany(),
    prisma.project.deleteMany(),
    prisma.user.deleteMany({ where: { email: 'test@e2e.local' } }),
  ]);

  // Create test user for project ownership
  const testUser = await prisma.user.upsert({
    where: { email: 'test@e2e.local' },
    update: {},
    create: {
      id: 'e2e-test-user-id',
      email: 'test@e2e.local',
      name: 'E2E Test User',
      passwordHash: 'not-used-for-testing',
    },
  });

  // Reset auto-increment sequences to start from 1
  // Note: "Issue_id_seq" is the original sequence name from before rename to Ticket
  console.log('🔄 Resetting ID sequences...');
  await prisma.$executeRaw`ALTER SEQUENCE "Issue_id_seq" RESTART WITH 1;`;
  await prisma.$executeRaw`ALTER SEQUENCE "Project_id_seq" RESTART WITH 1;`;
  await prisma.$executeRaw`ALTER SEQUENCE "Label_id_seq" RESTART WITH 1;`;

  // Create test project
  const project = await prisma.project.create({
    data: {
      id: 1,
      name: 'Test Project',
      description: 'E2E Test Project',
      repository: 'https://github.com/test/test',
      ownerId: testUser.id,
    },
  });

  // Create labels (Sprint 11.7: Labels are now project-scoped)
  const labels = await Promise.all([
    prisma.label.create({ data: { name: 'bug', color: '#FF0055', projectId: project.id } }),
    prisma.label.create({ data: { name: 'feature', color: '#00D4FF', projectId: project.id } }),
    prisma.label.create({ data: { name: 'enhancement', color: '#FFD600', projectId: project.id } }),
  ]);
  console.log(
    '🏷️  Created labels:',
    labels.map((l) => ({ id: l.id, name: l.name }))
  );

  // Create tickets with EXACT titles tests expect (Sprint 10: Renamed from issues)
  console.log('📝 Creating tickets...');

  // Strategy: Create auth ticket LAST (after all other tickets) so it appears in dashboard's
  // "recent issues" section which shows top 5 by createdAt DESC

  // Create 11 open tickets first (IDs 1-11)
  const ticketsData = [
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

  for (const data of ticketsData) {
    await prisma.ticket.create({
      data: {
        title: data.title,
        description: `Description for ${data.title}`,
        kind: 'issue',
        source: 'manual',
        status: 'open',
        priority: data.priority,
        module: data.module,
        projectId: project.id,
        assignee: 'Test User',
      },
    });
  }

  // Create 24 closed tickets for "Completed" stat (IDs 12-35)
  // We'll create 4 more tickets after this with varied priorities for test coverage
  console.log('✅ Creating completed tickets (first batch)...');
  for (let i = 1; i <= 24; i++) {
    await prisma.ticket.create({
      data: {
        title: `Completed issue ${i}`,
        description: `Completed task ${i}`,
        kind: 'issue',
        source: 'manual',
        status: 'closed',
        priority: i % 2 === 0 ? 'high' : 'medium',
        module: 'General',
        projectId: project.id,
        assignee: 'Test User',
      },
    });
  }

  // Create 4 more CLOSED tickets with varied priorities (IDs 36-39)
  // These ensure all priority badge variants (Critical/High/Medium/Low) appear in top 5 recent
  console.log('✅ Creating final closed tickets with varied priorities...');

  await prisma.ticket.create({
    data: {
      title: 'Performance regression in API endpoints',
      description: 'API response times increased significantly - RESOLVED',
      kind: 'issue',
      source: 'manual',
      status: 'closed',
      priority: 'high',
      module: 'Performance',
      projectId: project.id,
      assignee: 'Test User',
    },
  });

  await prisma.ticket.create({
    data: {
      title: 'Update documentation for new features',
      description: 'Documentation updated to reflect recent changes',
      kind: 'issue',
      source: 'manual',
      status: 'closed',
      priority: 'medium',
      module: 'Documentation',
      projectId: project.id,
      assignee: 'Test User',
    },
  });

  await prisma.ticket.create({
    data: {
      title: 'Minor UI alignment issue in footer',
      description: 'Footer text alignment fixed',
      kind: 'issue',
      source: 'manual',
      status: 'closed',
      priority: 'low',
      module: 'UI',
      projectId: project.id,
      assignee: 'Test User',
    },
  });

  await prisma.ticket.create({
    data: {
      title: 'Optimize database connection pooling',
      description: 'Connection pool settings tuned and optimized',
      kind: 'issue',
      source: 'manual',
      status: 'closed',
      priority: 'high',
      module: 'Database',
      projectId: project.id,
      assignee: 'Test User',
    },
  });

  // Create "Authentication flow" ticket LAST (ID 40)
  // This ensures it appears in "recent issues" section (dashboard shows 5 most recent by createdAt DESC)
  // Set to 'in-progress' so pulse indicator appears for E2E test
  console.log('📝 Creating test-expected authentication ticket...');
  const bugLabel = labels.find((l) => l.name === 'bug')!;
  console.log(`   Connecting to bug label: id=${bugLabel.id}`);

  // Create ticket first, then connect label (workaround for constraint timing issue)
  const authTicket = await prisma.ticket.create({
    data: {
      title: 'Authentication flow not handling session timeout',
      description: 'Session timeout not being handled correctly in auth flow',
      kind: 'issue',
      source: 'manual',
      status: 'in-progress',
      priority: 'critical',
      module: 'Authentication',
      projectId: project.id,
      assignee: 'Test User',
    },
  });

  // Now connect the label using raw SQL (Prisma connect has constraint timing issues)
  await prisma.$executeRaw`INSERT INTO "_LabelToTicket" ("A", "B") VALUES (${authTicket.id}, ${bugLabel.id})`;

  // Create 47 knowledge items for "Knowledge Items" stat
  console.log('📚 Creating knowledge items...');
  // Create a zero vector with 768 dimensions for test data
  const zeroVector = '[' + Array(768).fill(0).join(',') + ']';

  for (let i = 1; i <= 47; i++) {
    // Use raw SQL to bypass vector/tsvector requirements
    // Sprint 11.7: knowledge_items now requires projectId
    await prisma.$executeRaw`
      INSERT INTO knowledge_items ("projectId", title, content, category, tags, embedding, "contentTsvector", "createdAt", "updatedAt")
      VALUES (
        ${project.id},
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
        projectId: project.id,
      },
    });
  }

  // Create agent personas (with exact names tests expect)
  // Sprint 8.5 Phase 3: Agents are now project-scoped
  console.log('🤖 Creating agent personas...');
  await Promise.all([
    prisma.agentPersona.create({
      data: {
        projectId: project.id, // Link to project
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
        projectId: project.id, // Link to project
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
        projectId: project.id, // Link to project
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
  - 3 agent personas

  ✅ Recent 5 issues (IDs 36-40) include all priority variants:
    - Critical (auth issue #40)
    - High (#36, #39)
    - Medium (#37)
    - Low (#38)`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding E2E data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
