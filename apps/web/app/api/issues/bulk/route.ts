import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { IssueBulkCreateSchema } from '@/lib/validations/issue';
import { deriveAutoTags } from '@/lib/issues/tagging';
import { resolveModuleValue, resolvePriorityValue, resolveStatusValue } from '@/lib/issues/options';
import { failure, resolveProjectId, success } from '../_utils';

export const dynamic = 'force-dynamic';

const LABEL_ERROR = 'INVALID_LABEL_IDS';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const data = IssueBulkCreateSchema.parse(payload);
    const projectId = await resolveProjectId(data.projectId);
    const startedAt = Date.now();

    const createdIssues = await prisma.$transaction(async (tx) => {
      const createdIds: number[] = [];

      for (const issuePayload of data.issues) {
        const autoTags = await deriveAutoTags(issuePayload.context?.files);
        const status = await resolveStatusValue(issuePayload.status);
        const priority = await resolvePriorityValue(issuePayload.priority ?? autoTags.priority);
        const issueModule = await resolveModuleValue(issuePayload.module ?? autoTags.module);

        const labelIdSet = new Set<number>(issuePayload.labelIds ?? []);
        if (labelIdSet.size) {
          const labels = await tx.label.findMany({
            where: { id: { in: Array.from(labelIdSet) } },
            select: { id: true },
          });
          if (labels.length !== labelIdSet.size) {
            throw new Error(LABEL_ERROR);
          }
        }

        if (autoTags.labels?.length) {
          const existing = await tx.label.findMany({
            where: { name: { in: autoTags.labels } },
            select: { id: true, name: true },
          });
          const missing = autoTags.labels.filter(
            (name) => !existing.some((label) => label.name === name)
          );

          for (const label of existing) {
            labelIdSet.add(label.id);
          }

          if (missing.length) {
            const created = await Promise.all(
              missing.map((name) =>
                tx.label.create({
                  data: { name, color: '#94a3b8' },
                  select: { id: true },
                })
              )
            );
            created.forEach((label) => labelIdSet.add(label.id));
          }
        }

        const files = issuePayload.context?.files ?? [];
        const snippets =
          files
            .filter((file) => file.snippet)
            .map((file) => ({
              filePath: file.filePath,
              lineNumber: file.lineNumber ?? null,
              snippet: file.snippet,
            })) ?? [];

        const customFieldsPayload = {
          ...(issuePayload.customFields ?? {}),
          ...(issuePayload.context?.metadata ?? {}),
          ...(snippets.length ? { contextSnippets: snippets } : {}),
        };

        const customFields =
          Object.keys(customFieldsPayload).length > 0 ? customFieldsPayload : undefined;

        const created = await tx.issue.create({
          data: {
            projectId,
            title: issuePayload.title,
            description: issuePayload.description,
            status,
            priority,
            module: issueModule,
            assignee: issuePayload.assignee,
            customFields,
            labels:
              labelIdSet.size > 0
                ? {
                    connect: Array.from(labelIdSet).map((labelId) => ({ id: labelId })),
                  }
                : undefined,
          },
          select: { id: true },
        });

        if (files.length) {
          await tx.linkedFile.createMany({
            data: files.map((file) => ({
              issueId: created.id,
              filePath: file.filePath,
              lineNumber: file.lineNumber ?? null,
            })),
          });
        }

        createdIds.push(created.id);
      }

      return tx.issue.findMany({
        where: { id: { in: createdIds } },
        include: {
          labels: { select: { id: true, name: true, color: true } },
          linkedFiles: { select: { id: true, filePath: true, lineNumber: true } },
          comments: { select: { id: true } },
          attachments: { select: { id: true } },
        },
      });
    });

    revalidatePath('/issues');

    return success(
      {
        created: createdIssues.length,
        failed: 0,
        issues: createdIssues,
        durationMs: Date.now() - startedAt,
      },
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid bulk payload',
        details: error.flatten(),
      });
    }

    if (error instanceof Error && error.message === LABEL_ERROR) {
      return failure({
        code: 'INVALID_LABEL',
        message: 'One or more labels do not exist',
        status: 400,
      });
    }

    console.error('[API] POST /api/issues/bulk failed', error);
    return failure({ code: 'INTERNAL_ERROR', message: 'Bulk creation failed', status: 500 });
  }
}
