'use client';

/**
 * SprintKanbanClient - Client wrapper for sprint kanban board
 *
 * Handles:
 * - Ticket detail drawer state
 * - Keyboard shortcuts
 * - URL sync for selected ticket
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { KanbanTicket, SprintContext } from '@/types/kanban';
import { SprintKanbanBoard } from '@/components/kanban';
import TicketDetailDrawer from '@/components/kanban/TicketDetailDrawer';

interface SprintKanbanClientProps {
  sprintId: string;
  projectId?: number;
  initialSprint: SprintContext;
}

export default function SprintKanbanClient({ sprintId, projectId, initialSprint: _initialSprint }: SprintKanbanClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Drawer state
  const [selectedTicket, setSelectedTicket] = useState<KanbanTicket | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Open drawer for a ticket
  const handleTicketClick = useCallback(
    (ticket: KanbanTicket) => {
      setSelectedTicket(ticket);
      setIsDrawerOpen(true);

      // Update URL with ticket ID (for sharing)
      const params = new URLSearchParams(searchParams.toString());
      params.set('ticket', String(ticket.id));
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Close drawer
  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedTicket(null);

    // Remove ticket from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete('ticket');
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [router, searchParams]);

  // Handle URL ticket param on mount
  useEffect(() => {
    const ticketId = searchParams.get('ticket');
    if (ticketId) {
      // We'd need to fetch the ticket data here
      // For now, just open drawer if ticket param exists
      // The drawer will fetch its own data
      setIsDrawerOpen(true);
    }
  }, [searchParams]);

  // Keyboard shortcut: Escape to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        handleCloseDrawer();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, handleCloseDrawer]);

  return (
    <div className="h-screen flex flex-col bg-dark">
      {/* Main Kanban Board */}
      <SprintKanbanBoard
        sprintId={sprintId}
        projectId={projectId}
        onTicketClick={handleTicketClick}
        className="flex-1 min-h-0"
      />

      {/* Ticket Detail Drawer */}
      <TicketDetailDrawer
        ticket={selectedTicket}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
