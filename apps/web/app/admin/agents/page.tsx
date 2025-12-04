/**
 * Admin MCP/Agents Dashboard
 * Sprint 11.5: Monitor and control AI agent access to ProjectPulse
 *
 * Features:
 * - Emergency shutdown panel (always visible at top)
 * - MCP stats overview
 * - Token management table
 * - Global tool blocklist
 */

import { AdminHeader } from '@/components/admin/AdminHeader';
import { requireAdmin } from '@/lib/auth-server';
import { MCPStatsCards } from './MCPStatsCards';
import { EmergencyShutdownPanel } from './EmergencyShutdownPanel';
import { BlockedToolsPanel } from './BlockedToolsPanel';
import { TokensTable } from './TokensTable';

export const dynamic = 'force-dynamic';

export default async function AdminAgentsPage() {
  // Server-side auth check
  await requireAdmin();

  return (
    <div className="space-y-6">
      <AdminHeader
        title="MCP Agent Management"
        description="Monitor and control AI agent access to ProjectPulse"
      />

      {/* Emergency Shutdown - Always visible at top */}
      <EmergencyShutdownPanel />

      {/* Stats Overview */}
      <MCPStatsCards />

      {/* Two column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tokens Table (2/3 width) */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            API Tokens
          </h2>
          <TokensTable />
        </div>

        {/* Blocked Tools Panel (1/3 width) */}
        <div>
          <BlockedToolsPanel />
        </div>
      </div>
    </div>
  );
}
