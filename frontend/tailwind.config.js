// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#38a5f6',
          500: '#0c89e9',
          600: '#006dc7',
          700: '#0057a2',
          800: '#034985',
          900: '#073e6f',
        },
        secondary: {
          50: '#f5f6fa',
          100: '#ebedf5',
          200: '#d2d6e7',
          300: '#acb4d0',
          400: '#808bb2',
          500: '#616c97',
          600: '#4c567d',
          700: '#3e4664',
          800: '#363c55',
          900: '#313448',
        },
        accent: {
          50: '#f0fdfa',
          100: '#cefbe9',
          200: '#99f6d9',
          300: '#5eeac3',
          400: '#2dd4ac',
          500: '#14b996',
          600: '#099377',
          700: '#0a7563',
          800: '#0c5d4f',
          900: '#0d4d43',
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 0 15px -3px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
  variants: {
    extend: {
      opacity: ['disabled'],
      cursor: ['disabled'],
      backgroundColor: ['active', 'disabled'],
      borderColor: ['active', 'focus-visible'],
      textColor: ['active'],
    },
  },
}