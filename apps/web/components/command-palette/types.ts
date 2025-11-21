/**
 * Command Palette Types
 * 
 * Type definitions for the command palette system
 */

export type CommandType = 'action' | 'navigation' | 'agent' | 'setting';

export interface Command {
  id: string;
  type: CommandType;
  category: string;
  title: string;
  description?: string;
  icon: any; // Lucide icon component or string
  shortcut?: string;
  badge?: string;
  keywords?: string[];
  action: () => void | Promise<void>;
  disabled?: boolean;
}

export interface CommandCategory {
  id: string;
  label: string;
  icon: React.ReactNode | string;
  commands: Command[];
}

export interface CommandPaletteState {
  isOpen: boolean;
  searchQuery: string;
  selectedIndex: number;
  filteredCommands: Command[];
  recentCommands: Command[];
}
