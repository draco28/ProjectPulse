import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import type { TicketResponse } from '@/types/ticket';

interface TicketMetadataProps {
  ticket: TicketResponse;
}

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-800/50">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-gray-300 text-right">{children}</span>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function TicketMetadata({ ticket }: TicketMetadataProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-lg bg-surface-raised border border-gray-700/50 p-4 space-y-0">
      <MetaField label="Status">
        <Badge variant={ticket.status}>{ticket.status}</Badge>
      </MetaField>
      <MetaField label="Priority">
        <Badge variant={ticket.priority}>{ticket.priority}</Badge>
      </MetaField>
      <MetaField label="Kind">
        <Badge variant={ticket.kind}>{ticket.kind.replace('_', ' ')}</Badge>
      </MetaField>
      {ticket.module && (
        <MetaField label="Module">{ticket.module}</MetaField>
      )}
      <MetaField label="Assignee">
        {ticket.assignee ?? <span className="text-gray-600">Unassigned</span>}
      </MetaField>
      {ticket.sprint_number && (
        <MetaField label="Sprint">Sprint {ticket.sprint_number}</MetaField>
      )}
      {ticket.parent_ticket && (
        <MetaField label="Parent">
          <button
            onClick={() => navigate(`/tickets/${ticket.parent_ticket!.id}`)}
            className="text-coral hover:text-coral-light transition-colors"
          >
            #{ticket.parent_ticket.ticket_number} {ticket.parent_ticket.title}
          </button>
        </MetaField>
      )}
      {ticket.labels.length > 0 && (
        <MetaField label="Labels">
          <div className="flex flex-wrap gap-1 justify-end">
            {ticket.labels.map((label) => (
              <span
                key={label.id}
                className="px-2 py-0.5 rounded text-xs"
                style={{ backgroundColor: `${label.color}20`, color: label.color }}
              >
                {label.name}
              </span>
            ))}
          </div>
        </MetaField>
      )}
      {ticket.estimated_days && (
        <MetaField label="Estimate">{ticket.estimated_days}d</MetaField>
      )}
      <MetaField label="Created">{timeAgo(ticket.created_at)}</MetaField>
      <MetaField label="Updated">{timeAgo(ticket.updated_at)}</MetaField>
    </div>
  );
}
