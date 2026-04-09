/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#1a1a2e',
          raised: '#22223a',
          overlay: '#2a2a44',
          hover: '#32324e',
        },
        coral: {
          DEFAULT: '#ff6b6b',
          light: '#ff8787',
          dark: '#e05555',
        },
        status: {
          backlog: '#64748b',
          todo: '#ff6b6b',
          'in-progress': '#f59e0b',
          'in-review': '#a855f7',
          done: '#10b981',
        },
        priority: {
          critical: '#ef4444',
          high: '#f97316',
          medium: '#eab308',
          low: '#64748b',
        },
      },
    },
  },
  plugins: [],
};
