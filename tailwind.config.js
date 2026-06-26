/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        mission: {
          black:    '#060B14',
          bg:       '#0A0E1A',
          surface:  '#0D1525',
          panel:    '#111E30',
          border:   '#1E3050',
          accent:   '#F97316',   // neon orange
          cyan:     '#06B6D4',   // neon cyan
          green:    '#10B981',   // active / success
          red:      '#EF4444',   // alert
          yellow:   '#EAB308',   // warning
          lime:     '#84CC16',   // vegetation
          text:     '#E2E8F0',   // primary text
          muted:    '#64748B',   // secondary text
          dim:      '#334155',   // tertiary text / borders
        },
      },
      fontFamily: {
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-orange': '0 0 16px rgba(249,115,22,0.5)',
        'glow-cyan':   '0 0 16px rgba(6,182,212,0.5)',
        'glow-green':  '0 0 16px rgba(16,185,129,0.5)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scan-line':  'scan-line 4s linear infinite',
        'fade-in':    'fade-in 0.3s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5' },
          '50%':      { opacity: '1' },
        },
        'scan-line': {
          '0%':   { transform: 'translateY(-100%)', opacity: '0' },
          '50%':  { opacity: '0.4' },
          '100%': { transform: 'translateY(200%)', opacity: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
