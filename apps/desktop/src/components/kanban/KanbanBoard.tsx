import { useCallback, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { isRestrictedMove, useMoveTicket } from '@/hooks/useMoveTicket';
import { useReorderTickets } from '@/hooks/useReorderTickets';
import type { KanbanBoard as KanbanBoardType, KanbanTicket, TicketStatus } from '@/types/kanban';

interface KanbanBoardProps {
  board: KanbanBoardType;
  sprintId: string;
}

export function KanbanBoard({ board, sprintId }: KanbanBoardProps) {
  const [activeTicket, setActiveTicket] = useState<KanbanTicket | null>(null);
  const moveTicket = useMoveTicket(sprintId);
  const reorderTickets = useReorderTickets(sprintId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const findTicketAndColumn = useCallback(
    (ticketId: number) => {
      for (const col of board.columns) {
        const ticket = col.tickets.find((t) => t.id === ticketId);
        if (ticket) return { ticket, column: col };
      }
      return null;
    },
    [board],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const found = findTicketAndColumn(event.active.id as number);
      setActiveTicket(found?.ticket ?? null);
    },
    [findTicketAndColumn],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTicket(null);
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as number;
      const overId = over.id;

      const source = findTicketAndColumn(activeId);
      if (!source) return;

      // Determine destination column
      let destStatus: TicketStatus;
      const overColumn = board.columns.find((c) => c.status === overId);

      if (overColumn) {
        // Dropped directly on a column
        destStatus = overColumn.status;
      } else {
        // Dropped on another ticket — find which column it belongs to
        const overTicket = findTicketAndColumn(overId as number);
        if (!overTicket) return;
        destStatus = overTicket.column.status;
      }

      const sourceStatus = source.column.status;

      // Check restricted moves
      if (isRestrictedMove(sourceStatus, destStatus)) {
        return; // Silently reject — agent-only move
      }

      if (sourceStatus === destStatus) {
        // Same column reorder
        const col = board.columns.find((c) => c.status === sourceStatus);
        if (col) {
          const ids = col.tickets.map((t) => t.id);
          const oldIdx = ids.indexOf(activeId);
          const newIdx = ids.indexOf(overId as number);
          if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
            ids.splice(oldIdx, 1);
            ids.splice(newIdx, 0, activeId);
            reorderTickets.mutate({ ticketIds: ids, status: sourceStatus });
          }
        }
      } else {
        // Cross-column move
        const destCol = board.columns.find((c) => c.status === destStatus);
        const displayOrder = destCol ? destCol.tickets.length : 0;
        moveTicket.mutate({
          ticketId: activeId,
          status: destStatus,
          displayOrder,
        });
      }
    },
    [board, findTicketAndColumn, moveTicket, reorderTickets],
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {board.columns.map((column) => (
          <KanbanColumn key={column.status} column={column} />
        ))}
      </div>

      <DragOverlay>
        {activeTicket ? (
          <div className="rotate-2 shadow-2xl ring-2 ring-coral/50 rounded-lg">
            <KanbanCard ticket={activeTicket} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
