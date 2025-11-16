/**
 * Issue Detail Types
 *
 * Type definitions for Issue Detail page components
 * Includes both Prisma types (server-side) and serialized types (client-side props)
 */

import { Prisma } from '@prisma/client';

// ============================================================================
// SERVER-SIDE TYPES (from Prisma queries)
// ============================================================================

/**
 * Issue Detail query result type
 * Matches the Prisma query in app/issues/[id]/page.tsx
 */
export type IssueDetail = Prisma.IssueGetPayload<{
  include: {
    comments: {
      select: {
        id: true;
        content: true;
        author: true;
        createdAt: true;
        updatedAt: true;
      };
    };
    attachments: {
      select: {
        id: true;
        filename: true;
        filepath: true;
        mimetype: true;
        size: true;
        uploadedAt: true;
      };
    };
    labels: {
      select: {
        id: true;
        name: true;
        color: true;
      };
    };
    linkedFiles: {
      select: {
        id: true;
        filePath: true;
        lineNumber: true;
        createdAt: true;
      };
    };
    linkedCommits: {
      select: {
        id: true;
        commitHash: true;
        commitMessage: true;
        commitDate: true;
      };
    };
    project: {
      select: {
        id: true;
        name: true;
        repository: true;
      };
    };
  };
}>;

// ============================================================================
// CLIENT-SIDE TYPES (for React component props)
// ============================================================================

/**
 * Serialized comment for client components
 * Dates converted to ISO strings for JSON serialization
 */
export interface CommentProps {
  id: string; // Converted from number
  content: string;
  author: string | null;
  createdAt: string; // Converted from Date
  updatedAt: string; // Converted from Date
}

/**
 * Serialized attachment for client components
 */
export interface AttachmentProps {
  id: string; // Converted from number
  filename: string;
  filepath: string;
  mimetype: string;
  size: number;
  uploadedAt: string; // Converted from Date
}

/**
 * Serialized label for client components
 */
export interface LabelProps {
  id: string; // Converted from number
  name: string;
  color: string;
}

/**
 * Serialized linked file for client components
 */
export interface LinkedFileProps {
  id: string; // Converted from number
  filePath: string;
  lineNumber: number | null;
  createdAt: string; // Converted from Date
}

/**
 * Serialized linked commit for client components
 */
export interface LinkedCommitProps {
  id: string; // Converted from number
  commitHash: string;
  commitMessage: string | null;
  commitDate: string | null; // Converted from Date
}

/**
 * Serialized project for client components
 */
export interface ProjectProps {
  id: string; // Converted from number
  name: string;
  repository: string | null;
}

/**
 * Complete serialized issue for client components
 * All dates converted to ISO strings, all IDs to strings
 */
export interface IssueDetailProps {
  id: string; // Converted from number
  title: string;
  description: string | null;
  status: 'open' | 'in-progress' | 'closed'; // Narrowed from string
  priority: 'critical' | 'high' | 'medium' | 'low'; // Narrowed from string
  module: string | null;
  assignee: string | null;
  createdAt: string; // Converted from Date
  updatedAt: string; // Converted from Date
  closedAt: string | null; // Converted from Date

  // Relations
  project: ProjectProps;
  comments: CommentProps[];
  attachments: AttachmentProps[];
  labels: LabelProps[];
  linkedFiles: LinkedFileProps[];
  linkedCommits: LinkedCommitProps[];
}

// ============================================================================
// SERIALIZATION HELPERS
// ============================================================================

/**
 * Converts Prisma Issue query result to serialized props for client components
 *
 * Transformations:
 * - number IDs → string IDs (for URLs and client-side routing)
 * - Date objects → ISO string (for JSON serialization)
 * - Prisma relations → nested serialized objects
 *
 * @param issue - Issue query result from Prisma
 * @returns Serialized issue props ready for client components
 */
export function serializeIssueDetail(issue: IssueDetail): IssueDetailProps {
  return {
    id: issue.id.toString(),
    title: issue.title,
    description: issue.description,
    status: issue.status as IssueDetailProps['status'],
    priority: issue.priority as IssueDetailProps['priority'],
    module: issue.module,
    assignee: issue.assignee,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
    closedAt: issue.closedAt?.toISOString() || null,

    project: {
      id: issue.project.id.toString(),
      name: issue.project.name,
      repository: issue.project.repository,
    },

    comments: issue.comments.map((comment) => ({
      id: comment.id.toString(),
      content: comment.content,
      author: comment.author,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    })),

    attachments: issue.attachments.map((attachment) => ({
      id: attachment.id.toString(),
      filename: attachment.filename,
      filepath: attachment.filepath,
      mimetype: attachment.mimetype,
      size: attachment.size,
      uploadedAt: attachment.uploadedAt.toISOString(),
    })),

    labels: issue.labels.map((label) => ({
      id: label.id.toString(),
      name: label.name,
      color: label.color,
    })),

    linkedFiles: issue.linkedFiles.map((file) => ({
      id: file.id.toString(),
      filePath: file.filePath,
      lineNumber: file.lineNumber,
      createdAt: file.createdAt.toISOString(),
    })),

    linkedCommits: issue.linkedCommits.map((commit) => ({
      id: commit.id.toString(),
      commitHash: commit.commitHash,
      commitMessage: commit.commitMessage,
      commitDate: commit.commitDate?.toISOString() || null,
    })),
  };
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response format used throughout the application
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  details?: unknown; // Zod validation errors or additional context
}

/**
 * Comment creation request body
 */
export interface CreateCommentRequest {
  content: string;
  author?: string;
}

/**
 * Status update request body
 */
export interface UpdateStatusRequest {
  status: 'open' | 'in-progress' | 'closed';
}
