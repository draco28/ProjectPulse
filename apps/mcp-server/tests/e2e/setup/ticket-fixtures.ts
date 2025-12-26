/**
 * Ticket Test Fixtures
 *
 * Test data generators and utilities for MCP ticket tool tests.
 * Provides functions to:
 * - Generate unique project IDs (10000-99999 range)
 * - Create test projects with proper schema
 * - Generate ticket test data with all fields
 * - Clean up test data (respects FK constraints)
 *
 * Usage:
 * ```typescript
 * const projectId = generateUniqueProjectId();
 * await createTestProject(prisma, projectId);
 * const ticketData = generateTicketData({ kind: 'bug' });
 * await cleanupTestProject(prisma, projectId);
 * ```
 */

import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL ||
    'postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev',
});

/**
 * Generate a unique project ID for test isolation
 * Uses 10000-99999 range to avoid conflicts with seed data (1-9999)
 */
export function generateUniqueProjectId(): number {
  return 10000 + Math.floor(Math.random() * 90000);
}

/**
 * Generate ticket test data with sensible defaults
 * All fields can be overridden via the overrides parameter
 */
export function generateTicketData(overrides: Partial<any> = {}): any {
  return {
    title: `Test Ticket ${Date.now()}`,
    description: 'This is a test ticket created by automated tests',
    kind: 'feature',
    source: 'agent',
    priority: 'high',
    status: 'backlog', // Sprint 15: Updated default to backlog
    module: 'Testing',
    ...overrides,
  };
}

/**
 * Generate a secure random token for MCP authentication
 * Returns a 32-byte hex string
 */
export function generateTestToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a test project with an agent token for MCP authentication
 * Returns { project, token, projectId } where token is the plaintext bearer token
 * Note: projectId parameter is now ignored - Prisma auto-generates IDs
 */
export async function createTestProject(_projectId?: number): Promise<{ project: any; token: string; projectId: number }> {
  // Generate plaintext token
  const plaintextToken = generateTestToken();

  // Hash the token for storage
  const tokenHash = await bcrypt.hash(plaintextToken, 10);

  // Find test user from seed data
  const testUser = await prisma.user.findUnique({
    where: { email: 'dev@projectpulse.local' },
  });

  if (!testUser) {
    throw new Error('Test user not found. Run seed data first: pnpm prisma db seed');
  }

  // Generate unique name with timestamp and random suffix to avoid conflicts
  const timestamp = Date.now();
  const suffix = randomBytes(4).toString('hex');
  const uniqueName = `E2E Test Project ${timestamp}-${suffix}`;

  // Create project (let Prisma auto-generate ID)
  const project = await prisma.project.create({
    data: {
      name: uniqueName,
      description: `E2E test project created at ${new Date().toISOString()}`,
      repository: `https://github.com/test/project-${timestamp}`,
      owner: {
        connect: { id: testUser.id },
      },
    },
  });

  // Create project token for MCP auth
  await prisma.projectToken.create({
    data: {
      projectId: project.id,
      name: 'E2E Test Token',
      tokenHash,
      isRevoked: false,
    },
  });

  console.log(`✓ Created test project ${project.id} with auth token`);

  // Return project, token, and the auto-generated projectId
  return { project, token: plaintextToken, projectId: project.id };
}

/**
 * Create a test ticket in the database
 * Returns the created ticket
 */
export async function createTestTicket(
  projectId: number,
  overrides: Partial<any> = {}
): Promise<any> {
  const ticketData = generateTicketData(overrides);

  // Normalize status: convert underscores to hyphens (database uses hyphenated format)
  // Sprint 15: Default status changed from 'open' to 'backlog'
  const normalizedStatus = ticketData.status?.replace(/_/g, '-') ?? 'backlog';

  return await prisma.ticket.create({
    data: {
      projectId,
      title: ticketData.title,
      description: ticketData.description,
      kind: ticketData.kind,
      source: ticketData.source,
      priority: ticketData.priority,
      status: normalizedStatus,
      module: ticketData.module,
    },
  });
}

/**
 * Create multiple test tickets in the database
 * Returns array of created tickets
 */
export async function createTestTickets(
  projectId: number,
  count: number,
  overridesFn?: (index: number) => Partial<any>
): Promise<any[]> {
  const tickets = [];

  for (let i = 0; i < count; i++) {
    const overrides = overridesFn ? overridesFn(i) : {};
    const ticket = await createTestTicket(projectId, overrides);
    tickets.push(ticket);
  }

  return tickets;
}

/**
 * Clean up a test project and all related data
 * Respects foreign key constraints by deleting in correct order:
 * 1. Comments (references tickets)
 * 2. Attachments (references tickets)
 * 3. Linked files (references tickets)
 * 4. Linked commits (references tickets)
 * 5. Linked knowledge (references tickets)
 * 6. Linked wiki pages (references tickets)
 * 7. Tickets (references project)
 * 8. Project tokens (references project)
 * 9. Project (root entity)
 */
export async function cleanupTestProject(projectId: number): Promise<void> {
  if (!projectId) {
    console.log('⚠️ Skipping cleanup: No projectId provided');
    return;
  }

  try {
    // Check if project still exists before attempting cleanup
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      console.log(`✓ Project ${projectId} already deleted (cascade or external cleanup)`);
      return;
    }

    await prisma.$transaction([
      // Delete all ticket-related entities (in FK constraint order)
      prisma.ticketComment.deleteMany({
        where: { ticket: { projectId } },
      }),
      prisma.ticketAttachment.deleteMany({
        where: { ticket: { projectId } },
      }),
      prisma.ticketLinkedFile.deleteMany({
        where: { ticket: { projectId } },
      }),
      prisma.ticketLinkedCommit.deleteMany({
        where: { ticket: { projectId } },
      }),
      prisma.ticketKnowledgeLink.deleteMany({
        where: { ticket: { projectId } },
      }),
      prisma.ticketWikiPageLink.deleteMany({
        where: { ticket: { projectId } },
      }),

      // Delete tickets
      prisma.ticket.deleteMany({
        where: { projectId },
      }),

      // Delete project tokens
      prisma.projectToken.deleteMany({
        where: { projectId },
      }),

      // Finally delete the project
      prisma.project.delete({
        where: { id: projectId },
      }),
    ]);

    console.log(`✅ Cleaned up test project ${projectId}`);
  } catch (error) {
    // Handle the P2025 error (record not found) gracefully
    if ((error as any).code === 'P2025') {
      console.log(`✓ Project ${projectId} was deleted during cleanup (likely cascade)`);
      return;
    }
    console.error(`❌ Failed to cleanup project ${projectId}:`, error);
    throw error;
  }
}

/**
 * Disconnect Prisma client (call in afterAll)
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Get Prisma client instance for custom queries
 */
export function getPrismaClient(): PrismaClient {
  return prisma;
}
