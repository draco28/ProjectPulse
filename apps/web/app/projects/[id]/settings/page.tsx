/**
 * Old Project Settings Page Redirect (Sprint 15)
 *
 * This page has been migrated to /(authenticated)/settings
 * with query param pattern: /settings?project=6
 *
 * This redirect ensures old bookmarks and links continue to work.
 */

import { redirect } from 'next/navigation';

export default async function OldProjectSettingsRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/settings?project=${id}`);
}
