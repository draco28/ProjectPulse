/**
 * Phase F Test Data Seed
 *
 * Sprint 15: Updated for 2-level hierarchy (Phase → Sprint only)
 * Week and Day models removed (Ticket #80)
 *
 * Populates project 3 with comprehensive test data to verify:
 * - Sessions page (Phase F redesign)
 * - Roadmap page (Phase E timeline)
 * - Kanban board (Phase D)
 *
 * Run with:
 * DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev" npx tsx prisma/seed-phase-f-test.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROJECT_ID = 3;

async function main() {
  console.log('🌱 Seeding Phase F test data for project 3...');

  // Verify project exists
  const project = await prisma.project.findUnique({ where: { id: PROJECT_ID } });
  if (!project) {
    throw new Error(`Project ${PROJECT_ID} not found!`);
  }
  console.log(`📁 Found project: ${project.name}`);

  // Clean existing test data for project 3
  console.log('🗑️  Cleaning existing data for project 3...');
  await prisma.agentSession.deleteMany({ where: { projectId: PROJECT_ID } });
  await prisma.ticket.deleteMany({ where: { projectId: PROJECT_ID } });

  // Clean roadmap hierarchy (Sprint 15: 2-level only)
  const existingRoadmap = await prisma.roadmap.findUnique({ where: { projectId: PROJECT_ID } });
  if (existingRoadmap) {
    await prisma.sprint.deleteMany({ where: { phase: { roadmapId: existingRoadmap.id } } });
    await prisma.phase.deleteMany({ where: { roadmapId: existingRoadmap.id } });
    await prisma.roadmap.delete({ where: { id: existingRoadmap.id } });
  }

  // =========================================================================
  // 1. CREATE ROADMAP WITH 4 PHASES, 3 SPRINTS EACH
  // =========================================================================
  console.log('🗺️  Creating roadmap...');

  const startDate = new Date('2025-01-06');

  // Phase and sprint metadata (defined first for roadmap JSON construction)
  const phaseData = [
    {
      title: 'Phase 1: Foundation & Infrastructure',
      description: 'Set up project structure and core infrastructure',
      weekOffset: 0,
    },
    {
      title: 'Phase 2: Core Features',
      description: 'Build main application features',
      weekOffset: 6,
    },
    {
      title: 'Phase 3: Advanced Features',
      description: 'Add advanced functionality and integrations',
      weekOffset: 12,
    },
    {
      title: 'Phase 4: Polish & Launch',
      description: 'Testing, performance, and deployment',
      weekOffset: 18,
    },
  ];

  const sprintTitles = [
    ['Sprint 1.1: Setup', 'Sprint 1.2: Database', 'Sprint 1.3: Auth'],
    ['Sprint 2.1: User Mgmt', 'Sprint 2.2: Dashboard', 'Sprint 2.3: Data'],
    ['Sprint 3.1: Notifications', 'Sprint 3.2: Reports', 'Sprint 3.3: Integrations'],
    ['Sprint 4.1: Testing', 'Sprint 4.2: Performance', 'Sprint 4.3: Deploy'],
  ];

  // Build the phases JSON in the correct format expected by the UI
  const phasesJson = {
    phases: phaseData.map((phase, pIdx) => ({
      name: phase.title,
      duration: '6 weeks',
      sprints: sprintTitles[pIdx]!.map((sprintTitle, sIdx) => ({
        name: sprintTitle,
        duration: '2 weeks',
        weeks: `${pIdx * 6 + sIdx * 2 + 1}-${pIdx * 6 + sIdx * 2 + 2}`,
        goals: [`Complete ${sprintTitle} objectives`],
        deliverables: [`${sprintTitle} deliverables`],
        storyPoints: 8 + sIdx,
      })),
    })),
  };

  const roadmap = await prisma.roadmap.create({
    data: {
      projectId: PROJECT_ID,
      phases: phasesJson,
      currentPhase: phaseData[0]!.title,
      currentSprint: sprintTitles[0]![1], // Sprint 1.2
    },
  });
  console.log(`   Roadmap created: ${roadmap.id}`);

  const phases: any[] = [];
  const sprints: any[] = [];
  let globalSprintNumber = 0;

  for (let p = 0; p < phaseData.length; p++) {
    const pd = phaseData[p]!;
    const phaseStart = new Date(startDate);
    phaseStart.setDate(phaseStart.getDate() + pd.weekOffset * 7);
    const phaseEnd = new Date(phaseStart);
    phaseEnd.setDate(phaseEnd.getDate() + 42); // 6 weeks

    const phase = await prisma.phase.create({
      data: {
        roadmap: { connect: { id: roadmap.id } },
        title: pd.title,
        description: pd.description,
        startDate: phaseStart,
        endDate: phaseEnd,
        progress: p === 0 ? 65 : p === 1 ? 10 : 0,
        status: p === 0 ? 'IN_PROGRESS' : p === 1 ? 'IN_PROGRESS' : 'NOT_STARTED',
      },
    });
    phases.push(phase);
    console.log(`   Phase ${p + 1}: ${phase.title}`);

    // Create 3 sprints per phase
    const phaseSprints = sprintTitles[p]!;
    for (let s = 0; s < 3; s++) {
      globalSprintNumber++;
      const sprintStart = new Date(phaseStart);
      sprintStart.setDate(sprintStart.getDate() + s * 14); // 2 weeks per sprint
      const sprintEnd = new Date(sprintStart);
      sprintEnd.setDate(sprintEnd.getDate() + 14);

      const sprint = await prisma.sprint.create({
        data: {
          phase: { connect: { id: phase.id } },
          title: phaseSprints[s]!,
          sprintNumber: globalSprintNumber,
          startDate: sprintStart,
          endDate: sprintEnd,
          progress: p === 0 && s < 2 ? (s === 0 ? 100 : 50) : 0,
          status:
            p === 0 && s === 0 ? 'COMPLETED' : p === 0 && s === 1 ? 'IN_PROGRESS' : 'NOT_STARTED',
        },
      });
      sprints.push(sprint);
    }
  }
  console.log(`   Created ${phases.length} phases, ${sprints.length} sprints`);

  // =========================================================================
  // 2. CREATE 25 TICKETS OF DIFFERENT KINDS
  // =========================================================================
  console.log('🎫 Creating tickets...');

  const ticketData = [
    // Features (5)
    {
      title: 'User authentication system',
      kind: 'feature',
      status: 'in-progress',
      priority: 'critical',
      module: 'Auth',
      sprintNumber: 2,
      assignee: 'Claude Code',
    },
    {
      title: 'Dashboard analytics widgets',
      kind: 'feature',
      status: 'todo',
      priority: 'high',
      module: 'UI',
      sprintNumber: 2,
    },
    {
      title: 'Real-time notifications',
      kind: 'feature',
      status: 'backlog',
      priority: 'medium',
      module: 'Core',
      sprintNumber: 3,
    },
    {
      title: 'Export to PDF/CSV',
      kind: 'feature',
      status: 'backlog',
      priority: 'low',
      module: 'Reports',
      sprintNumber: 4,
    },
    {
      title: 'Dark mode theme',
      kind: 'feature',
      status: 'done',
      priority: 'medium',
      module: 'UI',
      sprintNumber: 1,
    },

    // Tasks (8)
    {
      title: 'Set up CI/CD pipeline',
      kind: 'task',
      status: 'done',
      priority: 'high',
      module: 'DevOps',
      sprintNumber: 1,
    },
    {
      title: 'Configure Docker environment',
      kind: 'task',
      status: 'done',
      priority: 'high',
      module: 'DevOps',
      sprintNumber: 1,
    },
    {
      title: 'Design database schema',
      kind: 'task',
      status: 'in-progress',
      priority: 'critical',
      module: 'Database',
      sprintNumber: 2,
      assignee: 'Claude Code',
    },
    {
      title: 'Write API documentation',
      kind: 'task',
      status: 'todo',
      priority: 'medium',
      module: 'Docs',
      sprintNumber: 2,
    },
    {
      title: 'Create seed data scripts',
      kind: 'task',
      status: 'review',
      priority: 'medium',
      module: 'Database',
      sprintNumber: 2,
    },
    {
      title: 'Set up monitoring',
      kind: 'task',
      status: 'backlog',
      priority: 'low',
      module: 'DevOps',
      sprintNumber: 3,
    },
    {
      title: 'Configure Redis caching',
      kind: 'task',
      status: 'backlog',
      priority: 'medium',
      module: 'Performance',
      sprintNumber: 3,
    },
    {
      title: 'Add unit test coverage',
      kind: 'task',
      status: 'todo',
      priority: 'high',
      module: 'Testing',
      sprintNumber: 2,
    },

    // Bugs (5)
    {
      title: 'Login fails on Safari',
      kind: 'bug',
      status: 'in-progress',
      priority: 'critical',
      module: 'Auth',
      sprintNumber: 2,
      assignee: 'Claude Code',
    },
    {
      title: 'Memory leak in dashboard',
      kind: 'bug',
      status: 'todo',
      priority: 'high',
      module: 'Performance',
      sprintNumber: 2,
    },
    {
      title: 'CSS overflow on mobile',
      kind: 'bug',
      status: 'review',
      priority: 'medium',
      module: 'UI',
      sprintNumber: 2,
    },
    {
      title: 'Timezone display incorrect',
      kind: 'bug',
      status: 'backlog',
      priority: 'low',
      module: 'Core',
      sprintNumber: 3,
    },
    {
      title: 'Form validation not working',
      kind: 'bug',
      status: 'done',
      priority: 'high',
      module: 'UI',
      sprintNumber: 1,
    },

    // Tech Debt (4)
    {
      title: 'Refactor auth middleware',
      kind: 'tech_debt',
      status: 'todo',
      priority: 'medium',
      module: 'Auth',
      sprintNumber: 2,
    },
    {
      title: 'Clean up deprecated APIs',
      kind: 'tech_debt',
      status: 'backlog',
      priority: 'low',
      module: 'API',
      sprintNumber: 3,
    },
    {
      title: 'Upgrade React to v19',
      kind: 'tech_debt',
      status: 'backlog',
      priority: 'medium',
      module: 'Core',
      sprintNumber: 4,
    },
    {
      title: 'Remove unused dependencies',
      kind: 'tech_debt',
      status: 'done',
      priority: 'low',
      module: 'Core',
      sprintNumber: 1,
    },

    // Issues (3)
    {
      title: 'Performance degradation reported',
      kind: 'issue',
      status: 'todo',
      priority: 'high',
      module: 'Performance',
      sprintNumber: 2,
    },
    {
      title: 'User feedback: confusing UX',
      kind: 'issue',
      status: 'backlog',
      priority: 'medium',
      module: 'UI',
      sprintNumber: 3,
    },
    {
      title: 'Security audit findings',
      kind: 'issue',
      status: 'in-progress',
      priority: 'critical',
      module: 'Security',
      sprintNumber: 2,
      assignee: 'Claude Code',
    },
  ];

  // Find sprint IDs for linking tickets
  const sprintMap = new Map(sprints.map((s) => [s.sprintNumber, s.id]));

  // Sprint 17: Track project-scoped ticketNumber
  let ticketNumber = 1;

  const createdTickets: any[] = [];
  for (const t of ticketData) {
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: ticketNumber++, // Sprint 17: Project-scoped number
        projectId: PROJECT_ID,
        title: t.title,
        description: `Detailed description for: ${t.title}`,
        kind: t.kind as any,
        source: 'manual',
        status: t.status,
        priority: t.priority,
        module: t.module,
        sprintNumber: t.sprintNumber,
        sprintId: sprintMap.get(t.sprintNumber) ?? null, // Sprint 15: FK to Sprint for Kanban
        assignee: t.assignee || null,
        assigneeType: t.assignee ? 'agent_persona' : null,
      },
    });
    createdTickets.push(ticket);
  }
  console.log(`   Created ${createdTickets.length} tickets`);

  // =========================================================================
  // 3. CREATE AGENT SESSIONS
  // =========================================================================
  console.log('🤖 Creating agent sessions...');

  // Get tickets assigned to Claude Code for sessions
  const assignedTickets = createdTickets.filter(
    (t) => ticketData[createdTickets.indexOf(t)]?.assignee === 'Claude Code'
  );

  // Session 1: Active (IN_PROGRESS) - working on auth and schema
  const session1 = await prisma.agentSession.create({
    data: {
      projectId: PROJECT_ID,
      name: 'Implementing Authentication & Database Schema',
      status: 'IN_PROGRESS',
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Started 2 hours ago
      plan: `## Implementation Plan

### Phase 1: Database Schema
1. Design user tables
2. Create migration files
3. Set up Prisma client

### Phase 2: Authentication
1. JWT token generation
2. Session management
3. Protected routes

### Current Focus
Working on JWT implementation`,
      todos: [
        { content: 'Design user schema', status: 'completed' },
        { content: 'Create Prisma migrations', status: 'completed' },
        { content: 'Implement JWT tokens', status: 'in_progress' },
        { content: 'Add session middleware', status: 'pending' },
        { content: 'Write auth tests', status: 'pending' },
      ],
      progress: 'Completed schema design. Working on JWT token generation.',
      activeTicketIds: assignedTickets.slice(0, 2).map((t) => String(t.id)),
      tokenCount: 45000,
    },
  });
  console.log(`   Session 1 (ACTIVE): ${session1.name}`);

  // Session 2: Paused - was working on bug fix
  const session2 = await prisma.agentSession.create({
    data: {
      projectId: PROJECT_ID,
      name: 'Safari Login Bug Investigation',
      status: 'PAUSED',
      startedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // Started 5 hours ago
      plan: `## Bug Fix Plan

### Investigation
1. Reproduce issue on Safari
2. Check WebKit-specific behaviors
3. Analyze network requests

### Status: PAUSED
Waiting for Safari test device`,
      todos: [
        { content: 'Set up Safari testing env', status: 'completed' },
        { content: 'Reproduce the bug', status: 'completed' },
        { content: 'Identify root cause', status: 'in_progress' },
        { content: 'Implement fix', status: 'pending' },
      ],
      progress: 'Reproduced issue. Found it relates to SameSite cookie handling.',
      activeTicketIds: [String(assignedTickets[2]?.id || createdTickets[0]!.id)],
      tokenCount: 28000,
    },
  });
  console.log(`   Session 2 (PAUSED): ${session2.name}`);

  // Session 3: Another active session
  const session3 = await prisma.agentSession.create({
    data: {
      projectId: PROJECT_ID,
      name: 'Security Audit Response',
      status: 'IN_PROGRESS',
      startedAt: new Date(Date.now() - 45 * 60 * 1000), // Started 45 mins ago
      plan: `## Security Fixes

1. Review audit findings
2. Prioritize by severity
3. Implement fixes
4. Document changes`,
      todos: [
        { content: 'Review critical findings', status: 'in_progress' },
        { content: 'Fix SQL injection risk', status: 'pending' },
        { content: 'Update dependencies', status: 'pending' },
      ],
      progress: 'Reviewing security audit report.',
      activeTicketIds: [String(assignedTickets[3]?.id || createdTickets[1]!.id)],
      tokenCount: 12000,
    },
  });
  console.log(`   Session 3 (ACTIVE): ${session3.name}`);

  // Sessions 4-7: Completed sessions (for history)
  const completedSessions = [
    { name: 'Initial Project Setup', hours: 48, tokens: 85000 },
    { name: 'Docker Configuration', hours: 36, tokens: 42000 },
    { name: 'CI/CD Pipeline Setup', hours: 24, tokens: 55000 },
    { name: 'Form Validation Bug Fix', hours: 12, tokens: 18000 },
  ];

  for (const cs of completedSessions) {
    const started = new Date(Date.now() - cs.hours * 60 * 60 * 1000);
    const completed = new Date(started.getTime() + 3 * 60 * 60 * 1000); // 3 hours duration

    await prisma.agentSession.create({
      data: {
        projectId: PROJECT_ID,
        name: cs.name,
        status: 'COMPLETED',
        startedAt: started,
        completedAt: completed,
        plan: `Completed work for: ${cs.name}`,
        todos: [
          { content: 'Task 1', status: 'completed' },
          { content: 'Task 2', status: 'completed' },
        ],
        progress: `Successfully completed ${cs.name}`,
        activeTicketIds: [],
        tokenCount: cs.tokens,
      },
    });
  }
  console.log(`   Created ${completedSessions.length} completed sessions`);

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log(`
✅ Phase F Test Data Created Successfully!

📊 Summary for Project ${PROJECT_ID} (${project.name}):

🗺️  Roadmap (Sprint 15: 2-level hierarchy):
   - 4 Phases (Foundation, Core, Advanced, Launch)
   - 12 Sprints (3 per phase)

🎫 Tickets: ${createdTickets.length} total
   - Features: 5
   - Tasks: 8
   - Bugs: 5
   - Tech Debt: 4
   - Issues: 3
   - Status distribution: backlog, todo, in-progress, review, done

🤖 Sessions: 7 total
   - Active (IN_PROGRESS): 2
   - Paused: 1
   - Completed: 4

🔗 Test URLs:
   - Sessions: http://localhost:3000/sessions?project=3
   - Roadmap: http://localhost:3000/roadmap?project=3
   - Kanban: http://localhost:3000/kanban?project=3
   - Dashboard: http://localhost:3000/dashboard?project=3
`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding Phase F test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
