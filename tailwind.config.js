/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0b0f17',
        cardBg: '#131822',
        accentGold: '#facc15',
        borderDark: 'rgba(255, 255, 255, 0.08)'
      }
    },
  },
  plugins: [],
}