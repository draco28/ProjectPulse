'use client';

/**
 * GhostCard Component - Shows ticket from another column
 *
 * Ghost cards appear when a parent/child relationship exists
 * across different columns. They show as dashed-border placeholders
 * that can be clicked to navigate to the actual ticket.
 *
 * @example
 * ```tsx
 * <GhostCard
 *   ghost={ghostCard}
 *   onClick={(ghost) => scrollToTicket(ghost.ticketId)}
 * />
 * ```
 */

import { memo } from 'react';
import type { GhostCard as GhostCardType } from '@/types/kanban';
import { cn } from '@/lib/utils';
import { TicketStatusSystem } from '@/lib/constants/status';

// ============================================================================
// Types
// ============================================================================

interface GhostCardProps {
  /** Ghost card data */
  ghost: GhostCardType;
  /** Click handler - typically scrolls to actual ticket */
  onClick?: (ghost: GhostCardType) => void;
}

// ============================================================================
// Component
// ============================================================================

export const GhostCard = memo(function GhostCard({ ghost, onClick }: GhostCardProps) {
  const actualStatusLabel = TicketStatusSystem.getLabel(ghost.actualStatus);
  const relationLabel = ghost.ghostType === 'parent' ? 'Parent in' : 'Child in';

  return (
    <div
      className={cn(
        // Base ghost styling - dashed border, semi-transparent
        'p-3 rounded-lg cursor-pointer transition-all',
        'border-2 border-dashed border-slate/30',
        'bg-dark-card/30 opacity-50',
        'hover:opacity-75 hover:border-coral/50'
      )}
      onClick={() => onClick?.(ghost)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(ghost);
        }
      }}
      aria-label={`Ghost card for ${ghost.title} - click to view in ${actualStatusLabel}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-slate/60">#{ghost.ticketId}</span>
        <span className="text-[10px] text-slate/60 italic">
          {relationLabel} {actualStatusLabel}
        </span>
      </div>

      {/* Title */}
      <p className="text-xs text-slate/80 line-clamp-1">{ghost.title}</p>

      {/* Kind badge */}
      <div className="mt-2">
        <span className="px-2 py-0.5 text-[10px] rounded bg-slate/10 text-slate/60 uppercase">
          {ghost.kind}
        </span>
      </div>

      {/* "Jump to" hint */}
      <div className="flex items-center gap-1 mt-2 text-[10px] text-coral/60">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
        <span>Click to view</span>
      </div>
    </div>
  );
});

GhostCard.displayName = 'GhostCard';

export default GhostCard;
