/**
 * Admin Overview Page
 * Sprint 11.5: Dashboard with system statistics
 * 
 * Features:
 * - User stats (total, active, admins)
 * - Project stats
 * - Token stats
 * - Recent activity
 */

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminStatsCards } from './AdminStatsCards';
import { requireAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  // Server-side auth check
  await requireAdmin();

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Overview"
        description="System-wide statistics and recent activity"
      />

      {/* Stats Cards - Client Component */}
      <AdminStatsCards />
    </div>
  );
}
