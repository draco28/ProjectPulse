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
        className={`cursor-pointer hover:bg-dark-pressed/50 px-1 -mx-1 rounded transition-colors ${className}`}
        title="Double-click to edit"
      >
        {value || <span className="text-slate/50 italic">{placeholder}</span>}
      </span>
    );
  }

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <InputComponent
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
          flex-1 px-2 py-1 rounded-lg text-sm
          neu-pressed bg-transparent
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
          className="p-1.5 rounded-lg hover:bg-green-500/20 text-slate hover:text-green-400 transition-colors disabled:opacity-50"
          title="Save (Enter)"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate hover:text-red-400 transition-colors disabled:opacity-50"
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
