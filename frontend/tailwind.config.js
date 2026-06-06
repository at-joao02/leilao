/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7c3aed',
          dark: '#5b21b6',
        },
        // Paleta azul-marinho derivada do fundo #013457
        zinc: {
          50:  '#f2f8fc',
          100: '#e3eff7',
          200: '#c7dfee',
          300: '#a3c9e0',
          400: '#7fb2d2',
          500: '#5c97bd',
          600: '#41759a',
          700: '#2c5a7d',
          800: '#134a70',
          900: '#023e63',
          950: '#01253e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
