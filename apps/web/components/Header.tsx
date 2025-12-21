/**
 * Header Component
 *
 * Glass morphism header with search and notifications
 * Matches the mockup exactly (dashboard-dark-neumorphic-coral.html lines 332-355)
 *
 * Features:
 * - Neumorphic raised container (neu-raised)
 * - Search input with pressed effect (neu-pressed)
 * - ⌘K keyboard shortcut indicator
 * - Notification bell with pulse indicator
 * - Mobile search modal (full-screen overlay)
 */

'use client';

import { Search, Bell, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useCommandPalette } from '@/components/command-palette/CommandPaletteProvider';

export function Header() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { open } = useCommandPalette();

  return (
    <>
      <header className="neu-raised smooth-transition rounded-3xl px-4 py-4 md:px-8">
        <div className="flex items-center justify-between gap-3">
          {/* Mobile Search Icon Button */}
          <button
            onClick={() => open()}
            className="neu-raised smooth-transition flex h-12 w-12 items-center justify-center rounded-2xl text-slate hover:text-white md:hidden"
            aria-label="Open search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Desktop Search Bar - Hidden on mobile */}
          <div className="hidden max-w-2xl flex-1 md:block">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate" />
              <input
                type="search"
                placeholder="Search issues, knowledge, wiki..."
                onClick={() => open()}
                className="neu-pressed smooth-transition w-full cursor-pointer rounded-2xl border-0 bg-transparent py-3 pl-11 pr-20 text-white placeholder:text-slate focus:outline-none"
                readOnly
              />
              <kbd className="neu-raised absolute right-4 top-1/2 -translate-y-1/2 rounded-xl px-3 py-1.5 font-mono text-xs font-semibold text-slate">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              className="neu-raised smooth-transition relative flex h-12 w-12 items-center justify-center rounded-2xl text-slate hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="pulse-glow absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-coral" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="neu-raised smooth-transition flex h-12 w-12 items-center justify-center rounded-2xl text-slate hover:text-white"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Search Modal - Full screen on mobile, centered on desktop */}
      {/* Overlay */}

      {/* Search Modal Content */}

      {/* Search results would go here */}
    </>
  );
}
