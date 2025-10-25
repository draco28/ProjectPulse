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
 */

'use client';

import { Search, Bell } from 'lucide-react';

export function Header() {
  return (
    <header className="neu-raised smooth-transition rounded-3xl px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="max-w-2xl flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate" />
            <input
              type="text"
              placeholder="Search or press Cmd+K..."
              className="neu-pressed smooth-transition w-full rounded-2xl border-0 bg-transparent py-3 pl-11 pr-20 text-white placeholder:text-slate focus:outline-none"
            />
            <span className="neu-raised absolute right-4 top-1/2 -translate-y-1/2 rounded-xl px-3 py-1.5 font-mono text-xs font-semibold text-slate">
              ⌘K
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="ml-6 flex items-center gap-3">
          {/* Notification Bell */}
          <button className="neu-raised smooth-transition relative flex h-12 w-12 items-center justify-center rounded-2xl text-slate hover:text-white">
            <Bell className="h-5 w-5" />
            <span className="pulse-glow absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-coral" />
          </button>
        </div>
      </div>
    </header>
  );
}
