/**
 * Shared types for roadmap tools
 */

export interface ParsedRoadmap {
  phases: Array<{
    title?: string; // Make optional to support both
    name?: string; // Make optional to support both
    duration?: string;
    sprints: Array<{
      name: string;
      duration?: string;
      weeks?: string;
      goals: string[];
      deliverables: string[];
      storyPoints?: number;
    }>;
  }>;
}

/**
 * Sprint 15: Simplified to 2-level hierarchy (Phase → Sprint)
 * Week/Day creation removed - Kanban board uses Ticket.sprintId instead
 */
export interface MaterializationResult {
  success: boolean;
  message: string;
  phaseIds: string[];
  sprintIds: string[];
  counts: {
    phases: number;
    sprints: number;
  };
}
