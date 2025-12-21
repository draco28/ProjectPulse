/**
 * Issue Detail Page - REDIRECT TO TICKETS
 *
 * Sprint 10: Issues detail route now redirects to /tickets/[id]
 * Preserves project query parameter for context.
 */

import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ project?: string }>;
}

export default async function IssueDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { project } = await searchParams;

  // Redirect to /tickets/[id] preserving project context
  const redirectUrl = project ? `/tickets/${id}?project=${project}` : `/tickets/${id}`;

  redirect(redirectUrl);
}
