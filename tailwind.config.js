/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Light mode colors
        light: {
          bg: '#ffffff',
          surface: '#f3f4f6',
          text: '#111827',
          border: '#e5e7eb',
        },
        // Dark mode colors
        dark: {
          bg: '#111827',
          surface: '#1f2937',
          text: '#f3f4f6',
          border: '#374151',
        },
      },
    },
  },
  plugins: [],
}

