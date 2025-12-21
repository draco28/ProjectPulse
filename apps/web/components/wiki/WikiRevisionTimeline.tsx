import { formatDistanceToNow } from 'date-fns';
import { RevisionDiffViewer } from './RevisionDiffViewer';

export interface WikiRevisionSummary {
  version: number;
  createdAt: string;
  createdBy: string;
  createdByType: string;
  diffSummary?: string | null;
}

interface WikiRevisionTimelineProps {
  slug: string;
  revisions: WikiRevisionSummary[];
  currentVersion: number;
}

export function WikiRevisionTimeline({
  slug,
  revisions,
  currentVersion,
}: WikiRevisionTimelineProps) {
  if (!revisions.length) {
    return null;
  }

  return (
    <section className="mt-10 rounded-3xl bg-black/10 p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate">Revision History</p>
          <h2 className="text-2xl font-semibold text-white">Changes & Rollbacks</h2>
        </div>
        <div className="rounded-full bg-black/30 px-3 py-1 text-xs text-slate">
          Current version v{currentVersion}
        </div>
      </header>

      <ol className="space-y-4">
        {revisions.map((revision, index) => {
          const relativeTime = formatDistanceToNow(new Date(revision.createdAt), {
            addSuffix: true,
          });
          const isMostRecent = index === 0;

          return (
            <li
              key={revision.version}
              className="rounded-2xl border border-white/5 bg-black/20 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate">
                    Version v{revision.version}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate">
                    <span className="font-semibold text-white">{revision.createdBy}</span>
                    <span className="h-1 w-1 rounded-full bg-slate/50" aria-hidden="true" />
                    <span>{relativeTime}</span>
                    <span className="h-1 w-1 rounded-full bg-slate/50" aria-hidden="true" />
                    <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs uppercase tracking-wide text-white/70">
                      {revision.createdByType}
                    </span>
                  </div>
                </div>
                {isMostRecent && (
                  <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold text-coral">
                    Latest snapshot
                  </span>
                )}
              </div>

              {revision.diffSummary && (
                <p className="mt-3 text-sm text-slate">{revision.diffSummary}</p>
              )}

              <RevisionDiffViewer slug={slug} version={revision.version} isLatest={isMostRecent} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
