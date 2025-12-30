/**
 * Sprint Resolution Helper Tests
 *
 * Tests for:
 * 1. resolveSprintByNumber - deterministic sprint lookup
 * 2. findNextSprint - ordered next sprint traversal
 * 3. getOrderedSprints - sprint list ordering
 *
 * Ticket #91: Verify deterministic ordering with global numbering
 *
 * Run: DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev" npx tsx tests/lib/sprints/resolution.test.ts
 */

import { PrismaClient } from '@prisma/client';
import {
  resolveSprintByNumber,
  findNextSprint,
  getOrderedSprints,
  SPRINT_ORDER_BY,
} from '../../../lib/sprints/resolution';

const TEST_PROJECT_ID = parseInt(process.env.TEST_PROJECT_ID || '6', 10);

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
  console.log(`❌ ${name}`);
  console.log(`   Error: ${error}`);
}

// ============================================================================
// Test: SPRINT_ORDER_BY constant
// ============================================================================

async function testSprintOrderByConstant() {
  const testName = 'SPRINT_ORDER_BY has correct structure';
  try {
    // Verify the constant has the expected shape
    if (!Array.isArray(SPRINT_ORDER_BY)) {
      throw new Error('SPRINT_ORDER_BY should be an array');
    }

    if (SPRINT_ORDER_BY.length !== 3) {
      throw new Error(`Expected 3 ordering fields, got ${SPRINT_ORDER_BY.length}`);
    }

    // First should be phase.startDate ascending (handles per-phase numbering)
    const first = SPRINT_ORDER_BY[0] as { phase?: { startDate?: string } };
    if (!first.phase || first.phase.startDate !== 'asc') {
      throw new Error('First field should be { phase: { startDate: "asc" } }');
    }

    // Second should be sprintNumber ascending
    const second = SPRINT_ORDER_BY[1] as { sprintNumber?: string };
    if (!('sprintNumber' in second) || second.sprintNumber !== 'asc') {
      throw new Error('Second field should be { sprintNumber: "asc" }');
    }

    // Third should be id ascending (tiebreaker)
    const third = SPRINT_ORDER_BY[2] as { id?: string };
    if (!('id' in third) || third.id !== 'asc') {
      throw new Error('Third field should be { id: "asc" }');
    }

    logSuccess(testName, { orderBy: SPRINT_ORDER_BY });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

// ============================================================================
// Test: resolveSprintByNumber
// ============================================================================

async function testResolveSprintByNumber() {
  const testName = 'resolveSprintByNumber returns correct sprint';
  try {
    // Get all sprints for the project to verify ordering
    const sprints = await prisma.sprint.findMany({
      where: { phase: { roadmap: { projectId: TEST_PROJECT_ID } } },
      orderBy: SPRINT_ORDER_BY,
      select: { id: true, sprintNumber: true, title: true },
    });

    if (sprints.length === 0) {
      log('Skipping test - no sprints in project');
      logSuccess(testName, { skipped: true, reason: 'No sprints in project' });
      return;
    }

    // Test: Resolve sprint number 1
    const sprint1 = await resolveSprintByNumber(prisma, TEST_PROJECT_ID, 1);

    if (!sprint1) {
      throw new Error('resolveSprintByNumber(1) returned null');
    }

    // Verify it matches the first sprint with sprintNumber=1
    const expectedSprint1 = sprints.find((s) => s.sprintNumber === 1);
    if (!expectedSprint1) {
      throw new Error('No sprint with sprintNumber=1 in database');
    }

    if (sprint1 !== expectedSprint1.id) {
      throw new Error(
        `Expected sprint ${expectedSprint1.id}, got ${sprint1}. ` +
          `This suggests ordering is not deterministic.`
      );
    }

    logSuccess(testName, {
      sprintNumber: 1,
      resolvedId: sprint1,
      expectedId: expectedSprint1.id,
      title: expectedSprint1.title,
    });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

async function testResolveSprintByNumberReturnsNull() {
  const testName = 'resolveSprintByNumber returns null for non-existent sprint';
  try {
    const result = await resolveSprintByNumber(prisma, TEST_PROJECT_ID, 999);

    if (result !== null) {
      throw new Error(`Expected null, got ${result}`);
    }

    logSuccess(testName);
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

async function testResolveSprintByNumberProjectScoping() {
  const testName = 'resolveSprintByNumber scopes to correct project';
  try {
    // Try with a project that doesn't exist
    const result = await resolveSprintByNumber(prisma, 99999, 1);

    if (result !== null) {
      throw new Error(`Expected null for non-existent project, got ${result}`);
    }

    logSuccess(testName);
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

// ============================================================================
// Test: findNextSprint
// ============================================================================

async function testFindNextSprint() {
  const testName = 'findNextSprint returns next sprint in sequence';
  try {
    // Get first two sprints
    const sprints = await prisma.sprint.findMany({
      where: { phase: { roadmap: { projectId: TEST_PROJECT_ID } } },
      orderBy: SPRINT_ORDER_BY,
      take: 2,
      select: { id: true, sprintNumber: true, title: true, phaseId: true },
    });

    if (sprints.length < 2) {
      log('Skipping test - less than 2 sprints in project');
      logSuccess(testName, { skipped: true, reason: 'Less than 2 sprints' });
      return;
    }

    const [sprint1, sprint2] = sprints;

    // TypeScript strict mode: guard against undefined after destructuring
    if (!sprint1 || !sprint2) {
      throw new Error('Expected at least 2 sprints after length check');
    }

    // Find next after sprint1
    const nextSprint = await findNextSprint(prisma, sprint1.id);

    if (!nextSprint) {
      throw new Error(`findNextSprint returned null, expected sprint ${sprint2.id}`);
    }

    if (nextSprint.id !== sprint2.id) {
      throw new Error(
        `Expected next sprint ${sprint2.id} (${sprint2.title}), ` +
          `got ${nextSprint.id}. Ordering may be incorrect.`
      );
    }

    logSuccess(testName, {
      currentSprint: { id: sprint1.id, title: sprint1.title, number: sprint1.sprintNumber },
      nextSprint: { id: nextSprint.id, phaseId: nextSprint.phaseId },
      expectedNextTitle: sprint2.title,
    });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

async function testFindNextSprintReturnsNullForLast() {
  const testName = 'findNextSprint returns null for last sprint';
  try {
    // Get the last sprint (highest sprintNumber)
    const lastSprint = await prisma.sprint.findFirst({
      where: { phase: { roadmap: { projectId: TEST_PROJECT_ID } } },
      orderBy: { sprintNumber: 'desc' },
      select: { id: true, sprintNumber: true, title: true },
    });

    if (!lastSprint) {
      log('Skipping test - no sprints in project');
      logSuccess(testName, { skipped: true, reason: 'No sprints' });
      return;
    }

    const nextSprint = await findNextSprint(prisma, lastSprint.id);

    if (nextSprint !== null) {
      throw new Error(
        `Expected null for last sprint, got ${JSON.stringify(nextSprint)}`
      );
    }

    logSuccess(testName, {
      lastSprint: { id: lastSprint.id, title: lastSprint.title, number: lastSprint.sprintNumber },
      nextSprint: null,
    });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

// ============================================================================
// Test: getOrderedSprints
// ============================================================================

async function testGetOrderedSprints() {
  const testName = 'getOrderedSprints returns sprints in correct order';
  try {
    const sprints = await getOrderedSprints(prisma, TEST_PROJECT_ID);

    if (sprints.length === 0) {
      log('Skipping test - no sprints in project');
      logSuccess(testName, { skipped: true, reason: 'No sprints' });
      return;
    }

    // Verify ordering is ascending by sprintNumber
    for (let i = 1; i < sprints.length; i++) {
      const current = sprints[i];
      const previous = sprints[i - 1];

      // TypeScript strict mode: guard against undefined array access
      if (!current || !previous) {
        throw new Error(`Unexpected undefined sprint at index ${i}`);
      }

      if (current.sprintNumber < previous.sprintNumber) {
        throw new Error(
          `Sprints not ordered: sprint ${current.sprintNumber} at index ${i} ` +
            `is less than sprint ${previous.sprintNumber} at index ${i - 1}`
        );
      }
    }

    logSuccess(testName, {
      count: sprints.length,
      firstThree: sprints.slice(0, 3).map((s) => ({ number: s.sprintNumber, title: s.title })),
    });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

// ============================================================================
// Test: Deterministic ordering (the main bug fix)
// ============================================================================

async function testDeterministicOrdering() {
  const testName = 'Multiple calls return consistent results (deterministic)';
  try {
    // Call resolveSprintByNumber multiple times for the same sprint
    const results: (string | null)[] = [];

    for (let i = 0; i < 5; i++) {
      const result = await resolveSprintByNumber(prisma, TEST_PROJECT_ID, 1);
      results.push(result);
    }

    // All results should be identical
    const allSame = results.every((r) => r === results[0]);

    if (!allSame) {
      throw new Error(
        `Non-deterministic results: ${JSON.stringify(results)}. ` +
          `This is the bug we fixed in Ticket #91!`
      );
    }

    logSuccess(testName, {
      calls: 5,
      result: results[0],
      allIdentical: true,
    });
  } catch (error) {
    logFailure(testName, error instanceof Error ? error.message : String(error));
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('Sprint Resolution Helper Tests (Ticket #91)');
  console.log('='.repeat(60));
  console.log(`Project ID: ${TEST_PROJECT_ID}`);
  console.log('');

  await testSprintOrderByConstant();
  await testResolveSprintByNumber();
  await testResolveSprintByNumberReturnsNull();
  await testResolveSprintByNumberProjectScoping();
  await testFindNextSprint();
  await testFindNextSprintReturnsNullForLast();
  await testGetOrderedSprints();
  await testDeterministicOrdering();

  console.log('');
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
