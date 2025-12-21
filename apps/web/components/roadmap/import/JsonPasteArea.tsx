'use client';

/**
 * JsonPasteArea Component
 *
 * Textarea for pasting JSON directly
 * - Monospace font
 * - Character count
 * - Format JSON button (optional)
 */

import { useCallback } from 'react';
import { Wand2, Loader2 } from 'lucide-react';

interface JsonPasteAreaProps {
  value: string;
  onChange: (value: string) => void;
  onParse: () => void;
  isDisabled: boolean;
}

export function JsonPasteArea({ value, onChange, onParse, isDisabled }: JsonPasteAreaProps) {
  // Format JSON
  const handleFormat = useCallback(() => {
    if (!value.trim()) return;

    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
    } catch {
      // Ignore format errors - will be caught during parse
    }
  }, [value, onChange]);

  return (
    <div className="space-y-4">
      {/* Textarea */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`{
  "phases": [
    {
      "title": "Phase 1",
      "sprints": [...]
    }
  ]
}`}
          disabled={isDisabled}
          rows={16}
          className={`
            neu-pressed w-full resize-none rounded-xl
            bg-transparent px-4
            py-3 font-mono
            text-sm text-white
            placeholder:text-slate/30 focus:outline-none focus:ring-2
            focus:ring-coral/50
            ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}
          `}
        />

        {/* Character Count */}
        <div className="absolute bottom-3 right-3 text-xs text-slate/50">
          {value.length.toLocaleString()} characters
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        {/* Format Button */}
        <button
          onClick={handleFormat}
          disabled={isDisabled || !value.trim()}
          className={`
            inline-flex items-center gap-2 rounded-lg px-4 py-2
            text-sm font-medium transition-all
            ${
              isDisabled || !value.trim()
                ? 'cursor-not-allowed text-slate opacity-50'
                : 'neu-flat text-slate hover:text-white'
            }
          `}
        >
          <Wand2 className="h-4 w-4" />
          Format JSON
        </button>

        {/* Parse Button */}
        <button
          onClick={onParse}
          disabled={isDisabled || !value.trim()}
          className={`
            inline-flex items-center gap-2 rounded-xl px-6 py-3
            font-semibold transition-all duration-200
            ${
              isDisabled || !value.trim()
                ? 'cursor-not-allowed bg-coral/50 text-white opacity-50'
                : 'coral-gradient text-white hover:shadow-lg hover:shadow-coral/20'
            }
          `}
        >
          {isDisabled ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Parsing...
            </>
          ) : (
            'Parse & Preview'
          )}
        </button>
      </div>
    </div>
  );
}
