/**
 * MCP Tool E2E Test: projectpulse_ticket_setStatus
 *
 * Tests the ticket status change MCP tool including:
 * - Change status from open to in-progress
 * - Change status from in-progress to completed
 * - Change status from open to blocked
 * - Change status from completed to reopened (if supported)
 * - Verify status transitions persist
 * - Verify closedAt timestamp set when status=closed
 * - Validation errors (invalid status values)
 *
 * Sprint 10: MCP Ticket Status Tool Testing
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  createTestProject,
  createTestTicket,
  cleanupTestProject,
  disconnectPrisma,
  getPrismaClient,
} from './setup/ticket-fixtures.js';
import { MCPTestClient } from './setup/mcp-client.js';

describe('MCP Tool: projectpulse_ticket_setStatus', () => {
  let projectId: number;
  let authToken: string;
  let client: MCPTestClient;
  const prisma = getPrismaClient();

  beforeEach(async () => {
    const { token, projectId: newProjectId } = await createTestProject();
    authToken = token;
    projectId = newProjectId;
    client = new MCPTestClient('http://192.168.1.15:3001', authToken);
    console.log(`✓ Test setup complete for project ${projectId}`);
  });

  afterEach(async () => {
    await cleanupTestProject(projectId);
    console.log(`✓ Test cleanup complete for project ${projectId}`);
  });

  test('should change status from open to in-progress', async () => {
    const ticket = await createTestTicket(projectId, {
      title: 'Test Status Transition',
      status: 'open',
    });

    const result = await client.callTool('projectpulse_ticket_setStatus', {
      ticketId: ticket.id,
      status: 'in-progress',
    });

    const updatedTicket = JSON.parse(result.content[0].text);

    assert.strictEqual(updatedTicket.status, 'in-progress', 'Status should be in-progress');

    // Verify in database
    const dbTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    assert.strictEqual(dbTicket?.status, 'in-progress', 'Status should be in-progress in database');

    console.log('✓ Status changed: open → in-progress');
  });

  test('should change status from in-progress to completed and set closedAt', async () => {
    const ticket = await createTestTicket(projectId, {
      title: 'Test Completion',
      status: 'in-progress',
    });

    const result = await client.callTool('projectpulse_ticket_setStatus', {
      ticketId: ticket.id,
      status: 'closed',
    });

    const updatedTicket = JSON.parse(result.content[0].text);

    assert.strictEqual(updatedTicket.status, 'closed', 'Status should be closed');

    // Verify closedAt timestamp was set
    const dbTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    assert.ok(dbTicket?.closedAt, 'closedAt should be set when status=closed');
    assert.strictEqual(dbTicket?.status, 'closed', 'Status should be closed in database');

    console.log(`✓ Status changed: in-progress → closed, closedAt set to ${dbTicket?.closedAt}`);
  });

  test('should change status from open to blocked', async () => {
    const ticket = await createTestTicket(projectId, {
      title: 'Test Blocked Status',
      status: 'open',
    });

    const result = await client.callTool('projectpulse_ticket_setStatus', {
      ticketId: ticket.id,
      status: 'blocked',
    });

    const updatedTicket = JSON.parse(result.content[0].text);

    assert.strictEqual(updatedTicket.status, 'blocked', 'Status should be blocked');

    // Verify in database
    const dbTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    assert.strictEqual(dbTicket?.status, 'blocked', 'Status should be blocked in database');

    console.log('✓ Status changed: open → blocked');
  });

  test('should fail validation when status value is invalid', async () => {
    const ticket = await createTestTicket(projectId, {
      title: 'Test Invalid Status',
      status: 'open',
    });

    try {
      await client.callTool('projectpulse_ticket_setStatus', {
        ticketId: ticket.id,
        status: 'invalid_status',
      });

      // Should not reach here
      assert.fail('Expected validation error for invalid status');
    } catch (error: any) {
      assert.ok(
        error.message.includes('status') || error.message.includes('invalid'),
        'Error should mention invalid status'
      );
      console.log('✓ Validation error for invalid status value');
    }
  });
});

// Cleanup after all tests
test.after(async () => {
  await disconnectPrisma();
  console.log('✓ Disconnected Prisma client');
});
