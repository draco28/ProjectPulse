/**
 * Sprint 12 API Tests
 *
 * Tests for:
 * 1. AgentSession CRUD operations (via API - no auth required)
 * 2. Ticket scheduling fields (via Prisma - bypasses API auth)
 * 3. Implementation Context feature (via Prisma - bypasses API auth)
 *
 * Run: DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev" npx tsx tests/api/sprint-12-features.test.ts
 */

import { PrismaClient } from '@prisma/client';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_PROJECT_ID = 1; // Valid project ID from database

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
  if (data) console.log(`   Data: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
}

function logFailure(name: string, error: string) {
  results.push({ name, passed: false, error });
  console.log(`❌ ${name}: ${error}`);
}

// ============================================================================
// AGENT SESSION TESTS
// ============================================================================

async function testAgentSessionCreate(): Promise<string | null> {
  const testName = 'AgentSession: Create new session';
  try {
    const response = await fetch(`${BASE_URL}/api/agent-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: TEST_PROJECT_ID,
        name: 'Test Session - Sprint 12 Verification',
        plan: '1. Create test data\n2. Verify API\n3. Check UI',
        todos: [
          { content: 'Create test data', status: 'completed' },
          { content: 'Verify API endpoints', status: 'in_progress' },
          { content: 'Check UI rendering', status: 'pending' },
        ],
        progress: 'Starting Sprint 12 verification tests...',
        activeTicketIds: [],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    if (!data.session?.id) {
      throw new Error('No session ID returned');
    }

    logSuccess(testName, { id: data.session.id, name: data.session.name });
    return data.session.id;
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function testAgentSessionGet(sessionId: string): Promise<void> {
  const testName = 'AgentSession: Get session by ID';
  try {
    const response = await fetch(`${BASE_URL}/api/agent-sessions/${sessionId}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.session?.id !== sessionId) {
      throw new Error('Session ID mismatch');
    }

    logSuccess(testName, { id: data.session.id, status: data.session.status });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

async function testAgentSessionUpdate(sessionId: string): Promise<void> {
  const testName = 'AgentSession: Update session';
  try {
    const response = await fetch(`${BASE_URL}/api/agent-sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        progress: 'Updated progress: API tests passing!',
        todos: [
          { content: 'Create test data', status: 'completed' },
          { content: 'Verify API endpoints', status: 'completed' },
          { content: 'Check UI rendering', status: 'in_progress' },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    logSuccess(testName, { updatedAt: data.updatedAt });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

async function testAgentSessionEnd(sessionId: string): Promise<void> {
  const testName = 'AgentSession: End session';
  try {
    const response = await fetch(`${BASE_URL}/api/agent-sessions/${sessionId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        progress: 'Session completed successfully!',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.session?.status !== 'COMPLETED') {
      throw new Error(`Expected COMPLETED status, got ${data.session?.status}`);
    }

    logSuccess(testName, { status: data.session.status, completedAt: data.session.completedAt });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

async function testAgentSessionList(): Promise<void> {
  const testName = 'AgentSession: List sessions for project';
  try {
    const response = await fetch(`${BASE_URL}/api/agent-sessions?projectId=${TEST_PROJECT_ID}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.sessions)) {
      throw new Error('Expected sessions array');
    }

    logSuccess(testName, { count: data.sessions.length });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

// ============================================================================
// IMPLEMENTATION CONTEXT TESTS
// ============================================================================

async function testTicketWithImplementationContext(): Promise<number | null> {
  const testName = 'Ticket: Create with implementation context';
  try {
    const response = await fetch(`${BASE_URL}/api/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: TEST_PROJECT_ID,
        title: 'Sprint 12 Test: Implementation Context Feature',
        description: 'Test ticket to verify implementation context storage and display',
        kind: 'feature',
        source: 'manual',
        priority: 'medium',
        status: 'BACKLOG',
        implementationContext: {
          phaseSprintRef: {
            // Note: phaseId and sprintId are optional strings (undefined OK, null NOT OK)
            displayName: 'Sprint 12 / Week 1',
          },
          filesToModify: [
            {
              path: 'apps/web/lib/auth.ts',
              reason: 'Add session handling for new auth flow',
              estimatedChanges: 'major',
            },
            {
              path: 'apps/web/components/Login.tsx',
              reason: 'Update login form UI',
              estimatedChanges: 'minor',
            },
          ],
          filesToCreate: [
            {
              path: 'apps/web/middleware.ts',
              purpose: 'Authentication middleware',
              template: 'next-middleware',
            },
          ],
          schemaChanges: {
            required: true,
            migrationName: 'add_user_sessions',
            models: ['User', 'UserSession'],
            description: 'Add session table for tracking user auth sessions',
          },
          implementationBlueprint: `## Implementation Steps

1. Create middleware.ts for auth checks
2. Update auth.ts with session handling
3. Run database migration
4. Update Login component
5. Test auth flow end-to-end`,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    if (!data.ticket?.id) {
      throw new Error('No ticket ID returned');
    }

    // Verify implementation context was stored
    const customFields = data.ticket.customFields;
    if (!customFields?.implementationContext) {
      throw new Error('Implementation context not found in customFields');
    }

    logSuccess(testName, {
      id: data.ticket.id,
      hasFilesToModify: customFields.implementationContext.filesToModify?.length > 0,
      hasSchemaChanges: customFields.implementationContext.schemaChanges?.required,
    });

    return data.ticket.id;
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function testTicketGetWithImplementationContext(ticketId: number): Promise<void> {
  const testName = 'Ticket: Get ticket with implementation context';
  try {
    const response = await fetch(`${BASE_URL}/api/tickets/${ticketId}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const customFields = data.ticket?.customFields;

    if (!customFields?.implementationContext) {
      throw new Error('Implementation context not found');
    }

    const ctx = customFields.implementationContext;
    logSuccess(testName, {
      filesToModify: ctx.filesToModify?.length || 0,
      filesToCreate: ctx.filesToCreate?.length || 0,
      requiresSchemaChanges: ctx.schemaChanges?.required || false,
      hasBlueprint: !!ctx.implementationBlueprint,
    });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

async function testTicketUpdateImplementationContext(ticketId: number): Promise<void> {
  const testName = 'Ticket: Update implementation context';
  try {
    const response = await fetch(`${BASE_URL}/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        implementationContext: {
          filesToModify: [
            {
              path: 'apps/web/lib/auth.ts',
              reason: 'UPDATED: Now includes refresh token logic',
              estimatedChanges: 'major',
            },
          ],
          implementationBlueprint: '## UPDATED Blueprint\n\n1. Added refresh token step',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const ctx = data.ticket?.customFields?.implementationContext;

    if (!ctx?.implementationBlueprint?.includes('UPDATED')) {
      throw new Error('Implementation context update not reflected');
    }

    logSuccess(testName, { updated: true });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

async function testTicketRemoveImplementationContext(ticketId: number): Promise<void> {
  const testName = 'Ticket: Remove implementation context';
  try {
    const response = await fetch(`${BASE_URL}/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        implementationContext: null,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const ctx = data.ticket?.customFields?.implementationContext;

    if (ctx) {
      throw new Error('Implementation context should be removed');
    }

    logSuccess(testName, { removed: true });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

// ============================================================================
// TICKET SCHEDULING TESTS
// ============================================================================

async function testTicketWithScheduling(): Promise<number | null> {
  const testName = 'Ticket: Create with scheduling fields';
  try {
    const response = await fetch(`${BASE_URL}/api/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: TEST_PROJECT_ID,
        title: 'Sprint 12 Test: Ticket Scheduling',
        description: 'Test ticket with scheduling fields',
        kind: 'task',
        source: 'manual',
        priority: 'medium',
        status: 'BACKLOG',
        estimatedDays: 3,
        scheduledDays: ['Monday', 'Tuesday', 'Wednesday'],
        // Note: scheduledWeekId requires a valid Week ID from the roadmap
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    if (!data.ticket?.id) {
      throw new Error('No ticket ID returned');
    }

    if (data.ticket.estimatedDays !== 3) {
      throw new Error(`Expected estimatedDays=3, got ${data.ticket.estimatedDays}`);
    }

    logSuccess(testName, {
      id: data.ticket.id,
      estimatedDays: data.ticket.estimatedDays,
      scheduledDays: data.ticket.scheduledDays,
    });

    return data.ticket.id;
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
    return null;
  }
}

// ============================================================================
// CLEANUP
// ============================================================================

async function cleanupTestTicket(ticketId: number): Promise<void> {
  try {
    await fetch(`${BASE_URL}/api/tickets/${ticketId}`, { method: 'DELETE' });
    log(`Cleaned up test ticket ${ticketId}`);
  } catch {
    // Ignore cleanup errors
  }
}

async function cleanupTestSession(sessionId: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/api/agent-sessions/${sessionId}`, { method: 'DELETE' });
    log(`Cleaned up test session ${sessionId}`);
  } catch {
    // Ignore cleanup errors
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runTests() {
  console.log('\n========================================');
  console.log('Sprint 12 Feature Tests');
  console.log('========================================\n');

  // Track created resources for cleanup
  let sessionId: string | null = null;
  let implContextTicketId: number | null = null;
  let schedulingTicketId: number | null = null;

  try {
    // --- Agent Session Tests ---
    console.log('\n--- Agent Session Tests ---\n');

    sessionId = await testAgentSessionCreate();
    if (sessionId) {
      await testAgentSessionGet(sessionId);
      await testAgentSessionUpdate(sessionId);
      await testAgentSessionList();
      await testAgentSessionEnd(sessionId);
    }

    // --- Implementation Context Tests ---
    console.log('\n--- Implementation Context Tests ---\n');

    implContextTicketId = await testTicketWithImplementationContext();
    if (implContextTicketId) {
      await testTicketGetWithImplementationContext(implContextTicketId);
      await testTicketUpdateImplementationContext(implContextTicketId);
      await testTicketRemoveImplementationContext(implContextTicketId);
    }

    // --- Ticket Scheduling Tests ---
    console.log('\n--- Ticket Scheduling Tests ---\n');

    schedulingTicketId = await testTicketWithScheduling();
  } finally {
    // Cleanup
    console.log('\n--- Cleanup ---\n');

    if (implContextTicketId) await cleanupTestTicket(implContextTicketId);
    if (schedulingTicketId) await cleanupTestTicket(schedulingTicketId);
    if (sessionId) await cleanupTestSession(sessionId);
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

  console.log('\n✅ All tests passed!\n');
}

// Run tests
runTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
