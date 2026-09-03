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
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38a8f8',
          500: '#0e8ce9',
          600: '#0270c7',
          700: '#0359a1',
          800: '#074c85',
          900: '#0c3f6e',
          950: '#082849',
        },
        dark: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        }
      }
    },
  },
  plugins: [],
}
