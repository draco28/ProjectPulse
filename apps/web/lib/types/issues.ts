/**
 * Issue types (Sprint 10 - Backwards Compatible with Ticket model)
 *
 * Issue is now an alias for Ticket with kind IN ('issue', 'bug', 'scanner_finding')
 */
import type {
  TicketAttachment,
  TicketComment,
  Ticket,
  Label,
  TicketLinkedFile,
  Prisma,
  Project,
} from '@prisma/client';
import type {
  IssueContextInput,
  IssueFileContextInput,
  IssueFilters,
} from '@/lib/validations/issue';

// Sprint 10: Issue is now Ticket
export type Issue = Ticket;
export type Comment = TicketComment;
export type Attachment = TicketAttachment;
export type LinkedFile = TicketLinkedFile;

export type IssueWithRelations = Ticket & {
  comments: Array<Pick<TicketComment, 'id' | 'createdAt'>>;
  attachments: Array<Pick<TicketAttachment, 'id' | 'filename' | 'filepath'>>;
  labels: Array<Pick<Label, 'id' | 'name' | 'color'>>;
  linkedFiles: Array<Pick<TicketLinkedFile, 'id' | 'filePath' | 'lineNumber'>>;
};

export interface IssueListResult {
  issues: IssueWithRelations[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: IssueFilters;
}

export interface IssueDetailResult {
  issue: IssueWithRelations & {
    project: Pick<Project, 'id' | 'name'>;
  };
}

export interface IssueCreateResult {
  issue: IssueWithRelations;
}

export interface IssueBulkCreateResult {
  created: number;
  failed: number;
  issues: IssueWithRelations[];
}

export interface IssueFileContext extends IssueFileContextInput {}

export interface IssueContext extends IssueContextInput {}

export interface IssueOptionValue {
  value: string;
  label: string;
}

export interface IssueOptionSets {
  statuses: IssueOptionValue[];
  priorities: IssueOptionValue[];
  modules: IssueOptionValue[];
}

export interface IssueAutoTagRule {
  pattern: string; // glob or regex pattern
  module?: string;
  labels?: string[];
  priority?: string;
}

export interface IssueAutoTagConfig {
  version: number;
  defaultModule?: string;
  defaultPriority?: string;
  rules: IssueAutoTagRule[];
}

// Sprint 10: Use Ticket types
export type IssueOrderBy =
  | Prisma.TicketOrderByWithRelationInput
  | Prisma.TicketOrderByWithRelationInput[];
