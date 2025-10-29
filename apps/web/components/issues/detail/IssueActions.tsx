/**
 * IssueActions Component
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
 * - Change issue status (Open → In Progress → Closed)
 * - Visual feedback during API calls
 * - Error handling with toast notifications
 *
 * Props:
 * - issueId: Issue identifier
 * - currentStatus: Current issue status
 *
 * Reference: mockups/Default theme/03-issue-detail-dark-neumorphic-coral.html
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ============================================================================
// TYPES
// ============================================================================

interface IssueActionsProps {
  issueId: string;
  currentStatus: 'open' | 'in_progress' | 'closed';
}

type StatusOption = 'open' | 'in_progress' | 'closed';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get next logical status based on current status
 */
function getNextStatus(current: StatusOption): StatusOption {
  const transitions: Record<StatusOption, StatusOption> = {
    open: 'in_progress',
    in_progress: 'closed',
    closed: 'open',
  };
  return transitions[current];
}

/**
 * Get button text for status transition
 */
function getStatusButtonText(current: StatusOption): string {
  const nextStatus = getNextStatus(current);
  const labels: Record<StatusOption, string> = {
    open: 'Reopen',
    in_progress: 'Start Progress',
    closed: 'Close',
  };
  return labels[nextStatus];
}

/**
 * Get button icon for status transition
 */
function getStatusButtonIcon(current: StatusOption): string {
  const nextStatus = getNextStatus(current);
  const icons: Record<StatusOption, string> = {
    open: 'fa-redo',
    in_progress: 'fa-play',
    closed: 'fa-check',
  };
  return icons[nextStatus];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function IssueActions({ issueId, currentStatus }: IssueActionsProps) {
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
      const response = await fetch(`/api/issues/${issueId}/status`, {
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
        className="coral-gradient smooth-transition rounded-2xl px-4 py-2 text-sm text-white shadow-lg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`${getStatusButtonText(optimisticStatus)} issue`}
      >
        <i
          className={`fas ${getStatusButtonIcon(optimisticStatus)} mr-2 ${isUpdating ? 'fa-spin' : ''}`}
          aria-hidden="true"
        ></i>
        {isUpdating ? 'Updating...' : getStatusButtonText(optimisticStatus)}
      </button>

      {/* More Actions Menu Button */}
      <button
        className="neu-raised smooth-transition flex h-10 w-10 items-center justify-center rounded-2xl text-slate hover:text-white"
        aria-label="More options"
        disabled={isUpdating}
      >
        <i className="fas fa-ellipsis-v" aria-hidden="true"></i>
      </button>
    </div>
  );
}
