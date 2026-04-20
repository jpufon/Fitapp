/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{ts,tsx}', './screens/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background:  '#0a0f0f',
        card:        '#141818',
        secondary:   '#1a1f1f',
        muted:       '#1f2525',
        border:      '#2a2f2f',
        foreground:  '#e5e7eb',
        'muted-foreground': '#9ca3af',
        primary: {
          DEFAULT: '#10b981',
          light:   '#34d399',
          dark:    '#059669',
          fg:      '#000000',
        },
        pillar: {
          steps:     '#10b981',
          protein:   '#f59e0b',
          hydration: '#60a5fa',
        },
        energy:      '#fbbf24',
        blue:        '#60a5fa',
        purple:      '#a78bfa',
        destructive: '#ef4444',
      }
    }
  },
  plugins: []
}
