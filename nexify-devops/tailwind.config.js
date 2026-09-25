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
        obsidian: '#090C10',
        surface: '#0F131C',
        surfaceElevated: '#141A26',
        surfaceBorder: 'rgba(255, 255, 255, 0.08)',
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'card': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.06), 0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'elevated': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.09), 0 8px 28px -4px rgba(0, 0, 0, 0.6)',
      }
    },
  },
  plugins: [],
}
