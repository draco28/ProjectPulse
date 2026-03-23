/**
 * Loading skeleton for Sprint Kanban Board
 *
 * Shows while the server component fetches sprint data.
 */

export default function SprintKanbanLoading() {
  return (
    <div className="flex h-screen animate-pulse flex-col bg-dark">
      {/* Header Skeleton */}
      <div className="p-6 pb-0">
        <div className="mb-4 flex items-center justify-between">
          {/* Left: Nav + Title */}
          <div className="flex items-center gap-4">
            <div className="h-8 w-24 rounded bg-slate/20" />
            <span className="text-slate">/</span>
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-slate/30" />
              <div className="h-8 w-32 rounded bg-slate/20" />
            </div>
          </div>
          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <div className="h-10 w-48 rounded-xl bg-slate/10" />
            <div className="h-10 w-28 rounded-xl bg-slate/10" />
            <div className="h-10 w-32 rounded-xl bg-coral/20" />
          </div>
        </div>
        {/* Info bar */}
        <div className="mb-4 flex items-center gap-4">
          <div className="h-4 w-24 rounded bg-slate/10" />
          <div className="h-4 w-20 rounded bg-slate/10" />
          <div className="h-4 w-28 rounded bg-slate/10" />
        </div>
      </div>

      {/* Board Skeleton */}
      <div className="flex flex-1 gap-4 overflow-hidden p-6 pt-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="kanban-column flex min-w-[280px] max-w-[320px] flex-col">
            {/* Column Header */}
            <div className="column-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate/30" />
                  <div className="h-5 w-20 rounded bg-slate/20" />
                </div>
                <div className="h-5 w-8 rounded bg-slate/10" />
              </div>
            </div>
            {/* Column Content */}
            <div className="column-content flex-1 space-y-3">
              {[...Array(3 - Math.floor(i / 2))].map((_, j) => (
                <div key={j} className="h-28 rounded-lg bg-dark-card/50" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Stats Bar Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 h-14 border-t border-white/5 bg-dark-card/80">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 w-24 rounded bg-slate/10" />
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="h-2 w-24 rounded-full bg-slate/10" />
            <div className="h-5 w-12 rounded bg-coral/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
