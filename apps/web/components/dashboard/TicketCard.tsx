/**
 * TicketCard Component
 *
 * Glass-dark ticket card matching the mockup exactly
 * (dashboard-dark-neumorphic-coral.html lines 437-479)
 *
 * Features:
 * - glass-dark container with rounded-2xl
 * - icon-coral gradient container for icon
 * - Custom priority/category badges
 * - Font-mono for issue number
 * - Metadata row with clock and comment icons
 */
'use client';

import { Clock, MessageSquare, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';

type Priority = 'critical' | 'high' | 'medium' | 'low';

interface Issue {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: string;
  isActive?: boolean;
  createdAt: string;
}

interface TicketCardProps {
  issue: Issue;
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  critical: {
    label: 'Critical',
    className: 'bg-red-500 text-white',
  },
  high: {
    label: 'High',
    className: 'bg-orange-500 text-white',
  },
  medium: {
    label: 'Medium',
    className: 'bg-yellow-500 text-white',
  },
  low: {
    label: 'Low',
    className: 'bg-slate text-white',
  },
};

export function TicketCard({ issue }: TicketCardProps) {
  const priorityInfo = priorityConfig[issue.priority];

  return (
    <div className="glass-dark neu-float cursor-pointer rounded-2xl p-5 hover:shadow-lg">
      <div className="flex items-start gap-4">
        {/* Icon Container */}
        <div className="icon-coral flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl shadow-lg">
          <Bug className="h-5 w-5 text-white" />
        </div>

        <div className="min-w-0 flex-1">
          {/* Issue Number + Badges */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-slate">#{issue.id}</span>
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold shadow-md',
                priorityInfo.className
              )}
            >
              {priorityInfo.label}
            </span>
            <span className="rounded-full bg-coral px-3 py-1 text-xs font-semibold text-white shadow-md">
              {issue.category}
            </span>
            {/* Pulse Indicator for Active Issues */}
            {issue.isActive && (
              <div className="pulse-indicator ml-1">
                <div className="pulse-dot" />
                <div className="pulse-ring" />
              </div>
            )}
          </div>

          {/* Title */}
          <h4 className="mb-1 font-semibold text-white">{issue.title}</h4>

          {/* Description */}
          <p className="line-clamp-2 text-sm text-slate">{issue.description}</p>

          {/* Metadata */}
          <div className="mt-3 flex items-center gap-4 text-xs text-slate">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {issue.createdAt}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {parseInt(issue.id) % 5 || 2}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
