export type TicketStatus = 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done';
export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';
export type TicketKind = 'feature' | 'task' | 'epic' | 'issue' | 'bug' | 'scanner_finding' | 'tech_debt';

export interface KanbanTicket {
  id: number;
  ticket_number: number;
  title: string;
  kind: string;
  priority: string;
  assignee: string | null;
  parent_ticket_id: number | null;
  display_order: number;
}

export interface KanbanColumn {
  status: TicketStatus;
  tickets: KanbanTicket[];
  count: number;
}

export interface SprintInfo {
  id: string;
  title: string;
  sprint_number: number;
  progress: number;
  status: string;
}

export interface KanbanStats {
  total: number;
  backlog: number;
  todo: number;
  in_progress: number;
  in_review: number;
  done: number;
}

export interface KanbanBoard {
  sprint: SprintInfo;
  columns: KanbanColumn[];
  stats: KanbanStats;
}

export interface MoveTicketRequest {
  status: TicketStatus;
  displayOrder: number;
}

export interface ReorderRequest {
  ticketIds: number[];
  status: TicketStatus;
}

export interface SprintListItem {
  id: string;
  title: string;
  sprintNumber: number;
  progress: number;
  status: string;
  createdAt: string;
  phaseTitle: string;
}
