/**
 * Loading skeleton for Sprint Kanban Board
 *
 * Shows while the server component fetches sprint data.
 */

export default function SprintKanbanLoading() {
  return (
    <div className="h-screen flex flex-col bg-dark animate-pulse">
      {/* Header Skeleton */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-4">
          {/* Left: Nav + Title */}
          <div className="flex items-center gap-4">
            <div className="h-8 w-24 bg-slate/20 rounded" />
            <span className="text-slate">/</span>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-slate/30" />
              <div className="h-8 w-32 bg-slate/20 rounded" />
            </div>
          </div>
          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <div className="h-10 w-48 bg-slate/10 rounded-xl" />
            <div className="h-10 w-28 bg-slate/10 rounded-xl" />
            <div className="h-10 w-32 bg-coral/20 rounded-xl" />
          </div>
        </div>
        {/* Info bar */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-4 w-24 bg-slate/10 rounded" />
          <div className="h-4 w-20 bg-slate/10 rounded" />
          <div className="h-4 w-28 bg-slate/10 rounded" />
        </div>
      </div>

      {/* Board Skeleton */}
      <div className="flex gap-4 p-6 pt-2 flex-1 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="kanban-column flex flex-col min-w-[280px] max-w-[320px]">
            {/* Column Header */}
            <div className="column-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate/30" />
                  <div className="h-5 w-20 bg-slate/20 rounded" />
                </div>
                <div className="h-5 w-8 bg-slate/10 rounded" />
              </div>
            </div>
            {/* Column Content */}
            <div className="column-content flex-1 space-y-3">
              {[...Array(3 - Math.floor(i / 2))].map((_, j) => (
                <div key={j} className="h-28 bg-dark-card/50 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Stats Bar Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-dark-card/80 border-t border-white/5">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-6 h-full">
          <div className="flex items-center gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 w-24 bg-slate/10 rounded" />
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="h-2 w-24 bg-slate/10 rounded-full" />
            <div className="h-5 w-12 bg-coral/20 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
