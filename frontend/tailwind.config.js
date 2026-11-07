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
        background: '#0B0F17',
        surface: {
          DEFAULT: '#131A29',
          card: '#161F33',
          border: '#222E46',
          muted: '#1E293B',
          hover: '#1B253D'
        },
        brand: {
          purple: {
            DEFAULT: '#8B5CF6',
            light: '#A78BFA',
            dark: '#7C3AED',
            glow: 'rgba(139, 92, 246, 0.25)'
          },
          cyan: {
            DEFAULT: '#06B6D4',
            light: '#22D3EE',
            dark: '#0891B2',
            glow: 'rgba(6, 182, 212, 0.25)'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

