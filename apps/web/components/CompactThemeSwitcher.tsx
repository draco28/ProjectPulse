/**
 * CompactThemeSwitcher Component
 *
 * Compact theme switcher for header with icon-based selection
 * Displays 4 theme options with distinctive icons
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/lib/theme-provider';
import { Button } from '@/components/ui/button';

// Theme icons mapping
const themeIcons: Record<string, string> = {
  desert: '🏜️', // Desert Stone
  neon: '⚡', // Neon Vibes
  earthy: '🌿', // Earthy
  coral: '🌊', // Dark Coral
};

export function CompactThemeSwitcher() {
  const { theme, themes, setTheme } = useTheme();
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

  const currentThemeIcon = themeIcons[theme] || '🎨';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="hover:bg-background-light"
        title="Switch theme"
      >
        <span className="text-xl">{currentThemeIcon}</span>
      </Button>

      {/* Dropdown */}
      {open && (
        <div className="fixed right-6 top-16 z-[100] mt-2 min-w-[240px] rounded-lg border border-background-light bg-background-dark p-2 shadow-neu-float">
          <div className="space-y-1">
            <div className="px-2 py-1 text-xs font-semibold text-text-tertiary">Choose Theme</div>

            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className={`
                  group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-all
                  ${
                    theme === t.id
                      ? 'bg-accent-primary/20 text-text-primary'
                      : 'text-text-secondary hover:bg-background-light hover:text-text-primary'
                  }
                `}
              >
                {/* Theme Icon */}
                <span className="text-xl">{themeIcons[t.id]}</span>

                {/* Theme Info */}
                <div className="flex-1">
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-text-muted">
                    {t.mode === 'light' ? '☀️ Light' : '🌙 Dark'}
                  </div>
                </div>

                {/* Checkmark */}
                {theme === t.id && (
                  <svg
                    className="h-4 w-4 flex-shrink-0 text-accent-primary"
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
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
