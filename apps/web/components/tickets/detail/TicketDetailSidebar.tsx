/**
 * Issue Detail Sidebar Component
 *
 * Right sidebar displaying quick actions, ticket details, watchers, and related issues
 * Reference: mockups/Default theme/03-issue-detail-dark-neumorphic-coral.html (lines 632-746)
 *
 * Sprint 11.7: Added milestone and dueDate support with overdue indicator
 * Sprint 11.7: Added LabelPicker for interactive label management
 */

'use client';

import { useState } from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';
import { LabelPicker } from '@/components/tickets/LabelPicker';
import type { LabelProps, MilestoneProps } from '@/types/issue';

interface TicketDetailSidebarProps {
  ticketId: string;
  projectId: string;
  assignee: string | null;
  labels: LabelProps[];
  priority: string;
  module: string | null;
  status: string;
  // Sprint 11.7: Milestone and Due Date
  dueDate: string | null;
  milestone: MilestoneProps | null;
}

export function TicketDetailSidebar({
  ticketId,
  projectId,
  assignee,
  labels: initialLabels,
  priority,
  module,
  status,
  dueDate,
  milestone,
}: TicketDetailSidebarProps) {
  // Sprint 11.7: Local state for labels (updated by LabelPicker)
  const [labels, setLabels] = useState(initialLabels);

  // Sprint 11.7: Handler to convert LabelPicker output to LabelProps format
  const handleLabelsChange = (newLabels: Array<{ id: string | number; name: string; color: string }>) => {
    setLabels(newLabels.map((l) => ({ ...l, id: String(l.id) })));
  };

  // Sprint 11.7: Check if ticket is overdue
  const isOverdue = dueDate && status !== 'closed' && new Date(dueDate) < new Date();

  // Format due date for display
  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="w-80 space-y-4 overflow-auto">
      {/* Quick Actions section removed - now handled by QuickActions component in left sidebar */}

      {/* Issue Details */}
      <div className="neu-raised smooth-transition rounded-3xl p-6">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Details</h3>
        <div className="space-y-4">
          {/* Assignee */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-slate">
              Assignee
            </label>
            <div className="flex items-center gap-2">
              <div className="icon-coral h-8 w-8 flex-shrink-0 rounded-xl"></div>
              <span className="text-sm font-medium text-white">{assignee || 'Unassigned'}</span>
            </div>
          </div>

          {/* Labels - Interactive LabelPicker (Sprint 11.7) */}
          <LabelPicker
            ticketId={ticketId}
            projectId={projectId}
            currentLabels={labels}
            onLabelsChange={handleLabelsChange}
          />

          {/* Priority */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-slate">
              Priority
            </label>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${getPriorityColor(priority)}`}></span>
              <span className="text-sm text-white">
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </span>
            </div>
          </div>

          {/* Module */}
          {module && (
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-slate">
                Module
              </label>
              <span className="text-sm text-white">{module}</span>
            </div>
          )}

          {/* Milestone (Sprint 11.7) */}
          <div data-testid="sidebar-milestone">
            <label className="mb-2 block text-xs uppercase tracking-wider text-slate">
              Milestone
            </label>
            {milestone ? (
              <span className="text-sm text-white">{milestone.name}</span>
            ) : (
              <span className="text-sm text-slate italic">No milestone</span>
            )}
          </div>

          {/* Due Date (Sprint 11.7) */}
          <div data-testid="sidebar-due-date">
            <label className="mb-2 block text-xs uppercase tracking-wider text-slate">
              Due Date
            </label>
            {dueDate ? (
              <div className="flex items-center gap-2">
                {isOverdue ? (
                  <AlertTriangle className="h-4 w-4 text-red-400" aria-label="Overdue" />
                ) : (
                  <Calendar className="h-4 w-4 text-coral" aria-hidden="true" />
                )}
                <span className={`text-sm ${isOverdue ? 'font-semibold text-red-400' : 'text-white'}`}>
                  {formatDueDate(dueDate)}
                  {isOverdue && <span className="ml-2 text-xs">(Overdue)</span>}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate" aria-hidden="true" />
                <span className="text-sm text-slate italic">No due date</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Watchers and Related Issues removed - now handled by standalone
          WatchersSection and RelatedTickets components in the page layout */}
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get priority color dot class
 */
function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500',
  };
  return (colors[priority] || colors.medium) as string;
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(
    () => {
      // TODO: Show success toast
      console.log('Copied to clipboard:', text);
    },
    (err) => {
      console.error('Failed to copy:', err);
    }
  );
}
