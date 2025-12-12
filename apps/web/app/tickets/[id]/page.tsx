/**
 * Ticket Detail Page
 *
 * Sprint 10: Unified ticket system for all work items
 * Displays complete ticket information with comments, attachments, and activity timeline
 */

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Paperclip, Plus, MessageSquare } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { serializeIssueDetail } from '@/types/issue';
import { FloatingBackground } from '@/components/FloatingBackground';
import { Sidebar } from '@/components/Sidebar';
import { getCurrentUser } from '@/lib/auth-server';
import { getActiveProjectForUser } from '@/lib/project-context';

// Ticket detail components (Sprint 10.5: renamed from issue)
import { TicketHeader } from '@/components/tickets/detail/TicketHeader';
import { QuickActions } from '@/components/tickets/detail/QuickActions';
// import { WatchersSection } from '@/components/tickets/detail/WatchersSection'; // Hidden until DB support
import { TicketActions } from '@/components/tickets/detail/TicketActions';
import { DescriptionSection } from '@/components/tickets/detail/DescriptionSection';
import { CodeSection } from '@/components/tickets/detail/CodeSection';
import { SystemActivity } from '@/components/tickets/detail/SystemActivity';
import { RelatedTickets } from '@/components/tickets/detail/RelatedTickets';
import { CommentList } from '@/components/tickets/detail/CommentList';
import { CommentForm } from '@/components/tickets/detail/CommentForm';
import { AttachmentList } from '@/components/tickets/detail/AttachmentList';
import { TicketDetailSidebar } from '@/components/tickets/detail/TicketDetailSidebar';
import { ImplementationContextSection } from '@/components/tickets/detail/ImplementationContextSection';

// Kind labels for display
const kindLabels: Record<string, string> = {
  feature: 'Feature',
  task: 'Task',
  epic: 'Epic',
  issue: 'Issue',
  bug: 'Bug',
  scanner_finding: 'Scanner Finding',
  tech_debt: 'Tech Debt',
};

// Kind badge colors
const kindColors: Record<string, string> = {
  feature: 'bg-blue-500/20 text-blue-400',
  task: 'bg-green-500/20 text-green-400',
  epic: 'bg-purple-500/20 text-purple-400',
  issue: 'bg-yellow-500/20 text-yellow-400',
  bug: 'bg-red-500/20 text-red-400',
  scanner_finding: 'bg-orange-500/20 text-orange-400',
  tech_debt: 'bg-gray-500/20 text-gray-400',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ticketId = parseInt(id, 10);

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { title: true, id: true, kind: true },
  });

  if (!ticket) {
    return {
      title: 'Ticket Not Found | ProjectPulse',
      description: 'The requested ticket could not be found.',
    };
  }

  const kindLabel = kindLabels[ticket.kind] || ticket.kind;

  return {
    title: `#${ticket.id} ${ticket.title} | ${kindLabel} | ProjectPulse`,
    description: `View details and activity for ${kindLabel.toLowerCase()} #${ticket.id}: ${ticket.title}`,
  };
}

async function getTicketDetail(id: number) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: {
      // Core ticket fields
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      module: true,
      assignee: true,
      projectId: true,
      customFields: true,
      createdAt: true,
      updatedAt: true,
      closedAt: true,
      // Sprint 10 fields
      kind: true,
      source: true,
      assigneeType: true,
      assigneeId: true,
      // Sprint 12: Ticket scheduling (replaces linkedTaskId)
      estimatedDays: true,
      scheduledWeekId: true,
      scheduledDays: true,

      // Sprint 11.7: Milestone and Due Date
      dueDate: true,
      milestoneId: true,
      milestone: {
        select: {
          id: true,
          name: true,
          targetDate: true,
          status: true,
        },
      },

      // Project context
      project: {
        select: {
          id: true,
          name: true,
          repository: true,
        },
      },

      // Labels for categorization
      labels: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },

      // Comments ordered chronologically
      comments: {
        select: {
          id: true,
          content: true,
          author: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },

      // Attachments with full metadata
      attachments: {
        select: {
          id: true,
          filename: true,
          filepath: true,
          mimetype: true,
          size: true,
          uploadedAt: true,
        },
      },

      // Linked files from codebase
      linkedFiles: {
        select: {
          id: true,
          filePath: true,
          lineNumber: true,
          createdAt: true,
        },
      },

      // Recent commit history (limited to 10 most recent)
      linkedCommits: {
        select: {
          id: true,
          commitHash: true,
          commitMessage: true,
          commitDate: true,
        },
        orderBy: { commitDate: 'desc' },
        take: 10,
      },

      // Sprint 12: Scheduled week (for roadmap integration)
      scheduledWeek: {
        select: {
          id: true,
          title: true,
          sprint: {
            select: {
              id: true,
              title: true,
              phase: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      },

      // Aggregated counts
      _count: {
        select: {
          comments: true,
          attachments: true,
          linkedFiles: true,
          linkedCommits: true,
        },
      },
    },
  });

  return ticket;
}

