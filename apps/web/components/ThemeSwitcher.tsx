/**
 * ThemeSwitcher Component
 *
 * Allows users to switch between different theme colors:
 * - Coral (default)
 * - Purple
 * - Blue
 * - Green
 */
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type Theme = 'coral' | 'purple' | 'blue' | 'green';

const themes: { name: Theme; label: string; color: string }[] = [
  { name: 'coral', label: 'Coral', color: 'bg-coral' },
  { name: 'purple', label: 'Purple', color: 'bg-purple-500' },
  { name: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { name: 'green', label: 'Green', color: 'bg-green-500' },
];

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('coral');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme && themes.some((t) => t.name === savedTheme)) {
      setCurrentTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (theme: Theme) => {
    // Update CSS custom properties based on theme
    const root = document.documentElement;
    
    switch (theme) {
      case 'coral':
        root.style.setProperty('--color-accent-primary', '#FF6B6B');
        root.style.setProperty('--color-accent-secondary', '#FF8E8E');
        break;
      case 'purple':
        root.style.setProperty('--color-accent-primary', '#A855F7');
        root.style.setProperty('--color-accent-secondary', '#C084FC');
        break;
      case 'blue':
        root.style.setProperty('--color-accent-primary', '#3B82F6');
        root.style.setProperty('--color-accent-secondary', '#60A5FA');
        break;
      case 'green':
        root.style.setProperty('--color-accent-primary', '#10B981');
        root.style.setProperty('--color-accent-secondary', '#34D399');
        break;
    }
  };

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  };

  return (
    <div className="neu-raised smooth-transition rounded-3xl p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate">Theme</h3>
      <div className="grid grid-cols-2 gap-2">
        {themes.map((theme) => (
          <button
            key={theme.name}
            onClick={() => handleThemeChange(theme.name)}
            className={cn(
              'smooth-transition flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium',
              currentTheme === theme.name
                ? 'bg-accent-primary/20 text-white'
                : 'neu-flat text-slate hover:text-white'
            )}
            aria-label={`Switch to ${theme.label} theme`}
            aria-pressed={currentTheme === theme.name}
          >
            <div className={cn('h-4 w-4 rounded-full shadow-md', theme.color)} />
            <span>{theme.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
