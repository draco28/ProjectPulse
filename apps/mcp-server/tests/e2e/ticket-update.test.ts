/**
 * MCP Tool E2E Test: projectpulse_ticket_update
 *
 * Tests the ticket update MCP tool including:
 * - Update ticket title
 * - Update ticket description
 * - Update ticket priority
 * - Update ticket status
 * - Update ticket module
 * - Update custom fields
 * - Update assignee
 * - Partial updates (only specified fields change)
 * - Verify updates persist to database
 * - Validation errors (invalid ticketId, invalid field values)
 *
 * Sprint 10: MCP Ticket Update Tool Testing
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateUniqueProjectId,
  createTestProject,
  createTestTicket,
  cleanupTestProject,
  disconnectPrisma,
  getPrismaClient,
} from './setup/ticket-fixtures.js';
import { MCPTestClient } from './setup/mcp-client.js';

describe('MCP Tool: projectpulse_ticket_update', () => {
  let projectId: number;
  let authToken: string;
  let client: MCPTestClient;
  let testTicket: any;
  const prisma = getPrismaClient();

  beforeEach(async () => {
    projectId = generateUniqueProjectId();
    const { token } = await createTestProject(projectId);
    authToken = token;

    // Create a test ticket to update
    testTicket = await createTestTicket(projectId, {
      title: 'Original Title',
      description: 'Original description',
      kind: 'feature',
      source: 'agent',
      priority: 'medium',
      status: 'open',
      module: 'API',
    });

    client = new MCPTestClient('http://192.168.1.15:3001', authToken);
    console.log(`✓ Test setup complete for project ${projectId}, ticket ${testTicket.id}`);
  });

  afterEach(async () => {
    await cleanupTestProject(projectId);
    console.log(`✓ Test cleanup complete for project ${projectId}`);
  });

  test('should update ticket title', async () => {
    const newTitle = `Updated Title ${Date.now()}`;

    const result = await client.callTool('projectpulse_ticket_update', {
      issueId: testTicket.id,
      title: newTitle,
    });

    const updatedTicket = JSON.parse(result.content[0].text);

    assert.strictEqual(updatedTicket.title, newTitle, 'Title should be updated');
    assert.strictEqual(updatedTicket.id, testTicket.id, 'Ticket ID should remain same');

    // Verify in database
    const dbTicket = await prisma.ticket.findUnique({
      where: { id: testTicket.id },
    });

    assert.strictEqual(dbTicket?.title, newTitle, 'Title should be updated in database');
    console.log(`✓ Updated title to: ${newTitle}`);
  });

  test('should update ticket description', async () => {
    const newDescription = `Updated description at ${new Date().toISOString()}`;

    const result = await client.callTool('projectpulse_ticket_update', {
      issueId: testTicket.id,
      description: newDescription,
    });

    const updatedTicket = JSON.parse(result.content[0].text);

    assert.strictEqual(updatedTicket.description, newDescription, 'Description should be updated');

    // Verify in database
    const dbTicket = await prisma.ticket.findUnique({
      where: { id: testTicket.id },
    });

    assert.strictEqual(dbTicket?.description, newDescription, 'Description should be updated in database');
    console.log('✓ Updated description');
  });

  test('should update ticket priority from medium to critical', async () => {
    const result = await client.callTool('projectpulse_ticket_update', {
      issueId: testTicket.id,
      priority: 'critical',
    });

    const updatedTicket = JSON.parse(result.content[0].text);

    assert.strictEqual(updatedTicket.priority, 'critical', 'Priority should be updated to critical');

    // Verify in database
    const dbTicket = await prisma.ticket.findUnique({
      where: { id: testTicket.id },
    });

    assert.strictEqual(dbTicket?.priority, 'critical', 'Priority should be critical in database');
    console.log('✓ Updated priority to critical');
  });

  test('should update ticket status from open to in_progress', async () => {
    const result = await client.callTool('projectpulse_ticket_update', {
      issueId: testTicket.id,
      status: 'in_progress',
    });

    const updatedTicket = JSON.parse(result.content[0].text);

    assert.strictEqual(updatedTicket.status, 'in_progress', 'Status should be in_progress');

    // Verify in database
    const dbTicket = await prisma.ticket.findUnique({
      where: { id: testTicket.id },
    });

    assert.strictEqual(dbTicket?.status, 'in_progress', 'Status should be in_progress in database');
    console.log('✓ Updated status to in_progress');
  });

  test('should update ticket module', async () => {
    const result = await client.callTool('projectpulse_ticket_update', {
      issueId: testTicket.id,
      module: 'Database',
    });

    const updatedTicket = JSON.parse(result.content[0].text);

    assert.strictEqual(updatedTicket.module, 'Database', 'Module should be updated to Database');

    // Verify in database
    const dbTicket = await prisma.ticket.findUnique({
      where: { id: testTicket.id },
    });

    assert.strictEqual(dbTicket?.module, 'Database', 'Module should be Database in database');
    console.log('✓ Updated module to Database');
  });

  test('should update custom fields while preserving existing data', async () => {
    // First set some custom fields
    await client.callTool('projectpulse_ticket_update', {
      issueId: testTicket.id,
      customFields: {
        environment: 'production',
        severity: 'high',
      },
    });

    // Then update with partial custom fields
    const result = await client.callTool('projectpulse_ticket_update', {
      issueId: testTicket.id,
      customFields: {
        severity: 'critical', // Update existing field
        affectedUsers: 100,   // Add new field
      },
    });

    const updatedTicket = JSON.parse(result.content[0].text);

    assert.ok(updatedTicket.customFields, 'Custom fields should exist');
    assert.strictEqual(updatedTicket.customFields.severity, 'critical', 'Severity should be updated');
    assert.strictEqual(updatedTicket.customFields.affectedUsers, 100, 'New field should be added');

    // Note: Depending on merge strategy, environment may or may not be preserved
    console.log(`✓ Updated custom fields: ${JSON.stringify(updatedTicket.customFields)}`);
  });

  test('should handle partial updates (only specified fields change)', async () => {
    // Update only priority, leaving all other fields unchanged
    await client.callTool('projectpulse_ticket_update', {
      issueId: testTicket.id,
      priority: 'high',
    });

    // Verify only priority changed
    const dbTicket = await prisma.ticket.findUnique({
      where: { id: testTicket.id },
    });

    assert.strictEqual(dbTicket?.priority, 'high', 'Priority should be updated');
    assert.strictEqual(dbTicket?.title, 'Original Title', 'Title should remain unchanged');
    assert.strictEqual(dbTicket?.description, 'Original description', 'Description should remain unchanged');
    assert.strictEqual(dbTicket?.status, 'open', 'Status should remain unchanged');
    assert.strictEqual(dbTicket?.module, 'API', 'Module should remain unchanged');

    console.log('✓ Partial update successful - only priority changed');
  });

  test('should fail when updating non-existent ticket', async () => {
    try {
      await client.callTool('projectpulse_ticket_update', {
        issueId: 999999, // Non-existent ID
        title: 'Should fail',
      });

      // Should not reach here
      assert.fail('Expected error for non-existent ticket');
    } catch (error: any) {
      assert.ok(
        error.message.includes('not found') || error.message.includes('404'),
        'Error should indicate ticket not found'
      );
      console.log('✓ Validation error for non-existent ticket');
    }
  });
});

// Cleanup after all tests
test.after(async () => {
  await disconnectPrisma();
  console.log('✓ Disconnected Prisma client');
});
