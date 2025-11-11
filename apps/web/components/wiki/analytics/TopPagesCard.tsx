interface TopPage {
  id: number;
  title: string;
  path: string;
  category: string;
  views: number;
  popularity: number;
  trend: number;
  updatedAt: string;
}

interface TopPagesCardProps {
  pages: TopPage[];
}

export function TopPagesCard({ pages }: TopPagesCardProps) {
  if (!pages.length) {
    return (
      <div className="neu-raised rounded-3xl p-5 text-slate">
        <h2 className="text-lg font-semibold text-white">Top Pages</h2>
        <p className="mt-4 text-sm text-slate">No analytics yet. Check back after users visit the wiki.</p>
      </div>
    );
  }

  return (
    <div className="neu-raised rounded-3xl p-5">
      <h2 className="text-lg font-semibold text-white">Top Pages</h2>
      <div className="mt-4 space-y-4">
        {pages.map((page, index) => (
          <div key={page.id} className="rounded-2xl bg-black/20 p-4">
            <div className="flex items-center justify-between text-sm text-slate">
              <span className="font-semibold text-white">{index + 1}. {page.title}</span>
              <span>{page.views.toLocaleString()} views</span>
            </div>
            <div className="mt-2 text-xs text-slate">/{page.path}</div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate">
              <span className="rounded-full bg-black/30 px-2 py-0.5 text-white/80">{page.category}</span>
              <span>{page.popularity.toFixed(1)} popularity</span>
              <span className={page.trend >= 1 ? 'text-green-400' : 'text-slate'}>
                {page.trend >= 1 ? '+' : ''}
                {page.trend.toFixed(2)} trend
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
