/**
 * Sprint 12 Prisma-Based Tests
 *
 * Tests Sprint 12 features directly via Prisma (bypasses API auth)
 *
 * Run: DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev" npx tsx tests/api/sprint-12-prisma-test.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TEST_PROJECT_ID = 1;

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  data?: unknown;
}

const results: TestResult[] = [];

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
// AGENT SESSION TESTS
// ============================================================================

async function testAgentSessionCRUD(): Promise<string | null> {
  let sessionId: string | null = null;

  // Create
  try {
    const session = await prisma.agentSession.create({
      data: {
        projectId: TEST_PROJECT_ID,
        name: 'Prisma Test Session',
        plan: '1. Create test\n2. Verify\n3. Cleanup',
        todos: [
          { content: 'Test item 1', status: 'completed' },
          { content: 'Test item 2', status: 'in_progress' },
        ],
        progress: 'Starting Prisma test...',
        activeTicketIds: [],
        status: 'IN_PROGRESS',
      },
    });
    sessionId = session.id;
    logSuccess('AgentSession: Create via Prisma', { id: session.id, name: session.name });
  } catch (error) {
    logFailure(
      'AgentSession: Create via Prisma',
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }

  // Read
  try {
    const session = await prisma.agentSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new Error('Session not found');
    logSuccess('AgentSession: Read via Prisma', { status: session.status });
  } catch (error) {
    logFailure(
      'AgentSession: Read via Prisma',
      error instanceof Error ? error.message : String(error)
    );
  }

  // Update
  try {
    const session = await prisma.agentSession.update({
      where: { id: sessionId },
      data: {
        progress: 'Updated progress via Prisma',
        todos: [
          { content: 'Test item 1', status: 'completed' },
          { content: 'Test item 2', status: 'completed' },
          { content: 'Test item 3', status: 'in_progress' },
        ],
      },
    });
    logSuccess('AgentSession: Update via Prisma', {
      todosCount: (session.todos as unknown[])?.length,
    });
  } catch (error) {
    logFailure(
      'AgentSession: Update via Prisma',
      error instanceof Error ? error.message : String(error)
    );
  }

  // End (complete)
  try {
    const session = await prisma.agentSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        progress: 'Session completed via Prisma test',
      },
    });
    if (session.status !== 'COMPLETED') throw new Error('Status not updated');
    logSuccess('AgentSession: Complete via Prisma', {
      status: session.status,
      completedAt: session.completedAt,
    });
  } catch (error) {
    logFailure(
      'AgentSession: Complete via Prisma',
      error instanceof Error ? error.message : String(error)
    );
  }

  return sessionId;
}

// ============================================================================
// IMPLEMENTATION CONTEXT TESTS
// ============================================================================

async function testImplementationContext(): Promise<number | null> {
  let ticketId: number | null = null;

  // Create ticket with implementation context
  try {
    const ticket = await prisma.ticket.create({
      data: {
        projectId: TEST_PROJECT_ID,
        title: 'Prisma Test: Implementation Context',
        description: 'Testing implementation context storage',
        kind: 'feature',
        source: 'manual',
        priority: 'medium',
        status: 'backlog',
        customFields: {
          implementationContext: {
            phaseSprintRef: {
              displayName: 'Sprint 12 / Test',
            },
            filesToModify: [
              {
                path: 'apps/web/lib/test.ts',
                reason: 'Add test utilities',
                estimatedChanges: 'minor',
              },
            ],
            filesToCreate: [
              {
                path: 'apps/web/tests/new-test.ts',
                purpose: 'Integration tests',
              },
            ],
            schemaChanges: {
              required: false,
              description: 'No schema changes needed',
            },
            implementationBlueprint: '## Test Plan\n\n1. Create test\n2. Verify\n3. Done',
          },
        },
      },
    });
    ticketId = ticket.id;

    // Verify implementation context was stored
    const customFields = ticket.customFields as { implementationContext?: unknown };
    if (!customFields?.implementationContext) {
      throw new Error('Implementation context not found in customFields');
    }

    logSuccess('Ticket: Create with implementation context', {
      id: ticket.id,
      hasContext: !!customFields.implementationContext,
    });
  } catch (error) {
    logFailure(
      'Ticket: Create with implementation context',
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }

  // Read and verify structure
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    const customFields = ticket?.customFields as {
      implementationContext?: {
        filesToModify?: unknown[];
        filesToCreate?: unknown[];
        schemaChanges?: { required?: boolean };
        implementationBlueprint?: string;
      };
    };
    const ctx = customFields?.implementationContext;

    if (!ctx) throw new Error('Implementation context not found');

    logSuccess('Ticket: Read implementation context', {
      filesToModify: ctx.filesToModify?.length || 0,
      filesToCreate: ctx.filesToCreate?.length || 0,
      schemaRequired: ctx.schemaChanges?.required || false,
      hasBlueprint: !!ctx.implementationBlueprint,
    });
  } catch (error) {
    logFailure(
      'Ticket: Read implementation context',
      error instanceof Error ? error.message : String(error)
    );
  }

  // Update implementation context
  try {
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        customFields: {
          implementationContext: {
            filesToModify: [
              {
                path: 'apps/web/lib/updated.ts',
                reason: 'UPDATED: Now includes additional logic',
                estimatedChanges: 'major',
              },
            ],
            implementationBlueprint: '## UPDATED Blueprint\n\n1. Updated step',
          },
        },
      },
    });
    const customFields = ticket.customFields as {
      implementationContext?: { implementationBlueprint?: string };
    };
    if (!customFields?.implementationContext?.implementationBlueprint?.includes('UPDATED')) {
      throw new Error('Update not reflected');
    }
    logSuccess('Ticket: Update implementation context', { updated: true });
  } catch (error) {
    logFailure(
      'Ticket: Update implementation context',
      error instanceof Error ? error.message : String(error)
    );
  }

  // Remove implementation context
  try {
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        customFields: {},
      },
    });
    const customFields = ticket.customFields as { implementationContext?: unknown };
    if (customFields?.implementationContext) {
      throw new Error('Implementation context should be removed');
    }
    logSuccess('Ticket: Remove implementation context', { removed: true });
  } catch (error) {
    logFailure(
      'Ticket: Remove implementation context',
      error instanceof Error ? error.message : String(error)
    );
  }

  return ticketId;
}

// ============================================================================
// TICKET SCHEDULING TESTS
// ============================================================================

async function testTicketScheduling(): Promise<number | null> {
  let ticketId: number | null = null;

  // Create ticket with scheduling fields
  // Sprint 15: scheduledDays removed (Week model deleted - Ticket #80)
  // Now only testing estimatedDays and sprintNumber
  try {
    const ticket = await prisma.ticket.create({
      data: {
        projectId: TEST_PROJECT_ID,
        title: 'Prisma Test: Scheduling Fields',
        description: 'Testing ticket scheduling',
        kind: 'task',
        source: 'manual',
        priority: 'medium',
        status: 'backlog',
        estimatedDays: 3,
        sprintNumber: 1,
      },
    });
    ticketId = ticket.id;

    if (ticket.estimatedDays !== 3) {
      throw new Error(`Expected estimatedDays=3, got ${ticket.estimatedDays}`);
    }
    if (ticket.sprintNumber !== 1) {
      throw new Error(`Expected sprintNumber=1, got ${ticket.sprintNumber}`);
    }

    logSuccess('Ticket: Create with scheduling fields', {
      id: ticket.id,
      estimatedDays: ticket.estimatedDays,
      sprintNumber: ticket.sprintNumber,
    });
  } catch (error) {
    logFailure(
      'Ticket: Create with scheduling fields',
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }

  // Update scheduling fields
  // Sprint 15: scheduledDays removed (Week model deleted - Ticket #80)
  try {
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        estimatedDays: 5,
        sprintNumber: 2,
      },
    });

    if (ticket.estimatedDays !== 5) {
      throw new Error(`Expected estimatedDays=5, got ${ticket.estimatedDays}`);
    }

    logSuccess('Ticket: Update scheduling fields', {
      estimatedDays: ticket.estimatedDays,
      sprintNumber: ticket.sprintNumber,
    });
  } catch (error) {
    logFailure(
      'Ticket: Update scheduling fields',
      error instanceof Error ? error.message : String(error)
    );
  }

  return ticketId;
}

// ============================================================================
// CLEANUP
// ============================================================================

async function cleanup(ticketIds: number[], sessionIds: string[]) {
  console.log('\n--- Cleanup ---\n');

  for (const id of ticketIds) {
    try {
      await prisma.ticket.delete({ where: { id } });
      console.log(`   Deleted ticket ${id}`);
    } catch {
      console.log(`   Ticket ${id} already deleted or not found`);
    }
  }

  for (const id of sessionIds) {
    try {
      await prisma.agentSession.delete({ where: { id } });
      console.log(`   Deleted session ${id}`);
    } catch {
      console.log(`   Session ${id} already deleted or not found`);
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n========================================');
  console.log('Sprint 12 Prisma-Based Tests');
  console.log('========================================\n');

  const ticketIds: number[] = [];
  const sessionIds: string[] = [];

  try {
    // --- Agent Session Tests ---
    console.log('\n--- AgentSession Tests ---\n');
    const sessionId = await testAgentSessionCRUD();
    if (sessionId) sessionIds.push(sessionId);

    // --- Implementation Context Tests ---
    console.log('\n--- Implementation Context Tests ---\n');
    const implTicketId = await testImplementationContext();
    if (implTicketId) ticketIds.push(implTicketId);

    // --- Ticket Scheduling Tests ---
    console.log('\n--- Ticket Scheduling Tests ---\n');
    const schedTicketId = await testTicketScheduling();
    if (schedTicketId) ticketIds.push(schedTicketId);
  } finally {
    // Cleanup
    await cleanup(ticketIds, sessionIds);
    await prisma.$disconnect();
  }

  // Summary
  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================\n');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed Tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    process.exit(1);
  }

  console.log('\n✅ All Sprint 12 tests passed!\n');
}

main().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
