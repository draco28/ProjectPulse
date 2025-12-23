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
// Sprint 14: All ticket kinds for counting
const TICKET_KINDS = [
  'feature',
  'task',
  'epic',
  'issue',
  'bug',
  'scanner_finding',
  'tech_debt',
] as const;

export async function getFilterCounts(projectId?: number) {
  // Fetch all options first (uses cache from getFilterOptions)
  const options = await getFilterOptions(projectId);

  // Sprint 14 (Ticket #28 fix): Use projectFilter for ALL counts
  // Previously used kind-restricted baseFilter for status/priority/module, but these
  // are universal attributes that apply to all ticket kinds (feature, task, bug, etc.)
  // Sprint 14: Add parentTicketId: null to only count top-level tickets (Ticket #55)
  const projectFilter = projectId ? { projectId, parentTicketId: null } : { parentTicketId: null };

  // Build count queries for all filter values
  // Sprint 14 (Ticket #28 fix): Use projectFilter for ALL counts, not baseFilter
  // Status/priority/module are universal attributes that apply to all ticket kinds
  const countQueries = [
    // Status counts (Ticket #28: use projectFilter instead of baseFilter)
    ...options.status.map((opt) =>
      prisma.ticket
        .count({ where: { ...projectFilter, status: opt.value } })
        .then((count) => ({ type: 'status', value: opt.value, count }))
    ),
    // Priority counts (Ticket #28: use projectFilter instead of baseFilter)
    ...options.priority.map((opt) =>
      prisma.ticket
        .count({ where: { ...projectFilter, priority: opt.value } })
        .then((count) => ({ type: 'priority', value: opt.value, count }))
    ),
    // Module counts (Ticket #28: use projectFilter instead of baseFilter)
    ...options.modules.map((opt) =>
      prisma.ticket
        .count({ where: { ...projectFilter, module: opt.value } })
        .then((count) => ({ type: 'module', value: opt.value, count }))
    ),
    // Sprint 11.7: Label counts (Ticket #28: use projectFilter instead of baseFilter)
    ...options.labels.map((label) =>
      prisma.ticket
        .count({
          where: {
            ...projectFilter,
            labels: { some: { id: label.id } },
          },
        })
        .then((count) => ({ type: 'label', value: String(label.id), count }))
    ),
    // Sprint 14: Kind counts (use projectFilter, not baseFilter - count ALL kinds)
    ...TICKET_KINDS.map((kind) =>
      prisma.ticket
        .count({ where: { ...projectFilter, kind } })
        .then((count) => ({ type: 'kind', value: kind, count }))
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
    kind: {} as Record<string, number>, // Sprint 14
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
    } else if (result.type === 'kind') {
      counts.kind[result.value] = result.count;
    }
  }

  return counts;
}
