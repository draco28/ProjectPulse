/**
 * Sprint 15 Kanban API Tests
 *
 * Tests for:
 * 1. Progress Calculator (parent, sprint, phase level)
 * 2. Kanban Board API (GET /api/sprints/[sprintId]/kanban)
 * 3. Move Ticket API (PATCH /api/tickets/[id]/move)
 * 4. Bulk Reorder API (PATCH /api/tickets/reorder)
 * 5. Roadmap Overview API (GET /api/roadmap/overview)
 *
 * Run: DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev" npx tsx tests/api/sprint-15-kanban.test.ts
 */

import { PrismaClient } from '@prisma/client';
import {
  calculateParentProgress,
  calculateSprintProgress,
  calculatePhaseProgress,
  calculateAndCascadeProgress,
} from '../../lib/tickets/progress-calculator';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_PROJECT_ID = parseInt(process.env.TEST_PROJECT_ID || '2', 10); // Use env var or default to AI Hub Development

// Agent token for authenticated API tests (optional)
const AGENT_TOKEN = process.env.AGENT_TOKEN || '';
// Type-safe headers that work with fetch
const getAuthHeaders = (withContentType = false): HeadersInit => {
  const headers: Record<string, string> = {};
  if (AGENT_TOKEN) {
    headers['Authorization'] = `Bearer ${AGENT_TOKEN}`;
  }
  if (withContentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  data?: unknown;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(`[TEST] ${message}`);
}

function logSuccess(name: string, data?: unknown) {
  results.push({ name, passed: true, data });
  console.log(`✅ ${name}`);
  if (data) console.log(`   Data: ${JSON.stringify(data, null, 2).substring(0, 300)}...`);
}

function logFailure(name: string, error: string) {
  results.push({ name, passed: false, error });
  console.log(`❌ ${name}: ${error}`);
}

// ============================================================================
// TEST FIXTURES - Create test data for kanban tests
// ============================================================================

interface TestFixtures {
  phaseId?: string;
  sprintId?: string;
  parentTicketId?: number;
  childTicketIds?: number[];
}

const fixtures: TestFixtures = {};

async function setupTestData() {
  log('Setting up test data...');

  try {
    // Get existing roadmap/phase/sprint or create new ones
    const roadmap = await prisma.roadmap.findUnique({
      where: { projectId: TEST_PROJECT_ID },
      include: {
        phases_rel: {
          include: {
            sprints: true,
          },
          take: 1,
        },
      },
    });

    if (roadmap?.phases_rel?.[0]?.sprints?.[0]) {
      fixtures.phaseId = roadmap.phases_rel[0].id;
      fixtures.sprintId = roadmap.phases_rel[0].sprints[0].id;
      log(`Using existing phase: ${fixtures.phaseId}`);
      log(`Using existing sprint: ${fixtures.sprintId}`);
    } else {
      log('No existing roadmap found - tests will skip roadmap-dependent features');
    }

    // Create a parent feature ticket for hierarchy tests
    // Sprint 17: Start at 9100 to avoid conflicts with other test data
    let testTicketNumber = 9100;
    const parentTicket = await prisma.ticket.create({
      data: {
        projectId: TEST_PROJECT_ID,
        ticketNumber: testTicketNumber++,
        title: 'Test Parent Feature - Sprint 15 Kanban Test',
        kind: 'feature',
        source: 'agent',
        status: 'todo',
        priority: 'medium',
        sprintId: fixtures.sprintId ?? null,
        sprintNumber: fixtures.sprintId ? 1 : null,
        displayOrder: 0,
      },
    });
    fixtures.parentTicketId = parentTicket.id;
    log(`Created parent ticket: ${fixtures.parentTicketId}`);

    // Create 4 child task tickets
    const childStatuses = ['backlog', 'todo', 'in-progress', 'done'];
    fixtures.childTicketIds = [];

    for (let i = 0; i < 4; i++) {
      const child = await prisma.ticket.create({
        data: {
          projectId: TEST_PROJECT_ID,
          ticketNumber: testTicketNumber++, // Sprint 17: Sequential test ticket numbers
          title: `Test Child Task ${i + 1} - Sprint 15`,
          kind: 'task',
          source: 'agent',
          status: childStatuses[i],
          priority: 'medium',
          parentTicketId: fixtures.parentTicketId,
          sprintId: fixtures.sprintId ?? null,
          sprintNumber: fixtures.sprintId ? 1 : null,
          displayOrder: i,
        },
      });
      fixtures.childTicketIds.push(child.id);
    }
    log(`Created ${fixtures.childTicketIds.length} child tickets`);

    return true;
  } catch (error) {
    log(`Setup failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function cleanupTestData() {
  log('Cleaning up test data...');

  try {
    // Delete child tickets first (FK constraint)
    if (fixtures.childTicketIds?.length) {
      await prisma.ticket.deleteMany({
        where: { id: { in: fixtures.childTicketIds } },
      });
      log(`Deleted ${fixtures.childTicketIds.length} child tickets`);
    }

    // Delete parent ticket
    if (fixtures.parentTicketId) {
      await prisma.ticket.delete({
        where: { id: fixtures.parentTicketId },
      });
      log(`Deleted parent ticket: ${fixtures.parentTicketId}`);
    }
  } catch (error) {
    log(`Cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ============================================================================
// PROGRESS CALCULATOR TESTS
// ============================================================================

async function testCalculateParentProgress() {
  const testName = 'Progress Calculator: Calculate parent progress';

  if (!fixtures.parentTicketId) {
    logFailure(testName, 'No parent ticket created');
    return;
  }

  try {
    const progress = await calculateParentProgress(prisma, fixtures.parentTicketId);

    // With 4 children: backlog(0), todo(0), in-progress(0), done(1) = 1/4 = 25%
    if (progress !== 25) {
      throw new Error(`Expected 25% progress, got ${progress}%`);
    }

    logSuccess(testName, { parentId: fixtures.parentTicketId, progress });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

async function testCalculateSprintProgress() {
  const testName = 'Progress Calculator: Calculate sprint progress';

  if (!fixtures.sprintId) {
    log(`⏭️ ${testName}: Skipped (no sprint in test project)`);
    results.push({ name: testName, passed: true, data: { skipped: true } });
    return;
  }

  try {
    const result = await calculateSprintProgress(prisma, fixtures.sprintId);

    // Progress should be a valid percentage (0-100)
    if (result.progress < 0 || result.progress > 100) {
      throw new Error(`Invalid progress value: ${result.progress}`);
    }

    logSuccess(testName, { sprintId: fixtures.sprintId, progress: result.progress, total: result.total });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

async function testCalculatePhaseProgress() {
  const testName = 'Progress Calculator: Calculate phase progress';

  if (!fixtures.phaseId) {
    log(`⏭️ ${testName}: Skipped (no phase in test project)`);
    results.push({ name: testName, passed: true, data: { skipped: true } });
    return;
  }

  try {
    const progress = await calculatePhaseProgress(prisma, fixtures.phaseId);

    // Progress should be a valid percentage (0-100)
    if (progress < 0 || progress > 100) {
      throw new Error(`Invalid progress value: ${progress}`);
    }

    logSuccess(testName, { phaseId: fixtures.phaseId, progress });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

async function testProgressCascade() {
  const testName = 'Progress Calculator: Cascade progress update';

  if (!fixtures.childTicketIds?.[0]) {
    logFailure(testName, 'No child ticket created');
    return;
  }

  try {
    // Move first child from 'backlog' to 'done'
    await prisma.ticket.update({
      where: { id: fixtures.childTicketIds[0] },
      data: { status: 'done' },
    });

    // Trigger cascade
    const result = await calculateAndCascadeProgress(prisma, fixtures.childTicketIds[0]);

    // Now 2/4 = 50% done
    if (result.parentProgress !== 50) {
      throw new Error(`Expected 50% parent progress, got ${result.parentProgress}%`);
    }

    logSuccess(testName, result);

    // Reset the ticket status for other tests
    await prisma.ticket.update({
      where: { id: fixtures.childTicketIds[0] },
      data: { status: 'backlog' },
    });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

// ============================================================================
// KANBAN BOARD API TESTS
// ============================================================================

async function testKanbanBoardEndpoint() {
  const testName = 'Kanban Board API: GET /api/sprints/[sprintId]/kanban';

  if (!fixtures.sprintId) {
    log(`⏭️ ${testName}: Skipped (no sprint in test project)`);
    results.push({ name: testName, passed: true, data: { skipped: true } });
    return;
  }

  if (!AGENT_TOKEN) {
    log(`⏭️ ${testName}: Skipped (no AGENT_TOKEN provided)`);
    results.push({ name: testName, passed: true, data: { skipped: true, reason: 'auth' } });
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/sprints/${fixtures.sprintId}/kanban`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.success) {
      throw new Error(`API returned error: ${data.error?.message}`);
    }

    const board = data.data;
    if (!board.columns) {
      throw new Error('Missing columns in response');
    }
    if (!board.stats) {
      throw new Error('Missing stats in response');
    }
    if (!board.sprint) {
      throw new Error('Missing sprint context in response');
    }

    // Validate column structure
    const expectedColumns = ['backlog', 'todo', 'in-progress', 'in-review', 'done'];
    for (const col of expectedColumns) {
      if (!Array.isArray(board.columns[col])) {
        throw new Error(`Column ${col} is not an array`);
      }
    }

    logSuccess(testName, {
      sprint: board.sprint.title,
      totalTickets: board.stats.total,
      progress: board.stats.progress,
    });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

// ============================================================================
// MOVE TICKET API TESTS
// ============================================================================

async function testMoveTicketEndpoint() {
  const testName = 'Move Ticket API: PATCH /api/tickets/[id]/move';

  if (!fixtures.childTicketIds?.[1]) {
    logFailure(testName, 'No child ticket created');
    return;
  }

  if (!AGENT_TOKEN) {
    log(`⏭️ ${testName}: Skipped (no AGENT_TOKEN provided)`);
    results.push({ name: testName, passed: true, data: { skipped: true, reason: 'auth' } });
    return;
  }

  const ticketId = fixtures.childTicketIds[1]; // Second child (was 'todo')

  try {
    const response = await fetch(`${BASE_URL}/api/tickets/${ticketId}/move`, {
      method: 'PATCH',
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        status: 'in-progress',
        displayOrder: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`API returned error: ${data.error?.message}`);
    }

    const result = data.data;
    if (result.ticket.status !== 'in-progress') {
      throw new Error(`Expected status 'in-progress', got '${result.ticket.status}'`);
    }

    logSuccess(testName, {
      ticketId,
      newStatus: result.ticket.status,
      newDisplayOrder: result.ticket.displayOrder,
      progressUpdates: result.progressUpdates,
    });

    // Reset ticket to original state
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'todo', displayOrder: 1 },
    });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

// ============================================================================
// BULK REORDER API TESTS
// ============================================================================

async function testBulkReorderEndpoint() {
  const testName = 'Bulk Reorder API: PATCH /api/tickets/reorder';

  if (!fixtures.childTicketIds || fixtures.childTicketIds.length < 2) {
    logFailure(testName, 'Not enough child tickets created');
    return;
  }

  if (!AGENT_TOKEN) {
    log(`⏭️ ${testName}: Skipped (no AGENT_TOKEN provided)`);
    results.push({ name: testName, passed: true, data: { skipped: true, reason: 'auth' } });
    return;
  }

  try {
    const moves = [
      { ticketId: fixtures.childTicketIds[0], status: 'todo', displayOrder: 5 },
      { ticketId: fixtures.childTicketIds[1], status: 'todo', displayOrder: 6 },
    ];

    const response = await fetch(`${BASE_URL}/api/tickets/reorder`, {
      method: 'PATCH',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ moves }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`API returned error: ${data.error?.message}`);
    }

    const result = data.data;
    if (result.updated !== 2) {
      throw new Error(`Expected 2 updates, got ${result.updated}`);
    }

    logSuccess(testName, {
      updated: result.updated,
      tickets: result.tickets.map((t: { id: number; status: string }) => ({ id: t.id, status: t.status })),
    });

    // Reset tickets to original state
    await prisma.ticket.update({
      where: { id: fixtures.childTicketIds[0] },
      data: { status: 'backlog', displayOrder: 0 },
    });
    await prisma.ticket.update({
      where: { id: fixtures.childTicketIds[1] },
      data: { status: 'todo', displayOrder: 1 },
    });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

// ============================================================================
// ROADMAP OVERVIEW API TESTS
// ============================================================================

async function testRoadmapOverviewEndpoint() {
  const testName = 'Roadmap Overview API: GET /api/roadmap/overview';

  if (!AGENT_TOKEN) {
    log(`⏭️ ${testName}: Skipped (no AGENT_TOKEN provided)`);
    results.push({ name: testName, passed: true, data: { skipped: true, reason: 'auth' } });
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/roadmap/overview?projectId=${TEST_PROJECT_ID}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // 404 is OK - means no roadmap for this project
      if (response.status === 404) {
        log(`⏭️ ${testName}: Skipped (no roadmap for project)`);
        results.push({ name: testName, passed: true, data: { skipped: true } });
        return;
      }
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`API returned error: ${data.error?.message}`);
    }

    const overview = data.data;
    if (!overview.phases || !Array.isArray(overview.phases)) {
      throw new Error('Missing phases array in response');
    }
    if (!overview.stats) {
      throw new Error('Missing stats in response');
    }

    logSuccess(testName, {
      title: overview.title,
      totalPhases: overview.stats.totalPhases,
      totalSprints: overview.stats.totalSprints,
      totalTickets: overview.stats.totalTickets,
      overallProgress: overview.stats.overallProgress,
    });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

// ============================================================================
// TICKET CREATE/UPDATE WITH SPRINT ID TESTS
// ============================================================================

async function testTicketCreateWithSprintNumber() {
  const testName = 'Ticket Create: Auto-resolve sprintId from sprintNumber';

  if (!fixtures.sprintId) {
    log(`⏭️ ${testName}: Skipped (no sprint in test project)`);
    results.push({ name: testName, passed: true, data: { skipped: true } });
    return;
  }

  if (!AGENT_TOKEN) {
    log(`⏭️ ${testName}: Skipped (no AGENT_TOKEN provided)`);
    results.push({ name: testName, passed: true, data: { skipped: true, reason: 'auth' } });
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/tickets`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        projectId: TEST_PROJECT_ID,
        title: 'Test Ticket - SprintNumber Resolution Test',
        kind: 'task',
        source: 'agent',
        sprintNumber: 1, // Should auto-resolve to sprintId
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`API returned error: ${data.error?.message}`);
    }

    const ticket = data.data;
    if (!ticket.sprintId) {
      throw new Error('sprintId was not auto-resolved from sprintNumber');
    }
    if (ticket.sprintNumber !== 1) {
      throw new Error(`Expected sprintNumber 1, got ${ticket.sprintNumber}`);
    }

    logSuccess(testName, {
      ticketId: ticket.id,
      sprintNumber: ticket.sprintNumber,
      sprintId: ticket.sprintId,
    });

    // Cleanup
    await prisma.ticket.delete({ where: { id: ticket.id } });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

async function testTicketCreateWithDisplayOrder() {
  const testName = 'Ticket Create: Auto-assign displayOrder';

  if (!fixtures.sprintId) {
    log(`⏭️ ${testName}: Skipped (no sprint in test project)`);
    results.push({ name: testName, passed: true, data: { skipped: true } });
    return;
  }

  if (!AGENT_TOKEN) {
    log(`⏭️ ${testName}: Skipped (no AGENT_TOKEN provided)`);
    results.push({ name: testName, passed: true, data: { skipped: true, reason: 'auth' } });
    return;
  }

  try {
    // Get current max displayOrder in the sprint
    const maxResult = await prisma.ticket.aggregate({
      where: { sprintId: fixtures.sprintId, status: 'todo' },
      _max: { displayOrder: true },
    });
    const expectedOrder = (maxResult._max.displayOrder ?? -1) + 1;

    const response = await fetch(`${BASE_URL}/api/tickets`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        projectId: TEST_PROJECT_ID,
        title: 'Test Ticket - DisplayOrder Test',
        kind: 'task',
        source: 'agent',
        status: 'todo',
        sprintNumber: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`API returned error: ${data.error?.message}`);
    }

    const ticket = data.data;
    if (ticket.displayOrder !== expectedOrder) {
      throw new Error(`Expected displayOrder ${expectedOrder}, got ${ticket.displayOrder}`);
    }

    logSuccess(testName, {
      ticketId: ticket.id,
      displayOrder: ticket.displayOrder,
      expectedOrder,
    });

    // Cleanup
    await prisma.ticket.delete({ where: { id: ticket.id } });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  Sprint 15 Kanban API Tests');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Setup
  const setupOk = await setupTestData();
  if (!setupOk) {
    console.log('\n⚠️  Setup failed - some tests may not run correctly\n');
  }

  console.log('\n─── Progress Calculator Tests ───────────────────────────────────\n');
  await testCalculateParentProgress();
  await testCalculateSprintProgress();
  await testCalculatePhaseProgress();
  await testProgressCascade();

  console.log('\n─── Kanban Board API Tests ──────────────────────────────────────\n');
  await testKanbanBoardEndpoint();

  console.log('\n─── Move Ticket API Tests ───────────────────────────────────────\n');
  await testMoveTicketEndpoint();

  console.log('\n─── Bulk Reorder API Tests ──────────────────────────────────────\n');
  await testBulkReorderEndpoint();

  console.log('\n─── Roadmap Overview API Tests ──────────────────────────────────\n');
  await testRoadmapOverviewEndpoint();

  console.log('\n─── Ticket Create/Update Tests ──────────────────────────────────\n');
  await testTicketCreateWithSprintNumber();
  await testTicketCreateWithDisplayOrder();

  // Cleanup
  await cleanupTestData();

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  Test Summary');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const skipped = results.filter((r) => r.passed && r.data && typeof r.data === 'object' && 'skipped' in r.data).length;

  console.log(`  Total:   ${results.length}`);
  console.log(`  Passed:  ${passed - skipped} ✅`);
  console.log(`  Skipped: ${skipped} ⏭️`);
  console.log(`  Failed:  ${failed} ❌`);

  if (failed > 0) {
    console.log('\n  Failed tests:');
    results.filter((r) => !r.passed).forEach((r) => console.log(`    - ${r.name}: ${r.error}`));
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
