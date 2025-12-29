/**
 * Bulk Ticket Creation API Route (Sprint 10)
 *
 * POST /api/tickets/bulk - Create multiple tickets at once
 *
 * Supports up to 50 tickets per request with auto-tagging
 *
 * Security (Sprint 10):
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { TicketBulkCreateSchema } from '@/lib/validations/ticket';
import { failure, success, resolveProjectId } from '../_utils';
import { resolveModuleValue, resolvePriorityValue, resolveStatusValue } from '@/lib/issues/options';
import { deriveAutoTags } from '@/lib/issues/tagging';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';
import { validateAndSetParent, TicketHierarchyError } from '@/lib/tickets/hierarchy';
import { resolveSprintByNumber } from '@/lib/sprints/resolution';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const data = TicketBulkCreateSchema.parse(payload);

    // Sprint 10: Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, data.projectId);

    const results: Array<{
      success: boolean;
      ticket?: { id: number; title: string; kind: string; reference?: string };
      error?: string;
      reference?: string;
    }> = [];

    // Process tickets in transaction for atomicity
    await prisma.$transaction(async (tx) => {
      for (const ticketData of data.tickets) {
        try {
          const autoTags = await deriveAutoTags(ticketData.context?.files);
          const status = await resolveStatusValue(ticketData.status);
          const priority = await resolvePriorityValue(ticketData.priority ?? autoTags.priority);
          const ticketModule = await resolveModuleValue(ticketData.module ?? autoTags.module);

          // Handle labels
          const labelIdSet = new Set<number>(ticketData.labelIds ?? []);

          if (autoTags.labels?.length) {
            // Sprint 11.7: Filter labels by projectId (labels are now project-scoped)
            const existing = await tx.label.findMany({
              where: { projectId, name: { in: autoTags.labels } },
              select: { id: true, name: true },
            });

            const missing = autoTags.labels.filter(
              (name) => !existing.some((label) => label.name === name)
            );

            if (missing.length) {
              // Sprint 11.7: Create labels with projectId
              const created = await Promise.all(
                missing.map((name) =>
                  tx.label.create({
                    data: { name, color: '#94a3b8', projectId },
                    select: { id: true },
                  })
                )
              );
              created.forEach((label) => labelIdSet.add(label.id));
            }

            existing.forEach((label) => labelIdSet.add(label.id));
          }

          // Build custom fields
          const files = ticketData.context?.files ?? [];
          const snippets = files
            .filter((file) => file.snippet)
            .map((file) => ({
              filePath: file.filePath,
              lineNumber: file.lineNumber ?? null,
              snippet: file.snippet,
            }));

          const customFieldsPayload = {
            ...(ticketData.customFields ?? {}),
            ...(ticketData.context?.metadata ?? {}),
            ...(snippets.length ? { contextSnippets: snippets } : {}),
          };
          const customFields =
            Object.keys(customFieldsPayload).length > 0 ? customFieldsPayload : undefined;

          // Sprint 12: linkedTaskId removed - tickets now schedule via scheduledWeekId

          // Sprint 13: Validate parent ticket if provided (Ticket #39 fix)
          // Note: Uses full prisma client (not tx) for validation reads - same pattern as regular create
          if (ticketData.parentTicketId) {
            await validateAndSetParent(
              prisma,
              null, // null ticketId for new ticket (no circular reference possible)
              ticketData.parentTicketId,
              projectId,
              ticketData.kind ?? 'issue'
            );
          }

          // Sprint 15 Fix: Resolve sprintId from sprintNumber (via roadmap hierarchy)
          // Bug fix: Bulk create was missing this, causing tickets to not appear on kanban
          const resolvedSprintId =
            ticketData.sprintNumber && !ticketData.sprintId
              ? await resolveSprintByNumber(prisma, projectId, ticketData.sprintNumber)
              : (ticketData.sprintId ?? null);

          // Create ticket
          const ticket = await tx.ticket.create({
            data: {
              projectId,
              title: ticketData.title,
              description: ticketData.description,
              status,
              priority,
              module: ticketModule,
              assignee: ticketData.assignee,
              kind: ticketData.kind ?? 'issue',
              source: ticketData.source ?? 'manual',
              assigneeType: ticketData.assigneeType,
              assigneeId: ticketData.assigneeId,
              // Sprint 12: linkedTaskId removed - tickets schedule via scheduledWeekId
              customFields,
              // Sprint 13: Hierarchy fields (Ticket #39 fix)
              parentTicketId: ticketData.parentTicketId ?? null,
              // Sprint 13: Traceability fields (Ticket #39 fix)
              epicRef: ticketData.epicRef ?? null,
              backlogRefs: ticketData.backlogRefs ?? [],
              sprintNumber: ticketData.sprintNumber ?? null,
              // Sprint 15 Fix: Set sprintId for kanban board queries
              sprintId: resolvedSprintId,
              labels:
                labelIdSet.size > 0
                  ? { connect: Array.from(labelIdSet).map((id) => ({ id })) }
                  : undefined,
            },
            select: { id: true, title: true, kind: true },
          });

          // Create linked files
          if (files.length) {
            await tx.ticketLinkedFile.createMany({
              data: files.map((file) => ({
                ticketId: ticket.id,
                filePath: file.filePath,
                lineNumber: file.lineNumber ?? null,
              })),
            });
          }

          results.push({
            success: true,
            ticket: {
              id: ticket.id,
              title: ticket.title,
              kind: ticket.kind,
              reference: ticketData.reference,
            },
          });
        } catch (ticketError) {
          // Sprint 13: Handle hierarchy validation errors (Ticket #39 fix)
          if (ticketError instanceof TicketHierarchyError) {
            results.push({
              success: false,
              error: `Hierarchy error: ${ticketError.message}`,
              reference: ticketData.reference,
            });
          } else {
            results.push({
              success: false,
              error: ticketError instanceof Error ? ticketError.message : 'Unknown error',
              reference: ticketData.reference,
            });
          }
        }
      }
    });

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    revalidatePath('/tickets');
    revalidatePath('/issues');

    return success(
      {
        created: successCount,
        failed: failureCount,
        total: data.tickets.length,
        results,
      },
      successCount > 0 ? 201 : 400
    );
  } catch (error) {
    // Sprint 10: Handle auth errors first
    if (error instanceof AuthError) {
      return failure({ code: error.code, message: error.message, status: error.status });
    }

    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid bulk ticket payload',
        details: error.flatten(),
      });
    }

    console.error('[API] POST /api/tickets/bulk failed', error);
    return failure({ code: 'INTERNAL_ERROR', message: 'Failed to create tickets', status: 500 });
  }
}
