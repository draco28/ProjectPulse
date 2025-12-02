/**
 * Admin Settings Page
 * Sprint 11.5: System settings and utilities
 * 
 * Features:
 * - System information
 * - Seed management
 * - Audit log viewer
 */

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSettingsPanel } from './AdminSettingsPanel';
import { requireAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  // Server-side auth check
  await requireAdmin();

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Settings"
        description="System configuration and utilities"
      />

      {/* Settings Panel - Client Component */}
      <AdminSettingsPanel />
    </div>
  );
}
