/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: '#1e293b',
        canvas: '#0f172a',
        ink: '#0a0f1a',
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(148, 163, 184, 0.06) inset, 0 8px 32px -8px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [],
};
