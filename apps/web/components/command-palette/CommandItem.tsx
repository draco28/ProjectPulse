'use client';

/**
 * Command Item Component
 *
 * Individual command row with icon, title, description, and shortcut
 */

import { Command } from './types';
import { cn } from '@/lib/utils';

interface CommandItemProps {
  command: Command;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

export function CommandItem({ command, isSelected, onClick, onMouseEnter }: CommandItemProps) {
  const IconComponent = command.icon;
  const isString = typeof command.icon === 'string';

  return (
    <div
      className={cn(
        'command-item flex cursor-pointer items-center gap-4 rounded-2xl px-3 py-3 transition-all',
        'border-l-3 border-transparent',
        isSelected &&
          'command-item-selected border-l-coral bg-gradient-to-r from-coral/15 to-transparent'
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      role="option"
      aria-selected={isSelected}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
          command.type === 'action' &&
            'bg-gradient-to-br from-coral to-coral-dark shadow-lg shadow-coral/30',
          command.type === 'agent' &&
            'bg-gradient-to-br from-coral to-coral-dark shadow-lg shadow-coral/30',
          command.type === 'navigation' && 'bg-gradient-to-br from-slate/30 to-slate/20',
          command.type === 'setting' && 'bg-gradient-to-br from-slate/30 to-slate/20'
        )}
      >
        {isString ? (
          <span className="text-lg">{command.icon}</span>
        ) : (
          <IconComponent className="h-5 w-5 text-white" />
        )}
      </div>

      {/* Text content */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white">{command.title}</p>
        {command.description && (
          <p className="truncate text-sm text-slate">{command.description}</p>
        )}
      </div>

      {/* Badge or Shortcut */}
      {command.badge && (
        <span className="active-badge rounded-full border border-coral/30 bg-coral/20 px-2 py-1 text-xs font-medium text-coral">
          {command.badge}
        </span>
      )}
      {command.shortcut && !command.badge && (
        <kbd className="neu-raised rounded px-2 py-1 font-mono text-xs text-slate">
          {command.shortcut}
        </kbd>
      )}
    </div>
  );
}
