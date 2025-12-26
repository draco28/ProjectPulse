/**
 * TicketActions Component
 *
 * Client Component with interactive issue action buttons
 *
 * Architecture (per react-expert recommendation):
 * - Client Component ("use client")
 * - Uses router.refresh() after mutations (no Context needed)
 * - Optimistic updates for instant feedback
 * - Explicit props (not full issue object)
 *
 * Features:
 * - Change issue status through kanban workflow
 * - Visual feedback during API calls
 * - Error handling with toast notifications
 *
 * Sprint 15: Updated for 5-status kanban workflow
 * - backlog → in-progress (start working)
 * - todo → in-progress (start working)
 * - in-progress → done (complete)
 * - in-review → done (approve)
 * - done → backlog (reopen)
 *
 * Props:
 * - ticketId: Ticket identifier
 * - currentStatus: Current ticket status
 *
 * Reference: mockups/Default theme/03-issue-detail-dark-neumorphic-coral.html
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCw, Play, Check, MoreVertical, Eye } from 'lucide-react';
import { TICKET_STATUSES, type TicketStatus } from '@/lib/constants/status';

// ============================================================================
// TYPES
// ============================================================================

interface TicketActionsProps {
  ticketId: string;
  currentStatus: TicketStatus;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get next logical status based on current status
 * Sprint 15: Updated for 5-status kanban workflow
 */
function getNextStatus(current: TicketStatus): TicketStatus {
  const transitions: Record<TicketStatus, TicketStatus> = {
    [TICKET_STATUSES.BACKLOG]: TICKET_STATUSES.IN_PROGRESS,
    [TICKET_STATUSES.TODO]: TICKET_STATUSES.IN_PROGRESS,
    [TICKET_STATUSES.IN_PROGRESS]: TICKET_STATUSES.DONE,
    [TICKET_STATUSES.IN_REVIEW]: TICKET_STATUSES.DONE,
    [TICKET_STATUSES.DONE]: TICKET_STATUSES.BACKLOG,
  };
  return transitions[current] || TICKET_STATUSES.BACKLOG;
}

/**
 * Get button text for status transition
 * Sprint 15: Updated labels for 5-status workflow
 */
function getStatusButtonText(current: TicketStatus): string {
  const nextStatus = getNextStatus(current);
  const labels: Record<TicketStatus, string> = {
    [TICKET_STATUSES.BACKLOG]: 'Reopen',
    [TICKET_STATUSES.TODO]: 'Move to Todo',
    [TICKET_STATUSES.IN_PROGRESS]: 'Start Progress',
    [TICKET_STATUSES.IN_REVIEW]: 'Start Review',
    [TICKET_STATUSES.DONE]: 'Complete',
  };
  return labels[nextStatus] || 'Update Status';
}

/**
 * Get button icon component for status transition
 * Sprint 15: Updated icons for 5-status workflow
 */
function getStatusButtonIcon(nextStatus: TicketStatus) {
  const icons = {
    [TICKET_STATUSES.BACKLOG]: RotateCw,
    [TICKET_STATUSES.TODO]: RotateCw,
    [TICKET_STATUSES.IN_PROGRESS]: Play,
    [TICKET_STATUSES.IN_REVIEW]: Eye,
    [TICKET_STATUSES.DONE]: Check,
  };
  return icons[nextStatus] || RotateCw;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TicketActions({ ticketId, currentStatus }: TicketActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState(currentStatus);

  /**
   * Handle status change
   * Uses optimistic update + router.refresh() pattern
   */
  async function handleStatusChange() {
    const nextStatus = getNextStatus(optimisticStatus);

    // Optimistic update (instant UI feedback)
    setOptimisticStatus(nextStatus);
    setIsUpdating(true);

    try {
      // Call API endpoint (from Day 4)
      const response = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }

      // Refresh Server Components to get latest data
      router.refresh();
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticStatus(currentStatus);
      console.error('Failed to update issue status:', error);

      // TODO: Show toast notification
      alert(error instanceof Error ? error.message : 'Failed to update issue status');
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Status Change Button */}
      <button
        onClick={handleStatusChange}
        disabled={isUpdating}
        className="coral-gradient smooth-transition flex items-center gap-2 rounded-2xl px-4 py-2 text-sm text-white shadow-lg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`${getStatusButtonText(optimisticStatus)} issue`}
      >
        {(() => {
          const IconComponent = getStatusButtonIcon(getNextStatus(optimisticStatus));
          return (
            <IconComponent
              className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
          );
        })()}
        {isUpdating ? 'Updating...' : getStatusButtonText(optimisticStatus)}
      </button>

      {/* More Actions Menu Button */}
      <button
        className="neu-raised smooth-transition flex h-10 w-10 items-center justify-center rounded-2xl text-slate hover:text-white"
        aria-label="More options"
        disabled={isUpdating}
      >
        <MoreVertical className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
