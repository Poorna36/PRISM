/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'bg-base': '#080C14',
        'bg-surface': '#0E1420',
        'bg-elevated': '#131929',
        border: '#1C2537',
        'accent-cyan': '#00D4FF',
        'accent-orange': '#FF6B35',
        positive: '#00E5A0',
        negative: '#FF3D5A',
        'text-primary': '#E8EDF5',
        'text-secondary': '#6B7A99',
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 212, 255, 0.15)',
        card: '0px 0px 0px 1px #1C2537',
      },
      borderRadius: {
        industrial: '2px',
      },
      animation: {
        'pulse-cyan': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-orange': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
