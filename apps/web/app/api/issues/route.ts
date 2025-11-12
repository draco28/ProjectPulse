import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { CreateIssueSchema, IssueFilterSchema } from '@/lib/validations/issue';
import { failure, success, resolveProjectId, buildIssueWhere, buildIssueOrderBy } from './_utils';
import { resolveModuleValue, resolvePriorityValue, resolveStatusValue } from '@/lib/issues/options';
import { deriveAutoTags } from '@/lib/issues/tagging';
import type { IssueFilters } from '@/lib/validations/issue';
import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

function parseArrayParam(searchParams: URLSearchParams, key: string) {
  const direct = searchParams.getAll(key);
  if (direct.length > 0) {
    return direct.flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean);
  }
  const single = searchParams.get(key);
  if (single) {
    return single
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }
  return undefined;
}

function includeConfig(includeRelations?: boolean): Prisma.IssueInclude {
  if (includeRelations) {
    return {
      labels: {
        select: { id: true, name: true, color: true },
      },
      linkedFiles: {
        select: { id: true, filePath: true, lineNumber: true },
      },
      comments: {
        select: { id: true, author: true, createdAt: true, content: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      attachments: {
        select: { id: true, filename: true, filepath: true },
      },
    };
  }

  return {
    labels: {
      select: { id: true, name: true, color: true },
    },
    linkedFiles: {
      select: { id: true, filePath: true, lineNumber: true },
    },
    comments: {
      select: { id: true },
    },
    attachments: {
      select: { id: true },
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const rawFilters: Partial<IssueFilters> = {
      projectId: url.searchParams.get('projectId')
        ? Number(url.searchParams.get('projectId'))
        : undefined,
      status: parseArrayParam(url.searchParams, 'status'),
      priority: parseArrayParam(url.searchParams, 'priority'),
      module: parseArrayParam(url.searchParams, 'module'),
      assignee: parseArrayParam(url.searchParams, 'assignee'),
      tags: parseArrayParam(url.searchParams, 'tags'),
      search: url.searchParams.get('search') ?? undefined,
      createdFrom: url.searchParams.get('createdFrom') ?? undefined,
      createdTo: url.searchParams.get('createdTo') ?? undefined,
      includeRelations: url.searchParams.get('includeRelations') === 'true',
      sortBy: (url.searchParams.get('sortBy') as IssueFilters['sortBy']) ?? undefined,
      sortDirection: (url.searchParams.get('sortDirection') as IssueFilters['sortDirection']) ?? undefined,
      page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
      pageSize: url.searchParams.get('pageSize') ? Number(url.searchParams.get('pageSize')) : undefined,
    };

    const filters = IssueFilterSchema.parse(rawFilters);
    const projectId = await resolveProjectId(filters.projectId);
    const where = buildIssueWhere(filters, projectId);
    const orderBy = buildIssueOrderBy(filters);
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;

    const [issues, totalCount] = await Promise.all([
      prisma.issue.findMany({
        where,
        orderBy,
        take: pageSize,
        skip: (page - 1) * pageSize,
        include: includeConfig(filters.includeRelations),
      }),
      prisma.issue.count({ where }),
    ]);

    return success({
      issues,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      filters: { ...filters, projectId },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid filter parameters',
        details: error.flatten(),
      });
    }

    console.error('[API] GET /api/issues failed', error);
    return failure({ code: 'INTERNAL_ERROR', message: 'Failed to fetch issues', status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const data = CreateIssueSchema.parse(payload);
    const projectId = await resolveProjectId(data.projectId);

    const autoTags = await deriveAutoTags(data.context?.files);
    const status = await resolveStatusValue(data.status);
    const priority = await resolvePriorityValue(data.priority ?? autoTags.priority);
    const issueModule = await resolveModuleValue(data.module ?? autoTags.module);

    const labelIdSet = new Set<number>(data.labelIds ?? []);
    if (labelIdSet.size) {
      const existingById = await prisma.label.findMany({
        where: { id: { in: Array.from(labelIdSet) } },
        select: { id: true },
      });
      if (existingById.length !== labelIdSet.size) {
        return failure({
          code: 'INVALID_LABEL',
          message: 'One or more labels do not exist',
          status: 400,
        });
      }
    }

    if (autoTags.labels?.length) {
      const existing = await prisma.label.findMany({
        where: { name: { in: autoTags.labels } },
        select: { id: true, name: true },
      });

      const missing = autoTags.labels.filter(
        (name) => !existing.some((label) => label.name === name)
      );

      if (missing.length) {
        const created = await prisma.$transaction((tx) =>
          Promise.all(
            missing.map((name) =>
              tx.label.create({
                data: { name, color: '#94a3b8' },
                select: { id: true, name: true },
              })
            )
          )
        );
        created.forEach((label) => labelIdSet.add(label.id));
      }

      existing.forEach((label) => labelIdSet.add(label.id));
    }

    const files = data.context?.files ?? [];
    const snippets =
      files
        .filter((file) => file.snippet)
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
    const customFields =
      Object.keys(customFieldsPayload).length > 0 ? customFieldsPayload : undefined;

    const issue = await prisma.$transaction(async (tx) => {
      const created = await tx.issue.create({
        data: {
          projectId,
          title: data.title,
          description: data.description,
          status,
          priority,
          module: issueModule,
          assignee: data.assignee,
          customFields,
          labels:
            labelIdSet.size > 0
              ? {
                  connect: Array.from(labelIdSet).map((id) => ({ id })),
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

      return tx.issue.findUniqueOrThrow({
        where: { id: created.id },
        include: includeConfig(true),
      });
    });

    revalidatePath('/issues');
    revalidatePath(`/issues/${issue.id}`);

    return success(issue, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid issue payload',
        details: error.flatten(),
      });
    }

    console.error('[API] POST /api/issues failed', error);
    return failure({ code: 'INTERNAL_ERROR', message: 'Failed to create issue', status: 500 });
  }
}
