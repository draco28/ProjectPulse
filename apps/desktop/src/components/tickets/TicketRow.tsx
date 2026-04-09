import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import type { TicketResponse } from '@/types/ticket';

interface TicketRowProps {
  ticket: TicketResponse;
}

export function TicketRow({ ticket }: TicketRowProps) {
  const navigate = useNavigate();

  return (
    <tr
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      className="group cursor-pointer border-b border-gray-800/50 hover:bg-surface-hover transition-colors"
    >
      <td className="py-2.5 px-3 text-xs font-mono text-gray-500">
        #{ticket.ticket_number}
      </td>
      <td className="py-2.5 px-3">
        <span className={`text-sm text-gray-200 ${ticket.closed_at ? 'line-through text-gray-500' : ''}`}>
          {ticket.title}
        </span>
      </td>
      <td className="py-2.5 px-3">
        <Badge variant={ticket.status}>{ticket.status}</Badge>
      </td>
      <td className="py-2.5 px-3">
        <Badge variant={ticket.priority}>{ticket.priority}</Badge>
      </td>
      <td className="py-2.5 px-3">
        <Badge variant={ticket.kind}>{ticket.kind.replace('_', ' ')}</Badge>
      </td>
      <td className="py-2.5 px-3 text-xs text-gray-500 truncate max-w-[120px]">
        {ticket.assignee ?? '—'}
      </td>
    </tr>
  );
}
