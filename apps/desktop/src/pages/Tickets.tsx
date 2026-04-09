import { useState } from 'react';
import { useTickets } from '@/hooks/useTickets';
import { TicketFilters } from '@/components/tickets/TicketFilters';
import { TicketRow } from '@/components/tickets/TicketRow';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListTodo } from 'lucide-react';

export default function Tickets() {
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [kind, setKind] = useState('');

  const { data, isLoading } = useTickets({
    projectId: 6,
    status: status || undefined,
    priority: priority || undefined,
    kind: kind || undefined,
    limit: 50,
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Tickets</h1>
          {data && (
            <p className="text-sm text-gray-400 mt-0.5">
              {data.total} ticket{data.total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <TicketFilters
          status={status}
          priority={priority}
          kind={kind}
          onStatusChange={setStatus}
          onPriorityChange={setPriority}
          onKindChange={setKind}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner />
        </div>
      ) : data?.tickets.length ? (
        <div className="rounded-lg border border-gray-700/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-raised text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="py-2 px-3 w-16">#</th>
                <th className="py-2 px-3">Title</th>
                <th className="py-2 px-3 w-28">Status</th>
                <th className="py-2 px-3 w-24">Priority</th>
                <th className="py-2 px-3 w-24">Kind</th>
                <th className="py-2 px-3 w-28">Assignee</th>
              </tr>
            </thead>
            <tbody>
              {data.tickets.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={ListTodo}
          title="No tickets found"
          description="Try adjusting your filters or create a new ticket."
        />
      )}
    </div>
  );
}
