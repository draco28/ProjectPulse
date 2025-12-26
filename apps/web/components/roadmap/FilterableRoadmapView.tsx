'use client';

/**
 * @deprecated Sprint 15 Phase E - Replaced by components/roadmap-timeline/
 * This component will be removed in Sprint 16.
 * Use PhaseTimelineClient from components/roadmap-timeline instead.
 *
 * FilterableRoadmapView Component - Standalone Roadmap UI Phase D
 *
 * Wrapper component that allows toggling between Tree and Timeline views
 * Handles responsive behavior (mobile defaults to tree)
 */

import { useState, useEffect } from 'react';
import type { RoadmapWithRelations } from '@/types/roadmap';
import { ViewToggle } from './ViewToggle';
import { FilterableRoadmapTree } from './FilterableRoadmapTree';
import { RoadmapTimeline } from './timeline/RoadmapTimeline';

interface FilterableRoadmapViewProps {
  roadmap: RoadmapWithRelations;
}

export function FilterableRoadmapView({ roadmap }: FilterableRoadmapViewProps) {
  const [view, setView] = useState<'tree' | 'timeline'>('tree');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Force tree view on mobile
  const effectiveView = isMobile ? 'tree' : view;

  return (
    <div className="space-y-4">
      {/* View Toggle (hidden on mobile) */}
      {!isMobile && (
        <div className="flex justify-end">
          <ViewToggle view={effectiveView} onChange={setView} />
        </div>
      )}

      {/* Mobile notice */}
      {isMobile && view === 'timeline' && (
        <div className="neu-flat rounded-xl p-3 text-center">
          <p className="text-xs text-slate">
            Timeline view is not available on mobile. Showing tree view.
          </p>
        </div>
      )}

      {/* View Content */}
      {effectiveView === 'tree' ? (
        <FilterableRoadmapTree roadmap={roadmap} />
      ) : (
        <RoadmapTimeline
          phases={roadmap.phases_rel}
          currentPhase={roadmap.currentPhase}
          currentSprint={roadmap.currentSprint}
        />
      )}
    </div>
  );
}
