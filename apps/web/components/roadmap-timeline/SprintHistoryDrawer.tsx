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

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, ArrowRight, Calendar, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { SprintHistoryDrawerProps } from '@/types/phase-timeline';
import { cn } from '@/lib/utils';

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
    <div className="bg-dark-pressed rounded-lg p-3 text-center">
      <div className={cn('text-2xl font-bold', colorClass)}>{value}</div>
      <div className="text-xs text-slate uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}

/**
 * Main drawer component - renders via portal.
 */
function DrawerContent({
  projectId,
  sprint,
  onClose,
}: {
  projectId: number;
  sprint: NonNullable<SprintHistoryDrawerProps['sprint']>;
  onClose: () => void;
}) {
  const router = useRouter();

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
  const completionRate = ticketCounts.total > 0
    ? Math.round((ticketCounts.done / ticketCounts.total) * 100)
    : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-md z-50',
          'bg-gradient-to-br from-dark-card to-dark-lighter',
          'border-l border-white/10',
          'shadow-2xl',
          'transform transition-transform duration-300 ease-out',
          'animate-slide-in-right'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-accent-green" />
            <h2 className="text-xl font-bold">Sprint {sprint.sprintNumber}</h2>
            <span className="text-xs px-2 py-0.5 rounded font-medium bg-accent-green/15 text-accent-green">
              Complete
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-pressed rounded-lg transition"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5 text-slate" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto h-[calc(100%-80px)]">
          {/* Date range */}
          <div className="flex items-center gap-2 text-sm text-slate mb-6">
            <Calendar className="w-4 h-4" />
            <span suppressHydrationWarning>
              {formatDateRange(sprint.startDate, sprint.endDate)}
            </span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard
              label="Completed"
              value={ticketCounts.done}
              colorClass="text-accent-green"
            />
            <StatCard
              label="Total"
              value={ticketCounts.total}
              colorClass="text-slate-light"
            />
            <StatCard
              label="Rate"
              value={`${completionRate}%`}
              colorClass="text-coral"
            />
          </div>

          {/* Completion indicator */}
          <div className="neu-card p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-light font-medium">
                Sprint Completion
              </span>
              <span className="text-sm font-bold text-accent-green">
                {completionRate}%
              </span>
            </div>
            <div className="h-2 bg-dark-pressed rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-green rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Ticket breakdown */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-medium text-slate-light">
              Ticket Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-3 bg-dark-pressed rounded-lg">
                <span className="text-xs text-slate">Done</span>
                <span className="text-sm font-bold text-accent-green">
                  {ticketCounts.done}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-pressed rounded-lg">
                <span className="text-xs text-slate">In Progress</span>
                <span className="text-sm font-bold text-accent-yellow">
                  {ticketCounts.inProgress}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-pressed rounded-lg">
                <span className="text-xs text-slate">In Review</span>
                <span className="text-sm font-bold text-accent-purple">
                  {ticketCounts.inReview}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-pressed rounded-lg">
                <span className="text-xs text-slate">Backlog</span>
                <span className="text-sm font-bold text-slate">
                  {ticketCounts.backlog}
                </span>
              </div>
            </div>
          </div>

          {/* Success indicator */}
          {completionRate >= 80 && (
            <div className="flex items-center gap-3 p-4 bg-accent-green/10 rounded-lg mb-6">
              <CheckCircle2 className="w-6 h-6 text-accent-green" />
              <div>
                <div className="text-sm font-medium text-accent-green">
                  Sprint Successful!
                </div>
                <div className="text-xs text-slate">
                  {completionRate}% completion rate achieved
                </div>
              </div>
            </div>
          )}

          {/* Velocity indicator */}
          <div className="flex items-center gap-3 p-4 bg-dark-pressed rounded-lg">
            <TrendingUp className="w-5 h-5 text-coral" />
            <div>
              <div className="text-sm font-medium text-slate-light">
                {ticketCounts.done} tickets delivered
              </div>
              <div className="text-xs text-slate">
                Sprint velocity contribution
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-white/10 bg-dark-card">
          <button
            onClick={() => router.push(`/roadmap/sprint/${sprint.sprintNumber}?project=${projectId}`)}
            className={cn(
              'w-full py-3 px-4 rounded-lg',
              'bg-coral hover:bg-coral/90',
              'text-white font-medium',
              'flex items-center justify-center gap-2',
              'transition-colors'
            )}
          >
            View Full Board
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * SprintHistoryDrawer - Portal wrapper.
 */
export function SprintHistoryDrawer({
  projectId,
  sprint,
  isOpen,
  onClose,
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
    <DrawerContent projectId={projectId} sprint={sprint} onClose={onClose} />,
    document.body
  );
}
