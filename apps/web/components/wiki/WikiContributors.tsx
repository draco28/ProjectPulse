import { ContributorList } from './ContributorList';
import { PageStats } from './PageStats';
import { FeedbackButtons } from './FeedbackButtons';

interface Contributor {
  name: string;
  avatar?: string;
  editCount: number;
  lastEditAt: string;
}

interface WikiContributorsProps {
  contributors: Contributor[];
  stats: {
    views: number;
    revisions: number;
    uniqueVisitors?: number | null;
    helpfulRatio?: number | null;
    avgReadTimeMs?: number | null;
  };
  pageId: number;
  slug: string;
}

export function WikiContributors({ contributors, stats, pageId, slug }: WikiContributorsProps) {
  return (
    <aside className="w-64 flex-shrink-0">
      <div className="sticky top-24 space-y-6">
        {/* Contributors */}
        <div className="neu-raised rounded-xl p-4">
          <h3 className="mb-4 text-sm font-semibold">Contributors</h3>
          <ContributorList contributors={contributors} />
        </div>

        {/* Page Stats */}
        <div className="neu-raised rounded-xl p-4">
          <h3 className="mb-4 text-sm font-semibold">Page Stats</h3>
          <PageStats
            views={stats.views}
            revisions={stats.revisions}
            uniqueVisitors={stats.uniqueVisitors}
            helpfulRatio={stats.helpfulRatio}
            avgReadTimeMs={stats.avgReadTimeMs}
          />
        </div>

        {/* Feedback (Client Component) */}
        <div className="neu-raised rounded-xl p-4">
          <h3 className="mb-4 text-sm font-semibold">Was this helpful?</h3>
          <FeedbackButtons pageId={pageId} slug={slug} />
        </div>
      </div>
    </aside>
  );
}
