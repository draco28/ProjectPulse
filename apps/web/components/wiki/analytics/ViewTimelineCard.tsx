'use client';

interface ViewTimelineCardProps {
  data: Array<{ label: string; count: number }>;
}

export function ViewTimelineCard({ data }: ViewTimelineCardProps) {
  const max = Math.max(...data.map((point) => point.count), 1);

  return (
    <div className="neu-raised rounded-3xl p-6">
      <h2 className="text-lg font-semibold text-white">Views (Last 7 Days)</h2>
      {data.length === 0 ? (
        <p className="mt-4 text-sm text-slate">No view events recorded yet.</p>
      ) : (
        <div className="mt-6 grid grid-cols-7 gap-3">
          {data.map((point) => (
            <div key={point.label} className="flex flex-col items-center gap-2 text-xs text-slate">
              <div className="flex h-32 w-3 items-end rounded-full bg-black/30">
                <div
                  className="w-full rounded-full bg-coral transition-all"
                  style={{ height: `${(point.count / max) * 100 || 5}%` }}
                  aria-label={`${point.count} views on ${point.label}`}
                />
              </div>
              <span className="text-white/70">{new Date(point.label).getDate()}</span>
              <span>{point.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
