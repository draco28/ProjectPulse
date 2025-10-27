/**
 * IssueListCard Component
 *
 * Individual issue card for the issues list page
 * Reference: mockups/Default theme/02-issues-dark-neumorphic-coral.html lines 523-631
 *
 * Features:
 * - Checkbox for selection
 * - Issue number, priority, module, status badges
 * - Title with line-through for closed issues
 * - Description preview (2 lines)
 * - Metadata (author, time, comments, attachments)
 * - Menu button
 * - Hover effect (translateY -2px)
 * - Opacity 60% for closed issues
 */
'use client';

import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

type Priority = 'critical' | 'high' | 'medium' | 'low';
type Status = 'open' | 'in_progress' | 'closed';

interface IssueListCardProps {
  issue: {
    id: string;
    title: string;
    description: string;
    priority: Priority;
    module: string;
    status: Status;
    assignee: string;
    createdAt: Date;
    commentsCount: number;
    attachmentsCount: number;
  };
}

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'bg-red-500 text-white shadow-md' },
  high: { label: 'High', className: 'bg-orange-500 text-white shadow-md' },
  medium: { label: 'Medium', className: 'bg-blue-400 text-white shadow-md' },
  low: { label: 'Low', className: 'neu-pressed text-slate' },
};

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-green-500 text-white shadow-md' },
  in_progress: { label: 'In Progress', className: 'bg-yellow-500 text-white shadow-md' },
  closed: { label: 'Closed', className: 'neu-pressed text-slate' },
};

export function IssueListCard({ issue }: IssueListCardProps) {
  const priorityInfo = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.low;
  const statusInfo = STATUS_CONFIG[issue.status] || {
    label: issue.status,
    className: 'neu-pressed text-slate',
  };
  const isClosed = issue.status === 'closed';

  // Format time ago
  const timeAgo = formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true });

  return (
    <div
      className={cn(
        'neu-raised issue-card smooth-transition rounded-3xl p-6',
        isClosed && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input type="checkbox" className="mt-1 flex-shrink-0" />

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Top Row: Issue Number + Badges + Menu */}
          <div className="mb-3 flex items-start justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {/* Issue Number */}
              <span className="font-mono text-sm font-semibold text-slate">#{issue.id}</span>

              {/* Priority Badge */}
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold',
                  priorityInfo.className
                )}
              >
                {priorityInfo.label}
              </span>

              {/* Module Badge */}
              <span className="rounded-full bg-coral px-3 py-1 text-xs font-semibold text-white shadow-md">
                {issue.module}
              </span>

              {/* Status Badge */}
              <span
                className={cn('rounded-full px-3 py-1 text-xs font-semibold', statusInfo.className)}
              >
                {statusInfo.label}
              </span>
            </div>

            {/* Menu Button */}
            <button className="smooth-transition text-slate hover:text-coral">
              <i className="fas fa-ellipsis-v"></i>
            </button>
          </div>

          {/* Title */}
          <Link href={`/issues/${issue.id}`} className="smooth-transition block hover:text-coral">
            <h3 className={cn('mb-2 text-lg font-bold text-white', isClosed && 'line-through')}>
              {issue.title}
            </h3>
          </Link>

          {/* Description */}
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate">
            {issue.description}
          </p>

          {/* Metadata Row */}
          <div className="flex items-center gap-6 text-sm text-slate">
            {/* Author */}
            <span className="flex items-center gap-2">
              <i className="fas fa-user"></i>
              {issue.assignee}
            </span>

            {/* Time */}
            <span className="flex items-center gap-2">
              <i className="fas fa-clock"></i>
              {timeAgo}
            </span>

            {/* Comments */}
            <span className="flex items-center gap-2">
              <i className="fas fa-comment"></i>
              {issue.commentsCount} {issue.commentsCount === 1 ? 'comment' : 'comments'}
            </span>

            {/* Attachments */}
            {issue.attachmentsCount > 0 && (
              <span className="flex items-center gap-2">
                <i className="fas fa-paperclip"></i>
                {issue.attachmentsCount} {issue.attachmentsCount === 1 ? 'file' : 'files'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
