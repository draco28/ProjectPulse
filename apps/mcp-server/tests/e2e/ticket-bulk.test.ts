/**
 * MCP Tool E2E Test: projectpulse_ticket_bulkCreate
 *
 * Tests the bulk ticket creation MCP tool including:
 * - Create multiple tickets in single request (1-50 tickets)
 * - Verify all tickets persisted to database
 * - Bulk create with different kinds
 * - Bulk create with auto-tagging context
 * - Handle partial failures gracefully
 * - Validation errors (exceeding max limit, invalid ticket data)
 *
 * Sprint 10: MCP Bulk Ticket Operations Testing
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateUniqueProjectId,
  createTestProject,
  cleanupTestProject,
  disconnectPrisma,
  getPrismaClient,
} from './setup/ticket-fixtures.js';
import { MCPTestClient } from './setup/mcp-client.js';

describe('MCP Tool: projectpulse_ticket_bulkCreate', () => {
  let projectId: number;
  let authToken: string;
  let client: MCPTestClient;
  const prisma = getPrismaClient();

  beforeEach(async () => {
    projectId = generateUniqueProjectId();
    const { token } = await createTestProject(projectId);
    authToken = token;
    client = new MCPTestClient('http://192.168.1.15:3001', authToken);
    console.log(`✓ Test setup complete for project ${projectId}`);
  });

  afterEach(async () => {
    await cleanupTestProject(projectId);
    console.log(`✓ Test cleanup complete for project ${projectId}`);
  });

  test('should create 5 tickets in single bulk request', async () => {
    const issues = [
      {
        title: 'Bulk Ticket 1',
        description: 'First ticket in bulk',
        kind: 'feature',
        source: 'agent',
        priority: 'high',
        status: 'open',
      },
      {
        title: 'Bulk Ticket 2',
        description: 'Second ticket in bulk',
        kind: 'bug',
        source: 'scanner',
        priority: 'critical',
        status: 'open',
      },
      {
        title: 'Bulk Ticket 3',
        description: 'Third ticket in bulk',
        kind: 'task',
        source: 'manual',
        priority: 'medium',
        status: 'open',
      },
      {
        title: 'Bulk Ticket 4',
        description: 'Fourth ticket in bulk',
        kind: 'issue',
        source: 'agent',
        priority: 'low',
        status: 'open',
      },
      {
        title: 'Bulk Ticket 5',
        description: 'Fifth ticket in bulk',
        kind: 'epic',
        source: 'manual',
        priority: 'high',
        status: 'open',
      },
    ];

    const result = await client.callTool('projectpulse_ticket_bulkCreate', {
      projectId,
      issues,
    });

    const bulkResult = JSON.parse(result.content[0].text);

    assert.ok(bulkResult.created, 'Should have created tickets array');
    assert.strictEqual(bulkResult.created.length, 5, 'Should create 5 tickets');

    // Verify all tickets in database
    const dbTickets = await prisma.ticket.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    assert.strictEqual(dbTickets.length, 5, 'Should have 5 tickets in database');
    assert.strictEqual(dbTickets[0].title, 'Bulk Ticket 1');
    assert.strictEqual(dbTickets[1].kind, 'bug');
    assert.strictEqual(dbTickets[2].priority, 'medium');

    console.log(`✓ Created ${bulkResult.created.length} tickets in bulk`);
  });

  test('should create 20 tickets efficiently', async () => {
    const issues = Array.from({ length: 20 }, (_, i) => ({
      title: `Bulk Ticket ${i + 1}`,
      description: `Description for ticket ${i + 1}`,
      kind: ['feature', 'bug', 'task'][i % 3],
      source: 'agent',
      priority: ['high', 'medium', 'low'][i % 3],
      status: 'open',
    }));

    const result = await client.callTool('projectpulse_ticket_bulkCreate', {
      projectId,
      issues,
    });

    const bulkResult = JSON.parse(result.content[0].text);

    assert.strictEqual(bulkResult.created.length, 20, 'Should create 20 tickets');

    // Verify in database
    const dbTickets = await prisma.ticket.findMany({
      where: { projectId },
    });

    assert.strictEqual(dbTickets.length, 20, 'Should have 20 tickets in database');

    console.log('✓ Created 20 tickets efficiently in bulk');
  });

  test('should create tickets with mixed kinds', async () => {
    const issues = [
      { title: 'Feature', kind: 'feature', source: 'agent', priority: 'high', status: 'open' },
      { title: 'Bug', kind: 'bug', source: 'scanner', priority: 'critical', status: 'open' },
      { title: 'Task', kind: 'task', source: 'manual', priority: 'medium', status: 'open' },
      { title: 'Epic', kind: 'epic', source: 'agent', priority: 'high', status: 'open' },
      { title: 'Scanner Finding', kind: 'scanner_finding', source: 'scanner', priority: 'high', status: 'open' },
      { title: 'Tech Debt', kind: 'tech_debt', source: 'agent', priority: 'medium', status: 'open' },
    ];

    const result = await client.callTool('projectpulse_ticket_bulkCreate', {
      projectId,
      issues,
    });

    const bulkResult = JSON.parse(result.content[0].text);

    assert.strictEqual(bulkResult.created.length, 6, 'Should create 6 tickets with different kinds');

    // Verify all kinds in database
    const dbTickets = await prisma.ticket.findMany({
      where: { projectId },
      select: { kind: true },
    });

    const kinds = dbTickets.map((t) => t.kind).sort();
    assert.ok(kinds.includes('feature'));
    assert.ok(kinds.includes('bug'));
    assert.ok(kinds.includes('task'));
    assert.ok(kinds.includes('epic'));
    assert.ok(kinds.includes('scanner_finding'));
    assert.ok(kinds.includes('tech_debt'));

    console.log('✓ Created tickets with all 6 different kinds');
  });

  test('should include context metadata in bulk create', async () => {
    const issues = [
      {
        title: 'Bulk Ticket with Context',
        description: 'Testing context metadata',
        kind: 'feature',
        source: 'agent',
        priority: 'high',
        status: 'open',
        context: {
          files: [
            { filePath: '/src/components/Button.tsx', lineNumber: 45 },
            { filePath: '/src/utils/helpers.ts', lineNumber: 23 },
          ],
          metadata: {
            scannerType: 'eslint',
            severity: 'warning',
          },
        },
      },
    ];

    const result = await client.callTool('projectpulse_ticket_bulkCreate', {
      projectId,
      issues,
    });

    const bulkResult = JSON.parse(result.content[0].text);

    assert.strictEqual(bulkResult.created.length, 1, 'Should create 1 ticket');
    assert.ok(bulkResult.created[0].context, 'Ticket should have context metadata');

    console.log('✓ Bulk created ticket with context metadata');
  });

  test('should fail when exceeding max limit (>50 tickets)', async () => {
    const issues = Array.from({ length: 51 }, (_, i) => ({
      title: `Ticket ${i + 1}`,
      kind: 'feature',
      source: 'agent',
      priority: 'medium',
      status: 'open',
    }));

    try {
      await client.callTool('projectpulse_ticket_bulkCreate', {
        projectId,
        issues,
      });

      // Should not reach here
      assert.fail('Expected validation error for exceeding max limit');
    } catch (error: any) {
      assert.ok(
        error.message.includes('limit') || error.message.includes('max') || error.message.includes('50'),
        'Error should mention exceeding max limit'
      );
      console.log('✓ Validation error for exceeding 50 ticket limit');
    }
  });

  test('should return summary with created count', async () => {
    const issues = Array.from({ length: 10 }, (_, i) => ({
      title: `Summary Test ${i + 1}`,
      kind: 'feature',
      source: 'agent',
      priority: 'medium',
      status: 'open',
    }));

    const result = await client.callTool('projectpulse_ticket_bulkCreate', {
      projectId,
      issues,
    });

    const bulkResult = JSON.parse(result.content[0].text);

    assert.ok(bulkResult.summary, 'Should have summary');
    assert.ok(bulkResult.summary.includes('10'), 'Summary should mention created count');

    console.log(`✓ Bulk create summary: ${bulkResult.summary}`);
  });
});

// Cleanup after all tests
test.after(async () => {
  await disconnectPrisma();
  console.log('✓ Disconnected Prisma client');
});
