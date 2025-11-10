interface PageStatsProps {
  views: number;
  revisions: number;
}

export function PageStats({ views, revisions }: PageStatsProps) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-slate">Views</span>
        <span className="font-medium">{views.toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate">Revisions</span>
        <span className="font-medium">{revisions}</span>
      </div>
    </div>
  );
}