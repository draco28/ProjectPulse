import Link from 'next/link';
import { Edit, Clock, Eye } from 'lucide-react';
import { ContributorAvatar } from './ContributorAvatar';

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
  views: number;
  path: string;
  readingTime?: number;
}

export function WikiHeader({
  title,
  description,
  category,
  tags,
  contributors,
  updatedAt,
  views,
  path,
  readingTime
}: WikiHeaderProps) {
  // Sort contributors by edit count
  const sortedContributors = [...contributors].sort((a, b) => b.editCount - a.editCount);
  const primaryContributor = sortedContributors[0];
  const topContributors = sortedContributors.slice(0, 5);

  const relativeTime = formatRelativeTime(updatedAt);

  return (
    <div className="mb-8">
      {/* Title + Edit Button */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 mr-4">
          <h1 className="text-4xl font-bold mb-3">{title}</h1>
          {description && (
            <p className="text-lg text-slate">{description}</p>
          )}
        </div>
        <Link
          href={`${path}/edit`}
          className="px-4 py-2 neu-raised hover:bg-darkCard rounded-xl smooth-transition text-sm whitespace-nowrap"
        >
          <Edit className="inline-block mr-2 h-4 w-4" aria-hidden="true" />
          Edit Page
        </Link>
      </div>

      {/* Contributor + Metadata */}
      <div className="flex items-center gap-4 text-sm text-slate mb-4">
        {primaryContributor && (
          <>
            <div className="flex items-center gap-2">
              <ContributorAvatar contributor={primaryContributor} size="sm" />
              <span>Updated by {primaryContributor.name}</span>
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
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Primary category - coral gradient */}
        <span className="px-3 py-1.5 coral-gradient text-white rounded-full text-xs font-semibold shadow-md">
          {category}
        </span>

        {/* Additional tags - neumorphic */}
        {tags?.map(tag => (
          <span
            key={tag}
            className="px-3 py-1.5 neu-raised text-slate rounded-full text-xs font-semibold cursor-pointer smooth-transition hover:bg-darkCard hover:text-white"
          >
            {tag}
          </span>
        ))}

        {/* Reading time badge */}
        {readingTime && (
          <span className="px-3 py-1.5 neu-raised text-slate rounded-full text-xs font-semibold">
            {readingTime} min read
          </span>
        )}
      </div>
    </div>
  );
}

// Helper: Format relative time
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}