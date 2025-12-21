'use client';

/**
 * Command Search Input
 *
 * Search input component with icon and ESC indicator
 */

import { Search } from 'lucide-react';
import { useCommandPalette } from './CommandPaletteProvider';

export function CommandSearch() {
  const { searchQuery, setSearchQuery } = useCommandPalette();

  return (
    <div className="border-b border-[#1F1F1F] p-6">
      <div className="flex items-center gap-4">
        <Search className="h-5 w-5 text-coral" />
        <input
          type="text"
          placeholder="Type a command or search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="command-input flex-1 bg-transparent text-xl text-white outline-none placeholder:text-slate"
          autoFocus
        />
        <kbd className="neu-raised rounded px-3 py-1.5 font-mono text-xs font-semibold text-slate">
          ESC
        </kbd>
      </div>
    </div>
  );
}
