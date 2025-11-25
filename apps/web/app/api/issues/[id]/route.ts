/**
 * Single Issue API Route (Sprint 10 - Backwards Compatible Wrapper)
 *
 * This route delegates to /api/tickets/[id] for backwards compatibility
 * Issues are tickets with kind IN ('issue', 'bug', 'scanner_finding')
 */

import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { TicketIdParamSchema, UpdateTicketSchema } from '@/lib/validations/ticket';
import { failure, success, ticketIncludeConfig } from '../../tickets/_utils';
import { resolveModuleValue, resolvePriorityValue, resolveStatusValue } from '@/lib/issues/options';
import type { Prisma } from '@prisma/client';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const { id } = TicketIdParamSchema.parse({ id: rawId });
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        labels: { select: { id: true, name: true, color: true } },
        linkedFiles: { select: { id: true, filePath: true, lineNumber: true } },
        comments: {
          select: { id: true, author: true, content: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        attachments: { select: { id: true, filename: true, filepath: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (!ticket) {
      return failure({ code: 'NOT_FOUND', message: 'Issue not found', status: 404 });
    }

    return success(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid issue id',
        details: error.flatten(),
      });
    }

    console.error('[API] GET /api/issues/[id] failed', error);
    return failure({ code: 'INTERNAL_ERROR', message: 'Failed to fetch issue', status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const { id } = TicketIdParamSchema.parse({ id: rawId });
    const payload = await request.json();
    const data = UpdateTicketSchema.parse(payload);

    const updates: Prisma.TicketUpdateInput = {};
    if (data.title) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.assignee !== undefined) updates.assignee = data.assignee;
    if (data.customFields !== undefined || data.context?.metadata) {
      const snippets =
        data.context?.files
          ?.filter((file) => file.snippet)
          .map((file) => ({
            filePath: file.filePath,
            lineNumber: file.lineNumber ?? null,
            snippet: file.snippet,
          })) ?? [];

      const customFieldsPayload = {
        ...(data.customFields ?? {}),
        ...(data.context?.metadata ?? {}),
        ...(snippets.length ? { contextSnippets: snippets } : {}),
      };

      updates.customFields =
        Object.keys(customFieldsPayload).length > 0 ? customFieldsPayload : undefined;
    }

    if (data.status) {
      updates.status = await resolveStatusValue(data.status);
    }

    if (data.priority) {
      updates.priority = await resolvePriorityValue(data.priority);
    }

    if (data.module) {
      updates.module = await resolveModuleValue(data.module);
    }

    if (data.labelIds) {
      const labels = await prisma.label.findMany({
        where: { id: { in: data.labelIds } },
        select: { id: true },
      });

      if (labels.length !== data.labelIds.length) {
        return failure({
          code: 'INVALID_LABEL',
          message: 'One or more labels do not exist',
          status: 400,
        });
      }

      updates.labels = {
        set: data.labelIds.map((labelId) => ({ id: labelId })),
      };
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: updates,
      include: ticketIncludeConfig(true),
    });

    revalidatePath('/issues');
    revalidatePath(`/issues/${id}`);
    revalidatePath('/tickets');
    revalidatePath(`/tickets/${id}`);

    return success(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid payload',
        details: error.flatten(),
      });
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return failure({ code: 'NOT_FOUND', message: 'Issue not found', status: 404 });
    }

    console.error('[API] PATCH /api/issues/[id] failed', error);
    return failure({
      code: 'INTERNAL_ERROR',
      message: 'Failed to update issue',
      status: 500,
    });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const { id } = TicketIdParamSchema.parse({ id: rawId });
    await prisma.ticket.delete({ where: { id } });
    revalidatePath('/issues');
    revalidatePath(`/issues/${id}`);
    revalidatePath('/tickets');
    revalidatePath(`/tickets/${id}`);
    return success({ id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid issue id',
        details: error.flatten(),
      });
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return failure({ code: 'NOT_FOUND', message: 'Issue not found', status: 404 });
    }

    console.error('[API] DELETE /api/issues/[id] failed', error);
    return failure({ code: 'INTERNAL_ERROR', message: 'Failed to delete issue', status: 500 });
  }
}
