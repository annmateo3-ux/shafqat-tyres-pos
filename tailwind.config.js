/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/renderer/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg:     '#070b12',
        card:   '#0a0f18',
        hover:  '#0d1420',
        border: '#111827',
        accent: '#06b6d4',
        success:'#22c55e',
        warning:'#f59e0b',
        danger: '#f87171',
        t1:     '#e2e8f0',
        t2:     '#64748b',
        t3:     '#334155',
      }
    },
  },
  plugins: [],
}
