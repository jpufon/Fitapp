# waliFit — VitalityTree.tsx

> `apps/mobile/components/VitalityTree.tsx` — copy this file exactly

```typescript
// waliFit — VitalityTree component props
// Pillars: steps (40%) · protein (30%) · hydration (30%)
// Steps source: Apple Health / Google Fit — NEVER manual entry
// Workout completion is NOT a pillar in V1

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, typography, treeStates, getTreeState } from '../theme'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DailyPillars {
  /** 0–1 ratio. Auto-synced from Apple Health / Google Fit. Never manual. */
  steps:     number
  /** 0–1 ratio. User-logged grams vs daily target. */
  protein:   number
  /** 0–1 ratio. User-logged ml vs daily target. */
  hydration: number
}

export interface VitalityTreeProps {
  /** Vitality score 0–100, computed from weighted pillar averages */
  score:      number
  /** Today's individual pillar completion ratios */
  pillars:    DailyPillars
  /** Optional tap handler to open tree detail screen */
  onPress?:   () => void
}

// ─── Score calculation ────────────────────────────────────────────────────────

/** Compute vitality score from pillar values. Weights: steps 40%, protein 30%, hydration 30% */
export function computeVitalityScore(pillars: DailyPillars): number {
  const score =
    (pillars.steps     * 0.40) +
    (pillars.protein   * 0.30) +
    (pillars.hydration * 0.30)
  return Math.round(Math.min(score, 1) * 100)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VitalityTree({ score, pillars, onPress }: VitalityTreeProps) {
  const state      = getTreeState(score)
  const stateInfo  = treeStates[state]

  return (
    <View style={styles.container}>

      {/* Tree illustration placeholder — replace with Lottie animation */}
      <View style={[styles.treePlaceholder, { borderColor: stateInfo.color }]}>
        <Text style={[styles.treeEmoji]}>🌱</Text>
        <Text style={[styles.stateLabel, { color: stateInfo.color }]}>
          {stateInfo.label}
        </Text>
        <Text style={styles.scoreLabel}>{score}</Text>
      </View>

      {/* Pillar progress rings */}
      <View style={styles.pillarsRow}>
        <PillarRing
          label="Steps"
          value={pillars.steps}
          color={colors.pillars.steps}
        />
        <PillarRing
          label="Protein"
          value={pillars.protein}
          color={colors.pillars.protein}
        />
        <PillarRing
          label="Hydration"
          value={pillars.hydration}
          color={colors.pillars.hydration}
        />
      </View>

    </View>
  )
}

// ─── PillarRing sub-component ─────────────────────────────────────────────────

interface PillarRingProps {
  label: string
  value: number   // 0–1
  color: string
}

function PillarRing({ label, value, color }: PillarRingProps) {
  const percent = Math.round(value * 100)
  return (
    <View style={styles.pillar}>
      <View style={[styles.ringOuter, { borderColor: color + '33' }]}>
        <View style={[
          styles.ringFill,
          { borderColor: color, opacity: value > 0 ? 1 : 0.3 }
        ]} />
        <Text style={[styles.pillarValue, { color }]}>{percent}%</Text>
      </View>
      <Text style={styles.pillarLabel}>{label}</Text>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding:    spacing.md,
  },
  treePlaceholder: {
    width:         160,
    height:        160,
    borderRadius:  80,
    borderWidth:   2,
    alignItems:    'center',
    justifyContent:'center',
    marginBottom:  spacing.lg,
  },
  treeEmoji: {
    fontSize: 48,
  },
  stateLabel: {
    fontSize:   typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginTop:  spacing.xs,
  },
  scoreLabel: {
    fontSize:   typography.size['4xl'],
    fontWeight: typography.weight.extrabold,
    color:      colors.foreground,
  },
  pillarsRow: {
    flexDirection:  'row',
    justifyContent: 'space-around',
    width:          '100%',
  },
  pillar: {
    alignItems: 'center',
    gap:        spacing.xs,
  },
  ringOuter: {
    width:         56,
    height:        56,
    borderRadius:  28,
    borderWidth:   4,
    alignItems:    'center',
    justifyContent:'center',
  },
  ringFill: {
    position:      'absolute',
    width:         56,
    height:        56,
    borderRadius:  28,
    borderWidth:   4,
  },
  pillarValue: {
    fontSize:   typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  pillarLabel: {
    fontSize: typography.size.xs,
    color:    colors.mutedForeground,
  },
})

// ─── Mock data for development ────────────────────────────────────────────────
// Use this in HomeScreen during development with MSW mocks.
// Steps come from HealthKit/Google Fit — never hardcoded in production.

export const MOCK_PILLARS: DailyPillars = {
  steps:     0.78,   // 6,240 / 8,000 steps
  protein:   0.79,   // 142 / 180g
  hydration: 0.75,   // 1,875ml / 2,500ml
}
```
