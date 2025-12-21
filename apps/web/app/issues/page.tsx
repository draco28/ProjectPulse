/**
 * Issues List Page - REDIRECT TO TICKETS
 *
 * Sprint 10: Issues route now redirects to /tickets with kind filter
 * Preserves all query parameters and adds kind=issue,bug,scanner_finding
 * for backwards compatibility (shows only issue-like tickets).
 */

import { redirect } from 'next/navigation';

interface SearchParams {
  status?: string;
  priority?: string;
  module?: string;
  search?: string;
  sort?: string;
  page?: string;
  project?: string;
  [key: string]: string | undefined;
}

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // Build redirect URL preserving all query params
  const queryParams = new URLSearchParams();

  // Add kind filter for backwards compatibility (only show issue-like tickets)
  queryParams.set('kind', 'issue,bug,scanner_finding');

  // Preserve existing query params
  if (params.project) queryParams.set('project', params.project);
  if (params.status) queryParams.set('status', params.status);
  if (params.priority) queryParams.set('priority', params.priority);
  if (params.module) queryParams.set('module', params.module);
  if (params.search) queryParams.set('search', params.search);
  if (params.sort) queryParams.set('sort', params.sort);
  if (params.page) queryParams.set('page', params.page);

  redirect(`/tickets?${queryParams.toString()}`);
}
