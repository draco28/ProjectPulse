const variantStyles: Record<string, string> = {
  // Status
  backlog: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
  todo: 'bg-coral/15 text-coral-light border-coral/30',
  'in-progress': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'in-review': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  done: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  // Priority
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  low: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  // Kind
  feature: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  task: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  bug: 'bg-red-500/15 text-red-400 border-red-500/30',
  issue: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  tech_debt: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  epic: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

interface BadgeProps {
  variant: string;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className = '' }: BadgeProps) {
  const style = variantStyles[variant] ?? variantStyles.task;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style} ${className}`}
    >
      {children}
    </span>
  );
}
