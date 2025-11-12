import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  IssueIdParamSchema,
  UpdateIssueSchema,
} from '@/lib/validations/issue';
import { failure, success } from '../_utils';
import { resolveModuleValue, resolvePriorityValue, resolveStatusValue } from '@/lib/issues/options';
import type { Prisma } from '@prisma/client';

function includeFullIssue(): Prisma.IssueInclude {
  return {
    labels: { select: { id: true, name: true, color: true } },
    linkedFiles: { select: { id: true, filePath: true, lineNumber: true } },
    comments: {
      select: { id: true, author: true, content: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    },
    attachments: { select: { id: true, filename: true, filepath: true } },
    project: { select: { id: true, name: true } },
  };
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = IssueIdParamSchema.parse({ id: params.id });
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: includeFullIssue(),
    });

    if (!issue) {
      return failure({ code: 'NOT_FOUND', message: 'Issue not found', status: 404 });
    }

    return success(issue);
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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = IssueIdParamSchema.parse({ id: params.id });
    const payload = await request.json();
    const data = UpdateIssueSchema.parse(payload);

    const updates: Prisma.IssueUpdateInput = {};
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

    const issue = await prisma.issue.update({
      where: { id },
      data: updates,
      include: includeFullIssue(),
    });

    revalidatePath('/issues');
    revalidatePath(`/issues/${id}`);

    return success(issue);
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

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = IssueIdParamSchema.parse({ id: params.id });
    await prisma.issue.delete({ where: { id } });
    revalidatePath('/issues');
    revalidatePath(`/issues/${id}`);
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
