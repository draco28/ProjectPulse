import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class', // Enable dark mode via class strategy
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background layers (4 levels for depth)
        background: {
          darkest: 'var(--color-bg-darkest)',
          dark: 'var(--color-bg-dark)',
          medium: 'var(--color-bg-medium)',
          light: 'var(--color-bg-light)',
        },
        // Accent colors (brand colors, theme-dependent)
        accent: {
          primary: 'var(--color-accent-primary)',
          secondary: 'var(--color-accent-secondary)',
          tertiary: 'var(--color-accent-tertiary)',
        },
        // Text colors (4 levels for hierarchy)
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          muted: 'var(--color-text-muted)',
        },
        // Semantic colors (theme-dependent)
        semantic: {
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          error: 'var(--color-error)',
          info: 'var(--color-info)',
        },
        // Priority colors (for issue tracker)
        priority: {
          critical: 'var(--color-priority-critical)',
          high: 'var(--color-priority-high)',
          medium: 'var(--color-priority-medium)',
          low: 'var(--color-priority-low)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        // Neumorphic shadows (theme-dependent)
        'neu-float': 'var(--shadow-neu-float)',
        'neu-inset': 'var(--shadow-neu-inset)',
        'neu-dark': 'var(--shadow-neu-dark)',
        // Glow effects (theme-dependent)
        'glow-primary': 'var(--glow-primary)',
        'glow-secondary': 'var(--glow-secondary)',
        'glow-tertiary': 'var(--glow-tertiary)',
        // Regular shadow
        'regular': 'var(--shadow-regular)',
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
        'gradient-bg': 'var(--gradient-background)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'heartbeat': 'heartbeat 2s ease-in-out infinite',
        'breathing': 'breathing 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-hex': 'float-hex 8s ease-in-out infinite',
        'float-bubble': 'float-bubble 6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'heartbeat': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        'breathing': {
          '0%, 100%': { boxShadow: 'var(--glow-primary)' },
          '50%': { boxShadow: 'var(--glow-secondary)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(8px)' },
        },
        'float-hex': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-20px) rotate(5deg)' },
          '66%': { transform: 'translateY(-10px) rotate(-5deg)' },
        },
        'float-bubble': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
