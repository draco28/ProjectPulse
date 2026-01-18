import Link from 'next/link';
import { Edit, Clock, Eye, Layers } from 'lucide-react';
import { ContributorAvatar } from './ContributorAvatar';
import { formatRelativeTime } from '@/lib/utils/date';

interface Contributor {
  name: string;
  avatar?: string;
  editCount: number;
  lastEditAt: string;
}

interface WikiHeaderProps {
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  contributors: Contributor[];
  updatedAt: string;
  lastEditedBy?: string | null;
  lastEditedAt?: string | null;
  version?: number;
  revisionsCount?: number;
  views: number;
  uniqueVisitors?: number | null;
  helpfulRatio?: number | null;
  popularity?: number | null;
  path: string;
  readingTime?: number;
  projectId: number;
}

export function WikiHeader({
  title,
  description,
  category,
  tags,
  contributors,
  updatedAt,
  lastEditedBy,
  lastEditedAt,
  version,
  revisionsCount,
  views,
  uniqueVisitors,
  helpfulRatio,
  popularity,
  path,
  readingTime,
  projectId,
}: WikiHeaderProps) {
  // Sort contributors by edit count
  const sortedContributors = [...contributors].sort((a, b) => b.editCount - a.editCount);
  const primaryContributor = sortedContributors[0];
  const _topContributors = sortedContributors.slice(0, 5);

  const relativeTime = formatRelativeTime(lastEditedAt ?? updatedAt);
  const editorName = lastEditedBy ?? primaryContributor?.name;

  return (
    <div className="mb-8">
      {/* Title + Edit Button */}
      <div className="mb-4 flex items-start justify-between">
        <div className="mr-4 flex-1">
          <h1 className="mb-3 text-4xl font-bold">{title}</h1>
          {description && <p className="text-lg text-slate">{description}</p>}
        </div>
        <Link
          href={`/wiki/edit${path.startsWith('/') ? path : '/' + path}?project=${projectId}`}
          className="neu-raised hover:bg-darkCard smooth-transition whitespace-nowrap rounded-xl px-4 py-2 text-sm"
        >
          <Edit className="mr-2 inline-block h-4 w-4" aria-hidden="true" />
          Edit Page
        </Link>
      </div>

      {/* Contributor + Metadata */}
      <div className="mb-4 flex items-center gap-4 text-sm text-slate">
        {editorName && (
          <>
            <div className="flex items-center gap-2">
              {primaryContributor && (
                <ContributorAvatar contributor={primaryContributor} size="sm" />
              )}
              <span>Updated by {editorName}</span>
            </div>
            <span>•</span>
          </>
        )}
        <span className="flex items-center">
          <Clock className="mr-2 h-4 w-4" aria-hidden="true" />
          {relativeTime}
        </span>
        <span>•</span>
        <span className="flex items-center">
          <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
          {views.toLocaleString()} views
        </span>
        {uniqueVisitors !== undefined && uniqueVisitors !== null && (
          <>
            <span>•</span>
            <span>{uniqueVisitors.toLocaleString()} visitors</span>
          </>
        )}
        {helpfulRatio !== null && helpfulRatio !== undefined && (
          <>
            <span>•</span>
            <span>{helpfulRatio}% helpful</span>
          </>
        )}
        {popularity !== null && popularity !== undefined && (
          <>
            <span>•</span>
            <span>Popularity {popularity.toFixed(1)}</span>
          </>
        )}
        {(version || revisionsCount) && (
          <>
            <span>•</span>
            <span className="flex items-center">
              <Layers className="mr-2 h-4 w-4" aria-hidden="true" />v{version ?? '?'} ·{' '}
              {revisionsCount ?? 0} revisions
            </span>
          </>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Primary category - coral gradient */}
        <span className="coral-gradient rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-md">
          {category}
        </span>

        {/* Additional tags - neumorphic */}
        {tags?.map((tag) => (
          <span
            key={tag}
            className="neu-raised smooth-transition hover:bg-darkCard cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold text-slate hover:text-white"
          >
            {tag}
          </span>
        ))}

        {/* Reading time badge */}
        {readingTime && (
          <span className="neu-raised rounded-full px-3 py-1.5 text-xs font-semibold text-slate">
            {readingTime} min read
          </span>
        )}
      </div>
    </div>
  );
}
