/**
 * Agent Token Service (Sprint 9: Agent OAuth & Project Settings)
 *
 * Manages opaque bearer tokens for project-scoped agent MCP access.
 * Tokens are hashed with bcrypt and validated per request.
 */

import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

/**
 * Generate a new project-scoped agent token
 *
 * @param projectId - Project ID (Int)
 * @param name - Human-friendly token name (e.g., "Frontend Claude")
 * @param days - Token expiry in days (default: 30)
 * @returns Plaintext token (shown only once), token ID, name, expiry
 */
export async function generateProjectToken(
  projectId: number,
  name: string,
  days = 30
): Promise<{
  token: string;
  id: number;
  name: string;
  expiresAt: Date;
}> {
  // Check for duplicate name in same project
  const existing = await prisma.projectToken.findFirst({
    where: {
      projectId,
      name,
      isRevoked: false,
    },
  });

  if (existing) {
    throw new Error(
      'A token with this name already exists for this project. Please choose a different name or revoke the existing token.'
    );
  }

  // Generate opaque token (64-char hex)
  const token = randomBytes(32).toString('hex');

  // Hash for storage
  const tokenHash = await bcrypt.hash(token, 10);

  // Calculate expiry
  const expiresAt = new Date(Date.now() + days * 86400000);

  // Create token record
  const record = await prisma.projectToken.create({
    data: {
      projectId,
      name,
      tokenHash,
      expiresAt,
    },
  });

  return {
    token, // Return plaintext ONLY ONCE
    id: record.id,
    name: record.name,
    expiresAt: record.expiresAt!,
  };
}

/**
 * Validate a project token
 *
 * @param rawToken - Plaintext token from Authorization header
 * @returns Project ID, token ID, and name if valid
 * @throws Error if token is invalid, expired, or revoked
 */
export async function validateProjectToken(rawToken: string): Promise<{
  projectId: number;
  tokenId: number;
  name: string;
}> {
  // Load all non-revoked, non-expired tokens
  const candidates = await prisma.projectToken.findMany({
    where: {
      isRevoked: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    select: {
      id: true,
      projectId: true,
      name: true,
      tokenHash: true,
    },
  });

  // Try to match against each candidate
  for (const candidate of candidates) {
    const match = await bcrypt.compare(rawToken, candidate.tokenHash);
    if (match) {
      // Update lastUsedAt
      await prisma.projectToken.update({
        where: { id: candidate.id },
        data: { lastUsedAt: new Date() },
      });

      return {
        projectId: candidate.projectId,
        tokenId: candidate.id,
        name: candidate.name,
      };
    }
  }

  throw new Error('Invalid or expired token');
}

/**
 * Revoke a project token by name
 *
 * @param projectId - Project ID
 * @param name - Token name to revoke
 */
export async function revokeProjectToken(
  projectId: number,
  name: string
): Promise<void> {
  await prisma.projectToken.updateMany({
    where: {
      projectId,
      name,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
    },
  });
}

/**
 * Revoke a project token by ID
 *
 * @param projectId - Project ID (for ownership check)
 * @param tokenId - Token ID to revoke
 */
export async function revokeProjectTokenById(
  projectId: number,
  tokenId: number
): Promise<void> {
  await prisma.projectToken.updateMany({
    where: {
      id: tokenId,
      projectId, // Ensure ownership
      isRevoked: false,
    },
    data: {
      isRevoked: true,
    },
  });
}

/**
 * List all tokens for a project
 *
 * @param projectId - Project ID
 * @returns Array of token metadata (no hashes)
 */
export async function listProjectTokens(projectId: number) {
  return await prisma.projectToken.findMany({
    where: { projectId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      expiresAt: true,
      lastUsedAt: true,
      isRevoked: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}
