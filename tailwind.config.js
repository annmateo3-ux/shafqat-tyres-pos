/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/renderer/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 400: '#f87171', 500: '#ef4444', 600: '#dc2626' },
        dark: {
          900: '#080810', 800: '#0f0f1a', 700: '#141420',
          600: '#1a1a2a', 500: '#1e1e2e', 400: '#252538',
          300: '#2a2a3d', 200: '#3a3a52', 100: '#8888aa',
        }
      },
      animation: {
        'fade-up': 'fadeUp 0.3s ease-out forwards',
        'slide-up': 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'spin-slow': 'spin-slow 8s linear infinite',
      },
    },
  },
  plugins: [],
}
