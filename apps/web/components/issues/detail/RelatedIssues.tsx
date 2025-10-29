/**
 * RelatedIssues Component
 *
 * Server Component that displays issues related to the current issue
 *
 * Architecture (per react-expert recommendation):
 * - Server Component (static rendering)
 * - Future: Use Suspense boundary (per next-js-expert) for async data loading
 * - Shows issues from same project or with similar labels
 *
 * Current State:
 * - Placeholder component (related issues logic not yet implemented)
 * - Future: Query issues with similar labels, same module, or linked references
 *
 * Props:
 * - currentIssueId: Current issue ID (to exclude from results)
 * - projectId: Project ID for finding related issues
 * - labels: Array of label names for similarity matching
 * - module: Module name for finding similar issues
 *
 * Reference: mockups/Default theme/03-issue-detail-dark-neumorphic-coral.html
 */

import Link from 'next/link';
import { format } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface RelatedIssuesProps {
  currentIssueId: number;
  projectId: number;
  labels: Array<{ id: number; name: string; color: string }>;
  module: string | null;
}

// Placeholder related issue type
interface PlaceholderRelatedIssue {
  id: number;
  title: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  createdAt: string;
  relationReason: string;
}

// ============================================================================
// PLACEHOLDER DATA
// ============================================================================

/**
 * Placeholder related issues
 * Future: This will come from Prisma query based on labels/module similarity
 */
const PLACEHOLDER_RELATED_ISSUES: PlaceholderRelatedIssue[] = [
  {
    id: 42,
    title: 'Character animations not playing correctly in combat',
    status: 'open',
    priority: 'high',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    relationReason: 'Same module',
  },
  {
    id: 38,
    title: 'Sword swing animation delay issue',
    status: 'in_progress',
    priority: 'medium',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    relationReason: 'Similar labels',
  },
  {
    id: 29,
    title: 'Animation state machine bugs in battle mode',
    status: 'closed',
    priority: 'critical',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    relationReason: 'Same module',
  },
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get status badge color
 */
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: 'bg-green-500/20 text-green-400',
    in_progress: 'bg-blue-500/20 text-blue-400',
    closed: 'bg-gray-500/20 text-gray-400',
  };
  return (colors[status] || colors.open) as string;
}

/**
 * Get priority indicator color
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

// ============================================================================
// COMPONENT
// ============================================================================

export function RelatedIssues({ currentIssueId, projectId, labels, module }: RelatedIssuesProps) {
  // Future: Query Prisma for related issues based on:
  // - Same project
  // - Overlapping labels
  // - Same module
  // - Similar title (full-text search)
  const relatedIssues = PLACEHOLDER_RELATED_ISSUES;

  if (relatedIssues.length === 0) {
    return (
      <div className="neu-raised smooth-transition rounded-3xl p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <i className="fas fa-link text-coral" aria-hidden="true"></i>
          Related Issues
        </h3>
        <p className="text-center text-sm text-slate">No related issues found</p>
      </div>
    );
  }

  return (
    <div className="neu-raised smooth-transition rounded-3xl p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
        <i className="fas fa-link text-coral" aria-hidden="true"></i>
        Related Issues
        <span className="text-sm font-normal text-slate">({relatedIssues.length})</span>
      </h3>

      {/* Related Issues List */}
      <div className="space-y-3">
        {relatedIssues.map((issue) => (
          <Link
            key={issue.id}
            href={`/issues/${issue.id}`}
            className="smooth-transition block rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 hover:border-coral/30"
          >
            {/* Issue Header */}
            <div className="mb-2 flex items-start gap-3">
              {/* Priority Indicator */}
              <div
                className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${getPriorityColor(issue.priority)}`}
                aria-label={`Priority: ${issue.priority}`}
              ></div>

              {/* Issue Info */}
              <div className="flex-1 overflow-hidden">
                <p className="mb-1 line-clamp-2 text-sm font-medium text-white hover:text-coral">
                  #{issue.id} {issue.title}
                </p>

                <div className="flex items-center gap-3 text-xs">
                  <span className={`rounded-full px-2 py-0.5 ${getStatusColor(issue.status)}`}>
                    {issue.status.replace('_', ' ')}
                  </span>
                  <time className="text-slate" dateTime={issue.createdAt}>
                    {format(new Date(issue.createdAt), 'MMM d')}
                  </time>
                </div>
              </div>
            </div>

            {/* Relation Reason */}
            <div className="flex items-center gap-2 text-xs text-slate">
              <i className="fas fa-info-circle text-coral" aria-hidden="true"></i>
              <span>{issue.relationReason}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Future Enhancement Note */}
      <div className="mt-4 rounded-2xl border border-dashed border-[#2A2A2A] p-3 text-center">
        <p className="text-xs text-slate">
          <i className="fas fa-lightbulb mr-2 text-coral" aria-hidden="true"></i>
          Future: AI-powered similarity detection
        </p>
      </div>
    </div>
  );
}
