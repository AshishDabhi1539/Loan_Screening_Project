/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss,css}",
    "./src/app/**/*.{html,ts,scss,css}",
    "./src/app/features/**/*.{html,ts,scss,css}",
    "./src/app/shared/**/*.{html,ts,scss,css}",
    "./src/app/core/**/*.{html,ts,scss,css}"
  ],
  theme: {
    extend: {
      colors: {
        // SLSP Brand Colors (matching landing page)
        primary: {
          50: '#f0f9f4',
          100: '#dcf2e4',
          200: '#bce5cd',
          300: '#8dd1a8',
          400: '#52b788',
          500: '#40916c', // Main secondary color from landing
          600: '#2d6a4f', // Main primary color from landing
          700: '#25543e',
          800: '#1e4332',
          900: '#19382a',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#ffd166', // Main accent color from landing
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#2196f3',
      },
      fontFamily: {
        'primary': ['Inter', 'Poppins', 'sans-serif'],
        'secondary': ['Roboto', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(90deg, #2D6A4F, #52B788)',
        'gradient-hero': 'linear-gradient(135deg, #2D6A4F 0%, #40916C 100%)',
        'gradient-accent': 'linear-gradient(135deg, #FFD166 0%, #FFE066 100%)',
      }
    },
  },
  plugins: [],
}

