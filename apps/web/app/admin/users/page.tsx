/**
 * Admin Users Page
 * Sprint 11.5: User management interface
 * 
 * Features:
 * - User list with pagination
 * - Search and filters
 * - Actions (activate/deactivate, promote/demote, reset password)
 */

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminUsersTable } from './AdminUsersTable';
import { requireAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  // Server-side auth check
  await requireAdmin();

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Users"
        description="Manage user accounts and permissions"
      />

      {/* Users Table - Client Component */}
      <AdminUsersTable />
    </div>
  );
}
