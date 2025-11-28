/**
 * Filter Types and DTOs for Dynamic Ticket Filtering
 *
 * These types represent filter options fetched from the database
 * and passed to UI components for rendering dynamic filter options.
 *
 * @see apps/web/prisma/schema.prisma for database models
 * @see apps/web/app/api/settings/filters for API endpoint
 */

import { z } from 'zod';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Kind filter option (tickets)
 * Maps to Ticket kind
 */
export interface KindOption {
  value: string; // e.g., "feature", "task", "bug"
  label: string; // e.g., "Feature", "Task", "Bug"
}

/**
 * Status filter option
 * Maps to TicketStatusOption model in database
 */
export interface StatusOption {
  value: string; // e.g., "open", "in-progress", "closed"
  label: string; // e.g., "Open", "In Progress", "Closed"
  colorClass?: string; // Tailwind class: "text-blue-600"
}

/**
 * Priority filter option
 * Maps to TicketPriorityOption model in database
 */
export interface PriorityOption {
  value: string; // e.g., "critical", "high", "medium", "low"
  label: string; // e.g., "Critical", "High", "Medium", "Low"
  dotColorClass?: string; // For filter dot: "bg-red-600"
  badgeColorClass?: string; // For issue card badge: "bg-red-100 text-red-800"
}

/**
 * Module filter option
 * Maps to TicketModuleOption model in database
 */
export interface ModuleOption {
  value: string; // e.g., "combat", "animation", "core", "ui"
  label: string; // e.g., "Combat", "Animation", "Core", "UI"
}

/**
 * Label option (from Label model)
 * Used for label filtering in issues
 */
export interface LabelOption {
  id: number; // Int autoincrement from Prisma
  name: string; // e.g., "bug", "enhancement"
  color: string; // Hex color: "#d73a4a"
}

/**
 * Complete filters DTO
 * Returned by GET /api/settings/filters
 */
export interface FiltersDTO {
  kinds?: string[]; // Optional for backwards compatibility
  status: StatusOption[];
  priority: PriorityOption[];
  modules: ModuleOption[];
  labels: LabelOption[];
}

// ============================================================================
// ZOD SCHEMAS (for validation)
// ============================================================================

/**
 * Zod schema for KindOption validation
 */
export const kindOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

/**
 * Zod schema for StatusOption validation
 */
export const statusOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  colorClass: z.string().optional(),
});

/**
 * Zod schema for PriorityOption validation
 */
export const priorityOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  dotColorClass: z.string().optional(),
  badgeColorClass: z.string().optional(),
});

/**
 * Zod schema for ModuleOption validation
 */
export const moduleOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

/**
 * Zod schema for LabelOption validation
 */
export const labelOptionSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/), // Hex color validation
});

/**
 * Zod schema for complete FiltersDTO validation
 */
export const filtersDTOSchema = z.object({
  kinds: z.array(z.string()).optional(),
  status: z.array(statusOptionSchema),
  priority: z.array(priorityOptionSchema),
  modules: z.array(moduleOptionSchema),
  labels: z.array(labelOptionSchema),
});

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if value is a valid KindOption
 */
export function isKindOption(value: unknown): value is KindOption {
  return kindOptionSchema.safeParse(value).success;
}

/**
 * Type guard to check if value is a valid StatusOption
 */
export function isStatusOption(value: unknown): value is StatusOption {
  return statusOptionSchema.safeParse(value).success;
}

/**
 * Type guard to check if value is a valid PriorityOption
 */
export function isPriorityOption(value: unknown): value is PriorityOption {
  return priorityOptionSchema.safeParse(value).success;
}

/**
 * Type guard to check if value is a valid ModuleOption
 */
export function isModuleOption(value: unknown): value is ModuleOption {
  return moduleOptionSchema.safeParse(value).success;
}

/**
 * Type guard to check if value is a valid FiltersDTO
 */
export function isFiltersDTO(value: unknown): value is FiltersDTO {
  return filtersDTOSchema.safeParse(value).success;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Filter type discriminator
 */
export type FilterType = 'kind' | 'status' | 'priority' | 'module' | 'label';

/**
 * Generic filter option (union of all option types)
 */
export type FilterOption = KindOption | StatusOption | PriorityOption | ModuleOption | LabelOption;

/**
 * Filter counts map (used in FilterSidebar)
 */
export interface FilterCounts {
  kind?: Record<string, number>; // { "feature": 5, "task": 3 }
  status: Record<string, number>; // { "open": 5, "in-progress": 3, "closed": 2 }
  priority: Record<string, number>; // { "critical": 1, "high": 4, "medium": 3, "low": 2 }
  module: Record<string, number>; // { "combat": 2, "animation": 3, "core": 2, "ui": 3 }
}
