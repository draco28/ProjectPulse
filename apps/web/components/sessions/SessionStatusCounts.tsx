'use client';

/**
 * SessionStatusCounts - Status counts card for page header
 *
 * Sprint 15 Phase F
 *
 * Features:
 * - Neumorphic card styling
 * - Green pulse dot for active sessions
 * - Yellow dot for paused sessions
 * - Compact inline layout
 */

import { memo } from 'react';
import type { SessionCounts } from '@/types/sessions';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface SessionStatusCountsProps {
  counts: SessionCounts;
  isLoading?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const SessionStatusCounts = memo(function SessionStatusCounts({
  counts,
  isLoading = false,
}: SessionStatusCountsProps) {
  return (
    <div className="neu-raised px-4 py-2.5 rounded-xl inline-flex items-center gap-4">
      {/* Active Count */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'w-2 h-2 rounded-full bg-green-500',
            counts.active > 0 && 'animate-pulse pulse-green'
          )}
        />
        <span className="text-sm font-medium text-white">
          {isLoading ? '—' : counts.active} Active
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-white/10" />

      {/* Paused Count */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-yellow-500" />
        <span className="text-sm font-medium text-slate">
          {isLoading ? '—' : counts.paused} Paused
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-white/10" />

      {/* Completed Count (today) */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-slate/50" />
        <span className="text-sm text-slate">
          {isLoading ? '—' : counts.completed} Completed
        </span>
      </div>
    </div>
  );
});

SessionStatusCounts.displayName = 'SessionStatusCounts';

export default SessionStatusCounts;
