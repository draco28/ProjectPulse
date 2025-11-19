/**
 * PhaseNavigator Component
 *
 * Progress bar + phase selector for Session 1 wizard
 */

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface PhaseNavigatorProps {
  currentPhase: number;
  totalPhases: number;
  completedPhases: number[];
  onPhaseSelect?: (phase: number) => void;
}

export function PhaseNavigator({
  currentPhase,
  totalPhases,
  completedPhases,
  onPhaseSelect,
}: PhaseNavigatorProps) {
  const progress = (currentPhase / totalPhases) * 100;

  return (
    <div className="mb-8">
      {/* Progress Text */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-slate">
          Phase {currentPhase} of {totalPhases}
        </span>
        <span className="text-sm font-semibold text-white">
          {Math.round(progress)}% Complete
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-700/30 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-coral-500 to-coral-400 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Phase Dots */}
      <div className="flex justify-between items-center gap-2">
        {Array.from({ length: totalPhases }, (_, i) => {
          const phase = i + 1;
          const isCompleted = completedPhases.includes(phase);
          const isCurrent = phase === currentPhase;
          const isClickable = onPhaseSelect && (isCompleted || phase <= currentPhase);

          return (
            <button
              key={phase}
              onClick={() => isClickable && onPhaseSelect(phase)}
              disabled={!isClickable}
              className={cn(
                'flex items-center justify-center h-8 w-8 rounded-full text-xs font-semibold transition-all',
                isCurrent && 'bg-coral-500 text-white shadow-lg scale-110',
                isCompleted && !isCurrent && 'bg-green-500 text-white',
                !isCurrent && !isCompleted && 'bg-slate-700/30 text-slate-400',
                isClickable && 'cursor-pointer hover:scale-105',
                !isClickable && 'cursor-not-allowed'
              )}
              title={`Phase ${phase}`}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : phase}
            </button>
          );
        })}
      </div>
    </div>
  );
}
