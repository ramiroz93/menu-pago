/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fff4ef',
          100: '#ffe6d9',
          200: '#ffc9ad',
          300: '#ffa07a',
          400: '#ff7a45',
          500: '#FF6B35',
          600: '#e84e15',
          700: '#c03a0f',
          800: '#9a2f10',
          900: '#7e2912',
        },
        dark: '#2D3436',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
