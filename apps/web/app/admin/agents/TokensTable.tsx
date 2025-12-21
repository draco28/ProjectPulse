/**
 * Admin Tokens Table Component
 * Sprint 11.5: Token management table with pagination and revoke actions
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Key,
  ShieldOff,
  Loader2,
  Clock,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Token {
  id: number;
  name: string;
  projectId: number;
  projectName: string;
  isRevoked: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  toolCallCount: number;
  blockedTools: string[];
  allowedTools: string[];
}

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export function TokensTable() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', '20');
      params.set('status', statusFilter);
      if (search) params.set('search', search);

      const response = await fetch(`/api/admin/tokens?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tokens');

      const data = await response.json();
      setTokens(data.tokens);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleRevoke = async (tokenId: number, tokenName: string) => {
    const reason = prompt(`Revoke token "${tokenName}"?\n\nProvide a reason (optional):`);
    if (reason === null) return; // User cancelled

    setActionLoading(tokenId);
    try {
      const response = await fetch(`/api/admin/tokens/${tokenId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isRevoked: true,
          reason: reason || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to revoke token');
      }

      await fetchTokens();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to revoke token');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatRelativeDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return formatDate(dateString);
  };

  const getStatusBadge = (token: Token) => {
    if (token.isRevoked) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <ShieldOff className="h-3 w-3" />
          Revoked
        </span>
      );
    }
    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="h-3 w-3" />
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <Key className="h-3 w-3" />
        Active
      </span>
    );
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tokens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral dark:border-gray-700 dark:bg-gray-800"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/50 bg-white dark:border-gray-700/50 dark:bg-gray-800/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Token
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Last Used
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    </td>
                  </tr>
                ))
              ) : tokens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Key className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No tokens found</p>
                  </td>
                </tr>
              ) : (
                tokens.map((token) => (
                  <tr key={token.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                          <Key className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {token.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {token.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {token.projectName}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(token)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Activity className="h-4 w-4" />
                        {token.toolCallCount.toLocaleString()} calls
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatRelativeDate(token.lastUsedAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!token.isRevoked && (
                        <button
                          onClick={() => handleRevoke(token.id, token.name)}
                          disabled={actionLoading === token.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                        >
                          {actionLoading === token.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ShieldOff className="h-4 w-4" />
                          )}
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of{' '}
              {pagination.totalCount} tokens
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="rounded-lg p-2 hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
                className="rounded-lg p-2 hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
