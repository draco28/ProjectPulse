'use client';

/**
 * Command List Component
 * 
 * Scrollable list of commands grouped by category with keyboard navigation
 */

import { useEffect, useRef } from 'react';
import { useCommandPalette } from './CommandPaletteProvider';
import { CommandCategory } from './types';
import { CommandSection } from './CommandSection';
import { CommandItem } from './CommandItem';

interface CommandListProps {
  categories: CommandCategory[];
}

export function CommandList({ categories }: CommandListProps) {
  const {
    filteredCommands,
    selectedIndex,
    setSelectedIndex,
    executeCommand,
    searchQuery,
  } = useCommandPalette();
  const listRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!filteredCommands.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((selectedIndex + 1) % filteredCommands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(
            (selectedIndex - 1 + filteredCommands.length) % filteredCommands.length
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredCommands, setSelectedIndex, executeCommand]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  if (!filteredCommands.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate">
        <p className="text-sm">No commands found</p>
        {searchQuery && (
          <p className="mt-1 text-xs">
            Try a different search term
          </p>
        )}
      </div>
    );
  }

  // Group filtered commands by category
  const commandsByCategory = categories.map((category) => ({
    ...category,
    commands: filteredCommands.filter((cmd) => cmd.category === category.label),
  })).filter((cat) => cat.commands.length > 0);

  return (
    <div ref={listRef} className="max-h-96 overflow-y-auto" role="listbox">
      {commandsByCategory.map((category, catIndex) => (
        <div
          key={category.id}
          className={catIndex > 0 ? 'border-t border-[#1F1F1F] p-4' : 'p-4'}
        >
          <CommandSection icon={category.icon as string} label={category.label} />
          <div className="mt-1 space-y-1">
            {category.commands.map((command) => {
              const commandIndex = filteredCommands.findIndex((c) => c.id === command.id);
              const isSelected = commandIndex === selectedIndex;

              return (
                <div
                  key={command.id}
                  ref={isSelected ? selectedItemRef : null}
                >
                  <CommandItem
                    command={command}
                    isSelected={isSelected}
                    onClick={() => executeCommand(command)}
                    onMouseEnter={() => setSelectedIndex(commandIndex)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
