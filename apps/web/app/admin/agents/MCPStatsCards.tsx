/**
 * MCP Stats Cards Component
 * Sprint 11.5: Display MCP/Agent statistics
 */
'use client';

import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Key, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MCPStats {
  toolCalls: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  errors: {
    last24h: number;
    errorRate24h: number;
  };
  topTools: Array<{
    name: string;
    count: number;
  }>;
  tokens: {
    active: number;
  };
  emergency: {
    enabled: boolean;
    reason: string | null;
    enabledAt: string | null;
  };
  blockedTools: string[];
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: typeof Activity;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'coral';
}

function StatCard({ title, value, icon: Icon, description, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'bg-gray-50 dark:bg-gray-800/50',
    success: 'bg-green-50 dark:bg-green-900/20',
    warning: 'bg-amber-50 dark:bg-amber-900/20',
    danger: 'bg-red-50 dark:bg-red-900/20',
    coral: 'bg-coral/5 dark:bg-coral/10',
  };

  const iconStyles = {
    default: 'text-gray-600 dark:text-gray-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-red-600 dark:text-red-400',
    coral: 'text-coral',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200/50 p-6 dark:border-gray-700/50',
        variantStyles[variant]
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            variantStyles[variant]
          )}
        >
          <Icon className={cn('h-6 w-6', iconStyles[variant])} />
        </div>
      </div>
    </div>
  );
}

export function MCPStatsCards() {
  const [stats, setStats] = useState<MCPStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/mcp/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch MCP stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
        Error loading stats: {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Determine error rate variant
  const errorRateVariant =
    stats.errors.errorRate24h > 5
      ? 'danger'
      : stats.errors.errorRate24h > 2
        ? 'warning'
        : 'success';

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Tool Calls (24h)"
        value={stats.toolCalls.last24h.toLocaleString()}
        icon={Activity}
        description={`${stats.toolCalls.last7d.toLocaleString()} last 7 days`}
        variant="coral"
      />
      <StatCard
        title="Error Rate (24h)"
        value={`${stats.errors.errorRate24h}%`}
        icon={AlertTriangle}
        description={`${stats.errors.last24h} errors`}
        variant={errorRateVariant}
      />
      <StatCard title="Active Tokens" value={stats.tokens.active} icon={Key} variant="success" />
      <StatCard
        title="Top Tool"
        value={stats.topTools[0]?.name?.replace('projectpulse_', '') || 'N/A'}
        icon={Wrench}
        description={
          stats.topTools[0] ? `${stats.topTools[0].count.toLocaleString()} calls` : undefined
        }
      />
    </div>
  );
}
