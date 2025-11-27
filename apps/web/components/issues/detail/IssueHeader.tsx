/**
 * IssueHeader Component
 *
 * Server Component that displays issue metadata and action buttons
 *
 * Architecture (per react-expert recommendation):
 * - Server Component (static rendering, no interactivity here)
 * - Receives explicit props (not full issue object)
 * - Badge styling uses helper functions for consistency
 *
 * Props:
 * - id: Issue ID number
 * - title: Issue title
 * - status: open | in-progress | closed
 * - priority: critical | high | medium | low
 * - module: Combat | Animation | etc (optional)
 * - projectName: Associated project name
 * - assignee: Assigned user (optional)
 * - createdAt: ISO 8601 date string
 * - updatedAt: ISO 8601 date string
 *
 * Reference: mockups/Default theme/03-issue-detail-dark-neumorphic-coral.html
 */

import Link from 'next/link';
import { format } from 'date-fns';
import {
  ChevronRight,
  X,
  User,
  Clock,
  FileEdit,
  PencilLine,
  Check,
  MoreVertical,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface IssueHeaderProps {
  id: number;
  title: string;
  status: 'open' | 'in-progress' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  module: string | null;
  projectName: string;
  assignee: string | null;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
  projectId: number;
}

// ============================================================================
// STYLING HELPERS
// ============================================================================

/**
 * Get Tailwind classes for priority badges
 */
function getPriorityStyles(priority: string): string {
  const styles: Record<string, string> = {
    critical: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-blue-500 text-white',
  };
  return (styles[priority] || styles.medium) as string;
}

/**
 * Get Tailwind classes for status badges
 */
function getStatusStyles(status: string): string {
  const styles: Record<string, string> = {
    open: 'bg-green-500 text-white',
    'in-progress': 'bg-blue-500 text-white',
    closed: 'bg-gray-500 text-white',
  };
  return (styles[status] || styles.open) as string;
}

/**
 * Get Tailwind classes for module badges
 */
function getModuleStyles(module: string | null): string {
  if (!module) return 'bg-coral text-white';

  const styles: Record<string, string> = {
    Combat: 'bg-coral text-white',
    Core: 'bg-purple-500 text-white',
    UI: 'bg-pink-500 text-white',
    Animation: 'bg-cyan-500 text-white',
    Systems: 'bg-indigo-500 text-white',
    World: 'bg-green-500 text-white',
    Creatures: 'bg-orange-500 text-white',
  };
  return styles[module] || 'bg-coral text-white';
}

/**
 * Format status for display (convert hyphens to spaces, title case)
 */
function formatStatus(status: string): string {
  return status.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

// ============================================================================
// COMPONENT
// ============================================================================

export function IssueHeader({
  id,
  title,
  status,
  priority,
  module,
  projectName,
  assignee,
  createdAt,
  updatedAt,
  projectId,
}: IssueHeaderProps) {
  return (
    <header className="neu-raised smooth-transition rounded-3xl px-8 py-5">
      {/* Breadcrumb Navigation */}
      <div className="mb-3 flex items-center justify-between">
        <nav className="flex items-center gap-3 text-sm" aria-label="Breadcrumb">
          <Link href={`/tickets?project=${projectId}`} className="smooth-transition text-slate hover:text-coral">
            Issues
          </Link>
          <ChevronRight className="h-3 w-3 text-slate" aria-hidden="true" />
          <span className="font-medium text-white">
            #{id} {title}
          </span>
        </nav>
        <Link
          href={`/tickets?project=${projectId}`}
          className="smooth-transition text-slate hover:text-white"
          aria-label="Close issue detail"
        >
          <X className="h-6 w-6" aria-hidden="true" />
        </Link>
      </div>

      {/* Issue Header Content */}
      <div className="flex items-start justify-between">
        {/* Left: Issue Info */}
        <div className="flex-1">
          {/* Badges Row */}
          <div className="mb-2 flex items-center gap-3">
            <span className="font-mono text-lg font-semibold text-slate">#{id}</span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold shadow-md ${getPriorityStyles(priority)}`}
              aria-label={`Priority: ${priority}`}
              data-testid="priority-badge"
            >
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </span>

            {module && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold shadow-md ${getModuleStyles(module)}`}
                aria-label={`Module: ${module}`}
              >
                {module}
              </span>
            )}

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold shadow-md ${getStatusStyles(status)}`}
              aria-label={`Status: ${formatStatus(status)}`}
              data-testid="status-badge"
            >
              {formatStatus(status)}
            </span>
          </div>

          {/* Title */}
          <h1 className="mb-2 text-2xl font-bold text-white">{title}</h1>

          {/* Metadata Row */}
          <div className="flex items-center gap-6 text-sm text-slate">
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" aria-hidden="true" />
              <span>
                Created by <strong className="text-white">{assignee || 'Unassigned'}</strong>
              </span>
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <time dateTime={createdAt}>{format(new Date(createdAt), 'MMM d, yyyy')}</time>
            </span>
            <span className="flex items-center gap-2">
              <FileEdit className="h-4 w-4" aria-hidden="true" />
              Updated <time dateTime={updatedAt}>{format(new Date(updatedAt), 'MMM d, yyyy')}</time>
            </span>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            className="smooth-transition neu-raised flex items-center gap-2 rounded-2xl px-4 py-2 text-sm text-white hover:text-coral"
            aria-label="Edit issue"
          >
            <PencilLine className="h-4 w-4" aria-hidden="true" />
            Edit
          </button>

          <button
            className="coral-gradient smooth-transition flex items-center gap-2 rounded-2xl px-4 py-2 text-sm text-white shadow-lg hover:opacity-90"
            aria-label="Close issue"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Close Issue
          </button>

          <button
            className="neu-raised smooth-transition flex h-10 w-10 items-center justify-center rounded-2xl text-slate hover:text-white"
            aria-label="More options"
          >
            <MoreVertical className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
