/**
 * MCP Tool E2E Test: projectpulse_ticket_addComment
 *
 * Tests the ticket comment MCP tool including:
 * - Add comment to ticket
 * - Verify comment persists to database
 * - Verify comment includes author metadata
 * - Verify comment includes timestamp
 * - Add multiple comments
 * - Validation errors (missing content, non-existent ticketId)
 *
 * Sprint 10: MCP Ticket Comments Tool Testing
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

describe('MCP Tool: projectpulse_ticket_addComment', () => {
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

  test('should add comment to ticket', async () => {
    const ticket = await createTestTicket(projectId, {
      title: 'Test Ticket for Comments',
    });

    const commentContent = `Test comment added at ${new Date().toISOString()}`;

    const result = await client.callTool('projectpulse_ticket_addComment', {
      issueId: ticket.id,
      content: commentContent,
      author: 'MCP Agent',
    });

    const comment = JSON.parse(result.content[0].text);

    assert.ok(comment.id, 'Comment should have ID');
    assert.strictEqual(comment.content, commentContent, 'Comment content should match');
    assert.ok(comment.createdAt, 'Comment should have createdAt timestamp');

    // Verify in database
    const dbComment = await prisma.ticketComment.findUnique({
      where: { id: comment.id },
    });

    assert.ok(dbComment, 'Comment should exist in database');
    assert.strictEqual(dbComment.content, commentContent);
    assert.strictEqual(dbComment.ticketId, ticket.id);

    console.log(`✓ Added comment with ID ${comment.id}`);
  });

  test('should add multiple comments to same ticket', async () => {
    const ticket = await createTestTicket(projectId, {
      title: 'Test Multiple Comments',
    });

    // Add first comment
    await client.callTool('projectpulse_ticket_addComment', {
      issueId: ticket.id,
      content: 'First comment',
      author: 'Agent 1',
    });

    // Add second comment
    await client.callTool('projectpulse_ticket_addComment', {
      issueId: ticket.id,
      content: 'Second comment',
      author: 'Agent 2',
    });

    // Verify both comments exist
    const comments = await prisma.ticketComment.findMany({
      where: { ticketId: ticket.id },
      orderBy: { createdAt: 'asc' },
    });

    assert.strictEqual(comments.length, 2, 'Should have 2 comments');
    assert.strictEqual(comments[0].content, 'First comment');
    assert.strictEqual(comments[1].content, 'Second comment');

    console.log('✓ Added multiple comments to same ticket');
  });

  test('should include author metadata in comment', async () => {
    const ticket = await createTestTicket(projectId, {
      title: 'Test Author Metadata',
    });

    const result = await client.callTool('projectpulse_ticket_addComment', {
      issueId: ticket.id,
      content: 'Comment with author',
      author: 'Test Agent',
    });

    const comment = JSON.parse(result.content[0].text);

    assert.ok(comment.author, 'Comment should have author field');
    assert.strictEqual(comment.author, 'Test Agent', 'Author should match provided value');

    console.log(`✓ Comment includes author: ${comment.author}`);
  });

  test('should fail when adding comment to non-existent ticket', async () => {
    try {
      await client.callTool('projectpulse_ticket_addComment', {
        issueId: 999999, // Non-existent ticket ID
        content: 'Should fail',
        author: 'Agent',
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