export default async function TicketDetailPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>; 
  searchParams: Promise<{ project?: string }> 
}) {
  const { id } = await params;
  const ticketId = parseInt(id, 10);

  // Auth check
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Fetch ticket with all relations
  const ticket = await getTicketDetail(ticketId);

  if (!ticket) {
    notFound();
  }

  // Verify project ownership
  const searchParamsResolved = await searchParams;
  const { projectId } = await getActiveProjectForUser(user.id, searchParamsResolved.project);
  
  if (ticket.projectId !== projectId) {
    redirect(`/tickets/${ticketId}?project=${ticket.projectId}`);
  }

  // Serialize for client components
  const serializedTicket = serializeIssueDetail(ticket);

  const kindLabel = kindLabels[ticket.kind] || ticket.kind;
  const kindColor = kindColors[ticket.kind] || 'bg-gray-500/20 text-gray-400';

  return (
    <>
      <FloatingBackground />
      <div className="content-wrapper flex h-screen overflow-hidden">
        <Sidebar projectId={projectId} />

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
          {/* Ticket Header */}
          <div className="relative" data-testid="ticket-header">
            <TicketHeader
              id={ticket.id}
              title={ticket.title}
              status={ticket.status as 'open' | 'in-progress' | 'closed'}
              priority={ticket.priority as 'critical' | 'high' | 'medium' | 'low'}
              module={ticket.module}
              projectName={ticket.project.name}
              assignee={ticket.assignee}
              createdAt={serializedTicket.createdAt}
              updatedAt={serializedTicket.updatedAt}
              projectId={projectId}
            />
          </div>

          {/* 2-Column Responsive Grid Layout (Main: 9, Sidebar: 3) */}
          <main className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-12">
            
            {/* MAIN CONTENT (Left Column) */}
            <div className="space-y-4 overflow-auto lg:col-span-9">
              {/* Action Buttons */}
              <div className="flex items-center justify-end">
                <TicketActions
                  ticketId={serializedTicket.id}
                  currentStatus={ticket.status as 'open' | 'in-progress' | 'closed'}
                />
              </div>

              {/* Description Section */}
              <DescriptionSection ticketId={serializedTicket.id} description={ticket.description} />

              {/* Implementation Context (Sprint 11.7) */}
              <ImplementationContextSection
                ticketId={serializedTicket.id}
                context={serializedTicket.implementationContext}
              />

              {/* Code Section (Linked Files) */}
              {ticket.linkedFiles.length > 0 && (
                <CodeSection linkedFiles={serializedTicket.linkedFiles} />
              )}

              {/* Attachments Section */}
              {ticket.attachments.length > 0 && (
                <div className="neu-raised smooth-transition rounded-3xl p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                      <Paperclip className="h-5 w-5 text-coral" aria-hidden="true" />
                      Attachments{' '}
                      <span className="text-sm font-normal text-slate">
                        ({ticket.attachments.length})
                      </span>
                    </h3>
                    <button
                      className="smooth-transition hover:text-coralLight text-sm font-semibold text-coral"
                      aria-label="Add file attachment"
                    >
                      <Plus className="mr-2 h-5 w-5" aria-hidden="true" />
                      Add File
                    </button>
                  </div>
                  <AttachmentList attachments={serializedTicket.attachments} />
                </div>
              )}

              {/* Activity/Comments Section */}
              <div className="neu-raised smooth-transition rounded-3xl p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                  <MessageSquare className="h-5 w-5 text-coral" aria-hidden="true" />
                  Activity{' '}
                  <span className="text-sm font-normal text-slate">
                    ({ticket.comments.length} comments)
                  </span>
                </h3>

                <CommentList
                  ticketId={serializedTicket.id}
                  initialComments={serializedTicket.comments}
                />

                {/* Add Comment Form */}
                <div className="mt-6 border-t border-[#2A2A2A] pt-6">
                  <CommentForm ticketId={serializedTicket.id} authorName={user.name ?? 'Anonymous'} />
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <aside className="space-y-4 overflow-auto lg:col-span-3">
              {/* Quick Actions */}
              <QuickActions ticketId={serializedTicket.id} ticketTitle={ticket.title} />

              {/* Issue Details */}
              <TicketDetailSidebar
                ticketId={serializedTicket.id}
                projectId={String(projectId)}
                assignee={serializedTicket.assignee}
                labels={serializedTicket.labels}
                priority={serializedTicket.priority}
                module={serializedTicket.module}
                status={serializedTicket.status}
                dueDate={serializedTicket.dueDate}
                milestone={serializedTicket.milestone}
              />
              
              {/* Ticket Metadata (Sprint 10) */}
              <div className="neu-raised smooth-transition rounded-3xl p-4" data-testid="ticket-metadata">
                <h4 className="text-sm font-semibold text-white mb-3">Ticket Info</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between" data-testid="metadata-kind">
                    <dt className="text-slate">Kind</dt>
                    <dd className={`px-2 py-0.5 rounded text-xs font-medium ${kindColor}`} data-testid="kind-badge" data-kind={ticket.kind}>
                      {kindLabel}
                    </dd>
                  </div>
                  <div className="flex justify-between" data-testid="metadata-source">
                    <dt className="text-slate">Source</dt>
                    <dd className="text-white capitalize" data-testid="source-badge" data-source={ticket.source}>{ticket.source}</dd>
                  </div>
                  {ticket.assigneeType && (
                    <div className="flex justify-between" data-testid="metadata-assignee-type">
                      <dt className="text-slate">Assignee Type</dt>
                      <dd className="text-white capitalize" data-assignee-type={ticket.assigneeType}>
                        {ticket.assigneeType === 'agent_persona' ? 'Agent' : 'Human'}
                      </dd>
                    </div>
                  )}
                  {ticket.closedAt && (
                    <div className="flex justify-between" data-testid="metadata-closed-at">
                      <dt className="text-slate">Closed At</dt>
                      <dd className="text-white text-xs">
                        {new Date(ticket.closedAt).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
              
              {/* Watchers - Hidden until DB support is implemented
              <WatchersSection ticketId={serializedTicket.id} />
              */}
              
              {/* Scheduled Week Breadcrumb (Sprint 12) */}
              {ticket.scheduledWeek && (
                <div className="neu-raised smooth-transition rounded-3xl p-4" data-testid="scheduled-week-breadcrumb">
                  <h4 className="text-sm font-semibold text-white mb-2">Scheduled in Roadmap</h4>
                  <div className="text-sm text-slate space-y-1">
                    <p className="text-white truncate" data-testid="scheduled-week-title">
                      {ticket.scheduledWeek.title}
                    </p>
                    {ticket.scheduledWeek.sprint && (
                      <p className="text-xs">
                        Sprint: <span className="text-white">{ticket.scheduledWeek.sprint.title}</span>
                      </p>
                    )}
                    {ticket.scheduledWeek.sprint?.phase && (
                      <p className="text-xs">
                        Phase: <span className="text-white">{ticket.scheduledWeek.sprint.phase.title}</span>
                      </p>
                    )}
                    {ticket.scheduledDays && ticket.scheduledDays.length > 0 && (
                      <p className="text-xs">
                        Days: <span className="text-white">{ticket.scheduledDays.join(', ')}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* System Activity */}
              <SystemActivity
                comments={serializedTicket.comments}
                linkedCommits={
                  serializedTicket.linkedCommits as Array<{
                    id: string;
                    commitHash: string;
                    commitMessage: string | null;
                    commitDate: string;
                  }>
                }
              />
              
              {/* Related Issues */}
              <RelatedTickets
                currentIssueId={ticket.id}
                projectId={ticket.project.id}
                labels={ticket.labels}
                module={ticket.module}
              />
            </aside>
          </main>
        </div>
      </div>
    </>
  );
}

export const revalidate = 300;
export const dynamicParams = true;
