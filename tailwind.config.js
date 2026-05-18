/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        coal: {
          950: '#070a0f',
          900: '#0a0d12',
          800: '#0f1117',
          700: '#161b26',
          600: '#1e2840',
          500: '#2a3550',
          400: '#364260',
        },
        parchment: {
          100: '#f0e9d2',
          200: '#d4c9a8',
          300: '#b8a882',
          400: '#8a7d65',
          500: '#5c5245',
        },
        teal: {
          300: '#33d9c5',
          400: '#00c9b5',
          500: '#00a896',
          600: '#007a6c',
          700: '#005a50',
          800: '#003d36',
        },
        crimson: {
          300: '#e87070',
          400: '#e05252',
          500: '#c0392b',
          600: '#a02020',
          700: '#8b1a14',
        },
        gold: {
          300: '#e0c050',
          400: '#d4a017',
          500: '#b8960c',
          600: '#967808',
          700: '#7a6308',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Crimson Pro"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
