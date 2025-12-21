/**
 * RelatedTickets Component
 *
 * Server Component that displays issues related to the current issue
 *
 * Architecture (per react-expert recommendation):
 * - Server Component (async data fetching)
 * - Shows issues from same project with similar labels or same module
 *
 * Sprint 11.7: Implemented real Prisma query (was placeholder)
 *
 * Props:
 * - currentIssueId: Current issue ID (to exclude from results)
 * - projectId: Project ID for finding related tickets
 * - labels: Array of label names for similarity matching
 * - module: Module name for finding similar issues
 *
 * Reference: mockups/Default theme/03-issue-detail-dark-neumorphic-coral.html
 */

import Link from 'next/link';
import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';

// ============================================================================
// TYPES
// ============================================================================

interface RelatedTicketsProps {
  currentIssueId: number;
  projectId: number;
  labels: Array<{ id: number; name: string; color: string }>;
  module: string | null;
}

interface RelatedTicket {
  id: number;
  title: string;
  status: string;
  priority: string;
  createdAt: Date;
  module: string | null;
  labels: Array<{ name: string }>;
  relationReason: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get status badge color
 */
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: 'bg-green-500/20 text-green-400',
    'in-progress': 'bg-blue-500/20 text-blue-400',
    in_progress: 'bg-blue-500/20 text-blue-400',
    closed: 'bg-gray-500/20 text-gray-400',
    resolved: 'bg-gray-500/20 text-gray-400',
  };
  return colors[status] ?? 'bg-green-500/20 text-green-400';
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
  return colors[priority] ?? 'bg-yellow-500';
}

/**
 * Determine why a ticket is related to the current one
 */
function getRelationReason(
  ticket: { module: string | null; labels: Array<{ name: string }> },
  currentModule: string | null,
  currentLabelNames: string[]
): string {
  if (currentModule && ticket.module === currentModule) {
    return 'Same module';
  }

  const overlappingLabels = ticket.labels.filter((l) => currentLabelNames.includes(l.name));

  if (overlappingLabels.length > 0) {
    return `Similar labels: ${overlappingLabels.map((l) => l.name).join(', ')}`;
  }

  return 'Related';
}

// ============================================================================
// COMPONENT
// ============================================================================

export async function RelatedTickets({
  currentIssueId,
  projectId,
  labels,
  module,
}: RelatedTicketsProps) {
  const labelNames = labels.map((l) => l.name);

  // Build OR conditions for related tickets
  const orConditions: Array<Record<string, unknown>> = [];

  // Condition 1: Same module (if current ticket has a module)
  if (module) {
    orConditions.push({ module });
  }

  // Condition 2: Overlapping labels (if current ticket has labels)
  if (labelNames.length > 0) {
    orConditions.push({
      labels: {
        some: {
          name: { in: labelNames },
        },
      },
    });
  }

  // If no conditions, return empty (no module and no labels to match)
  if (orConditions.length === 0) {
    return (
      <div className="neu-raised smooth-transition rounded-3xl p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <i className="fas fa-link text-coral" aria-hidden="true"></i>
          Related Tickets
        </h3>
        <p className="text-center text-sm text-slate">No related tickets found</p>
      </div>
    );
  }

  // Query related tickets from database
  const relatedTickets = await prisma.ticket.findMany({
    where: {
      projectId, // Same project
      id: { not: currentIssueId }, // Exclude current ticket
      OR: orConditions, // Match by module OR labels
    },
    take: 5,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      createdAt: true,
      module: true,
      labels: { select: { name: true } },
    },
  });

  // Add relation reason to each ticket
  const ticketsWithReason: RelatedTicket[] = relatedTickets.map((ticket) => ({
    ...ticket,
    relationReason: getRelationReason(ticket, module, labelNames),
  }));

  if (ticketsWithReason.length === 0) {
    return (
      <div className="neu-raised smooth-transition rounded-3xl p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <i className="fas fa-link text-coral" aria-hidden="true"></i>
          Related Tickets
        </h3>
        <p className="text-center text-sm text-slate">No related tickets found</p>
      </div>
    );
  }

  return (
    <div className="neu-raised smooth-transition rounded-3xl p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
        <i className="fas fa-link text-coral" aria-hidden="true"></i>
        Related Tickets
        <span className="text-sm font-normal text-slate">({ticketsWithReason.length})</span>
      </h3>

      {/* Related Tickets List */}
      <div className="space-y-3">
        {ticketsWithReason.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/tickets/${ticket.id}?project=${projectId}`}
            className="smooth-transition block rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 hover:border-coral/30"
          >
            {/* Issue Header */}
            <div className="mb-2 flex items-start gap-3">
              {/* Priority Indicator */}
              <div
                className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${getPriorityColor(ticket.priority)}`}
                aria-label={`Priority: ${ticket.priority}`}
              ></div>

              {/* Issue Info */}
              <div className="flex-1 overflow-hidden">
                <p className="mb-1 line-clamp-2 text-sm font-medium text-white hover:text-coral">
                  #{ticket.id} {ticket.title}
                </p>

                <div className="flex items-center gap-3 text-xs">
                  <span className={`rounded-full px-2 py-0.5 ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace(/_/g, ' ')}
                  </span>
                  <time className="text-slate" dateTime={ticket.createdAt.toISOString()}>
                    {format(ticket.createdAt, 'MMM d')}
                  </time>
                </div>
              </div>
            </div>

            {/* Relation Reason */}
            <div className="flex items-center gap-2 text-xs text-slate">
              <i className="fas fa-info-circle text-coral" aria-hidden="true"></i>
              <span>{ticket.relationReason}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
