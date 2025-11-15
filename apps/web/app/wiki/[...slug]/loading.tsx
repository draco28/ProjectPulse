/**
 * Loading skeleton for individual wiki page
 * Shows while markdown content is being fetched and rendered
 */

export default function WikiPageLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_250px]">
        {/* Main content area */}
        <article className="space-y-6">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 animate-pulse rounded bg-slate-700/30" />
            <span className="text-slate-600">/</span>
            <div className="h-4 w-32 animate-pulse rounded bg-slate-700/30" />
          </div>

          {/* Title */}
          <div className="h-12 w-3/4 animate-pulse rounded-lg bg-slate-700/50" />

          {/* Metadata */}
          <div className="flex items-center gap-4 border-b border-slate-700 pb-4">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-700/30" />
            <div className="h-4 w-32 animate-pulse rounded bg-slate-700/30" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-slate-700/30" />
          </div>

          {/* Content paragraphs */}
          <div className="space-y-4 pt-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-slate-700/30" />
                <div className="h-4 w-11/12 animate-pulse rounded bg-slate-700/30" />
                <div className="h-4 w-10/12 animate-pulse rounded bg-slate-700/30" />
                {i % 3 === 0 && (
                  <div className="mt-4 h-32 w-full animate-pulse rounded-lg bg-slate-700/20" />
                )}
              </div>
            ))}
          </div>
        </article>

        {/* Table of Contents sidebar skeleton */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <div className="h-6 w-32 animate-pulse rounded bg-slate-700/50" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-4 animate-pulse rounded bg-slate-700/30"
                  style={{
                    width: `${60 + Math.random() * 40}%`,
                    marginLeft: i % 2 === 0 ? '0' : '1rem',
                  }}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
