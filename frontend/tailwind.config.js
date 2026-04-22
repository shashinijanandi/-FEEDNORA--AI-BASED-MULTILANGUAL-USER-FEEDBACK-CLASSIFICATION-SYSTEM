/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#eff8ff',
          100: '#dbeffe',
          200: '#b9e0fd',
          300: '#7cc9fb',
          400: '#36aef6',
          500: '#0c93e7',
          600: '#0074c5',
          700: '#015da0',
          800: '#064f84',
          900: '#0b426e',
          950: '#072a49',
        },
        surface: {
          900: '#060d17',
          800: '#0c1726',
          700: '#112034',
          600: '#172a42',
          500: '#1e3452',
          400: '#2a4a6e',
        },
        accent: {
          cyan:   '#22d3ee',
          amber:  '#fbbf24',
          green:  '#34d399',
          red:    '#f87171',
          violet: '#a78bfa',
        }
      },
      backgroundImage: {
        'grid-surface': 'linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
      boxShadow: {
        'glow-cyan':  '0 0 20px rgba(34,211,238,0.15)',
        'glow-blue':  '0 0 30px rgba(12,147,231,0.2)',
        'card':       '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'pulse-slow':    'pulse 3s ease-in-out infinite',
        'slide-in-up':   'slideInUp 0.4s ease-out',
        'slide-in-right':'slideInRight 0.4s ease-out',
        'fade-in':       'fadeIn 0.5s ease-out',
        'pipeline-step': 'pipelineStep 0.5s ease-out forwards',
      },
      keyframes: {
        slideInUp:    { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: 0, transform: 'translateX(-20px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        fadeIn:       { from: { opacity: 0 }, to: { opacity: 1 } },
        pipelineStep: { from: { opacity: 0, transform: 'translateX(-10px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
      }
    },
  },
  plugins: [],
}
