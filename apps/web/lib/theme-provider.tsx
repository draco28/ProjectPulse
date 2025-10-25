'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

/**
 * Static Coral Theme Provider
 *
 * This provider locks the application to the Dark Neumorphic Coral theme.
 * Multi-theme switching has been removed for MVP - dynamic themes will be
 * added post-MVP.
 *
 * The provider ensures:
 * - data-theme="coral" is set on <html>
 * - "dark" class is added for Tailwind dark mode
 * - Consistent theme state across the app
 */

interface Theme {
  id: 'coral';
  name: string;
  description: string;
  mode: 'dark';
  emoji: string;
}

interface ThemeContextType {
  theme: Theme;
}

const coralTheme: Theme = {
  id: 'coral',
  name: 'Dark Neumorphic Coral',
  description: 'Modern dark with coral accent',
  mode: 'dark',
  emoji: '🪸',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Set mounted state after first render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply coral theme to HTML element on mount
  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;

    // Set theme data attribute to coral
    html.setAttribute('data-theme', 'coral');

    // Always add dark class for Tailwind dark mode
    html.classList.add('dark');
  }, [mounted]);

  return (
    <ThemeContext.Provider value={{ theme: coralTheme }}>
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
