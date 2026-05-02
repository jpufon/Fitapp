/** @type {import('tailwindcss').Config} */
const { colors, gradients, pillarColors } = require('./theme.colors');

module.exports = {
  content: ['./App.{ts,tsx}', './screens/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background:  colors.background,
        'background-alt': colors.backgroundAlt,
        card:        colors.card,
        popover:     colors.popover,
        secondary:   colors.secondary,
        muted:       colors.muted,
        border:      colors.border,
        overlay:     colors.overlay,
        foreground:  colors.foreground,
        'muted-foreground': colors.mutedForeground,
        'inverse-text': colors.inverseText,
        primary: {
          DEFAULT: colors.primary,
          light:   colors.primaryLight,
          dark:    colors.primaryDark,
          fg:      colors.primaryFg,
        },
        vitality: {
          light: colors.vitalityLight,
          dark:  colors.vitalityDark,
        },
        pillar: {
          steps:     pillarColors.steps,
          protein:   pillarColors.protein,
          hydration: pillarColors.hydration,
        },
        earth: {
          brown: colors.earth.brown,
          sage:  colors.earth.sage,
          amber: colors.earth.amber,
        },
        accent: {
          blue:   colors.accent.blue,
          purple: colors.accent.purple,
        },
        badge: {
          iron:      colors.badge.iron,
          bronze:    colors.badge.bronze,
          silver:    colors.badge.silver,
          gold:      colors.badge.gold,
          legendary: colors.badge.legendary,
        },
        energy:      colors.energy,
        hydration:   colors.hydration,
        growth:      colors.growth,
        blue:        colors.blue,
        purple:      colors.purple,
        success:     colors.success,
        warning:     colors.warning,
        destructive: colors.destructive,
        google:      colors.google,
        map: {
          surface: colors.mapSurface,
        },
      },
      backgroundImage: {
        'gradient-primary': `linear-gradient(135deg, ${gradients.primary[0]}, ${gradients.primary[1]})`,
        'gradient-energy': `linear-gradient(135deg, ${gradients.energy[0]}, ${gradients.energy[1]})`,
        'gradient-hydration': `linear-gradient(135deg, ${gradients.hydration[0]}, ${gradients.hydration[1]})`,
      }
    }
  },
  plugins: []
}
