/**
 * MCP Tool E2E Test: Project-Scoped Ticket Numbers (Sprint 17)
 *
 * Tests the ticketNumber field implementation:
 * - Tickets in a project get sequential ticketNumber (1, 2, 3...)
 * - Multiple projects have independent ticketNumber sequences
 * - Dual-input support: tools accept ticketId OR (ticketNumber + projectId)
 * - Ticket lookup by ticketNumber returns correct ticket
 * - ticketNumber is included in all ticket responses
 *
 * Sprint 17: Project-Scoped Ticket Numbers
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  createTestProject,
  cleanupTestProject,
  disconnectPrisma,
  getPrismaClient,
} from './setup/ticket-fixtures.js';
import { MCPTestClient } from './setup/mcp-client.js';

describe('Sprint 17: Project-Scoped Ticket Numbers', () => {
  let projectId1: number;
  let projectId2: number;
  let authToken1: string;
  let authToken2: string;
  let client1: MCPTestClient;
  let client2: MCPTestClient;
  const prisma = getPrismaClient();

  beforeEach(async () => {
    // Create two test projects to verify independent numbering
    const { token: token1, projectId: newProjectId1 } = await createTestProject();
    const { token: token2, projectId: newProjectId2 } = await createTestProject();
    authToken1 = token1;
    authToken2 = token2;
    projectId1 = newProjectId1;
    projectId2 = newProjectId2;

    // Initialize MCP clients (localhost for dev stack)
    client1 = new MCPTestClient('http://localhost:3001', authToken1);
    client2 = new MCPTestClient('http://localhost:3001', authToken2);

    console.log(`✓ Test setup complete for projects ${projectId1} and ${projectId2}`);
  });

  afterEach(async () => {
    // Cleanup test data
    await cleanupTestProject(projectId1);
    await cleanupTestProject(projectId2);
    console.log(`✓ Test cleanup complete for projects ${projectId1} and ${projectId2}`);
  });

  describe('Sequential ticketNumber Generation', () => {
    test('first ticket in new project should get ticketNumber = 1', async () => {
      const result = await client1.callTool('projectpulse_ticket_create', {
        projectId: projectId1,
        title: 'First Ticket',
        description: 'This should be ticket #1',
        kind: 'feature',
        source: 'agent',
        priority: 'medium',
        status: 'backlog',
      });

      const ticketData = JSON.parse(result.content[0].text);

      assert.ok(ticketData.ticketNumber, 'Response should include ticketNumber');
      assert.strictEqual(ticketData.ticketNumber, 1, 'First ticket should have ticketNumber = 1');

      console.log(`✓ First ticket in project ${projectId1} has ticketNumber = ${ticketData.ticketNumber}`);
    });

    test('subsequent tickets should increment ticketNumber', async () => {
      // Create 3 tickets
      const tickets = [];
      for (let i = 1; i <= 3; i++) {
        const result = await client1.callTool('projectpulse_ticket_create', {
          projectId: projectId1,
          title: `Ticket ${i}`,
          description: `This is ticket #${i}`,
          kind: 'task',
          source: 'agent',
          priority: 'medium',
          status: 'backlog',
        });
        tickets.push(JSON.parse(result.content[0].text));
      }

      // Verify sequential numbering
      assert.strictEqual(tickets[0].ticketNumber, 1, 'First ticket should be #1');
      assert.strictEqual(tickets[1].ticketNumber, 2, 'Second ticket should be #2');
      assert.strictEqual(tickets[2].ticketNumber, 3, 'Third ticket should be #3');

      console.log(`✓ Sequential ticketNumbers: ${tickets.map(t => t.ticketNumber).join(', ')}`);
    });
  });

  describe('Independent Project Numbering', () => {
    test('different projects should have independent ticketNumber sequences', async () => {
      // Create 2 tickets in project 1
      const p1t1 = await client1.callTool('projectpulse_ticket_create', {
        projectId: projectId1,
        title: 'Project 1 Ticket 1',
        kind: 'feature',
        source: 'agent',
        priority: 'medium',
        status: 'backlog',
      });
      const p1t2 = await client1.callTool('projectpulse_ticket_create', {
        projectId: projectId1,
        title: 'Project 1 Ticket 2',
        kind: 'task',
        source: 'agent',
        priority: 'low',
        status: 'backlog',
      });

      // Create 2 tickets in project 2
      const p2t1 = await client2.callTool('projectpulse_ticket_create', {
        projectId: projectId2,
        title: 'Project 2 Ticket 1',
        kind: 'feature',
        source: 'agent',
        priority: 'high',
        status: 'backlog',
      });
      const p2t2 = await client2.callTool('projectpulse_ticket_create', {
        projectId: projectId2,
        title: 'Project 2 Ticket 2',
        kind: 'bug',
        source: 'scanner',
        priority: 'critical',
        status: 'backlog',
      });

      // Parse responses
      const project1Tickets = [
        JSON.parse(p1t1.content[0].text),
        JSON.parse(p1t2.content[0].text),
      ];
      const project2Tickets = [
        JSON.parse(p2t1.content[0].text),
        JSON.parse(p2t2.content[0].text),
      ];

      // Verify project 1 has ticketNumbers 1, 2
      assert.strictEqual(project1Tickets[0].ticketNumber, 1, 'Project 1 ticket 1 should be #1');
      assert.strictEqual(project1Tickets[1].ticketNumber, 2, 'Project 1 ticket 2 should be #2');

      // Verify project 2 ALSO has ticketNumbers 1, 2 (independent sequence)
      assert.strictEqual(project2Tickets[0].ticketNumber, 1, 'Project 2 ticket 1 should ALSO be #1');
      assert.strictEqual(project2Tickets[1].ticketNumber, 2, 'Project 2 ticket 2 should ALSO be #2');

      // Verify different global IDs
      assert.notStrictEqual(
        project1Tickets[0].id,
        project2Tickets[0].id,
        'Different projects should have different global IDs'
      );

      console.log(`✓ Project ${projectId1} tickets: ${project1Tickets.map(t => `#${t.ticketNumber} (id=${t.id})`).join(', ')}`);
      console.log(`✓ Project ${projectId2} tickets: ${project2Tickets.map(t => `#${t.ticketNumber} (id=${t.id})`).join(', ')}`);
    });
  });

  describe('Dual-Input Support (ticketId OR ticketNumber + projectId)', () => {
    test('ticket_get should accept ticketNumber + projectId', async () => {
      // Create a ticket
      const createResult = await client1.callTool('projectpulse_ticket_create', {
        projectId: projectId1,
        title: 'Test Dual Input',
        kind: 'feature',
        source: 'agent',
        priority: 'high',
        status: 'backlog',
      });
      const createdTicket = JSON.parse(createResult.content[0].text);

      // Get ticket by ticketNumber + projectId (not ticketId)
      const getResult = await client1.callTool('projectpulse_ticket_get', {
        ticketNumber: createdTicket.ticketNumber,
        projectId: projectId1,
      });
      const fetchedTicket = JSON.parse(getResult.content[0].text);

      // Verify same ticket returned
      assert.strictEqual(fetchedTicket.id, createdTicket.id, 'Should return same ticket by ticketNumber lookup');
      assert.strictEqual(fetchedTicket.ticketNumber, createdTicket.ticketNumber);
      assert.strictEqual(fetchedTicket.title, 'Test Dual Input');

      console.log(`✓ ticket_get by ticketNumber=${createdTicket.ticketNumber} returned ticket id=${fetchedTicket.id}`);
    });

    test('ticket_get should still accept ticketId (backward compatible)', async () => {
      // Create a ticket
      const createResult = await client1.callTool('projectpulse_ticket_create', {
        projectId: projectId1,
        title: 'Test Backward Compat',
        kind: 'task',
        source: 'agent',
        priority: 'medium',
        status: 'backlog',
      });
      const createdTicket = JSON.parse(createResult.content[0].text);

      // Get ticket by ticketId (old method)
      const getResult = await client1.callTool('projectpulse_ticket_get', {
        ticketId: createdTicket.id,
      });
      const fetchedTicket = JSON.parse(getResult.content[0].text);

      // Verify same ticket returned
      assert.strictEqual(fetchedTicket.id, createdTicket.id);
      assert.strictEqual(fetchedTicket.ticketNumber, createdTicket.ticketNumber);

      console.log(`✓ ticket_get by ticketId=${createdTicket.id} still works (backward compatible)`);
    });

    test('ticket_update should accept ticketNumber + projectId', async () => {
      // Create a ticket
      const createResult = await client1.callTool('projectpulse_ticket_create', {
        projectId: projectId1,
        title: 'Original Title',
        kind: 'feature',
        source: 'agent',
        priority: 'low',
        status: 'backlog',
      });
      const createdTicket = JSON.parse(createResult.content[0].text);

      // Update by ticketNumber + projectId
      const updateResult = await client1.callTool('projectpulse_ticket_update', {
        ticketNumber: createdTicket.ticketNumber,
        projectId: projectId1,
        title: 'Updated Title',
        priority: 'high',
      });
      const updatedTicket = JSON.parse(updateResult.content[0].text);

      // Verify update applied
      assert.strictEqual(updatedTicket.id, createdTicket.id, 'Should update same ticket');
      assert.strictEqual(updatedTicket.title, 'Updated Title', 'Title should be updated');
      assert.strictEqual(updatedTicket.priority, 'high', 'Priority should be updated');

      console.log(`✓ ticket_update by ticketNumber=${createdTicket.ticketNumber} updated ticket id=${updatedTicket.id}`);
    });
  });

  describe('ticketNumber in Search Results', () => {
    test('ticket_search should return ticketNumber as primary identifier', async () => {
      // Create tickets
      await client1.callTool('projectpulse_ticket_create', {
        projectId: projectId1,
        title: 'Search Test Ticket 1',
        kind: 'feature',
        source: 'agent',
        priority: 'high',
        status: 'backlog',
      });
      await client1.callTool('projectpulse_ticket_create', {
        projectId: projectId1,
        title: 'Search Test Ticket 2',
        kind: 'task',
        source: 'agent',
        priority: 'medium',
        status: 'backlog',
      });

      // Search tickets
      const searchResult = await client1.callTool('projectpulse_ticket_search', {
        search: 'Search Test',
        status: ['backlog'],
      });

      const searchData = JSON.parse(searchResult.content[0].text);

      // Verify ticketNumber is present in results
      assert.ok(searchData.tickets, 'Search should return tickets array');
      assert.ok(searchData.tickets.length >= 2, 'Should find at least 2 tickets');

      // Verify each ticket has ticketNumber
      for (const ticket of searchData.tickets) {
        assert.ok(ticket.ticketNumber, `Ticket ${ticket.id} should have ticketNumber`);
        assert.ok(typeof ticket.ticketNumber === 'number', 'ticketNumber should be a number');
      }

      console.log(`✓ ticket_search returns ${searchData.tickets.length} tickets with ticketNumbers: ${searchData.tickets.map((t: any) => t.ticketNumber).join(', ')}`);
    });
  });

  describe('Bulk Create with Sequential Numbers', () => {
    test('bulkCreate should assign sequential ticketNumbers', async () => {
      const result = await client1.callTool('projectpulse_ticket_bulkCreate', {
        projectId: projectId1,
        tickets: [
          { title: 'Bulk Ticket 1', kind: 'task', source: 'agent', priority: 'low', status: 'backlog' },
          { title: 'Bulk Ticket 2', kind: 'task', source: 'agent', priority: 'medium', status: 'backlog' },
          { title: 'Bulk Ticket 3', kind: 'task', source: 'agent', priority: 'high', status: 'backlog' },
        ],
      });

      const bulkData = JSON.parse(result.content[0].text);

      assert.ok(bulkData.tickets, 'Bulk create should return tickets array');
      assert.strictEqual(bulkData.tickets.length, 3, 'Should create 3 tickets');

      // Verify sequential numbering
      const ticketNumbers = bulkData.tickets.map((t: any) => t.ticketNumber).sort((a: number, b: number) => a - b);
      assert.strictEqual(ticketNumbers[0], 1, 'First bulk ticket should be #1');
      assert.strictEqual(ticketNumbers[1], 2, 'Second bulk ticket should be #2');
      assert.strictEqual(ticketNumbers[2], 3, 'Third bulk ticket should be #3');

      console.log(`✓ bulkCreate assigned sequential ticketNumbers: ${ticketNumbers.join(', ')}`);
    });
  });

  describe('Database Verification', () => {
    test('ticketNumber should be persisted correctly in database', async () => {
      // Create a ticket via MCP
      const result = await client1.callTool('projectpulse_ticket_create', {
        projectId: projectId1,
        title: 'DB Verification Test',
        kind: 'feature',
        source: 'agent',
        priority: 'high',
        status: 'backlog',
      });

      const ticketData = JSON.parse(result.content[0].text);

      // Verify in database
      const dbTicket = await prisma.ticket.findUnique({
        where: { id: ticketData.id },
      });

      assert.ok(dbTicket, 'Ticket should exist in database');
      assert.strictEqual(dbTicket.ticketNumber, ticketData.ticketNumber, 'Database ticketNumber should match response');
      assert.strictEqual(dbTicket.ticketNumber, 1, 'First ticket should have ticketNumber = 1');

      // Verify unique constraint on (projectId, ticketNumber)
      const duplicateCheck = await prisma.ticket.findFirst({
        where: {
          projectId: projectId1,
          ticketNumber: 1,
        },
      });
      assert.ok(duplicateCheck, 'Should find ticket by projectId + ticketNumber');
      assert.strictEqual(duplicateCheck.id, dbTicket.id, 'Should be the same ticket');

      console.log(`✓ Database verification passed: ticket ${dbTicket.id} has ticketNumber ${dbTicket.ticketNumber}`);
    });
  });
});

// Cleanup after all tests
test.after(async () => {
  await disconnectPrisma();
  console.log('✓ Disconnected Prisma client');
});
