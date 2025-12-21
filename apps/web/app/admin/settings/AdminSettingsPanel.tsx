/**
 * Admin Settings Panel Component
 * Sprint 11.5: System settings interface
 */
'use client';

import { useEffect, useState } from 'react';
import { Server, Database, Clock, History, Loader2 } from 'lucide-react';

interface AuditLog {
  id: number;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export function AdminSettingsPanel() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch recent audit logs
    async function fetchAuditLogs() {
      try {
        const response = await fetch('/api/admin/audit-logs?limit=20');
        if (response.ok) {
          const data = await response.json();
          setAuditLogs(data.logs || []);
        }
      } catch (err) {
        console.error('Failed to fetch audit logs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAuditLogs();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    if (action.includes('ACTIVATE') || action.includes('PROMOTE')) {
      return 'text-green-600 dark:text-green-400';
    }
    if (action.includes('DEACTIVATE') || action.includes('DEMOTE')) {
      return 'text-red-600 dark:text-red-400';
    }
    return 'text-blue-600 dark:text-blue-400';
  };

  return (
    <div className="space-y-6">
      {/* System Info */}
      <div className="rounded-2xl border border-gray-200/50 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-800/50">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Server className="h-5 w-5" />
          System Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">Environment</p>
            <p className="mt-1 font-medium text-gray-900 dark:text-white">
              {process.env.NODE_ENV || 'development'}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">Version</p>
            <p className="mt-1 font-medium text-gray-900 dark:text-white">Sprint 11.5</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">Database</p>
            <p className="mt-1 flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
              <Database className="h-4 w-4" />
              Connected
            </p>
          </div>
        </div>
      </div>

      {/* Recent Audit Logs */}
      <div className="rounded-2xl border border-gray-200/50 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-800/50">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <History className="h-5 w-5" />
          Recent Admin Actions
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            No admin actions recorded yet
          </div>
        ) : (
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-700/50"
              >
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className={`font-medium ${getActionColor(log.action)}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">
                      {' '}
                      on {log.targetType.toLowerCase()}{' '}
                    </span>
                    <span className="font-mono text-xs text-gray-500">
                      {log.targetId.slice(0, 12)}...
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Future: Add more settings sections */}
      <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center dark:border-gray-600">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          More settings coming in future phases: MCP controls, rate limiting, session management
        </p>
      </div>
    </div>
  );
}
