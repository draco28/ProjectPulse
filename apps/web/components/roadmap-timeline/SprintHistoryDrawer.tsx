'use client';

/**
 * SprintHistoryDrawer - Side panel for completed sprint details
 *
 * Sprint 15 Phase E: Part of the new Phase Timeline view.
 * Portal-based drawer that slides in from the right when a user
 * clicks on a completed sprint card. Shows summary stats, completed
 * features, and navigation to full kanban view.
 *
 * @see mockups/alternatives/COMBINED-01-phase-timeline.html
 */

import { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, ArrowRight, Calendar, TrendingUp, Play, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { SprintHistoryDrawerProps } from '@/types/phase-timeline';
import { cn } from '@/lib/utils';
import { useProject } from '@/lib/project';

/**
 * Format date range for display.
 */
function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return '';

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const start = formatDate(startDate);
  const end = endDate ? formatDate(endDate) : 'Ongoing';

  return `${start} - ${end}`;
}

/**
 * Stat card for drawer metrics.
 */
function StatCard({
  label,
  value,
  colorClass = 'text-slate-light',
}: {
  label: string;
  value: string | number;
  colorClass?: string;
}) {
  return (
    <div className="rounded-lg bg-dark-pressed p-3 text-center">
      <div className={cn('text-2xl font-bold', colorClass)}>{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-slate">{label}</div>
    </div>
  );
}

/**
 * Main drawer component - renders via portal.
 */
function DrawerContent({
  projectId: _projectId,
  sprint,
  variant,
  onClose,
  onSprintSetCurrent,
}: {
  projectId: number;
  sprint: NonNullable<SprintHistoryDrawerProps['sprint']>;
  variant: 'completed' | 'planned';
  onClose: () => void;
  onSprintSetCurrent?: () => void;
}) {
  const router = useRouter();
  const { navigateTo } = useProject();
  const [isSettingCurrent, setIsSettingCurrent] = useState(false);
  const isCompleted = variant === 'completed';
  const isPlanned = variant === 'planned';

  // Handler for Set as Current button
  const handleSetCurrent = async () => {
    setIsSettingCurrent(true);
    try {
      const response = await fetch(`/api/sprints/${sprint.id}/set-current`, {
        method: 'POST',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to set current sprint');
      }
      // Success - close drawer and refresh
      onClose();
      onSprintSetCurrent?.();
      router.refresh();
    } catch (error) {
      console.error('Failed to set current sprint:', error);
      alert(error instanceof Error ? error.message : 'Failed to set current sprint');
    } finally {
      setIsSettingCurrent(false);
    }
  };

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when drawer is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const { ticketCounts } = sprint;
  const completionRate =
    ticketCounts.total > 0 ? Math.round((ticketCounts.done / ticketCounts.total) * 100) : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full max-w-md',
          'bg-gradient-to-br from-dark-card to-dark-lighter',
          'border-l border-white/10',
          'shadow-2xl',
          'transform transition-transform duration-300 ease-out',
          'animate-slide-in-right'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div
              className={cn('h-3 w-3 rounded-full', isCompleted ? 'bg-accent-green' : 'bg-slate')}
            />
            <h2 className="text-xl font-bold">Sprint {sprint.globalSprintNumber}</h2>
            <span
              className={cn(
                'rounded px-2 py-0.5 text-xs font-medium',
                isCompleted ? 'bg-accent-green/15 text-accent-green' : 'bg-slate/15 text-slate'
              )}
            >
              {isCompleted ? 'Complete' : 'Not Started'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-dark-pressed"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5 text-slate" />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-80px)] overflow-y-auto p-5">
          {/* Date range */}
          <div className="mb-6 flex items-center gap-2 text-sm text-slate">
            <Calendar className="h-4 w-4" />
            <span suppressHydrationWarning>
              {formatDateRange(sprint.startDate, sprint.endDate)}
            </span>
          </div>

          {/* Stats grid */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            <StatCard label="Completed" value={ticketCounts.done} colorClass="text-accent-green" />
            <StatCard label="Total" value={ticketCounts.total} colorClass="text-slate-light" />
            <StatCard label="Rate" value={`${completionRate}%`} colorClass="text-coral" />
          </div>

          {/* Completion indicator */}
          <div className="neu-card mb-6 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-light">
                {isCompleted ? 'Sprint Completion' : 'Sprint Progress'}
              </span>
              <span
                className={cn(
                  'text-sm font-bold',
                  isCompleted ? 'text-accent-green' : 'text-slate'
                )}
              >
                {isCompleted ? `${completionRate}%` : '0%'}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-dark-pressed">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isCompleted ? 'bg-accent-green' : 'bg-slate/30'
                )}
                style={{ width: isCompleted ? `${completionRate}%` : '0%' }}
              />
            </div>
          </div>

          {/* Ticket breakdown */}
          <div className="mb-6 space-y-3">
            <h3 className="text-sm font-medium text-slate-light">Ticket Breakdown</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between rounded-lg bg-dark-pressed p-3">
                <span className="text-xs text-slate">Done</span>
                <span className="text-sm font-bold text-accent-green">{ticketCounts.done}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-dark-pressed p-3">
                <span className="text-xs text-slate">In Progress</span>
                <span className="text-sm font-bold text-accent-yellow">
                  {ticketCounts.inProgress}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-dark-pressed p-3">
                <span className="text-xs text-slate">In Review</span>
                <span className="text-sm font-bold text-accent-purple">
                  {ticketCounts.inReview}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-dark-pressed p-3">
                <span className="text-xs text-slate">Backlog</span>
                <span className="text-sm font-bold text-slate">{ticketCounts.backlog}</span>
              </div>
            </div>
          </div>

          {/* Success indicator - only for completed sprints with >= 80% completion */}
          {isCompleted && completionRate >= 80 && (
            <div className="mb-6 flex items-center gap-3 rounded-lg bg-accent-green/10 p-4">
              <CheckCircle2 className="h-6 w-6 text-accent-green" />
              <div>
                <div className="text-sm font-medium text-accent-green">Sprint Successful!</div>
                <div className="text-xs text-slate">{completionRate}% completion rate achieved</div>
              </div>
            </div>
          )}

          {/* Velocity indicator */}
          <div className="flex items-center gap-3 rounded-lg bg-dark-pressed p-4">
            <TrendingUp className={cn('h-5 w-5', isCompleted ? 'text-coral' : 'text-slate')} />
            <div>
              <div className="text-sm font-medium text-slate-light">
                {isCompleted
                  ? `${ticketCounts.done} tickets delivered`
                  : `${ticketCounts.total} tickets planned`}
              </div>
              <div className="text-xs text-slate">
                {isCompleted ? 'Sprint velocity contribution' : 'Sprint scope'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-dark-card p-5">
          <div className="flex gap-3">
            {/* View Full Board */}
            <button
              onClick={() => navigateTo(`/roadmap/sprint/${sprint.globalSprintNumber}`)}
              className={cn(
                'flex-1 rounded-lg px-4 py-3',
                'flex items-center justify-center gap-2',
                'transition-colors',
                isPlanned
                  ? 'bg-dark-pressed text-slate-light hover:bg-dark-lighter'
                  : 'bg-coral font-medium text-white hover:bg-coral/90'
              )}
            >
              View Full Board
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Set as Current - Only for planned sprints */}
            {isPlanned && (
              <button
                onClick={handleSetCurrent}
                disabled={isSettingCurrent}
                className={cn(
                  'flex-1 rounded-lg px-4 py-3',
                  'bg-coral hover:bg-coral/90',
                  'font-medium text-white',
                  'flex items-center justify-center gap-2',
                  'transition-colors',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                {isSettingCurrent ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Setting...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Set as Current
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * SprintHistoryDrawer - Portal wrapper.
 * Supports both 'completed' and 'planned' sprint variants.
 */
export function SprintHistoryDrawer({
  projectId,
  sprint,
  variant,
  isOpen,
  onClose,
  onSprintSetCurrent,
}: SprintHistoryDrawerProps) {
  // Don't render if not open or no sprint
  if (!isOpen || !sprint) {
    return null;
  }

  // Client-side only portal
  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(
    <DrawerContent
      projectId={projectId}
      sprint={sprint}
      variant={variant}
      onClose={onClose}
      onSprintSetCurrent={onSprintSetCurrent}
    />,
    document.body
  );
}
