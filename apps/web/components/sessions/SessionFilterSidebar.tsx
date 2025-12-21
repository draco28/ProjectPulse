/**
 * SessionFilterSidebar Component
 *
 * Sprint 14: Filter sidebar for sessions page
 * Allows filtering by status (Active, Paused, Completed)
 */
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Play, Pause, Check, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionFilterSidebarProps {
  counts: {
    active: number;
    paused: number;
    completed: number;
  };
  projectId: number;
}

type StatusFilter = 'all' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';

const statusOptions: { value: StatusFilter; label: string; icon: typeof Play; color: string }[] = [
  { value: 'all', label: 'All Sessions', icon: Filter, color: 'text-slate' },
  { value: 'IN_PROGRESS', label: 'Active', icon: Play, color: 'text-green-400' },
  { value: 'PAUSED', label: 'Paused', icon: Pause, color: 'text-yellow-400' },
  { value: 'COMPLETED', label: 'Completed', icon: Check, color: 'text-slate' },
];

export function SessionFilterSidebar({ counts, projectId }: SessionFilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = (searchParams.get('status') as StatusFilter) || 'all';

  const getCount = (status: StatusFilter): number => {
    switch (status) {
      case 'IN_PROGRESS':
        return counts.active;
      case 'PAUSED':
        return counts.paused;
      case 'COMPLETED':
        return counts.completed;
      case 'all':
      default:
        return counts.active + counts.paused + counts.completed;
    }
  };

  const handleFilterChange = (status: StatusFilter) => {
    const params = new URLSearchParams(searchParams.toString());

    if (status === 'all') {
      params.delete('status');
    } else {
      params.set('status', status);
    }

    // Reset to page 1 when filter changes
    params.delete('page');

    // Ensure project is included
    if (projectId) {
      params.set('project', projectId.toString());
    }

    router.push(`/sessions?${params.toString()}`);
  };

  return (
    <div className="neu-raised smooth-transition w-64 shrink-0 rounded-3xl p-4">
      <h3 className="mb-4 text-sm font-semibold text-white">Filter by Status</h3>

      <div className="space-y-2">
        {statusOptions.map((option) => {
          const Icon = option.icon;
          const isActive = currentStatus === option.value;
          const count = getCount(option.value);

          return (
            <button
              key={option.value}
              onClick={() => handleFilterChange(option.value)}
              className={cn(
                'smooth-transition flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left',
                isActive
                  ? 'bg-coral/20 text-white'
                  : 'text-slate hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className={cn('h-4 w-4', option.color)} />
              <span className="flex-1 text-sm font-medium">{option.label}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  isActive ? 'bg-coral text-white' : 'bg-white/10 text-slate'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="mt-6 rounded-2xl bg-white/5 p-4">
        <p className="text-xs text-slate">
          <strong className="text-white">Tip:</strong> Copy a session ID and use{' '}
          <code className="rounded bg-white/10 px-1 py-0.5">projectpulse_agent_session_resume</code>{' '}
          to continue work in Claude Code.
        </p>
      </div>
    </div>
  );
}
