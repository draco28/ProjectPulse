import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import type { KanbanColumn as KanbanColumnType } from '@/types/kanban';

const statusColors: Record<string, string> = {
  backlog: 'bg-gray-500',
  todo: 'bg-coral',
  'in-progress': 'bg-amber-400',
  'in-review': 'bg-purple-400',
  done: 'bg-emerald-400',
};

const statusLabels: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  done: 'Done',
};

interface KanbanColumnProps {
  column: KanbanColumnType;
}

export function KanbanColumn({ column }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: column.status });

  return (
    <div className="flex flex-col min-w-[220px] max-w-[280px] flex-1">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2.5 h-2.5 rounded-full ${statusColors[column.status] ?? 'bg-gray-500'} ${
          column.status === 'in-progress' ? 'animate-pulse' : ''
        }`} />
        <span className="text-sm font-medium text-gray-300">
          {statusLabels[column.status] ?? column.status}
        </span>
        <span className="ml-auto text-xs text-gray-500 bg-surface-overlay px-1.5 py-0.5 rounded">
          {column.count}
        </span>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2 min-h-[200px] rounded-lg bg-surface/50 p-2"
      >
        <SortableContext
          items={column.tickets.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tickets.map((ticket) => (
            <KanbanCard key={ticket.id} ticket={ticket} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
