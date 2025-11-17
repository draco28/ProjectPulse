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
  roadmap: Pick<Roadmap, 'currentPhase' | 'currentSprint' | 'currentWeek' | 'currentDay' | 'projectId'>;
}

export function CurrentPositionBanner({ roadmap }: CurrentPositionBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!roadmap.currentPhase) {
    return null;
  }

  return (
    <>
      <div className="neu-raised rounded-3xl p-6 mb-6 border-l-4 border-coral">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="icon-coral flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            {/* Title */}
            <h2 className="text-lg font-bold text-white">Current Position</h2>
          </div>

          {/* View Details Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="coral-gradient px-4 py-2 rounded-xl text-sm font-semibold text-white smooth-transition shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            View Details
          </button>
        </div>

        {/* Position Data Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Phase */}
          <div className="neu-pressed rounded-xl p-3">
            <div className="text-xs text-slate mb-1">Phase</div>
            <div className="text-sm font-semibold text-white truncate">{roadmap.currentPhase}</div>
          </div>

          {/* Sprint */}
          {roadmap.currentSprint && (
            <div className="neu-pressed rounded-xl p-3">
              <div className="text-xs text-slate mb-1">Sprint</div>
              <div className="text-sm font-semibold text-white truncate">{roadmap.currentSprint}</div>
            </div>
          )}

          {/* Week */}
          {roadmap.currentWeek && (
            <div className="neu-pressed rounded-xl p-3">
              <div className="text-xs text-slate mb-1">Week</div>
              <div className="text-sm font-semibold text-white truncate">{roadmap.currentWeek}</div>
            </div>
          )}

          {/* Day */}
          {roadmap.currentDay && (
            <div className="neu-pressed rounded-xl p-3">
              <div className="text-xs text-slate mb-1">Day</div>
              <div className="text-sm font-semibold text-white truncate">{roadmap.currentDay}</div>
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
