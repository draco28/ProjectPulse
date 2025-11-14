import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', 'class'], // Enable dark mode via class strategy
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Coral Theme Colors
        dark: {
          DEFAULT: '#1A1A1A',
          lighter: '#242424',
          card: '#2A2A2A',
          pressed: '#1F1F1F',
        },
        coral: {
          DEFAULT: '#FF8B6A',
          light: '#FFB299',
          dark: '#E67759',
        },
        slate: {
          DEFAULT: '#8B8B8B',
          light: '#A5A5A5',
          dark: '#6B6B6B',
        },
        accent: {
          green: '#4ADE80',
          blue: '#60A5FA',
          yellow: '#FBBF24',
          red: '#EF4444',
          purple: '#A78BFA',
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        // Legacy color mappings for compatibility
        background: {
          darkest: 'var(--dark)',
          dark: 'var(--dark-lighter)',
          medium: 'var(--dark-card)',
          light: 'var(--dark-pressed)',
          DEFAULT: 'hsl(var(--background))',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        success: 'var(--accent-green)',
        warning: 'var(--accent-yellow)',
        error: 'var(--accent-red)',
        info: 'var(--accent-blue)',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        // Neumorphic Shadows
        'neu-raised':
          '8px 8px 16px rgba(0, 0, 0, 0.6), -8px -8px 16px rgba(60, 60, 60, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'neu-raised-hover':
          '12px 12px 24px rgba(0, 0, 0, 0.7), -12px -12px 24px rgba(60, 60, 60, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'neu-pressed':
          'inset 4px 4px 8px rgba(0, 0, 0, 0.5), inset -2px -2px 6px rgba(60, 60, 60, 0.1)',
        'neu-flat': '4px 4px 8px rgba(0, 0, 0, 0.6), -2px -2px 6px rgba(60, 60, 60, 0.1)',
        // Coral Shadows
        'coral-soft': '0 8px 20px rgba(255, 139, 106, 0.3)',
        'coral-medium': '0 12px 30px rgba(255, 139, 106, 0.4)',
        'coral-strong': '0 0 40px rgba(255, 139, 106, 0.6)',
        // Glass Effect
        'glass-dark':
          '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
        // Legacy shadow support
        'neu-float': 'var(--shadow-neu-float)',
        'neu-inset': 'var(--shadow-neu-inset)',
        'neu-dark': 'var(--shadow-neu-dark)',
        'glow-primary': '0 0 30px rgba(255, 139, 106, 0.4)',
        'glow-secondary': '0 0 40px rgba(255, 139, 106, 0.6)',
        regular: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'gradient-coral': 'linear-gradient(135deg, #FF8B6A 0%, #E67759 100%)',
        'gradient-primary': 'linear-gradient(135deg, #FF8B6A 0%, #E67759 100%)',
        'gradient-secondary': 'linear-gradient(145deg, #2A2A2A, #242424)',
        'gradient-bg': 'var(--dark)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
        '2xl': '30px',
      },
      animation: {
        'float-hex': 'float-hex 8s ease-in-out infinite',
        'float-bubble': 'float-bubble 6s ease-in-out infinite',
        heartbeat: 'heartbeat 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow-coral 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-in',
        'slide-up': 'slide-up 0.4s ease-out',
        shimmer: 'shimmer 2s infinite',
        // Legacy animations
        breathing: 'breathing 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'float-hex': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-20px) rotate(5deg)' },
          '66%': { transform: 'translateY(-10px) rotate(-5deg)' },
        },
        'float-bubble': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        'pulse-glow-coral': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 139, 106, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 139, 106, 0.6)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        // Legacy keyframes
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        breathing: {
          '0%, 100%': { boxShadow: '0 0 30px rgba(255, 139, 106, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 139, 106, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(8px)' },
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
