/**
 * LabelPicker Component (Sprint 11.7 - Labels Feature)
 *
 * ServiceNow-style dropdown for selecting labels on a ticket.
 * Features:
 * - Search input with filtering
 * - Checkbox list of available labels
 * - Color indicators
 * - Optimistic updates
 * - Keyboard navigation
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Tag, Search, ChevronDown, Check } from 'lucide-react';
import { LabelBadge, type LabelBadgeProps } from '@/components/ui/LabelBadge';
import { cn } from '@/lib/utils';

interface Label {
  id: number;
  name: string;
  color: string;
  ticketCount?: number;
}

interface LabelPickerProps {
  ticketId: number | string;
  projectId: number | string;
  currentLabels: LabelBadgeProps[];
  /** Called when labels change (for parent state sync) */
  onLabelsChange?: (labels: LabelBadgeProps[]) => void;
  /** Read-only mode (just display, no editing) */
  readOnly?: boolean;
}

export function LabelPicker({
  ticketId,
  projectId,
  currentLabels,
  onLabelsChange,
  readOnly = false,
}: LabelPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(currentLabels.map((l) => Number(l.id)))
  );
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync selectedIds with currentLabels when they change externally
  useEffect(() => {
    setSelectedIds(new Set(currentLabels.map((l) => Number(l.id))));
  }, [currentLabels]);

  // Fetch available labels when dropdown opens
  const fetchLabels = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/labels`);
      if (response.ok) {
        const data = await response.json();
        setAvailableLabels(data.labels || []);
      }
    } catch (error) {
      console.error('Failed to fetch labels:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen && availableLabels.length === 0) {
      fetchLabels();
    }
  }, [isOpen, availableLabels.length, fetchLabels]);

  // Filter labels by search
  const filteredLabels = availableLabels.filter((label) =>
    label.name.toLowerCase().includes(search.toLowerCase())
  );

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  // Toggle label selection
  const toggleLabel = async (label: Label) => {
    const newSelectedIds = new Set(selectedIds);
    const action = selectedIds.has(label.id) ? 'remove' : 'add';

    // Optimistic update
    if (action === 'add') {
      newSelectedIds.add(label.id);
    } else {
      newSelectedIds.delete(label.id);
    }
    setSelectedIds(newSelectedIds);

    // Notify parent
    const newLabels = availableLabels
      .filter((l) => newSelectedIds.has(l.id))
      .map((l) => ({ id: l.id, name: l.name, color: l.color }));
    onLabelsChange?.(newLabels);

    // API call
    try {
      const response = await fetch(`/api/tickets/${ticketId}/labels`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labelIds: [label.id],
          action,
        }),
      });

      if (!response.ok) {
        // Revert on failure
        if (action === 'add') {
          newSelectedIds.delete(label.id);
        } else {
          newSelectedIds.add(label.id);
        }
        setSelectedIds(newSelectedIds);
        const revertedLabels = availableLabels
          .filter((l) => newSelectedIds.has(l.id))
          .map((l) => ({ id: l.id, name: l.name, color: l.color }));
        onLabelsChange?.(revertedLabels);
      }
    } catch (error) {
      console.error('Failed to update labels:', error);
      // Revert on error
      if (action === 'add') {
        newSelectedIds.delete(label.id);
      } else {
        newSelectedIds.add(label.id);
      }
      setSelectedIds(newSelectedIds);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        setIsOpen(false);
        setSearch('');
        setFocusedIndex(-1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex((prev) => (prev < filteredLabels.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter': {
        event.preventDefault();
        const focusedLabel = filteredLabels[focusedIndex];
        if (focusedIndex >= 0 && focusedLabel) {
          toggleLabel(focusedLabel);
        }
        break;
      }
    }
  };

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.children[focusedIndex] as HTMLElement;
      focusedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  // Display current labels
  const displayLabels = currentLabels.length > 0 ? currentLabels : [];

  if (readOnly) {
    return (
      <div>
        <label className="mb-2 block text-xs uppercase tracking-wider text-slate">Labels</label>
        {displayLabels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {displayLabels.map((label) => (
              <LabelBadge key={label.id} label={label} />
            ))}
          </div>
        ) : (
          <span className="text-sm italic text-slate">No labels</span>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <label className="mb-2 block text-xs uppercase tracking-wider text-slate">Labels</label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'neu-pressed flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-all',
          'hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-coral/50'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {displayLabels.length > 0 ? (
            displayLabels
              .slice(0, 3)
              .map((label) => <LabelBadge key={label.id} label={label} size="sm" />)
          ) : (
            <span className="flex items-center gap-2 text-sm text-slate">
              <Tag className="h-4 w-4" />
              Add labels...
            </span>
          )}
          {displayLabels.length > 3 && (
            <span className="text-xs text-slate">+{displayLabels.length - 3}</span>
          )}
        </div>
        <ChevronDown
          className={cn('h-4 w-4 text-slate transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="neu-raised absolute left-0 right-0 z-50 mt-2 rounded-xl p-2 shadow-lg">
          {/* Search Input */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setFocusedIndex(-1);
              }}
              placeholder="Search labels..."
              className="neu-pressed w-full rounded-lg bg-transparent py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate focus:outline-none"
            />
          </div>

          {/* Labels List */}
          <div
            ref={listRef}
            className="max-h-48 overflow-y-auto"
            role="listbox"
            aria-label="Available labels"
          >
            {loading ? (
              <div className="px-3 py-4 text-center text-sm text-slate">Loading labels...</div>
            ) : filteredLabels.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-slate">
                {search ? 'No labels match your search' : 'No labels available'}
              </div>
            ) : (
              filteredLabels.map((label, index) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                    'hover:bg-white/5',
                    focusedIndex === index && 'bg-white/5'
                  )}
                  role="option"
                  aria-selected={selectedIds.has(label.id)}
                >
                  {/* Checkbox indicator */}
                  <div
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                      selectedIds.has(label.id) ? 'border-coral bg-coral' : 'border-slate'
                    )}
                  >
                    {selectedIds.has(label.id) && <Check className="h-3 w-3 text-white" />}
                  </div>

                  {/* Color dot */}
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: label.color }} />

                  {/* Label name */}
                  <span className="flex-1 text-sm text-white">{label.name}</span>

                  {/* Usage count */}
                  {label.ticketCount !== undefined && (
                    <span className="text-xs text-slate">{label.ticketCount}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
