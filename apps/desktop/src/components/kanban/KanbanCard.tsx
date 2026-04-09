import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import type { KanbanTicket } from '@/types/kanban';

interface KanbanCardProps {
  ticket: KanbanTicket;
}

export function KanbanCard({ ticket }: KanbanCardProps) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      className={`group rounded-lg bg-surface-raised border border-gray-700/40 p-3 cursor-grab active:cursor-grabbing hover:border-gray-600 transition-all ${
        isDragging ? 'opacity-50 scale-105 rotate-1 shadow-xl' : 'hover:-translate-y-0.5 hover:shadow-md'
      }`}
    >
      {/* Header: ticket number + kind */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-mono text-gray-500">#{ticket.ticket_number}</span>
        <Badge variant={ticket.kind}>{ticket.kind.replace('_', ' ')}</Badge>
      </div>

      {/* Title */}
      <p className="text-sm text-gray-200 line-clamp-2 leading-snug">{ticket.title}</p>

      {/* Footer: priority + assignee */}
      <div className="flex items-center justify-between mt-2">
        {ticket.priority && ticket.priority !== 'medium' && (
          <Badge variant={ticket.priority}>{ticket.priority}</Badge>
        )}
        {!ticket.priority || ticket.priority === 'medium' ? <span /> : null}
        {ticket.assignee && (
          <span className="text-xs text-gray-500 truncate max-w-[80px]">
            {ticket.assignee}
          </span>
        )}
      </div>
    </div>
  );
}
