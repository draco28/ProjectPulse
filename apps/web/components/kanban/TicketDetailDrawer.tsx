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
import type { TicketSessionContext } from '@/types/sessions';
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
  /** Optional session context when ticket is being worked on in a session */
  sessionContext?: TicketSessionContext;
  /** Handler to view the session */
  onViewSession?: (sessionId: string) => void;
}

// ============================================================================
// Helper Components
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  // Validate status is a valid TicketStatus, fallback to backlog
  const validStatus = TicketStatusSystem.isValid(status)
    ? (status as (typeof TICKET_STATUSES)[keyof typeof TICKET_STATUSES])
    : TICKET_STATUSES.BACKLOG;
  const label = TicketStatusSystem.getLabel(validStatus);
  const colorClass = TicketStatusSystem.getColorClass(validStatus);

  return (
    <span className={cn('rounded-lg px-3 py-1 text-sm font-medium', colorClass)}>{label}</span>
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

  return (
    <span className={cn('rounded-lg px-3 py-1 text-sm font-medium', colorClass)}>{priority}</span>
  );
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
    <span className={cn('rounded px-2 py-0.5 text-xs font-bold uppercase', colorClass)}>
      {displayName}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-2">
      <span className="text-sm text-slate">{label}</span>
      <span className="text-sm text-white">{value || '-'}</span>
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
  sessionContext,
  onViewSession,
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
            <div className="sticky top-0 z-10 border-b border-white/10 bg-dark-card p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg text-slate">#{ticket.ticketNumber}</span>
                  <KindBadge kind={ticket.kind} />
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-slate transition hover:bg-white/5 hover:text-white"
                  aria-label="Close drawer"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <h2 id="drawer-title" className="mb-4 text-xl font-semibold">
                {ticket.title}
              </h2>

              {/* Status + Priority */}
              <div className="flex items-center gap-3">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                {ticket.assigneeType === 'agent_persona' && (
                  <span className="flex items-center gap-1 rounded-lg bg-coral/20 px-2 py-1 text-xs font-bold text-coral">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-coral text-[8px] text-white">
                      AI
                    </span>
                    Agent Assigned
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="space-y-6 p-4">
              {/* Session Context (if ticket is being worked on) */}
              {sessionContext && (
                <div className="neu-raised rounded-lg border border-coral/20 bg-coral/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Agent Avatar */}
                      <div className="relative">
                        <div className="pulse-ring flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-coral to-coral-dark text-sm font-bold text-white">
                          AI
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{sessionContext.agentName}</p>
                        <p className="text-xs text-coral">
                          Working for {sessionContext.workingDuration}
                        </p>
                      </div>
                    </div>
                    {onViewSession && (
                      <button
                        onClick={() => onViewSession(sessionContext.sessionId)}
                        className="text-sm text-coral transition hover:text-coral-light"
                      >
                        View Session →
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate">Session: {sessionContext.sessionName}</p>
                </div>
              )}

              {/* Parent Feature (if applicable) */}
              {ticket.parentTicket && (
                <div className="neu-inset rounded-lg p-4">
                  <p className="mb-2 text-xs uppercase tracking-wide text-slate">Parent Feature</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-slate">#{ticket.parentTicket.id}</span>
                    <span className="text-sm font-medium">{ticket.parentTicket.title}</span>
                  </div>
                  <div className="mt-2">
                    <StatusBadge status={ticket.parentTicket.status} />
                  </div>
                </div>
              )}

              {/* Child Progress (if feature with children) */}
              {ticket.childTickets && ticket.childTickets.length > 0 && (
                <div className="neu-inset rounded-lg p-4">
                  <p className="mb-2 text-xs uppercase tracking-wide text-slate">Child Tasks</p>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm">{ticket.childTickets.length} tasks</span>
                    <span className="text-sm font-bold text-coral">
                      {ticket.childProgress ?? 0}% complete
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-dark">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-coral to-coral-dark transition-all"
                      style={{ width: `${ticket.childProgress ?? 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div>
                <p className="mb-3 text-xs uppercase tracking-wide text-slate">Details</p>
                <div className="neu-inset rounded-lg p-4">
                  <DetailRow label="Assignee" value={ticket.assignee || 'Unassigned'} />
                  <DetailRow
                    label="Sprint"
                    value={ticket.sprintNumber ? `Sprint ${ticket.sprintNumber}` : '-'}
                  />
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
                <p className="mb-3 text-xs uppercase tracking-wide text-slate">Actions</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onEdit?.(ticket)}
                    className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </button>
                  <button className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                    Move
                  </button>
                  <button className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="sticky bottom-0 border-t border-white/10 bg-dark-card p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-slate transition hover:text-white"
                >
                  Close
                </button>
                <button className="btn-coral rounded-lg px-6 py-2 font-medium">
                  View Full Details
                </button>
              </div>
            </div>
          </>
        ) : (
          // Loading state
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-coral border-t-transparent" />
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
