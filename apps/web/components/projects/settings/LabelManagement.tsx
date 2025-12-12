/**
 * LabelManagement Component (Sprint 11.7)
 *
 * Admin UI for managing project labels.
 * Features:
 * - Table view: color, name, usage count, actions
 * - Add/Edit label modal with name and color picker
 * - Delete confirmation with usage warning
 * - Owner-only access (enforced by parent page)
 */
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Tag, AlertTriangle, X } from 'lucide-react';
import { ColorPicker, LABEL_COLORS } from '@/components/ui/ColorPicker';
import { cn } from '@/lib/utils';

export interface Label {
  id: number;
  name: string;
  color: string;
  _count?: {
    tickets: number;
  };
}

interface LabelManagementProps {
  projectId: number;
  labels: Label[];
}

export function LabelManagement({ projectId, labels }: LabelManagementProps) {
  const router = useRouter();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(LABEL_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete confirmation state
  const [deletingLabel, setDeletingLabel] = useState<Label | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Open add modal
  const handleAdd = useCallback(() => {
    setEditingLabel(null);
    setName('');
    setColor(LABEL_COLORS[0]);
    setError(null);
    setShowModal(true);
  }, []);

  // Open edit modal
  const handleEdit = useCallback((label: Label) => {
    setEditingLabel(label);
    setName(label.name);
    setColor(label.color);
    setError(null);
    setShowModal(true);
  }, []);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingLabel(null);
    setName('');
    setColor(LABEL_COLORS[0]);
    setError(null);
  }, []);

  // Save label (create or update)
  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setError('Label name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const url = editingLabel
        ? `/api/projects/${projectId}/labels/${editingLabel.id}`
        : `/api/projects/${projectId}/labels`;

      const method = editingLabel ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to save label');
      }

      handleCloseModal();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  }, [name, color, editingLabel, projectId, handleCloseModal, router]);

  // Open delete confirmation
  const handleDeleteClick = useCallback((label: Label) => {
    setDeletingLabel(label);
  }, []);

  // Confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!deletingLabel) return;

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/labels/${deletingLabel.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to delete label');
      }

      setDeletingLabel(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete label');
    } finally {
      setIsDeleting(false);
    }
  }, [deletingLabel, projectId, router]);

  // Cancel delete
  const handleCancelDelete = useCallback(() => {
    setDeletingLabel(null);
  }, []);

  return (
    <section className="bg-[#1a1a2e] rounded-lg p-6 shadow-neumorphic">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-coral-400 mb-1 flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Labels
          </h2>
          <p className="text-sm text-gray-400">
            Create and manage labels for organizing tickets
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-coral-500 text-white rounded-md hover:bg-coral-600 transition-colors"
        >
          <Plus size={18} />
          Add Label
        </button>
      </div>

      {/* Labels Table */}
      {labels.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Color</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Usage</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {labels.map((label) => (
                <tr key={label.id} className="border-b border-gray-800 hover:bg-[#1f1f33]">
                  <td className="py-3 px-4">
                    <span
                      className="inline-block h-5 w-5 rounded-md"
                      style={{ backgroundColor: label.color }}
                    />
                  </td>
                  <td className="py-3 px-4 font-medium">{label.name}</td>
                  <td className="py-3 px-4 text-gray-400">
                    {label._count?.tickets ?? 0} ticket{(label._count?.tickets ?? 0) !== 1 ? 's' : ''}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(label)}
                        className="p-1.5 text-gray-400 hover:text-coral-400 transition-colors rounded hover:bg-[#2a2a44]"
                        title="Edit label"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(label)}
                        className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded hover:bg-[#2a2a44]"
                        title="Delete label"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Tag className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="mb-2">No labels yet</p>
          <p className="text-sm">Create labels to organize your tickets</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] rounded-lg p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-coral-400">
                {editingLabel ? 'Edit Label' : 'Add Label'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., bug, enhancement, documentation"
                  className="w-full px-4 py-2 bg-[#0f0f1a] border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                  maxLength={50}
                  autoFocus
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium mb-3">Color</label>
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0f0f1a]"
                    style={{ borderLeft: `3px solid ${color}` }}
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-gray-300">
                      {name || 'Label preview'}
                    </span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-[#0f0f1a] rounded-lg">
                  <ColorPicker value={color} onChange={setColor} />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !name.trim()}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-md transition-colors',
                    'bg-coral-500 text-white hover:bg-coral-600',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {isSaving ? 'Saving...' : editingLabel ? 'Save Changes' : 'Create Label'}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLabel && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] rounded-lg p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Delete Label</h3>
            </div>

            <p className="text-gray-300 mb-4">
              Are you sure you want to delete the label{' '}
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm"
                style={{ backgroundColor: `${deletingLabel.color}20`, color: deletingLabel.color }}
              >
                {deletingLabel.name}
              </span>
              ?
            </p>

            {(deletingLabel._count?.tickets ?? 0) > 0 && (
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-4">
                <p className="text-yellow-200 text-sm">
                  <strong>Warning:</strong> This label is used on{' '}
                  {deletingLabel._count?.tickets} ticket{deletingLabel._count?.tickets !== 1 ? 's' : ''}.
                  Deleting it will remove the label from all tickets.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className={cn(
                  'flex-1 px-4 py-2 rounded-md transition-colors',
                  'bg-red-500 text-white hover:bg-red-600',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isDeleting ? 'Deleting...' : 'Delete Label'}
              </button>
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
