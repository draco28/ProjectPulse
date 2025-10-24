/**
 * IssueCard Component
 *
 * Displays an issue with:
 * - Title and description
 * - Priority badge
 * - Category tags
 * - Pulse indicator for active/recent issues
 * - Timestamp
 */
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
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

interface IssueCardProps {
  issue: Issue;
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  critical: {
    label: 'Critical',
    className: 'bg-error/20 text-error border-error/30',
  },
  high: {
    label: 'High',
    className: 'bg-warning/20 text-warning border-warning/30',
  },
  medium: {
    label: 'Medium',
    className: 'bg-info/20 text-info border-info/30',
  },
  low: {
    label: 'Low',
    className: 'bg-text-tertiary/20 text-text-tertiary border-text-tertiary/30',
  },
};

export function IssueCard({ issue }: IssueCardProps) {
  const priorityInfo = priorityConfig[issue.priority];

  return (
    <Card className="card-hover group cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Pulse indicator for active issues */}
          {issue.isActive && (
            <div className="pt-1">
              <div className="pulse-indicator">
                <div className="pulse-dot" />
                <div className="pulse-ring" />
              </div>
            </div>
          )}

          <div className="min-w-0 flex-1">
            {/* Title */}
            <h3 className="mb-1 truncate font-semibold text-text-primary transition-colors group-hover:text-accent-primary">
              {issue.title}
            </h3>

            {/* Description */}
            <p className="mb-3 line-clamp-2 text-sm text-text-secondary">{issue.description}</p>

            {/* Badges and meta */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Priority badge */}
                <Badge className={cn('text-xs', priorityInfo.className)}>
                  {priorityInfo.label}
                </Badge>

                {/* Category badge */}
                <Badge variant="outline" className="text-xs">
                  {issue.category}
                </Badge>
              </div>

              {/* Timestamp */}
              <div className="flex items-center gap-1 text-xs text-text-tertiary">
                <Clock className="h-3 w-3" />
                <span>{issue.createdAt}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
