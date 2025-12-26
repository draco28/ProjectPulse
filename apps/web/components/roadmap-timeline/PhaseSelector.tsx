'use client';

/**
 * PhaseSelector - Dropdown to switch between phases
 *
 * Sprint 15 Phase E: Part of the new Phase Timeline view.
 * Displays as a neumorphic dropdown with coral focus styling.
 *
 * @see mockups/alternatives/COMBINED-01-phase-timeline.html
 */

import { ChevronDown } from 'lucide-react';
import type { PhaseSelectorProps } from '@/types/phase-timeline';
import { cn } from '@/lib/utils';

export function PhaseSelector({
  phases,
  selectedPhaseId,
  onPhaseChange,
}: PhaseSelectorProps) {
  const selectedPhase = phases.find((p) => p.id === selectedPhaseId);

  return (
    <div className="relative">
      <select
        value={selectedPhaseId}
        onChange={(e) => onPhaseChange(e.target.value)}
        className={cn(
          'appearance-none cursor-pointer',
          'px-4 py-2.5 pr-10',
          'rounded-xl',
          // Neumorphic styling
          'bg-gradient-to-br from-dark-card to-dark-lighter',
          'border border-white/5',
          'text-text-primary font-medium',
          // Focus state with coral accent
          'focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/30',
          // Transition
          'transition-all duration-200'
        )}
      >
        {phases.map((phase) => (
          <option key={phase.id} value={phase.id} className="bg-dark-card">
            {phase.title}
          </option>
        ))}
      </select>

      {/* Custom dropdown arrow */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <ChevronDown className="h-4 w-4 text-slate" />
      </div>

      {/* Status indicator */}
      {selectedPhase && (
        <div className="pointer-events-none absolute inset-y-0 right-8 flex items-center">
          <span
            className={cn(
              'text-xs font-medium px-1.5 py-0.5 rounded',
              selectedPhase.status === 'COMPLETED' && 'bg-accent-green/15 text-accent-green',
              selectedPhase.status === 'IN_PROGRESS' && 'bg-coral/15 text-coral',
              selectedPhase.status === 'NOT_STARTED' && 'bg-slate/15 text-slate'
            )}
          >
            {selectedPhase.progress}%
          </span>
        </div>
      )}
    </div>
  );
}
