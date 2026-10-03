/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        primary: { DEFAULT: '#1d4ed8', foreground: '#ffffff' },
        muted: 'rgb(var(--muted) / <alpha-value>)'
      },
      borderRadius: { lg: '0.75rem', md: '0.5rem' },
      boxShadow: { card: '0 1px 3px rgba(0,0,0,0.08)' }
    }
  },
  plugins: []
};
