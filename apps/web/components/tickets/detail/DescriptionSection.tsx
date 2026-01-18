/**
 * DescriptionSection Component
 *
 * Client Component for displaying and editing ticket description
 *
 * Architecture (per react-expert recommendation):
 * - Client Component ("use client")
 * - Toggle between view and edit modes
 * - Uses router.refresh() after save
 * - Future: Markdown rendering with TipTap editor
 *
 * Features:
 * - View mode: Display description (whitespace preserved)
 * - Edit mode: Textarea with save/cancel buttons
 * - Future: Rich markdown editor (TipTap)
 * - Future: Preview tab
 *
 * Props:
 * - ticketId: Ticket identifier
 * - description: Ticket description text (can be null)
 *
 * Reference: mockups/Default theme/03-issue-detail-dark-neumorphic-coral.html
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ============================================================================
// TYPES
// ============================================================================

interface DescriptionSectionProps {
  ticketId: string;
  description: string | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DescriptionSection({ ticketId: _ticketId, description }: DescriptionSectionProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(description || '');
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Handle save description
   * Future: Add PATCH /api/tickets/[id] endpoint
   */
  async function handleSave() {
    setIsSaving(true);

    try {
      // TODO: Implement PATCH /api/tickets/[id] endpoint
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // const response = await fetch(`/api/tickets/${ticketId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ description: editedDescription }),
      // });
      //
      // if (!response.ok) {
      //   throw new Error('Failed to update description');
      // }

      // Refresh Server Components
      router.refresh();

      // Exit edit mode
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save description:', error);
      alert('Failed to save description. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Handle cancel edit
   */
  function handleCancel() {
    setEditedDescription(description || '');
    setIsEditing(false);
  }

  // Empty state
  if (!description && !isEditing) {
    return (
      <div className="neu-raised smooth-transition rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <i className="fas fa-align-left text-coral" aria-hidden="true"></i>
            Description
          </h3>
          <button
            onClick={() => setIsEditing(true)}
            className="smooth-transition hover:text-coralLight text-sm text-coral"
          >
            <i className="fas fa-plus mr-2" aria-hidden="true"></i>
            Add description
          </button>
        </div>
        <p className="text-center text-sm italic text-slate">No description provided</p>
      </div>
    );
  }

  return (
    <div className="neu-raised smooth-transition rounded-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
          <i className="fas fa-align-left text-coral" aria-hidden="true"></i>
          Description
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="smooth-transition hover:text-coralLight text-sm text-coral"
          >
            <i className="fas fa-edit mr-2" aria-hidden="true"></i>
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        // Edit Mode
        <div className="space-y-4">
          {/* Textarea */}
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className="neu-pressed w-full rounded-2xl bg-[#1A1A1A] p-4 text-sm text-white placeholder-slate focus:outline-none focus:ring-2 focus:ring-coral/50"
            rows={8}
            placeholder="Describe the issue in detail..."
            aria-label="Edit description"
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="smooth-transition neu-raised rounded-2xl px-4 py-2 text-sm text-slate hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="coral-gradient smooth-transition rounded-2xl px-4 py-2 text-sm text-white shadow-lg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2" aria-hidden="true"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2" aria-hidden="true"></i>
                  Save
                </>
              )}
            </button>
          </div>

          {/* Future Enhancement Hint */}
          <div className="rounded-2xl border border-dashed border-[#2A2A2A] p-3 text-center">
            <p className="text-xs text-slate">
              <i className="fas fa-lightbulb mr-2 text-coral" aria-hidden="true"></i>
              Future: Rich markdown editor with preview
            </p>
          </div>
        </div>
      ) : (
        // View Mode
        <div className="space-y-3 text-sm leading-relaxed text-slate">
          <p className="whitespace-pre-wrap">{description}</p>
        </div>
      )}
    </div>
  );
}
