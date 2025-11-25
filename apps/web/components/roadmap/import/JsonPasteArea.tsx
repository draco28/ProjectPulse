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
            w-full px-4 py-3 rounded-xl
            neu-pressed bg-transparent
            text-white placeholder:text-slate/30
            font-mono text-sm
            focus:outline-none focus:ring-2 focus:ring-coral/50
            resize-none
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
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
            inline-flex items-center gap-2 px-4 py-2 rounded-lg
            text-sm font-medium transition-all
            ${isDisabled || !value.trim()
              ? 'opacity-50 cursor-not-allowed text-slate'
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
            inline-flex items-center gap-2 px-6 py-3 rounded-xl
            font-semibold transition-all duration-200
            ${isDisabled || !value.trim()
              ? 'opacity-50 cursor-not-allowed bg-coral/50 text-white'
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
