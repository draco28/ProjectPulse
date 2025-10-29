/**
 * SystemActivity Component
 *
 * Server Component that displays activity timeline for the issue
 *
 * Architecture (per react-expert recommendation):
 * - Server Component (static rendering)
 * - Receives explicit props for comments and commits
 * - Combines and sorts activity by date (most recent first)
 *
 * Activity Types:
 * - Comments: User comments on the issue
 * - Commits: Linked git commits
 * - Future: Status changes, label changes (when audit log table is added)
 *
 * Props:
 * - comments: Array of comment objects with author, content, createdAt
 * - linkedCommits: Array of commit objects with hash, message, commitDate
 *
 * Reference: mockups/Default theme/03-issue-detail-dark-neumorphic-coral.html
 */

import { format, formatDistanceToNow } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface Comment {
  id: string; // Serialized from number
  author: string | null;
  content: string;
  createdAt: string; // ISO 8601 date string
}

interface LinkedCommit {
  id: string; // Serialized from number
  commitHash: string;
  commitMessage: string | null;
  commitDate: string; // ISO 8601 date string
}

interface SystemActivityProps {
  comments: Comment[];
  linkedCommits: LinkedCommit[];
}

// Activity item type (union of comment and commit)
type ActivityItem =
  | {
      type: 'comment';
      date: Date;
      author: string | null;
      content: string;
      id: string;
    }
  | {
      type: 'commit';
      date: Date;
      commitHash: string;
      commitMessage: string | null;
      id: string;
    };

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Combine comments and commits into a single activity timeline
 * Sorted by date (most recent first)
 */
function mergeActivity(comments: Comment[], linkedCommits: LinkedCommit[]): ActivityItem[] {
  const commentActivities: ActivityItem[] = comments.map((comment) => ({
    type: 'comment' as const,
    date: new Date(comment.createdAt),
    author: comment.author,
    content: comment.content,
    id: comment.id,
  }));

  const commitActivities: ActivityItem[] = linkedCommits.map((commit) => ({
    type: 'commit' as const,
    date: new Date(commit.commitDate),
    commitHash: commit.commitHash,
    commitMessage: commit.commitMessage,
    id: commit.id,
  }));

  const allActivities = [...commentActivities, ...commitActivities];

  // Sort by date (most recent first)
  allActivities.sort((a, b) => b.date.getTime() - a.date.getTime());

  return allActivities;
}

/**
 * Truncate commit hash to short form (first 7 chars)
 */
function shortHash(hash: string): string {
  return hash.substring(0, 7);
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SystemActivity({ comments, linkedCommits }: SystemActivityProps) {
  const activities = mergeActivity(comments, linkedCommits);

  // Show only recent 10 activities to avoid overwhelming the sidebar
  const recentActivities = activities.slice(0, 10);

  if (recentActivities.length === 0) {
    return (
      <div className="neu-raised smooth-transition rounded-3xl p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <i className="fas fa-history text-coral" aria-hidden="true"></i>
          Activity
        </h3>
        <p className="text-center text-sm text-slate">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="neu-raised smooth-transition rounded-3xl p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
        <i className="fas fa-history text-coral" aria-hidden="true"></i>
        Activity
        <span className="text-sm font-normal text-slate">({recentActivities.length})</span>
      </h3>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {recentActivities.map((activity, index) => {
          const isLast = index === recentActivities.length - 1;

          return (
            <div
              key={`${activity.type}-${activity.id}`}
              className={`relative ${!isLast ? 'pb-4' : ''}`}
            >
              {/* Timeline connector line */}
              {!isLast && (
                <div
                  className="absolute left-3 top-6 h-full w-px bg-gradient-to-b from-coral/30 to-transparent"
                  aria-hidden="true"
                />
              )}

              {/* Activity Item */}
              <div className="relative flex gap-3">
                {/* Icon */}
                <div
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                    activity.type === 'comment'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-coral/20 text-coral'
                  }`}
                  aria-hidden="true"
                >
                  <i
                    className={`text-xs ${
                      activity.type === 'comment' ? 'fas fa-comment' : 'fas fa-code-branch'
                    }`}
                  ></i>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  {activity.type === 'comment' ? (
                    // Comment Activity
                    <div>
                      <div className="mb-1 flex items-baseline gap-2">
                        <span className="text-sm font-medium text-white">{activity.author}</span>
                        <span className="text-xs text-slate">commented</span>
                        <time
                          className="text-xs text-slate"
                          dateTime={activity.date.toISOString()}
                          title={format(activity.date, 'PPpp')}
                        >
                          {formatDistanceToNow(activity.date, { addSuffix: true })}
                        </time>
                      </div>
                      <p className="line-clamp-2 text-sm text-slate">{activity.content}</p>
                    </div>
                  ) : (
                    // Commit Activity
                    <div>
                      <div className="mb-1 flex items-baseline gap-2">
                        <span className="font-mono text-xs text-coral">
                          {shortHash(activity.commitHash)}
                        </span>
                        <span className="text-xs text-slate">committed</span>
                        <time
                          className="text-xs text-slate"
                          dateTime={activity.date.toISOString()}
                          title={format(activity.date, 'PPpp')}
                        >
                          {formatDistanceToNow(activity.date, { addSuffix: true })}
                        </time>
                      </div>
                      <p className="line-clamp-2 text-sm text-slate">{activity.commitMessage}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show More Link (if there are more than 10 activities) */}
      {activities.length > 10 && (
        <div className="mt-4 border-t border-[#2A2A2A] pt-4 text-center">
          <button className="smooth-transition hover:text-coralLight text-sm font-medium text-coral">
            View all activity ({activities.length})
          </button>
        </div>
      )}
    </div>
  );
}
