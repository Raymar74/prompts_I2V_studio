/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef0ff', 100: '#dce0ff', 200: '#bfc5ff',
          300: '#949dff', 400: '#666fff', 500: '#4f46e5',
          600: '#3b38c7', 700: '#2d2aa3', 800: '#252385',
          900: '#21206d', 950: '#151445',
        },
        surface: {
          50: '#f5f4f0', 100: '#eeede7', 200: '#d8d6cf',
          300: '#bfbbae', 400: '#9e9889', 500: '#857e6f',
          600: '#6d6659', 700: '#575045', 800: '#484139',
          900: '#3d3730', 950: '#211d19',
        },
      },
    },
  },
  plugins: [],
}
