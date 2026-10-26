/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vodared: {
          50: '#fef2f3',
          100: '#fde6e8',
          200: '#fbd0d5',
          300: '#f7aab4',
          400: '#f27688',
          500: '#e52245',
          600: '#ca1535',
          700: '#a70d29',
          800: '#8c0f25',
          900: '#751224',
          950: '#430510',
        },
        slatebg: '#f3f5f8',
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Cairo', 'Tahoma', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
