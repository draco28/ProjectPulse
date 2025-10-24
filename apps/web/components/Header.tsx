/**
 * Header Component
 *
 * Top header bar with:
 * - Search bar with ⌘K indicator
 * - Notifications with pulse indicator
 * - Theme switcher
 */
'use client';

import { Search, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CompactThemeSwitcher } from './CompactThemeSwitcher';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-background-light bg-background-dark px-6">
      {/* Search Bar */}
      <div className="max-w-2xl flex-1">
        <div className="group relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary transition-colors group-focus-within:text-accent-primary" />
          <Input
            type="search"
            placeholder="Search issues, knowledge, wiki..."
            className="focus:ring-accent-primary/20 border-background-light bg-background-medium pl-10 pr-16 focus:border-accent-primary"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-background-light bg-background-light px-2 py-1 font-mono text-xs text-text-tertiary">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="ml-6 flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative hover:bg-background-light">
          <Bell className="h-5 w-5 text-text-secondary" />
          {/* Notification badge with pulse */}
          <div className="absolute right-2 top-2">
            <div className="pulse-indicator">
              <div className="pulse-dot !bg-error" />
              <div className="pulse-ring !border-error" />
            </div>
          </div>
        </Button>

        {/* Theme Switcher */}
        <CompactThemeSwitcher />
      </div>
    </header>
  );
}
