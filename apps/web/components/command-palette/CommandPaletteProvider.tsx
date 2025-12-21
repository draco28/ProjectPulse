'use client';

/**
 * Command Palette Provider
 *
 * Global state management for command palette using Context API
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Command } from './types';

interface CommandPaletteContextType {
  isOpen: boolean;
  searchQuery: string;
  selectedIndex: number;
  filteredCommands: Command[];
  allCommands: Command[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedIndex: (index: number) => void;
  executeCommand: (command: Command) => void;
  registerCommands: (commands: Command[]) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [allCommands, setAllCommands] = useState<Command[]>([]);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);

  // Open palette
  const open = useCallback(() => {
    setIsOpen(true);
    setSearchQuery('');
    setSelectedIndex(0);
  }, []);

  // Close palette
  const close = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
    setSelectedIndex(0);
  }, []);

  // Toggle palette
  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Register commands
  const registerCommands = useCallback((commands: Command[]) => {
    setAllCommands(commands);
  }, []);

  // Execute command
  const executeCommand = useCallback(
    async (command: Command) => {
      if (command.disabled) return;

      try {
        await command.action();
        close();
      } catch (error) {
        console.error('Command execution failed:', error);
      }
    },
    [close]
  );

  // Filter commands based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCommands(allCommands);
      setSelectedIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allCommands.filter((command) => {
      const titleMatch = command.title.toLowerCase().includes(query);
      const descriptionMatch = command.description?.toLowerCase().includes(query);
      const keywordsMatch = command.keywords?.some((keyword) =>
        keyword.toLowerCase().includes(query)
      );

      return titleMatch || descriptionMatch || keywordsMatch;
    });

    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [searchQuery, allCommands]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K to toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }

      // ESC to close
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle, close]);

  const value = {
    isOpen,
    searchQuery,
    selectedIndex,
    filteredCommands,
    allCommands,
    open,
    close,
    toggle,
    setSearchQuery,
    setSelectedIndex,
    executeCommand,
    registerCommands,
  };

  return <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>;
}

// Custom hook to use command palette
export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  }
  return context;
}
