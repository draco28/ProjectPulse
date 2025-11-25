'use client';

/**
 * ProgressSlider Component - Standalone Roadmap UI Phase E
 *
 * Quick progress update slider
 * - Horizontal slider with gradient fill
 * - Shows percentage label
 * - Commits on mouse up (debounced)
 */

import { useState, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ProgressSliderProps {
  value: number;
  onChange?: (value: number) => void;
  onCommit: (value: number) => Promise<void>;
  isDisabled?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function ProgressSlider({
  value,
  onChange,
  onCommit,
  isDisabled = false,
  showLabel = true,
  size = 'md',
}: ProgressSliderProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const commitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with prop value when not dragging
  if (!isDragging && localValue !== value) {
    setLocalValue(value);
  }

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value, 10);
      setLocalValue(newValue);
      onChange?.(newValue);
    },
    [onChange]
  );

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(async () => {
    setIsDragging(false);

    // Clear any pending commit
    if (commitTimeoutRef.current) {
      clearTimeout(commitTimeoutRef.current);
    }

    // Don't commit if value unchanged
    if (localValue === value) return;

    // Debounce commit
    commitTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await onCommit(localValue);
      } catch (err) {
        // Revert on error
        setLocalValue(value);
      } finally {
        setIsSaving(false);
      }
    }, 300);
  }, [localValue, value, onCommit]);

  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className="flex items-center gap-3 w-full">
      {/* Slider Track */}
      <div className="relative flex-1">
        <div className={`neu-pressed rounded-full ${heightClass} overflow-hidden`}>
          <div
            className="h-full coral-gradient rounded-full transition-all duration-100"
            style={{ width: `${localValue}%` }}
          />
        </div>

        {/* Native Range Input (invisible, for interaction) */}
        <input
          type="range"
          min={0}
          max={100}
          value={localValue}
          onChange={handleChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          disabled={isDisabled || isSaving}
          className={`
            absolute inset-0 w-full opacity-0 cursor-pointer
            disabled:cursor-not-allowed
          `}
        />
      </div>

      {/* Label */}
      {showLabel && (
        <div className="flex items-center gap-1 min-w-[48px] justify-end">
          {isSaving ? (
            <Loader2 className="h-3 w-3 animate-spin text-coral" />
          ) : (
            <span
              className={`
                text-xs font-semibold tabular-nums
                ${localValue === 100 ? 'text-green-400' : 'text-coral'}
              `}
            >
              {localValue}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
