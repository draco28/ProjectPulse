/**
 * ProjectPulse - Tailwind CSS Configuration
 * Dark Neumorphic Coral Theme
 */

module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Base Colors
        dark: {
          DEFAULT: '#1A1A1A',
          lighter: '#242424',
          card: '#2A2A2A',
          pressed: '#1F1F1F',
        },
        
        // Coral Palette
        coral: {
          DEFAULT: '#FF8B6A',
          light: '#FFB299',
          dark: '#E67759',
        },
        
        // Slate/Gray Palette
        slate: {
          DEFAULT: '#8B8B8B',
          light: '#A5A5A5',
          dark: '#6B6B6B',
        },
        
        // Accent Colors
        accent: {
          green: '#4ADE80',
          blue: '#60A5FA',
          yellow: '#FBBF24',
          red: '#EF4444',
          purple: '#A78BFA',
        },
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      
      boxShadow: {
        // Neumorphic Shadows
        'neu-raised': '8px 8px 16px rgba(0, 0, 0, 0.6), -8px -8px 16px rgba(60, 60, 60, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'neu-raised-hover': '12px 12px 24px rgba(0, 0, 0, 0.7), -12px -12px 24px rgba(60, 60, 60, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'neu-pressed': 'inset 4px 4px 8px rgba(0, 0, 0, 0.5), inset -2px -2px 6px rgba(60, 60, 60, 0.1)',
        'neu-flat': '4px 4px 8px rgba(0, 0, 0, 0.6), -2px -2px 6px rgba(60, 60, 60, 0.1)',
        
        // Coral Shadows
        'coral-soft': '0 8px 20px rgba(255, 139, 106, 0.3)',
        'coral-medium': '0 12px 30px rgba(255, 139, 106, 0.4)',
        'coral-strong': '0 0 40px rgba(255, 139, 106, 0.6)',
        
        // Glass Effect
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
      },
      
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '30px',
      },
      
      animation: {
        'float-hex': 'float-hex 8s ease-in-out infinite',
        'float-bubble': 'float-bubble 6s ease-in-out infinite',
        'heartbeat': 'heartbeat 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow-coral 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-in',
        'slide-up': 'slide-up 0.4s ease-out',
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
        'heartbeat': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        'pulse-glow-coral': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 139, 106, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 139, 106, 0.6)' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'slide-up': {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
