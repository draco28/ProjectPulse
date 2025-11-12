import type {
  Attachment,
  Comment,
  Issue,
  Label,
  LinkedFile,
  Prisma,
  Project,
} from '@prisma/client';
import type {
  IssueContextInput,
  IssueFileContextInput,
  IssueFilters,
} from '@/lib/validations/issue';

export type IssueWithRelations = Issue & {
  comments: Array<Pick<Comment, 'id' | 'createdAt'>>;
  attachments: Array<Pick<Attachment, 'id' | 'filename' | 'filepath'>>;
  labels: Array<Pick<Label, 'id' | 'name' | 'color'>>;
  linkedFiles: Array<Pick<LinkedFile, 'id' | 'filePath' | 'lineNumber'>>;
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

export type IssueOrderBy =
  | Prisma.IssueOrderByWithRelationInput
  | Prisma.IssueOrderByWithRelationInput[];
