'use client';

/**
 * TimelineLegend Component
 *
 * Status color legend for timeline
 */

export function TimelineLegend() {
  const statuses = [
    { label: 'Not Started', color: 'bg-slate-500' },
    { label: 'In Progress', color: 'bg-blue-500' },
    { label: 'Completed', color: 'bg-green-500' },
    { label: 'Blocked', color: 'bg-red-500' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-6">
      <span className="text-xs font-medium text-slate">Legend:</span>
      {statuses.map((status) => (
        <div key={status.label} className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded ${status.color}`} />
          <span className="text-xs text-slate">{status.label}</span>
        </div>
      ))}
    </div>
  );
}
