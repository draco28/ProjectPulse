'use client';

/**
 * MiniKanbanPreview - Live column counts for current sprint
 *
 * Sprint 15 Phase E: Part of the new Phase Timeline view.
 * Renders a compact 4-column preview (excluding backlog) showing
 * ticket counts per status. Reuses the existing useKanbanBoard hook.
 *
 * @see mockups/alternatives/COMBINED-01-phase-timeline.html
 */

import { useKanbanBoard } from '@/hooks/useKanbanBoard';
import { TICKET_STATUSES } from '@/lib/constants/status';
import { cn } from '@/lib/utils';
import type { MiniKanbanPreviewProps } from '@/types/phase-timeline';

/**
 * Status configuration for mini kanban columns.
 */
const MINI_COLUMNS = [
  {
    status: TICKET_STATUSES.TODO,
    label: 'To Do',
    colorClass: 'bg-coral',
    textClass: 'text-coral',
  },
  {
    status: TICKET_STATUSES.IN_PROGRESS,
    label: 'Active',
    colorClass: 'bg-accent-yellow',
    textClass: 'text-accent-yellow',
    pulse: true,
  },
  {
    status: TICKET_STATUSES.IN_REVIEW,
    label: 'Review',
    colorClass: 'bg-accent-purple',
    textClass: 'text-accent-purple',
  },
  {
    status: TICKET_STATUSES.DONE,
    label: 'Done',
    colorClass: 'bg-accent-green',
    textClass: 'text-accent-green',
  },
] as const;

/**
 * Skeleton loader for mini kanban columns.
 */
function MiniKanbanSkeleton() {
  return (
    <div className="flex gap-3 mb-4">
      {MINI_COLUMNS.map((col) => (
        <div
          key={col.status}
          className="flex-1 min-w-[90px] bg-dark-pressed/50 rounded-lg p-2 animate-pulse"
        >
          <div className="h-3 w-12 bg-dark-lighter rounded mb-2" />
          <div className="h-12 bg-dark-lighter rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Single mini ticket card.
 */
function MiniTicketCard({
  id,
  title,
  hasBorder,
}: {
  id: number;
  title: string;
  hasBorder?: boolean;
}) {
  return (
    <div
      className={cn(
        'bg-gradient-to-br from-[#333] to-dark-card rounded-lg p-2 transition-all',
        hasBorder && 'shadow-[inset_0_0_0_1px_rgba(255,139,106,0.5)]'
      )}
    >
      <div className="text-[9px] text-slate mb-0.5 font-mono">#{id}</div>
      <div className="text-[11px] leading-tight line-clamp-2">{title}</div>
    </div>
  );
}

/**
 * Mini kanban column.
 */
function MiniColumn({
  status,
  label,
  colorClass,
  textClass,
  pulse,
  tickets,
  maxDisplay = 2,
}: {
  status: string;
  label: string;
  colorClass: string;
  textClass: string;
  pulse?: boolean;
  tickets: Array<{ id: number; title: string }>;
  maxDisplay?: number;
}) {
  const displayTickets = tickets.slice(0, maxDisplay);
  const remaining = tickets.length - maxDisplay;

  return (
    <div className="flex-1 min-w-[90px] bg-dark-pressed/50 rounded-lg p-2">
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <div
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            colorClass,
            pulse && 'animate-pulse'
          )}
        />
        <span
          className={cn('text-[10px] font-medium uppercase tracking-wide', textClass)}
        >
          {label}
        </span>
        <span className={cn('text-[10px] opacity-60', textClass)}>
          ({tickets.length})
        </span>
      </div>

      {/* Tickets */}
      <div className="space-y-1.5 max-h-[140px] overflow-y-auto scrollbar-thin">
        {displayTickets.map((ticket, index) => (
          <MiniTicketCard
            key={ticket.id}
            id={ticket.id}
            title={ticket.title}
            hasBorder={index === 0 && status === TICKET_STATUSES.IN_PROGRESS}
          />
        ))}

        {remaining > 0 && (
          <div className="text-center py-1">
            <span className="text-[10px] text-slate opacity-50">
              +{remaining} more
            </span>
          </div>
        )}

        {tickets.length === 0 && (
          <div className="text-center py-2">
            <span className="text-[10px] text-slate opacity-50">Empty</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main MiniKanbanPreview component.
 */
export function MiniKanbanPreview({ sprintId }: MiniKanbanPreviewProps) {
  const { boardQuery } = useKanbanBoard(sprintId);
  const columns = boardQuery.data?.columns;

  if (boardQuery.isLoading) {
    return <MiniKanbanSkeleton />;
  }

  if (boardQuery.isError || !columns) {
    return (
      <div className="flex gap-3 mb-4 opacity-50">
        <div className="flex-1 bg-dark-pressed/50 rounded-lg p-4 text-center">
          <span className="text-xs text-slate">Unable to load preview</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-4">
      {MINI_COLUMNS.map((col) => {
        const tickets = columns[col.status] ?? [];
        return (
          <MiniColumn
            key={col.status}
            status={col.status}
            label={col.label}
            colorClass={col.colorClass}
            textClass={col.textClass}
            pulse={'pulse' in col ? col.pulse : undefined}
            tickets={tickets.map((t) => ({ id: t.id, title: t.title }))}
          />
        );
      })}
    </div>
  );
}
