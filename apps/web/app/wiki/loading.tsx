/**
 * Loading skeleton for wiki list page
 * Provides instant visual feedback during page load
 */

export default function WikiLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-8 space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-700/50" />
        <div className="h-4 w-64 animate-pulse rounded bg-slate-700/30" />
      </div>

      {/* Search bar skeleton */}
      <div className="mb-6 flex gap-4">
        <div className="h-12 flex-1 animate-pulse rounded-lg bg-slate-700/50" />
        <div className="h-12 w-32 animate-pulse rounded-lg bg-slate-700/50" />
      </div>

      {/* Filters skeleton */}
      <div className="mb-6 flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-slate-700/30" />
        ))}
      </div>

      {/* Wiki cards skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-dark-surface space-y-3 rounded-lg border border-slate-700 p-6"
            style={{
              animationDelay: `${i * 100}ms`,
            }}
          >
            {/* Title */}
            <div className="h-6 w-3/4 animate-pulse rounded bg-slate-700/50" />

            {/* Category badge */}
            <div className="h-5 w-20 animate-pulse rounded-full bg-slate-700/30" />

            {/* Excerpt lines */}
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full animate-pulse rounded bg-slate-700/30" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-slate-700/30" />
              <div className="h-4 w-4/6 animate-pulse rounded bg-slate-700/30" />
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 pt-4">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-700/30" />
              <div className="h-4 w-20 animate-pulse rounded bg-slate-700/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
