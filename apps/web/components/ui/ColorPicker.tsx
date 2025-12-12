/**
 * ColorPicker Component (Sprint 11.7)
 *
 * Predefined color palette picker for labels.
 * Features:
 * - 18 curated colors (matching common issue tracker conventions)
 * - Click-to-select with visual indicator
 * - Accessible with keyboard navigation
 * - Matches neumorphic design system
 */
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Predefined label colors
 * Curated palette matching common issue tracker conventions
 */
export const LABEL_COLORS = [
  // Red tones
  '#b60205', // dark red
  '#d93f0b', // red-orange
  '#e99695', // light red

  // Orange/Yellow tones
  '#fbca04', // yellow
  '#f9d0c4', // peach
  '#fef2c0', // light yellow

  // Green tones
  '#0e8a16', // green
  '#c2e0c6', // light green

  // Teal/Cyan tones
  '#006b75', // teal
  '#bfdadc', // light teal

  // Blue tones
  '#1d76db', // blue
  '#0052cc', // dark blue
  '#c5def5', // light blue
  '#bfd4f2', // pale blue

  // Purple tones
  '#5319e7', // purple
  '#d4c5f9', // light purple

  // Neutral tones
  '#f5f5f5', // white/light gray
  '#6b7280', // gray
] as const;

export type LabelColor = typeof LABEL_COLORS[number];

interface ColorPickerProps {
  /**
   * Currently selected color (hex format)
   */
  value: string;

  /**
   * Callback when color is selected
   */
  onChange: (color: string) => void;

  /**
   * Optional class name for container
   */
  className?: string;

  /**
   * Disabled state
   */
  disabled?: boolean;
}

/**
 * ColorPicker Component
 *
 * Grid of color swatches for selecting label colors.
 * Uses predefined palette for consistency.
 */
export function ColorPicker({
  value,
  onChange,
  className,
  disabled = false,
}: ColorPickerProps) {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const gridRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      const cols = 6; // 6 columns in the grid
      const total = LABEL_COLORS.length;

      let newIndex = focusedIndex;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          newIndex = focusedIndex < total - 1 ? focusedIndex + 1 : 0;
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = focusedIndex > 0 ? focusedIndex - 1 : total - 1;
          break;
        case 'ArrowDown':
          e.preventDefault();
          newIndex = focusedIndex + cols < total ? focusedIndex + cols : focusedIndex % cols;
          break;
        case 'ArrowUp':
          e.preventDefault();
          newIndex = focusedIndex - cols >= 0 ? focusedIndex - cols : total - cols + (focusedIndex % cols);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          const selectedColor = LABEL_COLORS[focusedIndex];
          if (focusedIndex >= 0 && focusedIndex < total && selectedColor) {
            onChange(selectedColor);
          }
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = total - 1;
          break;
      }

      if (newIndex !== focusedIndex && newIndex >= 0 && newIndex < total) {
        setFocusedIndex(newIndex);
      }
    },
    [focusedIndex, onChange, disabled]
  );

  // Focus the focused color button when index changes
  useEffect(() => {
    if (focusedIndex >= 0 && gridRef.current) {
      const buttons = gridRef.current.querySelectorAll('button');
      buttons[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  // Select color handler
  const selectColor = useCallback(
    (color: string, index: number) => {
      if (disabled) return;
      setFocusedIndex(index);
      onChange(color);
    },
    [onChange, disabled]
  );

  return (
    <div
      ref={gridRef}
      className={cn('grid grid-cols-6 gap-2', className)}
      role="listbox"
      aria-label="Select a color"
      onKeyDown={handleKeyDown}
    >
      {LABEL_COLORS.map((color, index) => {
        const isSelected = value.toLowerCase() === color.toLowerCase();
        const isFocused = focusedIndex === index;

        // Determine if color is light (for contrast)
        const isLight = isLightColor(color);

        return (
          <button
            key={color}
            type="button"
            role="option"
            aria-selected={isSelected}
            tabIndex={isFocused || (focusedIndex === -1 && index === 0) ? 0 : -1}
            onClick={() => selectColor(color, index)}
            disabled={disabled}
            className={cn(
              'relative h-8 w-8 rounded-lg transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 focus:ring-offset-background',
              'hover:scale-110 hover:shadow-md',
              isSelected && 'ring-2 ring-coral ring-offset-2 ring-offset-background',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            style={{ backgroundColor: color }}
            title={color}
          >
            {isSelected && (
              <Check
                className={cn(
                  'absolute inset-0 m-auto h-4 w-4',
                  isLight ? 'text-gray-800' : 'text-white'
                )}
                strokeWidth={3}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Determine if a hex color is "light" for contrast purposes
 */
function isLightColor(hex: string): boolean {
  // Remove # if present
  const color = hex.replace('#', '');

  // Parse RGB values
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Calculate relative luminance (simplified)
  // Using the formula: 0.299*R + 0.587*G + 0.114*B
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5;
}

/**
 * ColorPickerDropdown - Dropdown wrapper for ColorPicker
 *
 * Shows a trigger button with the selected color and opens
 * a dropdown with the full color palette.
 */
interface ColorPickerDropdownProps extends ColorPickerProps {
  /**
   * Optional label to show next to the color
   */
  label?: string;
}

export function ColorPickerDropdown({
  value,
  onChange,
  label,
  disabled = false,
  className,
}: ColorPickerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleColorChange = useCallback(
    (color: string) => {
      onChange(color);
      setIsOpen(false);
    },
    [onChange]
  );

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2',
          'neu-pressed smooth-transition',
          'hover:bg-slate/10',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <span
          className="h-5 w-5 rounded-md border border-slate/30"
          style={{ backgroundColor: value }}
        />
        {label && <span className="text-sm text-slate">{label}</span>}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute left-0 top-full z-50 mt-2',
            'rounded-xl p-3',
            'neu-raised',
            'shadow-lg'
          )}
        >
          <ColorPicker
            value={value}
            onChange={handleColorChange}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
