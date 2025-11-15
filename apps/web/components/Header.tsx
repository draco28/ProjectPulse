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

import { Search, Bell, X, Sun, Moon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll when search modal is open
  useBodyScrollLock(isSearchOpen);

  // Handle ⌘K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  return (
    <>
      <header className="neu-raised smooth-transition rounded-3xl px-4 py-4 md:px-8">
        <div className="flex items-center justify-between gap-3">
          {/* Mobile Search Icon Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
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
                onClick={() => setIsSearchOpen(true)}
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
      {isSearchOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSearchOpen(false)}
            aria-hidden="true"
          />

          {/* Search Modal Content */}
          <div className="fixed inset-x-4 top-20 z-50 mx-auto max-w-2xl md:top-32">
            <div className="neu-raised smooth-transition rounded-3xl p-6 shadow-2xl">
              <div className="relative">
                {!modalSearch && (
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate" />
                )}
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="     Search issues, knowledge, wiki..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="neu-pressed smooth-transition w-full rounded-2xl border-0 bg-transparent py-3 pl-11 pr-12 text-white placeholder:text-slate focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setModalSearch('');
                  }}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-slate hover:text-white"
                  aria-label="Close search"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search results would go here */}
              <div className="mt-4 text-sm text-slate">
                <p>Start typing to search...</p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
