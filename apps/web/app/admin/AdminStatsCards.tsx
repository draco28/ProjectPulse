/**
 * Admin Stats Cards Component
 * Sprint 11.5: Display system statistics
 */
'use client';

import { useEffect, useState } from 'react';
import { Users, FolderKanban, Ticket, Key, UserCheck, Shield, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Stats {
  users: {
    total: number;
    active: number;
    admins: number;
    recentSignups: number;
  };
  projects: {
    total: number;
  };
  tickets: {
    total: number;
  };
  tokens: {
    total: number;
    active: number;
  };
}

interface StatCardProps {
  title: string;
  value: number;
  icon: typeof Users;
  description?: string;
  trend?: number;
  variant?: 'default' | 'success' | 'warning' | 'coral';
}

function StatCard({ title, value, icon: Icon, description, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'bg-gray-50 dark:bg-gray-800/50',
    success: 'bg-green-50 dark:bg-green-900/20',
    warning: 'bg-amber-50 dark:bg-amber-900/20',
    coral: 'bg-coral/5 dark:bg-coral/10',
  };

  const iconStyles = {
    default: 'text-gray-600 dark:text-gray-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400',
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

export function AdminStatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
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
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
          />
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

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Users"
        value={stats.users.total}
        icon={Users}
        description={`${stats.users.active} active`}
      />
      <StatCard
        title="Admins"
        value={stats.users.admins}
        icon={Shield}
        variant="coral"
      />
      <StatCard
        title="Projects"
        value={stats.projects.total}
        icon={FolderKanban}
      />
      <StatCard
        title="Tickets"
        value={stats.tickets.total}
        icon={Ticket}
      />
      <StatCard
        title="Active Users"
        value={stats.users.active}
        icon={UserCheck}
        variant="success"
      />
      <StatCard
        title="Recent Signups"
        value={stats.users.recentSignups}
        icon={TrendingUp}
        description="Last 7 days"
        variant="success"
      />
      <StatCard
        title="Total Tokens"
        value={stats.tokens.total}
        icon={Key}
      />
      <StatCard
        title="Active Tokens"
        value={stats.tokens.active}
        icon={Key}
        variant="success"
      />
    </div>
  );
}
