'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/lib/theme-provider';
import { ThemePreview } from './ThemePreview';

/**
 * ThemeSwitcher Component
 *
 * Dropdown for switching between themes
 * Displays theme previews and current selection
 *
 * TODO: Upgrade to use shadcn/ui Popover when installed (Week 1 Day 3)
 */
export function ThemeSwitcher() {
  const { theme, currentTheme, themes, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-text-primary transition-all hover:bg-background-light"
      >
        {/* Palette Icon */}
        <svg
          className="h-5 w-5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>

        {/* Theme Name */}
        <div className="flex-1 text-left">
          <div className="text-sm font-medium">{currentTheme.name}</div>
          <div className="text-xs text-text-muted">{currentTheme.description}</div>
        </div>

        {/* Chevron */}
        <svg
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="neon-border absolute bottom-full left-0 right-0 z-50 mb-2 rounded-xl border bg-background-dark p-3 shadow-neu-float"
          style={{ minWidth: '320px' }}
        >
          <div className="space-y-3">
            <div className="px-2 text-sm font-semibold text-text-primary">Choose Theme</div>

            <div className="grid max-h-96 grid-cols-1 gap-2 overflow-y-auto">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setOpen(false);
                  }}
                  className={`
                    group relative rounded-lg border-2 p-3 text-left transition-all
                    ${
                      theme === t.id
                        ? 'bg-accent-primary/10 border-accent-primary'
                        : 'hover:border-accent-primary/50 border-background-light hover:bg-background-medium'
                    }
                  `}
                >
                  <div className="space-y-2">
                    {/* Theme Info */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-text-primary">{t.name}</div>
                        <div className="text-xs text-text-muted">{t.description}</div>
                        <div className="mt-1 text-xs text-text-tertiary">
                          {t.mode === 'light' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                        </div>
                      </div>
                      {theme === t.id && (
                        <svg
                          className="h-5 w-5 flex-shrink-0 text-accent-primary"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Theme Preview */}
                    <ThemePreview themeId={t.id} isActive={theme === t.id} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
