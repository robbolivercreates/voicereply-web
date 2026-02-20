/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chassis: {
          DEFAULT: '#e8e4d9', // Aged beige plastic
          dark: '#dcd8cc',
          darker: '#bfbkb0',
        },
        speaker: {
          DEFAULT: '#2a2a2a', // Dark grill
          light: '#3a3a3a',
        },
        tape: {
          window: '#1a1a1a', // Smoky dark plastic
          spool: '#ffffff',
          body: '#333333',
        },
        brand: {
          gold: '#d4af37', // Vintage gold text
          red: '#cc0000', // Recording LED/Button
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        mono: ['"Courier Prime"', 'monospace'],
        sans: ['"Inter"', 'sans-serif'],
      },
      backgroundImage: {
        'brushed-metal': 'linear-gradient(180deg, #e8e8e8 0%, #d0d0d0 100%)',
        'knob-metal': 'conic-gradient(#f0f0f0, #d0d0d0, #f0f0f0, #d0d0d0, #f0f0f0)',
      },
      boxShadow: {
        'deep': '0 10px 30px -5px rgba(0, 0, 0, 0.5)',
        'button-pressed': 'inset 0 2px 4px rgba(0,0,0,0.3)',
        'button-raised': '0 4px 0 #b0b0b0, 0 8px 10px rgba(0,0,0,0.3)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'tape-run': 'spin 4s linear infinite',
        'vu-bounce': 'vuBounce 0.2s ease-in-out',
      },
      keyframes: {
        vuBounce: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(5deg)' },
        }
      }
    },
  },
  plugins: [],
}
