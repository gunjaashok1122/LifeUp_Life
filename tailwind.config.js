/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'sm': '640px',
      'md': '9999px',
      'lg': '9999px',
      'xl': '9999px',
      '2xl': '9999px',
    },
    extend: {
      colors: {
        rpg: {
          dark: '#0B0F19',
          card: '#151D30',
          border: '#223150',
          gold: '#F59E0B',
          xp: '#3B82F6',
          level: '#A855F7',
          discipline: '#10B981',
          health: '#EF4444'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
      }
    },
  },
  plugins: [],
}
