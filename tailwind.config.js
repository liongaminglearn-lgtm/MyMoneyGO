/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // solo activa dark si se agrega clase .dark — nunca automático
  theme: {
    extend: {
      colors: {
        brand: {
          green:  '#00C896',
          dark2:  '#00A67C',
          light:  '#ECFDF5',
          dark:   '#F0FDF9',
          card:   '#FFFFFF',
          border: '#E2E8F0',
          muted:  '#64748B',
          text:   '#0F172A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}
