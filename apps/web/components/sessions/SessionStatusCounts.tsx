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
    <div className="neu-raised inline-flex items-center gap-4 rounded-xl px-4 py-2.5">
      {/* Active Count */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'h-2 w-2 rounded-full bg-green-500',
            counts.active > 0 && 'pulse-green animate-pulse'
          )}
        />
        <span className="text-sm font-medium text-white">
          {isLoading ? '—' : counts.active} Active
        </span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-white/10" />

      {/* Paused Count */}
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-yellow-500" />
        <span className="text-sm font-medium text-slate">
          {isLoading ? '—' : counts.paused} Paused
        </span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-white/10" />

      {/* Completed Count (today) */}
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-slate/50" />
        <span className="text-sm text-slate">{isLoading ? '—' : counts.completed} Completed</span>
      </div>
    </div>
  );
});

SessionStatusCounts.displayName = 'SessionStatusCounts';

export default SessionStatusCounts;
