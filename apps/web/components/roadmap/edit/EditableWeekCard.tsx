'use client';

/**
 * EditableWeekCard Component - DEPRECATED
 *
 * Sprint 15: Week/Day models removed (Ticket #80)
 * This component is stubbed for backward compatibility.
 * Roadmap hierarchy is now 2-level: Phase -> Sprint
 *
 * @deprecated Use EditableSprintCard instead. This file will be removed in a future release.
 */

interface EditableWeekCardProps {
  week?: unknown; // Keep prop for backward compatibility
  isEditable?: boolean;
}

/**
 * @deprecated Sprint 15: Week model removed (Ticket #80)
 * Roadmap is now 2-level hierarchy: Phase -> Sprint
 */
export function EditableWeekCard({ week: _week, isEditable: _isEditable }: EditableWeekCardProps) {
  // Sprint 15: Week/Day removed - return null for backward compatibility
  return null;
}
