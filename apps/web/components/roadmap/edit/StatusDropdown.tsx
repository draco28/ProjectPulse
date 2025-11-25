'use client';

/**
 * StatusDropdown Component - Standalone Roadmap UI Phase E
 *
 * Quick status change dropdown
 * - Shows current status with color
 * - Dropdown to change status
 * - Commits immediately on selection
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, Loader2, Circle, CheckCircle, PlayCircle, XCircle, Ban } from 'lucide-react';

type Status = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';

interface StatusDropdownProps {
  value: Status;
  onChange: (status: Status) => Promise<void>;
  isDisabled?: boolean;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string; bgColor: string; icon: typeof Circle }
> = {
  NOT_STARTED: {
    label: 'Not Started',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
    icon: Circle,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    icon: PlayCircle,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    icon: CheckCircle,
  },
  BLOCKED: {
    label: 'Blocked',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    icon: XCircle,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    icon: Ban,
  },
};

const STATUS_ORDER: Status[] = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'BLOCKED',
  'CANCELLED',
];

export function StatusDropdown({
  value,
  onChange,
  isDisabled = false,
  size = 'md',
}: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentConfig = STATUS_CONFIG[value] || STATUS_CONFIG.NOT_STARTED;
  const Icon = currentConfig.icon;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = useCallback(
    async (status: Status) => {
      if (status === value || isSaving) return;

      setIsOpen(false);
      setIsSaving(true);

      try {
        await onChange(status);
      } catch (err) {
        // Error handling - could show toast
        console.error('Failed to update status:', err);
      } finally {
        setIsSaving(false);
      }
    },
    [value, onChange, isSaving]
  );

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5';

  return (
    <div ref={dropdownRef} className="relative inline-block">
      {/* Trigger Button */}
      <button
        onClick={() => !isDisabled && !isSaving && setIsOpen(!isOpen)}
        disabled={isDisabled || isSaving}
        className={`
          inline-flex items-center gap-1.5 rounded-lg
          ${currentConfig.bgColor} ${currentConfig.color}
          ${sizeClasses}
          font-medium transition-all
          hover:brightness-110
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isSaving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Icon className="h-3.5 w-3.5" />
        )}
        <span>{currentConfig.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
            absolute z-50 top-full left-0 mt-1
            min-w-[160px] py-1 rounded-xl
            neu-raised border border-dark-pressed
            shadow-xl
          "
        >
          {STATUS_ORDER.map((status) => {
            const config = STATUS_CONFIG[status];
            const StatusIcon = config.icon;
            const isSelected = status === value;

            return (
              <button
                key={status}
                onClick={() => handleSelect(status)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2
                  text-sm text-left transition-colors
                  ${isSelected ? 'bg-dark-pressed' : 'hover:bg-dark-pressed/50'}
                  ${config.color}
                `}
              >
                <StatusIcon className="h-4 w-4" />
                <span>{config.label}</span>
                {isSelected && (
                  <CheckCircle className="h-3.5 w-3.5 ml-auto text-coral" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
