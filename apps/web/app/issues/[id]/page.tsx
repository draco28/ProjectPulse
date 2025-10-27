/**
 * Issue Detail Page
 *
 * Displays complete issue information with comments, attachments, and activity timeline
 * Reference: mockups/Default theme/03-issue-detail-dark-neumorphic-coral.html
 *
 * Architecture:
 * - Server Component for initial data fetching
 * - Client Components for interactive features (comments, status changes)
 * - API routes for mutations (create comment, update status)
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { serializeIssueDetail, type IssueDetail } from '@/types/issue';
import { FloatingBackground } from '@/components/FloatingBackground';
import { Sidebar } from '@/components/Sidebar';
import { CommentList } from '@/components/issues/detail/CommentList';
import { CommentForm } from '@/components/issues/detail/CommentForm';
import { AttachmentList } from '@/components/issues/detail/AttachmentList';
import { IssueDetailSidebar } from '@/components/issues/detail/IssueDetailSidebar';

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const issueId = parseInt(id, 10);

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { title: true, id: true },
  });

  if (!issue) {
    return {
      title: 'Issue Not Found | ProjectPulse',
      description: 'The requested issue could not be found.',
    };
  }

  return {
    title: `#${issue.id} ${issue.title} | Issues | ProjectPulse`,
    description: `View details and activity for issue #${issue.id}: ${issue.title}`,
  };
}

// ============================================================================
// DATA FETCHING
// ============================================================================

/**
 * Fetches complete issue details with all relations
 *
 * Prisma query strategy:
 * - Single query with selective includes (avoids N+1 queries)
 * - Orders comments chronologically (ASC)
 * - Limits linked commits to recent 10
 * - Returns null if issue not found (handled by notFound())
 */
async function getIssueDetail(id: number): Promise<IssueDetail | null> {
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      // Comments ordered chronologically
      comments: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          content: true,
          author: true,
          createdAt: true,
          updatedAt: true,
        },
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

      // Labels for categorization
      labels: {
        select: {
          id: true,
          name: true,
          color: true,
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

      // Recent commit history
      linkedCommits: {
        orderBy: { commitDate: 'desc' },
        take: 10, // Limit to recent commits
        select: {
          id: true,
          commitHash: true,
          commitMessage: true,
          commitDate: true,
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
    },
  });

  return issue;
}

// ============================================================================
// PRIORITY & STATUS DISPLAY HELPERS
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
    in_progress: 'bg-blue-500 text-white',
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
 * Format status for display (convert underscores to spaces, title case)
 */
function formatStatus(status: string): string {
  return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issueId = parseInt(id, 10);

  // Fetch issue with all relations
  const issue = await getIssueDetail(issueId);

  if (!issue) {
    notFound();
  }

  // Serialize for client components (Dates → ISO strings, numbers → strings)
  const serializedIssue = serializeIssueDetail(issue);

  return (
    <>
      <FloatingBackground />
      <div className="content-wrapper flex h-screen overflow-hidden">
        <Sidebar />

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
          {/* Header with Breadcrumb */}
          <header className="neu-raised smooth-transition rounded-3xl px-8 py-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm">
                <Link href="/issues" className="smooth-transition text-slate hover:text-coral">
                  Issues
                </Link>
                <i className="fas fa-chevron-right text-xs text-slate"></i>
                <span className="font-medium text-white">
                  #{issue.id} {issue.title}
                </span>
              </div>
              <Link href="/issues" className="smooth-transition text-slate hover:text-white">
                <i className="fas fa-times text-xl"></i>
              </Link>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <span className="font-mono text-lg font-semibold text-slate">#{issue.id}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold shadow-md ${getPriorityStyles(issue.priority)}`}
                  >
                    {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                  </span>
                  {issue.module && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold shadow-md ${getModuleStyles(issue.module)}`}
                    >
                      {issue.module}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold shadow-md ${getStatusStyles(issue.status)}`}
                  >
                    {formatStatus(issue.status)}
                  </span>
                </div>

                <h2 className="mb-2 text-2xl font-bold text-white">{issue.title}</h2>

                <div className="flex items-center gap-6 text-sm text-slate">
                  <span className="flex items-center gap-2">
                    <i className="fas fa-user"></i>
                    <span>
                      Opened by{' '}
                      <strong className="text-white">{issue.assignee || 'Unassigned'}</strong>
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <i className="fas fa-clock"></i>
                    {format(new Date(issue.createdAt), 'MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-2">
                    <i className="fas fa-edit"></i>
                    Updated {format(new Date(issue.updatedAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="smooth-transition neu-raised rounded-2xl px-4 py-2 text-sm text-white">
                  <i className="fas fa-pencil-alt mr-2"></i>Edit
                </button>
                <button className="coral-gradient smooth-transition rounded-2xl px-4 py-2 text-sm text-white shadow-lg">
                  <i className="fas fa-check mr-2"></i>Close Issue
                </button>
                <button className="neu-raised smooth-transition flex h-10 w-10 items-center justify-center rounded-2xl text-slate hover:text-white">
                  <i className="fas fa-ellipsis-v"></i>
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex flex-1 gap-4 overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 space-y-4 overflow-auto">
              {/* Description Section */}
              {issue.description && (
                <div className="neu-raised smooth-transition rounded-3xl p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                      <i className="fas fa-align-left text-coral"></i>
                      Description
                    </h3>
                    <button className="smooth-transition text-sm text-slate hover:text-coral">
                      <i className="fas fa-edit mr-2"></i>Edit
                    </button>
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed text-slate">
                    <p className="whitespace-pre-wrap">{issue.description}</p>
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              {issue.attachments.length > 0 && (
                <div className="neu-raised smooth-transition rounded-3xl p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                      <i className="fas fa-paperclip text-coral"></i>
                      Attachments{' '}
                      <span className="text-sm font-normal text-slate">
                        ({issue.attachments.length})
                      </span>
                    </h3>
                    <button className="smooth-transition hover:text-coralLight text-sm font-semibold text-coral">
                      <i className="fas fa-plus mr-2"></i>Add File
                    </button>
                  </div>
                  <AttachmentList attachments={serializedIssue.attachments} />
                </div>
              )}

              {/* Activity/Comments Section */}
              <div className="neu-raised smooth-transition rounded-3xl p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                  <i className="fas fa-comments text-coral"></i>
                  Activity{' '}
                  <span className="text-sm font-normal text-slate">
                    ({issue.comments.length} comments)
                  </span>
                </h3>

                <CommentList
                  issueId={serializedIssue.id}
                  initialComments={serializedIssue.comments}
                />

                {/* Add Comment Form */}
                <div className="mt-6 border-t border-[#2A2A2A] pt-6">
                  <CommentForm issueId={serializedIssue.id} />
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <IssueDetailSidebar
              issueId={serializedIssue.id}
              assignee={serializedIssue.assignee}
              labels={serializedIssue.labels}
              priority={serializedIssue.priority}
              module={serializedIssue.module}
              status={serializedIssue.status}
            />
          </main>
        </div>
      </div>
    </>
  );
}
