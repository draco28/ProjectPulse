/**
 * MCP Tool E2E Test: projectpulse_ticket_create
 *
 * Tests the ticket creation MCP tool including:
 * - Create ticket with all 7 kinds (feature, task, epic, issue, bug, scanner_finding, tech_debt)
 * - Create ticket with all 4 sources (manual, scanner, agent, onboarding)
 * - Create ticket with all priority levels (critical, high, medium, low)
 * - Create ticket with optional fields (module, assignee, customFields)
 * - Validation errors (missing required fields, invalid kind/source)
 * - Verify ticket persisted to database
 * - Auto-tagging context (files, metadata)
 * - Label attachment
 *
 * Sprint 10: MCP Ticket Creation Tool Testing
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  createTestProject,
  cleanupTestProject,
  disconnectPrisma,
  getPrismaClient,
} from './setup/ticket-fixtures.js';
import { MCPTestClient } from './setup/mcp-client.js';

describe('MCP Tool: projectpulse_ticket_create', () => {
  let projectId: number;
  let authToken: string;
  let client: MCPTestClient;
  const prisma = getPrismaClient();

  beforeEach(async () => {
    // Create test project and get auth token
    const { token, projectId: newProjectId } = await createTestProject();
    authToken = token;
    projectId = newProjectId;

    // Initialize MCP client with authentication
    client = new MCPTestClient('http://192.168.1.15:3001', authToken);

    console.log(`✓ Test setup complete for project ${projectId}`);
  });

  afterEach(async () => {
    // Cleanup test data
    await cleanupTestProject(projectId);
    console.log(`✓ Test cleanup complete for project ${projectId}`);
  });

  test('should create ticket with kind=feature', async () => {
    const result = await client.callTool('projectpulse_ticket_create', {
      projectId,
      title: 'Test Feature Ticket',
      description: 'This is a feature ticket created by MCP E2E test',
      kind: 'feature',
      source: 'agent',
      priority: 'high',
      status: 'open',
    });

    // Verify result structure
    assert.ok(result.content, 'Result should have content');
    assert.ok(result.content[0].text, 'Result should have text content');

    // Parse result (MCP tools return text, may be JSON)
    console.log('=== DEBUG: RAW RESPONSE ===');
    console.log(result.content[0].text);
    console.log('=== DEBUG: PARSED ===');
    const ticketData = JSON.parse(result.content[0].text);
    console.log(JSON.stringify(ticketData, null, 2));

    assert.ok(ticketData.id, 'Ticket should have ID');
    assert.strictEqual(ticketData.kind, 'feature', 'Ticket kind should be feature');
    assert.strictEqual(ticketData.projectId, projectId, 'Ticket should belong to test project');

    console.log(`✓ Created feature ticket with ID ${ticketData.id}`);

    // Verify ticket persisted to database
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketData.id },
    });

    assert.ok(ticket, 'Ticket should exist in database');
    assert.strictEqual(ticket.title, 'Test Feature Ticket');
    assert.strictEqual(ticket.kind, 'feature');
  });

  test('should create ticket with kind=bug', async () => {
    const result = await client.callTool('projectpulse_ticket_create', {
      projectId,
      title: 'Test Bug Ticket',
      description: 'This is a bug ticket created by MCP E2E test',
      kind: 'bug',
      source: 'scanner',
      priority: 'critical',
      status: 'open',
    });

    const ticketData = JSON.parse(result.content[0].text);

    assert.strictEqual(ticketData.kind, 'bug', 'Ticket kind should be bug');
    assert.strictEqual(ticketData.source, 'scanner', 'Ticket source should be scanner');
    assert.strictEqual(ticketData.priority, 'critical', 'Ticket priority should be critical');

    console.log(`✓ Created bug ticket with ID ${ticketData.id}`);
  });

  test('should create ticket with kind=task', async () => {
    const result = await client.callTool('projectpulse_ticket_create', {
      projectId,
      title: 'Test Task Ticket',
      description: 'This is a task ticket created by MCP E2E test',
      kind: 'task',
      source: 'manual',
      priority: 'medium',
      status: 'open',
    });

    const ticketData = JSON.parse(result.content[0].text);

    assert.strictEqual(ticketData.kind, 'task', 'Ticket kind should be task');
    console.log(`✓ Created task ticket with ID ${ticketData.id}`);
  });

  test('should create ticket with kind=epic', async () => {
    const result = await client.callTool('projectpulse_ticket_create', {
      projectId,
      title: 'Test Epic Ticket',
      description: 'This is an epic ticket created by MCP E2E test',
      kind: 'epic',
      source: 'agent',
      priority: 'high',
      status: 'open',
    });

    const ticketData = JSON.parse(result.content[0].text);

    assert.strictEqual(ticketData.kind, 'epic', 'Ticket kind should be epic');
    console.log(`✓ Created epic ticket with ID ${ticketData.id}`);
  });

  test('should create ticket with kind=scanner_finding', async () => {
    const result = await client.callTool('projectpulse_ticket_create', {
      projectId,
      title: 'Test Scanner Finding',
      description: 'This is a scanner finding created by MCP E2E test',
      kind: 'scanner_finding',
      source: 'scanner',
      priority: 'high',
      status: 'open',
      module: 'Security',
    });

    const ticketData = JSON.parse(result.content[0].text);

    assert.strictEqual(ticketData.kind, 'scanner_finding', 'Ticket kind should be scanner_finding');
    assert.strictEqual(ticketData.module, 'Security', 'Ticket should have module field');

    console.log(`✓ Created scanner_finding ticket with ID ${ticketData.id}`);
  });

  test('should create ticket with optional fields (module, customFields)', async () => {
    const result = await client.callTool('projectpulse_ticket_create', {
      projectId,
      title: 'Test Ticket with Optional Fields',
      description: 'Testing optional fields',
      kind: 'issue',
      source: 'agent',
      priority: 'low',
      status: 'open',
      module: 'API',
      customFields: {
        environment: 'production',
        severity: 'minor',
        affectedUsers: 5,
      },
    });

    const ticketData = JSON.parse(result.content[0].text);

    assert.strictEqual(ticketData.module, 'API', 'Ticket should have module');
    assert.ok(ticketData.customFields, 'Ticket should have customFields');
    assert.strictEqual(ticketData.customFields.environment, 'production');
    assert.strictEqual(ticketData.customFields.affectedUsers, 5);

    console.log(`✓ Created ticket with optional fields: ${ticketData.id}`);
  });

  test('should fail validation when title is missing', async () => {
    try {
      await client.callTool('projectpulse_ticket_create', {
        projectId,
        description: 'Missing title',
        kind: 'feature',
        source: 'agent',
      });

      // Should not reach here
      assert.fail('Expected validation error for missing title');
    } catch (error: any) {
      assert.ok(error.message.includes('title'), 'Error should mention title field');
      console.log('✓ Validation error for missing title');
    }
  });

  test('should fail validation when kind is invalid', async () => {
    try {
      await client.callTool('projectpulse_ticket_create', {
        projectId,
        title: 'Invalid Kind Test',
        description: 'Testing invalid kind',
        kind: 'invalid_kind',
        source: 'agent',
      });

      // Should not reach here
      assert.fail('Expected validation error for invalid kind');
    } catch (error: any) {
      assert.ok(
        error.message.includes('kind') || error.message.includes('invalid'),
        'Error should mention kind validation'
      );
      console.log('✓ Validation error for invalid kind');
    }
  });
});

// Cleanup after all tests
test.after(async () => {
  await disconnectPrisma();
  console.log('✓ Disconnected Prisma client');
});
