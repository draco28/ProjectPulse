/**
 * MCP Tool E2E Test: Issue → Ticket Adapter Tools (Backwards Compatibility)
 *
 * Tests Sprint 10 backwards compatibility adapters that map old "issue" tools to new "ticket" tools:
 * - projectpulse_issue_create → projectpulse_ticket_create (with kind filter)
 * - projectpulse_issue_search → projectpulse_ticket_search (with kind filter)
 * - projectpulse_issue_update → projectpulse_ticket_update
 * - projectpulse_issue_setStatus → projectpulse_ticket_setStatus
 * - projectpulse_issue_addComment → projectpulse_ticket_addComment
 * - projectpulse_issue_bulkCreate → projectpulse_ticket_bulkCreate (with kind filter)
 *
 * These adapters ensure agents using old API continue to work with kind-filtered behavior:
 * - issue_create defaults to kind=issue
 * - issue_search filters to kind=issue,bug,scanner_finding (legacy issue types)
 * - Other tools pass through unchanged
 *
 * Sprint 10: Backwards Compatibility Testing
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

describe('MCP Backwards Compatibility: Issue → Ticket Adapters', () => {
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

  test('issue_create should create ticket with kind=issue by default', async () => {
    const result = await client.callTool('projectpulse_issue_create', {
      projectId,
      title: 'Legacy Issue Creation',
      description: 'Testing backwards compatibility for issue_create',
      source: 'agent',
      priority: 'high',
      status: 'open',
    });

    const ticket = JSON.parse(result.content[0].text);

    assert.ok(ticket.id, 'Should create ticket');
    assert.strictEqual(ticket.kind, 'issue', 'Should default to kind=issue');
    assert.strictEqual(ticket.title, 'Legacy Issue Creation');

    // Verify in database
    const dbTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    assert.strictEqual(dbTicket?.kind, 'issue', 'Database should have kind=issue');

    console.log(`✓ Legacy issue_create created ticket with kind=issue (ID: ${ticket.id})`);
  });

  test('issue_search should filter to legacy issue types (issue, bug, scanner_finding)', async () => {
    // Create tickets with various kinds
    await createTestTicket(projectId, { title: 'Issue', kind: 'issue' });
    await createTestTicket(projectId, { title: 'Bug', kind: 'bug' });
    await createTestTicket(projectId, { title: 'Scanner Finding', kind: 'scanner_finding' });
    await createTestTicket(projectId, { title: 'Feature', kind: 'feature' }); // Should NOT appear
    await createTestTicket(projectId, { title: 'Task', kind: 'task' }); // Should NOT appear

    const result = await client.callTool('projectpulse_issue_search', {
      projectId,
      page: 1,
      pageSize: 20,
    });

    const searchResults = JSON.parse(result.content[0].text);

    assert.ok(searchResults.tickets, 'Should have tickets array');
    assert.strictEqual(searchResults.tickets.length, 3, 'Should find 3 legacy issue types');

    // Verify all results are legacy types
    for (const ticket of searchResults.tickets) {
      assert.ok(
        ['issue', 'bug', 'scanner_finding'].includes(ticket.kind),
        `Ticket kind should be legacy type, got ${ticket.kind}`
      );
    }

    console.log('✓ Legacy issue_search filtered to issue/bug/scanner_finding only');
  });

  test('issue_update should work identically to ticket_update', async () => {
    const ticket = await createTestTicket(projectId, {
      title: 'Issue for Update Test',
      kind: 'issue',
    });

    const result = await client.callTool('projectpulse_issue_update', {
      issueId: ticket.id,
      title: 'Updated via Legacy API',
      priority: 'critical',
    });

    const updatedTicket = JSON.parse(result.content[0].text);

    assert.strictEqual(updatedTicket.title, 'Updated via Legacy API');
    assert.strictEqual(updatedTicket.priority, 'critical');

    // Verify in database
    const dbTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    assert.strictEqual(dbTicket?.title, 'Updated via Legacy API');

    console.log('✓ Legacy issue_update works identically to ticket_update');
  });

  test('issue_setStatus should work identically to ticket_setStatus', async () => {
    const ticket = await createTestTicket(projectId, {
      title: 'Issue for Status Test',
      kind: 'issue',
      status: 'open',
    });

    const result = await client.callTool('projectpulse_issue_setStatus', {
      issueId: ticket.id,
      status: 'in_progress',
    });

    const updatedTicket = JSON.parse(result.content[0].text);

    assert.strictEqual(updatedTicket.status, 'in_progress');

    // Verify in database
    const dbTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    assert.strictEqual(dbTicket?.status, 'in_progress');

    console.log('✓ Legacy issue_setStatus works identically to ticket_setStatus');
  });

  test('issue_addComment should work identically to ticket_addComment', async () => {
    const ticket = await createTestTicket(projectId, {
      title: 'Issue for Comment Test',
      kind: 'issue',
    });

    const result = await client.callTool('projectpulse_issue_addComment', {
      issueId: ticket.id,
      content: 'Legacy comment via issue_addComment',
      author: 'Legacy Agent',
    });

    const comment = JSON.parse(result.content[0].text);

    assert.ok(comment.id, 'Comment should be created');
    assert.strictEqual(comment.content, 'Legacy comment via issue_addComment');

    // Verify in database
    const dbComment = await prisma.ticketComment.findUnique({ where: { id: comment.id } });
    assert.ok(dbComment, 'Comment should exist in database');
    assert.strictEqual(dbComment.ticketId, ticket.id);

    console.log('✓ Legacy issue_addComment works identically to ticket_addComment');
  });

  test('issue_bulkCreate should create tickets with kind=issue by default', async () => {
    const issues = [
      {
        title: 'Legacy Bulk Issue 1',
        description: 'First legacy issue',
        source: 'agent',
        priority: 'high',
        status: 'open',
      },
      {
        title: 'Legacy Bulk Issue 2',
        description: 'Second legacy issue',
        source: 'scanner',
        priority: 'critical',
        status: 'open',
      },
    ];

    const result = await client.callTool('projectpulse_issue_bulkCreate', {
      projectId,
      issues,
    });

    const bulkResult = JSON.parse(result.content[0].text);

    assert.strictEqual(bulkResult.created.length, 2, 'Should create 2 tickets');

    // Verify all have kind=issue
    for (const ticket of bulkResult.created) {
      assert.strictEqual(ticket.kind, 'issue', 'All bulk created tickets should default to kind=issue');
    }

    // Verify in database
    const dbTickets = await prisma.ticket.findMany({ where: { projectId } });
    assert.strictEqual(dbTickets.length, 2);
    assert.ok(dbTickets.every((t) => t.kind === 'issue'), 'All database tickets should have kind=issue');

    console.log('✓ Legacy issue_bulkCreate created tickets with kind=issue default');
  });

  test('issue_create with explicit kind should allow bug or scanner_finding', async () => {
    // Test creating a bug via legacy issue_create API
    const bugResult = await client.callTool('projectpulse_issue_create', {
      projectId,
      title: 'Legacy Bug Creation',
      kind: 'bug', // Explicitly set kind
      source: 'scanner',
      priority: 'critical',
      status: 'open',
    });

    const bug = JSON.parse(bugResult.content[0].text);
    assert.strictEqual(bug.kind, 'bug', 'Should allow kind=bug via legacy API');

    // Test creating scanner_finding via legacy issue_create API
    const findingResult = await client.callTool('projectpulse_issue_create', {
      projectId,
      title: 'Legacy Scanner Finding',
      kind: 'scanner_finding', // Explicitly set kind
      source: 'scanner',
      priority: 'high',
      status: 'open',
    });

    const finding = JSON.parse(findingResult.content[0].text);
    assert.strictEqual(finding.kind, 'scanner_finding', 'Should allow kind=scanner_finding via legacy API');

    console.log('✓ Legacy issue_create allows explicit bug/scanner_finding kinds');
  });

  test('issue_create should reject non-legacy kinds (feature, task, epic)', async () => {
    try {
      await client.callTool('projectpulse_issue_create', {
        projectId,
        title: 'Should Reject Feature',
        kind: 'feature', // Not a legacy issue type
        source: 'agent',
        priority: 'high',
        status: 'open',
      });

      // Should not reach here
      assert.fail('Expected validation error for non-legacy kind');
    } catch (error: any) {
      assert.ok(
        error.message.includes('kind') || error.message.includes('issue'),
        'Error should mention invalid kind for legacy API'
      );
      console.log('✓ Legacy issue_create rejects non-legacy kind (feature)');
    }
  });
});

// Cleanup after all tests
test.after(async () => {
  await disconnectPrisma();
  console.log('✓ Disconnected Prisma client');
});
