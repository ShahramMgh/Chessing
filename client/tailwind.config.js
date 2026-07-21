/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Vazirmatn is a polished open Persian/Farsi UI font (loaded in index.html).
        sans: ['Vazirmatn', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          900: '#0a0e1a',
          800: '#0f1424',
          700: '#161c30',
          600: '#1e2540',
        },
        board: {
          light: '#e9edcc',
          dark: '#6c9350',
        },
        brand: {
          DEFAULT: '#6366f1',
          light: '#a5b4fc',
          glow: '#818cf8',
        },
        coach: {
          DEFAULT: '#7c6cf0',
          soft: '#c7cbff',
        },
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(2, 6, 23, 0.75)',
        panel: '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 20px 40px -24px rgba(0,0,0,0.7)',
        board: '0 30px 70px -20px rgba(0,0,0,0.7)',
        glow: '0 0 0 1px rgba(129,140,248,0.4), 0 8px 30px -6px rgba(99,102,241,0.55)',
        toast: '0 12px 30px -8px rgba(0,0,0,0.6)',
      },
      keyframes: {
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(-16px) scale(0.85)' },
          '60%': { opacity: '1', transform: 'translateY(2px) scale(1.04)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'bubble-pop': {
          '0%': { opacity: '0', transform: 'translateY(6px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.15' } },
        'glow-pulse': {
          '0%,100%': { opacity: '0.55' },
          '50%': { opacity: '0.95' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'toast-in': 'toast-in 0.34s cubic-bezier(0.22, 1, 0.36, 1)',
        'bubble-pop': 'bubble-pop 0.25s ease-out',
        'fade-up': 'fade-up 0.4s ease-out both',
        'scale-in': 'scale-in 0.22s ease-out',
        blink: 'blink 1s step-start infinite',
        'glow-pulse': 'glow-pulse 3.5s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        shimmer: 'shimmer 2.2s linear infinite',
      },
    },
  },
  plugins: [],
};
