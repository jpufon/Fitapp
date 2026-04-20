# waliFit — HomeScreen.tsx

> `apps/mobile/screens/HomeScreen.tsx` — copy this file exactly

```typescript
// waliFit — HomeScreen
// Tree hero + pillar cards + today's workout + streak
// Pillars: steps (auto) · protein (manual) · hydration (manual)

import React from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { StatusBar }    from 'expo-status-bar'
import { Bell, Settings, Flame } from 'lucide-react-native'
import { colors, spacing, typography, touchTarget, radius } from '../theme'
import VitalityTree, { computeVitalityScore, MOCK_PILLARS } from '../components/VitalityTree'

// ─── Mock data (replace with TanStack Query hooks in production) ──────────────

const MOCK_USER = {
  displayName: 'Marcus',
  streak:      12,
}

const MOCK_TODAY_WORKOUT = {
  name:        'Push Day A',
  type:        'Upper Push',
  exercises:   6,
  durationMin: 55,
}

export default function HomeScreen() {
  const pillars      = MOCK_PILLARS
  const vitalityScore = computeVitalityScore(pillars)

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.name}>{MOCK_USER.displayName}</Text>
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            accessibilityLabel="Notifications"
          >
            <Bell color={colors.mutedForeground} size={22} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>

        {/* ── Streak badge ────────────────────────────────────── */}
        <View style={styles.streakBadge}>
          <Flame color={colors.energy} size={20} strokeWidth={2} />
          <Text style={styles.streakNumber}>{MOCK_USER.streak}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>

        {/* ── Vitality Tree hero ──────────────────────────────── */}
        <View style={styles.treeCard}>
          <VitalityTree
            score={vitalityScore}
            pillars={pillars}
            onPress={() => {/* navigate to tree detail */}}
          />
        </View>

        {/* ── Today's workout ─────────────────────────────────── */}
        <View style={styles.workoutCard}>
          <View style={styles.workoutLeft}>
            <Text style={styles.workoutTitle}>{MOCK_TODAY_WORKOUT.name}</Text>
            <Text style={styles.workoutSub}>
              {MOCK_TODAY_WORKOUT.type} · {MOCK_TODAY_WORKOUT.exercises} exercises · ~{MOCK_TODAY_WORKOUT.durationMin} min
            </Text>
          </View>
          <TouchableOpacity style={styles.startBtn} accessibilityLabel="Start workout">
            <Text style={styles.startBtnText}>Start</Text>
          </TouchableOpacity>
        </View>

        {/* ── Quick-log row ────────────────────────────────────── */}
        <View style={styles.quickRow}>
          <QuickLogTile label="+ Protein"   color={colors.pillars.protein}   />
          <QuickLogTile label="+ Water"     color={colors.pillars.hydration} />
          <QuickLogTile label="Rest timer"  color={colors.blue}              />
          <QuickLogTile label="Log meal"    color={colors.mutedForeground}   />
        </View>

      </ScrollView>
    </View>
  )
}

// ─── QuickLogTile sub-component ────────────────────────────────────────────────

function QuickLogTile({ label, color }: { label: string; color: string }) {
  return (
    <TouchableOpacity style={styles.quickTile} accessibilityLabel={label}>
      <View style={[styles.quickDot, { backgroundColor: color + '33' }]}>
        <View style={[styles.quickDotInner, { backgroundColor: color }]} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: colors.background,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop:        spacing.xl,
    paddingBottom:     spacing.xxl,
    gap:               spacing.md,
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   spacing.sm,
  },
  greeting: {
    fontSize:   typography.size.sm,
    color:      colors.mutedForeground,
  },
  name: {
    fontSize:   typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color:      colors.foreground,
  },
  iconBtn: {
    width:           touchTarget.min,
    height:          touchTarget.min,
    alignItems:      'center',
    justifyContent:  'center',
  },
  streakBadge: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            spacing.xs,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
    borderRadius:   radius.full,
    alignSelf:      'flex-start',
    borderWidth:    0.5,
    borderColor:    colors.border,
  },
  streakNumber: {
    fontSize:   typography.size.lg,
    fontWeight: typography.weight.bold,
    color:      colors.energy,
  },
  streakLabel: {
    fontSize: typography.size.sm,
    color:    colors.mutedForeground,
  },
  treeCard: {
    backgroundColor: colors.card,
    borderRadius:    radius.lg,
    borderWidth:     0.5,
    borderColor:     colors.border,
    overflow:        'hidden',
  },
  workoutCard: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    backgroundColor:  colors.card,
    borderRadius:     radius.lg,
    borderWidth:      0.5,
    borderColor:      colors.border,
    padding:          spacing.md,
  },
  workoutLeft: { flex: 1, marginRight: spacing.md },
  workoutTitle: {
    fontSize:   typography.size.base,
    fontWeight: typography.weight.semibold,
    color:      colors.foreground,
    marginBottom: 2,
  },
  workoutSub: {
    fontSize: typography.size.sm,
    color:    colors.mutedForeground,
  },
  startBtn: {
    backgroundColor:  colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
    borderRadius:     radius.full,
    minHeight:        touchTarget.comfortable,
    justifyContent:   'center',
  },
  startBtnText: {
    fontSize:   typography.size.base,
    fontWeight: typography.weight.semibold,
    color:      colors.primaryFg,
  },
  quickRow: {
    flexDirection:  'row',
    gap:            spacing.sm,
  },
  quickTile: {
    flex:            1,
    backgroundColor: colors.card,
    borderRadius:    radius.lg,
    borderWidth:     0.5,
    borderColor:     colors.border,
    padding:         spacing.sm,
    alignItems:      'center',
    gap:             spacing.xs,
    minHeight:       touchTarget.comfortable,
    justifyContent:  'center',
  },
  quickDot: {
    width:        28,
    height:       28,
    borderRadius: 14,
    alignItems:   'center',
    justifyContent: 'center',
  },
  quickDotInner: {
    width:        10,
    height:       10,
    borderRadius: 5,
  },
  quickLabel: {
    fontSize:  typography.size.xs,
    color:     colors.mutedForeground,
    textAlign: 'center',
  },
})
```
