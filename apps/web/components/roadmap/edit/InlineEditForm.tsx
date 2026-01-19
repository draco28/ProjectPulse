'use client';

/**
 * InlineEditForm Component - Standalone Roadmap UI Phase E
 *
 * Reusable inline edit component
 * - Shows input on double-click or edit button
 * - Save on blur or Enter
 * - Cancel on Escape
 * - Loading state during save
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, Loader2 } from 'lucide-react';

interface InlineEditFormProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  className?: string;
  inputClassName?: string;
}

export function InlineEditForm({
  value,
  onSave,
  placeholder = 'Enter text...',
  maxLength = 200,
  multiline = false,
  className = '',
  inputClassName = '',
}: InlineEditFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset edit value when value prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    setEditValue(value);
    setError(null);
  }, [value]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(value);
    setError(null);
  }, [value]);

  const handleSave = useCallback(async () => {
    if (editValue.trim() === value.trim()) {
      setIsEditing(false);
      return;
    }

    if (!editValue.trim()) {
      setError('Value cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(editValue.trim());
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [editValue, value, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !multiline) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [multiline, handleSave, handleCancel]
  );

  if (!isEditing) {
    return (
      <span
        onDoubleClick={handleStartEdit}
        className={`-mx-1 cursor-pointer rounded px-1 transition-colors hover:bg-dark-pressed/50 ${className}`}
        title="Double-click to edit"
      >
        {value || <span className="italic text-slate/50">{placeholder}</span>}
      </span>
    );
  }

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <InputComponent
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Union ref types for dynamic input/textarea require assertion
        ref={inputRef as any}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Small delay to allow button clicks
          setTimeout(() => {
            if (!isSaving) handleSave();
          }, 150);
        }}
        maxLength={maxLength}
        disabled={isSaving}
        placeholder={placeholder}
        rows={multiline ? 2 : undefined}
        className={`
          neu-pressed flex-1 rounded-lg bg-transparent px-2
          py-1 text-sm
          text-white placeholder:text-slate/50
          focus:outline-none focus:ring-2 focus:ring-coral/50
          disabled:opacity-50
          ${multiline ? 'resize-none' : ''}
          ${error ? 'ring-2 ring-red-500' : ''}
          ${inputClassName}
        `}
      />

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-lg p-1.5 text-slate transition-colors hover:bg-green-500/20 hover:text-green-400 disabled:opacity-50"
          title="Save (Enter)"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="rounded-lg p-1.5 text-slate transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
          title="Cancel (Esc)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Error */}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
