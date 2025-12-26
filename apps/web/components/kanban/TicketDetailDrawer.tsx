'use client';

/**
 * TicketDetailDrawer Component - Side panel for ticket details
 *
 * Slides in from the right to show full ticket information:
 * - Header with ID, status, priority
 * - Parent feature context (if applicable)
 * - Agent session info (if AI is working)
 * - Details grid (assignee, created, updated)
 * - Action buttons (edit, move to column, etc.)
 *
 * Features:
 * - 480px width on desktop, full width on mobile
 * - Escape key closes drawer
 * - Click outside closes drawer
 * - Body scroll lock when open
 */

import { memo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { KanbanTicket } from '@/types/kanban';
import { TicketStatusSystem, TICKET_STATUSES } from '@/lib/constants/status';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface TicketDetailDrawerProps {
  /** Ticket to display (null = closed) */
  ticket: KanbanTicket | null;
  /** Whether drawer is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Optional edit handler */
  onEdit?: (ticket: KanbanTicket) => void;
}

// ============================================================================
// Helper Components
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  // Validate status is a valid TicketStatus, fallback to backlog
  const validStatus = TicketStatusSystem.isValid(status)
    ? (status as typeof TICKET_STATUSES[keyof typeof TICKET_STATUSES])
    : TICKET_STATUSES.BACKLOG;
  const label = TicketStatusSystem.getLabel(validStatus);
  const colorClass = TicketStatusSystem.getColorClass(validStatus);

  return (
    <span className={cn('px-3 py-1 rounded-lg text-sm font-medium', colorClass)}>{label}</span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const priorityColors: Record<string, string> = {
    critical: 'bg-red-500/20 text-accent-red border border-accent-red/30',
    high: 'bg-orange-500/20 text-orange-400 border border-orange-400/30',
    medium: 'bg-yellow-500/20 text-accent-yellow border border-accent-yellow/30',
    low: 'bg-slate/20 text-slate border border-slate/30',
  };

  const colorClass = priorityColors[priority?.toLowerCase()] || priorityColors.medium;

  return <span className={cn('px-3 py-1 rounded-lg text-sm font-medium', colorClass)}>{priority}</span>;
}

function KindBadge({ kind }: { kind: string }) {
  const kindColors: Record<string, string> = {
    feature: 'bg-emerald-500/20 text-emerald-400',
    task: 'bg-slate/20 text-slate',
    bug: 'bg-red-500/20 text-accent-red',
    issue: 'bg-orange-500/20 text-orange-400',
    tech_debt: 'bg-purple-500/20 text-accent-purple',
    epic: 'bg-blue-500/20 text-accent-blue',
  };

  const colorClass = kindColors[kind?.toLowerCase()] || kindColors.task;
  const displayName = kind?.replace('_', ' ').toUpperCase() || 'TASK';

  return (
    <span className={cn('px-2 py-0.5 text-xs rounded font-bold uppercase', colorClass)}>
      {displayName}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5">
      <span className="text-slate text-sm">{label}</span>
      <span className="text-white text-sm">{value || '-'}</span>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export const TicketDetailDrawer = memo(function TicketDetailDrawer({
  ticket,
  isOpen,
  onClose,
  onEdit,
}: TicketDetailDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Click outside to close
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Don't render if not open
  if (!isOpen) return null;

  // Portal content
  const drawerContent = (
    <div
      className={cn('drawer-overlay', isOpen && 'open')}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div ref={drawerRef} className="drawer-panel">
        {ticket ? (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-dark-card border-b border-white/10 p-4 z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-mono text-slate">#{ticket.id}</span>
                  <KindBadge kind={ticket.kind} />
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/5 text-slate hover:text-white transition"
                  aria-label="Close drawer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Title */}
              <h2 id="drawer-title" className="text-xl font-semibold mb-4">
                {ticket.title}
              </h2>

              {/* Status + Priority */}
              <div className="flex items-center gap-3">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                {ticket.assigneeType === 'agent_persona' && (
                  <span className="px-2 py-1 rounded-lg text-xs font-bold bg-coral/20 text-coral flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-coral text-white text-[8px] flex items-center justify-center">
                      AI
                    </span>
                    Agent Assigned
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-6">
              {/* Parent Feature (if applicable) */}
              {ticket.parentTicket && (
                <div className="neu-inset p-4 rounded-lg">
                  <p className="text-xs text-slate uppercase tracking-wide mb-2">Parent Feature</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-slate">#{ticket.parentTicket.id}</span>
                    <span className="text-sm font-medium">{ticket.parentTicket.title}</span>
                  </div>
                  <div className="mt-2">
                    <StatusBadge status={ticket.parentTicket.status} />
                  </div>
                </div>
              )}

              {/* Child Progress (if feature with children) */}
              {ticket.childTickets && ticket.childTickets.length > 0 && (
                <div className="neu-inset p-4 rounded-lg">
                  <p className="text-xs text-slate uppercase tracking-wide mb-2">Child Tasks</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">{ticket.childTickets.length} tasks</span>
                    <span className="text-sm font-bold text-coral">
                      {ticket.childProgress ?? 0}% complete
                    </span>
                  </div>
                  <div className="w-full h-2 bg-dark rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-coral to-coral-dark rounded-full transition-all"
                      style={{ width: `${ticket.childProgress ?? 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div>
                <p className="text-xs text-slate uppercase tracking-wide mb-3">Details</p>
                <div className="neu-inset p-4 rounded-lg">
                  <DetailRow label="Assignee" value={ticket.assignee || 'Unassigned'} />
                  <DetailRow label="Sprint" value={ticket.sprintNumber ? `Sprint ${ticket.sprintNumber}` : '-'} />
                  <DetailRow label="Epic" value={ticket.epicRef} />
                  <DetailRow
                    label="Created"
                    value={new Date(ticket.createdAt).toLocaleDateString()}
                  />
                  <DetailRow
                    label="Updated"
                    value={new Date(ticket.updatedAt).toLocaleDateString()}
                  />
                </div>
              </div>

              {/* Actions */}
              <div>
                <p className="text-xs text-slate uppercase tracking-wide mb-3">Actions</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onEdit?.(ticket)}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                    Move
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    Comment
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-dark-card border-t border-white/10 p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-slate hover:text-white transition"
                >
                  Close
                </button>
                <button className="btn-coral px-6 py-2 rounded-lg font-medium">
                  View Full Details
                </button>
              </div>
            </div>
          </>
        ) : (
          // Loading state
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-2 border-coral border-t-transparent rounded-full" />
          </div>
        )}
      </div>
    </div>
  );

  // Render via portal
  if (typeof window === 'undefined') return null;
  return createPortal(drawerContent, document.body);
});

TicketDetailDrawer.displayName = 'TicketDetailDrawer';

export default TicketDetailDrawer;
