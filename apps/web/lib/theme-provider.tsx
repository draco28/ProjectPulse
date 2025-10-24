'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeId = 'desert' | 'neon' | 'earthy' | 'coral';
type ThemeMode = 'light' | 'dark';

interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  mode: ThemeMode;
}

interface ThemeContextType {
  theme: ThemeId;
  currentTheme: Theme;
  themes: Theme[];
  setTheme: (theme: ThemeId) => void;
}

const themes: Theme[] = [
  {
    id: 'desert',
    name: 'Desert Stone',
    description: 'Soft neumorphic light theme',
    mode: 'light',
  },
  {
    id: 'neon',
    name: 'Neon Vibes',
    description: 'Vibrant neon dark theme',
    mode: 'dark',
  },
  {
    id: 'earthy',
    name: 'Earthy',
    description: 'Muted earth tones',
    mode: 'dark',
  },
  {
    id: 'coral',
    name: 'Dark Neumorphic Coral',
    description: 'Modern dark with coral accent',
    mode: 'dark',
  },
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('desert');
  const [mounted, setMounted] = useState(false);

  const getCurrentTheme = (): Theme => {
    const found = themes.find((t) => t.id === theme);
    // themes[0] always exists (we have 4 themes defined), so this is safe
    return found ?? themes[0]!;
  };

  const currentTheme = getCurrentTheme();

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme') as ThemeId;
    if (saved && themes.some((t) => t.id === saved)) {
      setThemeState(saved);
    }
  }, []);

  // Apply theme to HTML element + dark mode class
  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;

    // Set theme data attribute
    html.setAttribute('data-theme', theme);

    // Set dark/light class for Tailwind
    if (currentTheme.mode === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme, currentTheme.mode, mounted]);

  const setTheme = async (newTheme: ThemeId) => {
    setThemeState(newTheme);

    // Sync to database (optional, can fail silently)
    try {
      await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      });
    } catch (error) {
      console.warn('Failed to sync theme to server:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, currentTheme, themes, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
