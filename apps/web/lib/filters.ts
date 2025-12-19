/**
 * Filter Options Helper
 *
 * Server-side helper to fetch filter options from database.
 * Uses Next.js unstable_cache for 1-hour caching to minimize database queries.
 *
 * Usage:
 * - Import in Server Components (issues/page.tsx)
 * - Reused by API endpoint (/api/settings/filters)
 *
 * @see apps/web/app/issues/page.tsx for Server Component usage
 * @see apps/web/app/api/settings/filters/route.ts for API endpoint
 */

import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type {
  FiltersDTO,
  StatusOption,
  PriorityOption,
  ModuleOption,
  LabelOption,
} from '@/types/filters';

/**
 * Fetch all filter options from database
 *
 * Options cached for 1 hour (3600 seconds) with tag-based revalidation.
 * Tag can be used later for on-demand revalidation when admin edits options.
 *
 * Sprint 11.7: Added projectId parameter to filter labels by project
 *
 * @param projectId - Project ID to filter labels (required for project-scoped labels)
 * @returns {Promise<FiltersDTO>} Complete filter options DTO
 * @throws {Error} If database query fails
 */
export async function getFilterOptions(projectId?: number): Promise<FiltersDTO> {
  return getFilterOptionsCached(projectId);
}

const getFilterOptionsCached = unstable_cache(
  async (projectId?: number): Promise<FiltersDTO> => {
    // Parallel fetch all option tables + labels
    const [statusOptions, priorityOptions, moduleOptions, labels] = await Promise.all([
      // Status options
      prisma.ticketStatusOption.findMany({
        orderBy: { order: 'asc' },
        select: {
          value: true,
          label: true,
          colorClass: true,
        },
      }),

      // Priority options
      prisma.ticketPriorityOption.findMany({
        orderBy: { order: 'asc' },
        select: {
          value: true,
          label: true,
          dotColorClass: true,
          badgeColorClass: true,
        },
      }),

      // Module options
      prisma.ticketModuleOption.findMany({
        orderBy: { order: 'asc' },
        select: {
          value: true,
          label: true,
        },
      }),

      // Labels (existing Label model) - Sprint 11.7: Filter by projectId
      prisma.label.findMany({
        where: projectId ? { projectId } : undefined,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          color: true,
        },
      }),
    ]);

    // Map database results to DTO types
    return {
      status: statusOptions.map(
        (opt): StatusOption => ({
          value: opt.value,
          label: opt.label,
          colorClass: opt.colorClass ?? undefined,
        })
      ),
      priority: priorityOptions.map(
        (opt): PriorityOption => ({
          value: opt.value,
          label: opt.label,
          dotColorClass: opt.dotColorClass ?? undefined,
          badgeColorClass: opt.badgeColorClass ?? undefined,
        })
      ),
      modules: moduleOptions.map(
        (opt): ModuleOption => ({
          value: opt.value,
          label: opt.label,
        })
      ),
      labels: labels.map(
        (label): LabelOption => ({
          id: label.id,
          name: label.name,
          color: label.color,
        })
      ),
    };
  },
  ['filter-options'], // Cache key
  {
    revalidate: 3600, // 1 hour in seconds
    tags: ['filter-options'], // Tag for on-demand revalidation
  }
);

/**
 * Get filter counts for all option values
 *
 * Computes count of issues for each filter option value.
 * Uses parallel queries with Promise.all for performance.
 *
 * NOT CACHED - counts change frequently when issues are created/updated.
 *
 * Sprint 11.7: Added projectId parameter and label counts
 *
 * @param projectId - Project ID to filter counts by project
 * @returns {Promise<FilterCounts>} Count of issues per filter value
 * @throws {Error} If database query fails
 */
export async function getFilterCounts(projectId?: number) {
  // Fetch all options first (uses cache from getFilterOptions)
  const options = await getFilterOptions(projectId);

  // Sprint 10: Use ticket model with kind filter for backwards compatibility
  // Sprint 14: Add projectId to base filter to fix data bleeding bug (Ticket #19)
  const baseFilter = {
    ...(projectId && { projectId }),
    kind: { in: ['issue', 'bug', 'scanner_finding'] },
  };

  // Build count queries for all filter values
  const countQueries = [
    // Status counts
    ...options.status.map((opt) =>
      prisma.ticket
        .count({ where: { ...baseFilter, status: opt.value } })
        .then((count) => ({ type: 'status', value: opt.value, count }))
    ),
    // Priority counts
    ...options.priority.map((opt) =>
      prisma.ticket
        .count({ where: { ...baseFilter, priority: opt.value } })
        .then((count) => ({ type: 'priority', value: opt.value, count }))
    ),
    // Module counts
    ...options.modules.map((opt) =>
      prisma.ticket
        .count({ where: { ...baseFilter, module: opt.value } })
        .then((count) => ({ type: 'module', value: opt.value, count }))
    ),
    // Sprint 11.7: Label counts
    ...options.labels.map((label) =>
      prisma.ticket
        .count({
          where: {
            ...baseFilter,
            labels: { some: { id: label.id } },
          },
        })
        .then((count) => ({ type: 'label', value: String(label.id), count }))
    ),
  ];

  // Execute all count queries in parallel
  const results = await Promise.all(countQueries);

  // Transform results into FilterCounts shape
  const counts = {
    status: {} as Record<string, number>,
    priority: {} as Record<string, number>,
    module: {} as Record<string, number>,
    label: {} as Record<string, number>, // Sprint 11.7
  };

  for (const result of results) {
    if (result.type === 'status') {
      counts.status[result.value] = result.count;
    } else if (result.type === 'priority') {
      counts.priority[result.value] = result.count;
    } else if (result.type === 'module') {
      counts.module[result.value] = result.count;
    } else if (result.type === 'label') {
      counts.label[result.value] = result.count;
    }
  }

  return counts;
}
