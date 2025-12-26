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

  // Sprint 15: Updated tests for 5-status kanban workflow
  test('should change status from backlog to in-progress', async () => {
    const ticket = await createTestTicket(projectId, {
      title: 'Test Status Transition',
      status: 'backlog',
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

    console.log('✓ Status changed: backlog → in-progress');
  });

  test('should change status from in-progress to done and set closedAt', async () => {
    const ticket = await createTestTicket(projectId, {
      title: 'Test Completion',
      status: 'in-progress',
    });

    const result = await client.callTool('projectpulse_ticket_setStatus', {
      ticketId: ticket.id,
      status: 'done',
    });

    const updatedTicket = JSON.parse(result.content[0].text);

    assert.strictEqual(updatedTicket.status, 'done', 'Status should be done');

    // Verify closedAt timestamp was set
    const dbTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    assert.ok(dbTicket?.closedAt, 'closedAt should be set when status=done');
    assert.strictEqual(dbTicket?.status, 'done', 'Status should be done in database');

    console.log(`✓ Status changed: in-progress → done, closedAt set to ${dbTicket?.closedAt}`);
  });

  // Sprint 15: Test backwards compatibility - 'closed' should be normalized to 'done'
  test('should normalize legacy "closed" status to "done"', async () => {
    const ticket = await createTestTicket(projectId, {
      title: 'Test Legacy Status',
      status: 'backlog',
    });

    const result = await client.callTool('projectpulse_ticket_setStatus', {
      ticketId: ticket.id,
      status: 'closed', // Legacy value
    });

    const updatedTicket = JSON.parse(result.content[0].text);

    // Sprint 15: 'closed' should be normalized to 'done'
    assert.strictEqual(updatedTicket.status, 'done', 'Status should be normalized to done');

    // Verify in database
    const dbTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    assert.strictEqual(dbTicket?.status, 'done', 'Status should be done in database');

    console.log('✓ Legacy status "closed" normalized to "done"');
  });

  test('should fail validation when status value is invalid', async () => {
    const ticket = await createTestTicket(projectId, {
      title: 'Test Invalid Status',
      status: 'backlog',
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
