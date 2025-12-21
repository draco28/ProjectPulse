/**
 * Emergency Shutdown Panel Component
 * Sprint 11.5: Enable/disable emergency shutdown for all MCP operations
 */
'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Power, PowerOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmergencyStatus {
  enabled: boolean;
  reason: string | null;
  enabledAt: string | null;
  enabledBy: string | null;
}

export function EmergencyShutdownPanel() {
  const [status, setStatus] = useState<EmergencyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState('');

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/mcp/emergency');
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh every 10 seconds when enabled
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleEnable = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for enabling emergency shutdown');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/mcp/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to enable');
      }

      await fetchStatus();
      setShowReasonInput(false);
      setReason('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to enable emergency shutdown');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable = async () => {
    if (
      !confirm('Are you sure you want to disable emergency shutdown? MCP operations will resume.')
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/mcp/emergency', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to disable');
      }

      await fetchStatus();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to disable emergency shutdown');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
        Error: {error}
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div
      className={cn(
        'rounded-2xl border-2 p-6 transition-colors',
        status?.enabled
          ? 'border-red-500 bg-red-50 dark:border-red-500/50 dark:bg-red-900/20'
          : 'border-green-500/50 bg-green-50 dark:border-green-500/30 dark:bg-green-900/20'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl',
              status?.enabled
                ? 'bg-red-100 dark:bg-red-900/30'
                : 'bg-green-100 dark:bg-green-900/30'
            )}
          >
            {status?.enabled ? (
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            ) : (
              <Power className="h-6 w-6 text-green-600 dark:text-green-400" />
            )}
          </div>
          <div>
            <h3
              className={cn(
                'text-lg font-semibold',
                status?.enabled
                  ? 'text-red-900 dark:text-red-100'
                  : 'text-green-900 dark:text-green-100'
              )}
            >
              {status?.enabled ? 'Emergency Shutdown ACTIVE' : 'MCP Operations Normal'}
            </h3>
            {status?.enabled ? (
              <div className="mt-1 space-y-1">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>Reason:</strong> {status.reason}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Enabled at: {formatDate(status.enabledAt)}
                </p>
                <p className="text-xs text-red-500 dark:text-red-400">
                  All MCP tool calls are being rejected
                </p>
              </div>
            ) : (
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                All MCP operations are functioning normally
              </p>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          {status?.enabled ? (
            <button
              onClick={handleDisable}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Power className="h-4 w-4" />
              )}
              Resume Operations
            </button>
          ) : showReasonInput ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for shutdown..."
                className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEnable}
                  disabled={actionLoading || !reason.trim()}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Confirm'}
                </button>
                <button
                  onClick={() => {
                    setShowReasonInput(false);
                    setReason('');
                  }}
                  className="flex-1 rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowReasonInput(true)}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              <PowerOff className="h-4 w-4" />
              Emergency Shutdown
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
