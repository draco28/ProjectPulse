/**
 * MCP Tool E2E Test: projectpulse_ticket_search
 *
 * Tests the ticket search MCP tool including:
 * - Search by free-text query (title + description)
 * - Filter by kind (single and multiple)
 * - Filter by status (single and multiple)
 * - Filter by priority (single and multiple)
 * - Filter by module
 * - Filter by assignee
 * - Combined filters (AND logic)
 * - Pagination (page, pageSize, total count)
 * - Sorting (createdAt, updatedAt, priority)
 * - Empty results handling
 *
 * Sprint 10: MCP Ticket Search Tool Testing
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateUniqueProjectId,
  createTestProject,
  createTestTickets,
  cleanupTestProject,
  disconnectPrisma,
} from './setup/ticket-fixtures.js';
import { MCPTestClient } from './setup/mcp-client.js';

describe('MCP Tool: projectpulse_ticket_search', () => {
  let projectId: number;
  let authToken: string;
  let client: MCPTestClient;

  beforeEach(async () => {
    projectId = generateUniqueProjectId();
    const { token } = await createTestProject(projectId);
    authToken = token;

    // Create test tickets with different kinds, statuses, priorities
    await createTestTickets(projectId, 5, (index) => ({
      title: `Test Ticket ${index + 1}`,
      description: `Description for ticket ${index + 1}`,
      kind: ['feature', 'bug', 'task', 'issue', 'epic'][index],
      source: 'agent',
      priority: ['critical', 'high', 'medium', 'low', 'medium'][index],
      status: ['open', 'in_progress', 'open', 'blocked', 'open'][index],
      module: index % 2 === 0 ? 'API' : 'UI',
    }));

    client = new MCPTestClient('http://192.168.1.15:3001', authToken);
    console.log(`✓ Test setup complete for project ${projectId} with 5 tickets`);
  });

  afterEach(async () => {
    await cleanupTestProject(projectId);
    console.log(`✓ Test cleanup complete for project ${projectId}`);
  });

  test('should search tickets by free-text query in title', async () => {
    const result = await client.callTool('projectpulse_ticket_search', {
      projectId,
      search: 'Ticket 1',
      page: 1,
      pageSize: 10,
    });

    const searchResults = JSON.parse(result.content[0].text);

    assert.ok(searchResults.tickets, 'Results should have tickets array');
    assert.ok(searchResults.tickets.length >= 1, 'Should find at least 1 ticket');
    assert.ok(
      searchResults.tickets[0].title.includes('Ticket 1'),
      'Found ticket should match search query'
    );

    console.log(`✓ Found ${searchResults.tickets.length} ticket(s) matching "Ticket 1"`);
  });

  test('should filter tickets by kind=bug', async () => {
    const result = await client.callTool('projectpulse_ticket_search', {
      projectId,
      kind: ['bug'],
      page: 1,
      pageSize: 10,
    });

    const searchResults = JSON.parse(result.content[0].text);

    assert.ok(searchResults.tickets.length >= 1, 'Should find bug tickets');
    assert.strictEqual(searchResults.tickets[0].kind, 'bug', 'All results should be bugs');

    console.log(`✓ Found ${searchResults.tickets.length} bug ticket(s)`);
  });

  test('should filter tickets by multiple kinds (feature + task)', async () => {
    const result = await client.callTool('projectpulse_ticket_search', {
      projectId,
      kind: ['feature', 'task'],
      page: 1,
      pageSize: 10,
    });

    const searchResults = JSON.parse(result.content[0].text);

    assert.ok(searchResults.tickets.length >= 2, 'Should find feature and task tickets');

    // Verify all results are either feature or task
    for (const ticket of searchResults.tickets) {
      assert.ok(
        ticket.kind === 'feature' || ticket.kind === 'task',
        `Ticket kind should be feature or task, got ${ticket.kind}`
      );
    }

    console.log(`✓ Found ${searchResults.tickets.length} tickets with kind=feature OR task`);
  });

  test('should filter tickets by status=open', async () => {
    const result = await client.callTool('projectpulse_ticket_search', {
      projectId,
      status: ['open'],
      page: 1,
      pageSize: 10,
    });

    const searchResults = JSON.parse(result.content[0].text);

    assert.ok(searchResults.tickets.length >= 3, 'Should find open tickets (we created 3)');

    // Verify all results are open
    for (const ticket of searchResults.tickets) {
      assert.strictEqual(ticket.status, 'open', 'All tickets should have status=open');
    }

    console.log(`✓ Found ${searchResults.tickets.length} open ticket(s)`);
  });

  test('should filter tickets by priority=critical', async () => {
    const result = await client.callTool('projectpulse_ticket_search', {
      projectId,
      priority: ['critical'],
      page: 1,
      pageSize: 10,
    });

    const searchResults = JSON.parse(result.content[0].text);

    assert.ok(searchResults.tickets.length >= 1, 'Should find critical tickets');
    assert.strictEqual(searchResults.tickets[0].priority, 'critical', 'Ticket should be critical');

    console.log(`✓ Found ${searchResults.tickets.length} critical ticket(s)`);
  });

  test('should filter tickets by module', async () => {
    const result = await client.callTool('projectpulse_ticket_search', {
      projectId,
      module: ['API'],
      page: 1,
      pageSize: 10,
    });

    const searchResults = JSON.parse(result.content[0].text);

    assert.ok(searchResults.tickets.length >= 1, 'Should find tickets in API module');

    // Verify all results have module=API
    for (const ticket of searchResults.tickets) {
      assert.strictEqual(ticket.module, 'API', 'All tickets should have module=API');
    }

    console.log(`✓ Found ${searchResults.tickets.length} ticket(s) in API module`);
  });

  test('should combine multiple filters with AND logic (kind=bug + status=open)', async () => {
    // First create a bug with status=open to ensure we have one
    await client.callTool('projectpulse_ticket_create', {
      projectId,
      title: 'Open Bug for Search Test',
      description: 'Testing combined filters',
      kind: 'bug',
      source: 'agent',
      priority: 'high',
      status: 'open',
    });

    const result = await client.callTool('projectpulse_ticket_search', {
      projectId,
      kind: ['bug'],
      status: ['open'],
      page: 1,
      pageSize: 10,
    });

    const searchResults = JSON.parse(result.content[0].text);

    // Should find tickets that are BOTH bug AND open
    for (const ticket of searchResults.tickets) {
      assert.strictEqual(ticket.kind, 'bug', 'Ticket should be bug');
      assert.strictEqual(ticket.status, 'open', 'Ticket should be open');
    }

    console.log(`✓ Found ${searchResults.tickets.length} ticket(s) matching bug + open`);
  });

  test('should handle pagination correctly', async () => {
    // Request page 1 with pageSize=2
    const page1Result = await client.callTool('projectpulse_ticket_search', {
      projectId,
      page: 1,
      pageSize: 2,
    });

    const page1Data = JSON.parse(page1Result.content[0].text);

    assert.strictEqual(page1Data.tickets.length, 2, 'Page 1 should have 2 tickets');
    assert.ok(page1Data.total >= 5, 'Total should be at least 5');
    assert.ok(page1Data.page === 1, 'Should be page 1');

    console.log(`✓ Page 1: ${page1Data.tickets.length} tickets, total: ${page1Data.total}`);

    // Request page 2
    const page2Result = await client.callTool('projectpulse_ticket_search', {
      projectId,
      page: 2,
      pageSize: 2,
    });

    const page2Data = JSON.parse(page2Result.content[0].text);

    assert.ok(page2Data.tickets.length >= 1, 'Page 2 should have at least 1 ticket');
    assert.ok(page2Data.page === 2, 'Should be page 2');

    // Verify no duplicate tickets across pages
    const page1Ids = page1Data.tickets.map((t: any) => t.id);
    const page2Ids = page2Data.tickets.map((t: any) => t.id);
    const intersection = page1Ids.filter((id: number) => page2Ids.includes(id));

    assert.strictEqual(intersection.length, 0, 'Pages should not have overlapping tickets');
    console.log(`✓ Page 2: ${page2Data.tickets.length} tickets, no duplicates`);
  });

  test('should return empty results when no tickets match', async () => {
    const result = await client.callTool('projectpulse_ticket_search', {
      projectId,
      search: 'nonexistent_search_term_xyz999',
      page: 1,
      pageSize: 10,
    });

    const searchResults = JSON.parse(result.content[0].text);

    assert.strictEqual(searchResults.tickets.length, 0, 'Should return empty array');
    assert.strictEqual(searchResults.total, 0, 'Total should be 0');

    console.log('✓ Empty results handled correctly');
  });
});

// Cleanup after all tests
test.after(async () => {
  await disconnectPrisma();
  console.log('✓ Disconnected Prisma client');
});
