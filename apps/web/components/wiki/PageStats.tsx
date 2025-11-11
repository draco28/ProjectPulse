interface PageStatsProps {
  views: number;
  revisions: number;
  uniqueVisitors?: number | null;
  helpfulRatio?: number | null;
  avgReadTimeMs?: number | null;
}

export function PageStats({
  views,
  revisions,
  uniqueVisitors,
  helpfulRatio,
  avgReadTimeMs,
}: PageStatsProps) {
  return (
    <div className="space-y-3 text-sm">
      <StatRow label="Views" value={views.toLocaleString()} />
      {uniqueVisitors !== undefined && uniqueVisitors !== null && (
        <StatRow label="Visitors" value={uniqueVisitors.toLocaleString()} />
      )}
      {helpfulRatio !== undefined && helpfulRatio !== null && (
        <StatRow label="Helpful" value={`${helpfulRatio}%`} />
      )}
      {avgReadTimeMs ? (
        <StatRow label="Avg. Read Time" value={`${Math.round(avgReadTimeMs / 1000 / 60)} min`} />
      ) : null}
      <StatRow label="Revisions" value={revisions.toString()} />
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
