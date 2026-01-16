/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#00C853',      // Makan Green (Primary)
          'green-dark': '#00A846',
          blue: '#005EB8',        // TnG Blue (Accent)
          'blue-light': '#E3F2FD',
        },
        surface: {
          DEFAULT: '#F5F5F5',     // Background Gray
          card: '#FFFFFF',
          muted: '#9E9E9E',
        },
        status: {
          paid: '#4CAF50',
          pending: '#FF9800',
          error: '#F44336',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'button': '0 4px 12px rgba(0, 200, 83, 0.3)',
      }
    },
  },
  plugins: [],
}
