/**
 * ProgressBar Component
 *
 * Reusable animated progress bar with color gradient
 */

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({ value, label, showPercentage = false, className }: ProgressBarProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(Math.max(value, 0), 100);

  // Color based on progress
  const getColorClass = () => {
    if (clampedValue < 33) return 'bg-red-500';
    if (clampedValue < 66) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Label and Percentage */}
      {(label || showPercentage) && (
        <div className="mb-2 flex items-center justify-between">
          {label && <span className="text-sm font-medium text-slate">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-semibold text-white">{Math.round(clampedValue)}%</span>
          )}
        </div>
      )}

      {/* Progress Bar Track */}
      <div className="h-2 overflow-hidden rounded-full bg-slate-700/30">
        {/* Progress Bar Fill */}
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            getColorClass()
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
