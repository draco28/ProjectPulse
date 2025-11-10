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
  views: number;
  revisions: number;
  pageId: number;  // For feedback tracking
}

export function WikiContributors({
  contributors,
  views,
  revisions,
  pageId
}: WikiContributorsProps) {
  return (
    <aside className="w-64 flex-shrink-0">
      <div className="sticky top-24 space-y-6">
        {/* Contributors */}
        <div className="neu-raised rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-4">Contributors</h3>
          <ContributorList contributors={contributors} />
        </div>

        {/* Page Stats */}
        <div className="neu-raised rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-4">Page Stats</h3>
          <PageStats views={views} revisions={revisions} />
        </div>

        {/* Feedback (Client Component) */}
        <div className="neu-raised rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-4">Was this helpful?</h3>
          <FeedbackButtons pageId={pageId} />
        </div>
      </div>
    </aside>
  );
}