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

export interface MaterializationResult {
  success: boolean;
  message: string;
  phaseIds: string[];
  sprintIds: string[];
  weekIds: string[];
  dayIds: string[];
  counts: {
    phases: number;
    sprints: number;
    weeks: number;
    days: number;
  };
}
