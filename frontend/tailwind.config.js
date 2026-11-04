/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnight: '#080D1A',
        surface: {
          DEFAULT: '#0F172A',
          elevated: '#152036',
          hover: '#1D2C4A',
          glass: 'rgba(15, 23, 42, 0.68)',
          border: 'rgba(255, 255, 255, 0.07)',
          'border-light': 'rgba(255, 255, 255, 0.14)',
          'border-subtle': 'rgba(255, 255, 255, 0.04)',
        },
        brand: {
          lime: '#B6F36B',
          'lime-hover': '#A3E853',
          'lime-muted': 'rgba(182, 243, 107, 0.12)',
          'lime-border': 'rgba(182, 243, 107, 0.25)',
          blue: '#38BDF8',
          'blue-muted': 'rgba(56, 189, 248, 0.12)',
        },
        tactical: {
          success: '#10B981',
          warning: '#F59E0B',
          critical: '#EF4444',
          info: '#38BDF8',
        },
        content: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.25)',
        'glass-md': '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
        'glass-lg': '0 16px 48px -8px rgba(0, 0, 0, 0.5)',
        'glow-lime': '0 0 16px -2px rgba(182, 243, 107, 0.18)',
        'glow-blue': '0 0 16px -2px rgba(56, 189, 248, 0.18)',
        'surface-elevation': '0 12px 36px -8px rgba(0, 0, 0, 0.55)',
      },
    },
  },
  plugins: [],
}
