export interface TicketResponse {
  id: number;
  ticket_number: number;
  display_id: string;
  project_id: number;
  title: string;
  description: string | null;
  kind: string;
  source: string;
  status: string;
  priority: string;
  module: string | null;
  assignee: string | null;
  assignee_type: string | null;
  sprint_number: number | null;
  parent_ticket_id: number | null;
  parent_ticket: { id: number; ticket_number: number; title: string } | null;
  children_count: number;
  epic_ref: string | null;
  backlog_refs: string[];
  estimated_days: number | null;
  display_order: number;
  labels: LabelResponse[];
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabelResponse {
  id: number;
  name: string;
  color: string;
}

export interface CommentResponse {
  id: number;
  ticket_id: number;
  author: string;
  author_type: string;
  content: string;
  created_at: string;
}

export interface TicketListParams {
  projectId?: number;
  status?: string;
  priority?: string;
  kind?: string;
  module?: string;
  sprintNumber?: number;
  page?: number;
  limit?: number;
}
