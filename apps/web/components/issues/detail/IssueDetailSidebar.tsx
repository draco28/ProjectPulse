/**
 * Issue Detail Sidebar Component
 *
 * Right sidebar displaying quick actions, issue details, watchers, and related issues
 * Reference: mockups/Default theme/03-issue-detail-dark-neumorphic-coral.html (lines 632-746)
 */

'use client';

import type { LabelProps } from '@/types/issue';

interface IssueDetailSidebarProps {
  issueId: string;
  assignee: string | null;
  labels: LabelProps[];
  priority: string;
  module: string | null;
  status: string;
}

export function IssueDetailSidebar({
  issueId: _issueId,
  assignee,
  labels,
  priority,
  module,
  status: _status,
}: IssueDetailSidebarProps) {
  return (
    <div className="w-80 space-y-4 overflow-auto">
      {/* Quick Actions */}
      <div className="neu-raised smooth-transition rounded-3xl p-6">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
          Quick Actions
        </h3>
        <div className="space-y-2">
          <button className="neu-raised smooth-transition flex w-full items-center gap-2 rounded-2xl px-4 py-2 text-sm text-white hover:text-white">
            <i className="fas fa-eye w-5"></i>
            <span>Watch Issue</span>
          </button>
          <button
            className="neu-raised smooth-transition flex w-full items-center gap-2 rounded-2xl px-4 py-2 text-sm text-white hover:text-white"
            onClick={() => copyToClipboard(window.location.href)}
          >
            <i className="fas fa-link w-5"></i>
            <span>Copy Link</span>
          </button>
          <button className="neu-raised smooth-transition flex w-full items-center gap-2 rounded-2xl px-4 py-2 text-sm text-white hover:text-white">
            <i className="fas fa-code-branch w-5"></i>
            <span>Create Branch</span>
          </button>
        </div>
      </div>

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

          {/* Labels */}
          {labels.length > 0 && (
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-slate">
                Labels
              </label>
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <span
                    key={label.id}
                    className="neu-pressed rounded-full px-3 py-1 text-xs font-semibold text-slate"
                    style={{ borderLeft: `3px solid ${label.color}` }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            </div>
          )}

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

          {/* Milestone (Placeholder) */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-slate">
              Milestone
            </label>
            <span className="text-sm text-white">v1.2.0 - Feature Implementation</span>
          </div>

          {/* Due Date (Placeholder) */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-slate">
              Due Date
            </label>
            <div className="flex items-center gap-2">
              <i className="fas fa-calendar text-coral"></i>
              <span className="text-sm text-white">Nov 15, 2024</span>
            </div>
          </div>
        </div>
      </div>

      {/* Watchers */}
      <div className="neu-raised smooth-transition rounded-3xl p-6">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
          Watchers <span className="font-normal text-slate">(4)</span>
        </h3>
        <div className="flex -space-x-2">
          <div className="icon-coral h-10 w-10 rounded-xl border-2 border-[#2A2A2A]"></div>
          <div className="icon-slate h-10 w-10 rounded-xl border-2 border-[#2A2A2A]"></div>
          <div className="icon-coral h-10 w-10 rounded-xl border-2 border-[#2A2A2A]"></div>
          <div className="icon-slate flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#2A2A2A]">
            <span className="text-xs font-bold text-slate">+1</span>
          </div>
        </div>
      </div>

      {/* Related Issues (Placeholder) */}
      <div className="neu-raised smooth-transition rounded-3xl p-6">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
          Related Issues
        </h3>
        <div className="space-y-3">
          <a
            href="#"
            className="neu-pressed smooth-transition block rounded-2xl p-3 hover:bg-coral/5"
          >
            <div className="flex items-start gap-2">
              <i className="fas fa-link mt-0.5 text-sm text-coral"></i>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">#38 Animation sync issues</p>
                <p className="text-xs text-slate">Related to combat</p>
              </div>
            </div>
          </a>
          <a
            href="#"
            className="neu-pressed smooth-transition block rounded-2xl p-3 hover:bg-coral/5"
          >
            <div className="flex items-start gap-2">
              <i className="fas fa-code-branch mt-0.5 text-sm text-green-400"></i>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">#127 Fix FSM replication</p>
                <p className="text-xs text-slate">Pull Request</p>
              </div>
            </div>
          </a>
        </div>
      </div>
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
