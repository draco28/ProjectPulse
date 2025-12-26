/**
 * Status System - Barrel Export
 *
 * Central export for all status-related types, constants, and utilities.
 * Import from '@/lib/constants/status' for clean access.
 *
 * @example
 * ```typescript
 * // Import specific domain
 * import { TICKET_STATUSES, TicketStatusSystem, type TicketStatus } from '@/lib/constants/status';
 *
 * // Import multiple domains
 * import {
 *   TICKET_STATUSES,
 *   SPRINT_STATUSES,
 *   SESSION_STATUSES,
 * } from '@/lib/constants/status';
 *
 * // Import shared types
 * import { type StatusMeta, createStatusSystem } from '@/lib/constants/status';
 * ```
 */

// Shared types and factory
export * from './types';

// Ticket/Kanban domain
export * from './ticket';

// Sprint/Phase domain (roadmap)
export * from './sprint';

// Agent Session domain
export * from './session';
