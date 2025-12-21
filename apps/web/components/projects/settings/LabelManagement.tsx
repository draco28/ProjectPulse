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
      const response = await fetch(`/api/projects/${projectId}/labels/${deletingLabel.id}`, {
        method: 'DELETE',
      });

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
    <section className="shadow-neumorphic rounded-lg bg-[#1a1a2e] p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-coral-400 mb-1 flex items-center gap-2 text-xl font-semibold">
            <Tag className="h-5 w-5" />
            Labels
          </h2>
          <p className="text-sm text-gray-400">Create and manage labels for organizing tickets</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-coral-500 hover:bg-coral-600 flex items-center gap-2 rounded-md px-4 py-2 text-white transition-colors"
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
                <th className="px-4 py-3 text-left font-medium text-gray-400">Color</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">Usage</th>
                <th className="px-4 py-3 text-right font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {labels.map((label) => (
                <tr key={label.id} className="border-b border-gray-800 hover:bg-[#1f1f33]">
                  <td className="px-4 py-3">
                    <span
                      className="inline-block h-5 w-5 rounded-md"
                      style={{ backgroundColor: label.color }}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{label.name}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {label._count?.tickets ?? 0} ticket
                    {(label._count?.tickets ?? 0) !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(label)}
                        className="hover:text-coral-400 rounded p-1.5 text-gray-400 transition-colors hover:bg-[#2a2a44]"
                        title="Edit label"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(label)}
                        className="rounded p-1.5 text-gray-400 transition-colors hover:bg-[#2a2a44] hover:text-red-400"
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
        <div className="py-8 text-center text-gray-500">
          <Tag className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p className="mb-2">No labels yet</p>
          <p className="text-sm">Create labels to organize your tickets</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg bg-[#1a1a2e] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-coral-400 text-xl font-semibold">
                {editingLabel ? 'Edit Label' : 'Add Label'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 text-gray-400 transition-colors hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="mb-2 block text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., bug, enhancement, documentation"
                  className="focus:ring-coral-500 w-full rounded-md border border-gray-700 bg-[#0f0f1a] px-4 py-2 focus:outline-none focus:ring-2"
                  maxLength={50}
                  autoFocus
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="mb-3 block text-sm font-medium">Color</label>
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div
                    className="flex items-center gap-2 rounded-full bg-[#0f0f1a] px-3 py-1.5"
                    style={{ borderLeft: `3px solid ${color}` }}
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm text-gray-300">{name || 'Label preview'}</span>
                  </div>
                </div>
                <div className="mt-3 rounded-lg bg-[#0f0f1a] p-3">
                  <ColorPicker value={color} onChange={setColor} />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !name.trim()}
                  className={cn(
                    'flex-1 rounded-md px-4 py-2 transition-colors',
                    'bg-coral-500 hover:bg-coral-600 text-white',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                >
                  {isSaving ? 'Saving...' : editingLabel ? 'Save Changes' : 'Create Label'}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="rounded-md bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg bg-[#1a1a2e] p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-red-500/20 p-2">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Delete Label</h3>
            </div>

            <p className="mb-4 text-gray-300">
              Are you sure you want to delete the label{' '}
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm"
                style={{ backgroundColor: `${deletingLabel.color}20`, color: deletingLabel.color }}
              >
                {deletingLabel.name}
              </span>
              ?
            </p>

            {(deletingLabel._count?.tickets ?? 0) > 0 && (
              <div className="mb-4 rounded-lg border border-yellow-700/50 bg-yellow-900/20 p-4">
                <p className="text-sm text-yellow-200">
                  <strong>Warning:</strong> This label is used on {deletingLabel._count?.tickets}{' '}
                  ticket{deletingLabel._count?.tickets !== 1 ? 's' : ''}. Deleting it will remove
                  the label from all tickets.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className={cn(
                  'flex-1 rounded-md px-4 py-2 transition-colors',
                  'bg-red-500 text-white hover:bg-red-600',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                {isDeleting ? 'Deleting...' : 'Delete Label'}
              </button>
              <button
                onClick={handleCancelDelete}
                className="rounded-md bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600"
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
