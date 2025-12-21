/**
 * CurrentPositionBanner Component - Sprint 8.5
 *
 * Displays current position in roadmap hierarchy with premium neumorphic design:
 * - Coral icon and border accent
 * - Current Phase, Sprint, Week, Day in grid layout
 * - Coral gradient "View Details" button
 * - Opens CurrentWorkModal on click
 */

'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import type { Roadmap } from '@prisma/client';
import { CurrentWorkModal } from './CurrentWorkModal';

interface CurrentPositionBannerProps {
  roadmap: Pick<
    Roadmap,
    'currentPhase' | 'currentSprint' | 'currentWeek' | 'currentDay' | 'projectId'
  >;
}

export function CurrentPositionBanner({ roadmap }: CurrentPositionBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!roadmap.currentPhase) {
    return null;
  }

  return (
    <>
      <div className="neu-raised mb-6 rounded-3xl border-l-4 border-coral p-6">
        {/* Header Row */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="icon-coral flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            {/* Title */}
            <h2 className="text-lg font-bold text-white">Current Position</h2>
          </div>

          {/* View Details Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="coral-gradient smooth-transition rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg hover:-translate-y-1 hover:shadow-xl"
          >
            View Details
          </button>
        </div>

        {/* Position Data Grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {/* Phase */}
          <div className="neu-pressed rounded-xl p-3">
            <div className="mb-1 text-xs text-slate">Phase</div>
            <div className="truncate text-sm font-semibold text-white">{roadmap.currentPhase}</div>
          </div>

          {/* Sprint */}
          {roadmap.currentSprint && (
            <div className="neu-pressed rounded-xl p-3">
              <div className="mb-1 text-xs text-slate">Sprint</div>
              <div className="truncate text-sm font-semibold text-white">
                {roadmap.currentSprint}
              </div>
            </div>
          )}

          {/* Week */}
          {roadmap.currentWeek && (
            <div className="neu-pressed rounded-xl p-3">
              <div className="mb-1 text-xs text-slate">Week</div>
              <div className="truncate text-sm font-semibold text-white">{roadmap.currentWeek}</div>
            </div>
          )}

          {/* Day */}
          {roadmap.currentDay && (
            <div className="neu-pressed rounded-xl p-3">
              <div className="mb-1 text-xs text-slate">Day</div>
              <div className="truncate text-sm font-semibold text-white">{roadmap.currentDay}</div>
            </div>
          )}
        </div>
      </div>

      <CurrentWorkModal
        projectId={roadmap.projectId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
