/**
 * LabelBadge Component (Sprint 11.7 - Labels Feature)
 *
 * Reusable badge component for displaying labels with color accent.
 * Matches the existing neumorphic design system.
 *
 * Reference: TicketDetailSidebar.tsx (lines 77-83)
 */

import { cn } from '@/lib/utils';

export interface LabelBadgeProps {
  id: number | string;
  name: string;
  color: string;
}

interface LabelBadgeComponentProps {
  label: LabelBadgeProps;
  /** Size variant: 'sm' for list cards, 'md' for detail views */
  size?: 'sm' | 'md';
  /** Optional click handler (for interactive labels) */
  onClick?: () => void;
  /** Whether the label can be removed (shows X button) */
  removable?: boolean;
  /** Callback when remove is clicked */
  onRemove?: () => void;
  /** Additional class names */
  className?: string;
}

export function LabelBadge({
  label,
  size = 'md',
  onClick,
  removable = false,
  onRemove,
  className,
}: LabelBadgeComponentProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <span
      className={cn(
        'neu-pressed inline-flex items-center gap-1 rounded-full font-semibold text-slate transition-all',
        sizeClasses[size],
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      style={{ borderLeft: `3px solid ${label.color}` }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {label.name}
      {removable && onRemove && (
        <button
          type="button"
          onClick={handleRemove}
          className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-white/10"
          aria-label={`Remove ${label.name} label`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'}
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </span>
  );
}

/**
 * LabelBadgeList - Helper component to display multiple labels with overflow handling
 */
interface LabelBadgeListProps {
  labels: LabelBadgeProps[];
  /** Maximum number of labels to show before "+N more" */
  maxVisible?: number;
  /** Size variant for all badges */
  size?: 'sm' | 'md';
  /** Click handler for individual labels */
  onLabelClick?: (label: LabelBadgeProps) => void;
  /** Additional class names for the container */
  className?: string;
}

export function LabelBadgeList({
  labels,
  maxVisible = 3,
  size = 'md',
  onLabelClick,
  className,
}: LabelBadgeListProps) {
  if (labels.length === 0) return null;

  const visibleLabels = labels.slice(0, maxVisible);
  const remainingCount = labels.length - maxVisible;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {visibleLabels.map((label) => (
        <LabelBadge
          key={label.id}
          label={label}
          size={size}
          onClick={onLabelClick ? () => onLabelClick(label) : undefined}
        />
      ))}
      {remainingCount > 0 && (
        <span
          className={cn(
            'text-slate',
            size === 'sm' ? 'text-[10px]' : 'text-xs'
          )}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
