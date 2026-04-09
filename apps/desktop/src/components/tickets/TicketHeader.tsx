import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { TicketResponse } from '@/types/ticket';

interface TicketHeaderProps {
  ticket: TicketResponse;
}

export function TicketHeader({ ticket }: TicketHeaderProps) {
  const navigate = useNavigate();

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 transition-colors mb-3"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="flex items-start gap-3">
        <span className="text-sm font-mono text-gray-500 mt-1">
          #{ticket.ticket_number}
        </span>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-100">{ticket.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={ticket.status}>{ticket.status}</Badge>
            <Badge variant={ticket.priority}>{ticket.priority}</Badge>
            <Badge variant={ticket.kind}>{ticket.kind.replace('_', ' ')}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
