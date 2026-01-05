/**
 * Ticket Lookup by Project-Scoped Number (Sprint 17)
 *
 * GET /api/tickets/by-number/[projectId]/[ticketNumber]
 *
 * Enables MCP tools to look up tickets by the user-friendly ticketNumber
 * instead of requiring the global id.
 *
 * Example: GET /api/tickets/by-number/6/5 → Returns ticket #5 in project 6
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';
import { failure, success } from '../../../_utils';
import { ticketIncludeConfig, addDisplayIdToTickets } from '../../../_utils';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  projectId: z.coerce.number().int().positive(),
  ticketNumber: z.coerce.number().int().positive(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; ticketNumber: string }> }
) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const rawParams = await params;
    const { projectId, ticketNumber } = paramsSchema.parse(rawParams);

    // Authenticate and validate project access
    await getAuthorizedProjectId(request, projectId);

    // Look up ticket by projectId + ticketNumber (uses unique constraint)
    const ticket = await prisma.ticket.findUnique({
      where: {
        projectId_ticketNumber: {
          projectId,
          ticketNumber,
        },
      },
      include: ticketIncludeConfig(true),
    });

    if (!ticket) {
      return failure({
        code: 'NOT_FOUND',
        message: `Ticket #${ticketNumber} not found in project ${projectId}`,
        status: 404,
      });
    }

    // Add displayId to the ticket
    const [ticketWithDisplayId] = addDisplayIdToTickets([ticket]);

    return success(ticketWithDisplayId);
  } catch (error) {
    if (error instanceof AuthError) {
      return failure({ code: error.code, message: error.message, status: error.status });
    }

    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid projectId or ticketNumber',
        details: error.flatten(),
      });
    }

    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to fetch ticket by number');
    return failure({
      code: 'INTERNAL_ERROR',
      message: 'Failed to fetch ticket',
      status: 500,
    });
  }
}
