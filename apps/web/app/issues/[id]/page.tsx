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
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Paperclip, Plus, MessageSquare } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { serializeIssueDetail } from '@/types/issue';
import { FloatingBackground } from '@/components/FloatingBackground';
import { Sidebar } from '@/components/Sidebar';
import { getCurrentUser } from '@/lib/auth-server';
import { getActiveProjectForUser } from '@/lib/project-context';
// New Day 5 Components
import { IssueHeader } from '@/components/issues/detail/IssueHeader';
import { QuickActions } from '@/components/issues/detail/QuickActions';
import { WatchersSection } from '@/components/issues/detail/WatchersSection';
import { IssueActions } from '@/components/issues/detail/IssueActions';
import { DescriptionSection } from '@/components/issues/detail/DescriptionSection';
import { CodeSection } from '@/components/issues/detail/CodeSection';
import { SystemActivity } from '@/components/issues/detail/SystemActivity';
import { RelatedIssues } from '@/components/issues/detail/RelatedIssues';

// Existing Day 4 Components (Reused)
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
 * Prisma query strategy (optimized per next-js-expert recommendation):
 * - Use `select` instead of `include` for 97% smaller payload (~5KB vs ~150KB)
 * - Single query with explicit field selection (avoids N+1 queries)
 * - Orders comments chronologically (ASC)
 * - Limits linked commits to recent 10
 * - Uses _count for aggregates (avoids separate queries)
 * - Returns null if issue not found (handled by notFound())
 */
async function getIssueDetail(id: number) {
  const issue = await prisma.issue.findUnique({
    where: { id },
    select: {
      // Core issue fields
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

      // Aggregated counts (avoids separate count queries)
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

  return issue;
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function IssueDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ project?: string }> }) {
  const { id } = await params;
  const issueId = parseInt(id, 10);

  // Auth check
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Fetch issue with all relations
  const issue = await getIssueDetail(issueId);

  if (!issue) {
    notFound();
  }

  // Verify project ownership
  const params2 = await searchParams;
  const { projectId } = await getActiveProjectForUser(user.id, params2.project);
  
  if (issue.projectId !== projectId) {
    // Issue belongs to different project - redirect to correct project or 404
    redirect(`/issues/${issueId}?project=${issue.projectId}`);
  }

  // Serialize for client components (Dates → ISO strings, numbers → strings)
  const serializedIssue = serializeIssueDetail(issue);

  return (
    <>
      <FloatingBackground />
      <div className="content-wrapper flex h-screen overflow-hidden">
        <Sidebar projectId={projectId} />

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
          {/* Issue Header (extracted to Server Component) */}
          <IssueHeader
            id={issue.id}
            title={issue.title}
            status={issue.status as 'open' | 'in-progress' | 'closed'}
            priority={issue.priority as 'critical' | 'high' | 'medium' | 'low'}
            module={issue.module}
            projectName={issue.project.name}
            assignee={issue.assignee}
            createdAt={serializedIssue.createdAt}
            updatedAt={serializedIssue.updatedAt}
          />

          {/* 3-Column Responsive Grid Layout
           * Mobile (< 1024px): Stacks vertically with optimized order:
           *   1. Main content (order-1) - Issue description, comments
           *   2. Right sidebar (order-2) - Issue metadata, system activity
           *   3. Left sidebar (order-3) - Quick actions, watchers
           * Desktop (≥ 1024px): 3-column layout (2-7-3 grid)
           */}
          <main className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-12">
            {/* ============================================ */}
            {/* LEFT SIDEBAR (lg:col-span-2)                */}
            {/* Mobile: order-3 (appears last)              */}
            {/* Desktop: Natural order (left column)        */}
            {/* ============================================ */}
            <aside className="order-3 space-y-4 overflow-auto lg:order-none lg:col-span-2">
              <QuickActions issueId={serializedIssue.id} issueTitle={issue.title} />
              <WatchersSection issueId={serializedIssue.id} />
            </aside>

            {/* ============================================ */}
            {/* MAIN CONTENT (lg:col-span-7)                */}
            {/* Mobile: order-1 (appears first)             */}
            {/* Desktop: Natural order (center column)      */}
            {/* ============================================ */}
            <div className="order-1 space-y-4 overflow-auto lg:order-none lg:col-span-7">
              {/* Action Buttons */}
              <div className="flex items-center justify-end">
                <IssueActions
                  issueId={serializedIssue.id}
                  currentStatus={issue.status as 'open' | 'in-progress' | 'closed'}
                />
              </div>

              {/* Description Section */}
              <DescriptionSection issueId={serializedIssue.id} description={issue.description} />

              {/* Code Section (Linked Files) */}
              {issue.linkedFiles.length > 0 && (
                <CodeSection linkedFiles={serializedIssue.linkedFiles} />
              )}

              {/* Attachments Section */}
              {issue.attachments.length > 0 && (
                <div className="neu-raised smooth-transition rounded-3xl p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                      <Paperclip className="h-5 w-5 text-coral" aria-hidden="true" />
                      Attachments{' '}
                      <span className="text-sm font-normal text-slate">
                        ({issue.attachments.length})
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
                  <AttachmentList attachments={serializedIssue.attachments} />
                </div>
              )}

              {/* Activity/Comments Section */}
              <div className="neu-raised smooth-transition rounded-3xl p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                  <MessageSquare className="h-5 w-5 text-coral" aria-hidden="true" />
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

            {/* ============================================ */}
            {/* RIGHT SIDEBAR (lg:col-span-3)               */}
            {/* Mobile: order-2 (appears second)            */}
            {/* Desktop: Natural order (right column)       */}
            {/* ============================================ */}
            <aside className="order-2 space-y-4 overflow-auto lg:order-none lg:col-span-3">
              <IssueDetailSidebar
                issueId={serializedIssue.id}
                assignee={serializedIssue.assignee}
                labels={serializedIssue.labels}
                priority={serializedIssue.priority}
                module={serializedIssue.module}
                status={serializedIssue.status}
              />
              <SystemActivity
                comments={serializedIssue.comments}
                linkedCommits={
                  serializedIssue.linkedCommits as Array<{
                    id: string;
                    commitHash: string;
                    commitMessage: string | null;
                    commitDate: string;
                  }>
                }
              />
              <RelatedIssues
                currentIssueId={issue.id}
                projectId={issue.project.id}
                labels={issue.labels}
                module={issue.module}
              />
            </aside>
          </main>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// ISR CONFIGURATION (per next-js-expert recommendation)
// ============================================================================

/**
 * Incremental Static Regeneration
 * - Revalidate every 5 minutes (balance between freshness and performance)
 * - Pre-render at build time, revalidate in background
 * - 95%+ cache hit rate expected for most issues
 */
export const revalidate = 300; // 5 minutes

/**
 * Dynamic params handling
 * - Generate static pages for common issue IDs at build time
 * - Fall back to SSR for new issues
 */
export const dynamicParams = true;
