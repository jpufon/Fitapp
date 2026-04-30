/** @type {import('tailwindcss').Config} */
const { colors, pillarColors } = require('./theme.colors');

module.exports = {
  content: ['./App.{ts,tsx}', './screens/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background:  colors.background,
        card:        colors.card,
        secondary:   colors.secondary,
        muted:       colors.muted,
        border:      colors.border,
        foreground:  colors.foreground,
        'muted-foreground': colors.mutedForeground,
        primary: {
          DEFAULT: colors.primary,
          light:   colors.vitalityLight,
          dark:    colors.primaryDark,
          fg:      colors.primaryFg,
        },
        pillar: {
          steps:     pillarColors.steps,
          protein:   pillarColors.protein,
          hydration: pillarColors.hydration,
        },
        badge: {
          iron:      colors.badgeIron,
          bronze:    colors.badgeBronze,
          silver:    colors.badgeSilver,
          gold:      colors.badgeGold,
          legendary: colors.badgeLegendary,
        },
        energy:      colors.energy,
        blue:        colors.blue,
        purple:      colors.purple,
        destructive: colors.destructive,
      }
    }
  },
  plugins: []
}
