/**
 * Issue Adapter Tools - Backwards Compatibility Layer (Sprint 10)
 *
 * These tools map the legacy "issue" API to the new unified "ticket" system.
 * They ensure existing agents continue to work while migrating to tickets.
 *
 * Mapping:
 * - issue_create → ticket_create with kind filtering (issue, bug, scanner_finding)
 * - issue_search → ticket_search with kind filter for legacy types
 * - issue_update → ticket_update (passthrough)
 * - issue_setStatus → ticket_setStatus (passthrough)
 * - issue_addComment → ticket_addComment (passthrough)
 * - issue_bulkCreate → ticket_bulkCreate with kind=issue default
 */

export { issueCreateTool } from './create.js';
export { issueSearchTool } from './search.js';
export { issueUpdateTool } from './update.js';
export { issueSetStatusTool } from './setStatus.js';
export { issueAddCommentTool } from './addComment.js';
export { issueBulkCreateTool } from './bulkCreate.js';
