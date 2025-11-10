import { ContributorAvatar } from './ContributorAvatar';

interface Contributor {
  name: string;
  avatar?: string;
  editCount: number;
  lastEditAt: string;
}

interface ContributorListProps {
  contributors: Contributor[];
}

export function ContributorList({ contributors }: ContributorListProps) {
  // Sort by edit count, show top 5
  const topContributors = contributors
    .sort((a, b) => b.editCount - a.editCount)
    .slice(0, 5);

  if (topContributors.length === 0) {
    return <p className="text-sm text-slate">No contributors yet</p>;
  }

  return (
    <div className="space-y-3">
      {topContributors.map((contributor) => (
        <div key={contributor.name} className="flex items-center gap-3">
          <ContributorAvatar contributor={contributor} size="sm" showTooltip={false} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{contributor.name}</p>
            <p className="text-xs text-slate">
              {contributor.editCount} {contributor.editCount === 1 ? 'edit' : 'edits'}
            </p>
          </div>
        </div>
      ))}

      {contributors.length > 5 && (
        <button className="text-sm text-coral hover:underline smooth-transition w-full text-left">
          View all {contributors.length} contributors →
        </button>
      )}
    </div>
  );
}