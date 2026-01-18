/**
 * Blocked Tools Panel Component
 * Sprint 11.5: Manage globally blocked MCP tools
 */
'use client';

import { useEffect, useState } from 'react';
import { Ban, Plus, X, Loader2, Wrench } from 'lucide-react';
import '@/lib/utils';

export function BlockedToolsPanel() {
  const [blockedTools, setBlockedTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newTool, setNewTool] = useState('');
  const [reason, setReason] = useState('');

  const fetchBlockedTools = async () => {
    try {
      const response = await fetch('/api/admin/mcp/blocked-tools');
      if (!response.ok) throw new Error('Failed to fetch blocked tools');
      const data = await response.json();
      setBlockedTools(data.blockedTools || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedTools();
  }, []);

  const handleAddTool = async () => {
    if (!newTool.trim()) return;

    setActionLoading('add');
    try {
      const response = await fetch('/api/admin/mcp/blocked-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: newTool.trim(),
          reason: reason.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to block tool');
      }

      await fetchBlockedTools();
      setNewTool('');
      setReason('');
      setShowAddInput(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to block tool');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveTool = async (toolName: string) => {
    if (!confirm(`Unblock "${toolName}"? Agents will be able to use this tool again.`)) {
      return;
    }

    setActionLoading(toolName);
    try {
      const response = await fetch('/api/admin/mcp/blocked-tools', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to unblock tool');
      }

      await fetchBlockedTools();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to unblock tool');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200/50 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-800/50">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <Ban className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Blocked Tools</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {blockedTools.length} tool{blockedTools.length !== 1 ? 's' : ''} blocked
            </p>
          </div>
        </div>
        {!showAddInput && (
          <button
            onClick={() => setShowAddInput(true)}
            className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        )}
      </div>

      {/* Add Tool Form */}
      {showAddInput && (
        <div className="mb-4 space-y-2 rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
          <input
            type="text"
            value={newTool}
            onChange={(e) => setNewTool(e.target.value)}
            placeholder="Tool name (e.g., projectpulse_ticket_create)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            autoFocus
          />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddTool}
              disabled={actionLoading === 'add' || !newTool.trim()}
              className="flex-1 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
            >
              {actionLoading === 'add' ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                'Block Tool'
              )}
            </button>
            <button
              onClick={() => {
                setShowAddInput(false);
                setNewTool('');
                setReason('');
              }}
              className="flex-1 rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Blocked Tools List */}
      <div className="space-y-2">
        {blockedTools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Wrench className="mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No tools blocked</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              All MCP tools are available to agents
            </p>
          </div>
        ) : (
          blockedTools.map((toolName) => (
            <div
              key={toolName}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <Ban className="h-4 w-4 text-amber-500" />
                <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                  {toolName.replace('projectpulse_', '')}
                </span>
              </div>
              <button
                onClick={() => handleRemoveTool(toolName)}
                disabled={actionLoading === toolName}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-gray-600 dark:hover:text-gray-300"
                title="Unblock tool"
              >
                {actionLoading === toolName ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
