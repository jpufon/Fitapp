# waliFit — WorkoutCompleteScreen

**Destination:** `apps/mobile/screens/WorkoutCompleteScreen.tsx`

---

```tsx
// waliFit — WorkoutCompleteScreen
// Shows after finishing a workout: PRs, volume, tree pillar impact, share to Arena

import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Trophy, TrendingUp, Trees, Share2, Check, ChevronRight, Zap } from 'lucide-react-native'
import { colors, spacing, typography, radius, touchTarget } from '../theme'

const MOCK_RESULT = {
  workoutName:    'Push Day A',
  durationMin:    52,
  totalVolume:    4820,
  totalSets:      16,
  totalReps:      112,
  personalRecords: [
    { exercise: 'Bench Press', newValue: '82.5kg', oldValue: '80kg', delta: '+2.5kg' },
  ],
  treeImpact: {
    before: 72,
    after:  85,
    label:  'Growing',
  },
  topSets: [
    { exercise: 'Bench Press',       best: '82.5kg × 5' },
    { exercise: 'Overhead Press',    best: '57.5kg × 6' },
    { exercise: 'Incline Dumbbell',  best: '32.5kg × 8' },
  ],
}

interface WorkoutCompleteScreenProps {
  onDone: () => void
}

export default function WorkoutCompleteScreen({ onDone }: WorkoutCompleteScreenProps) {
  const [shared, setShared] = useState(false)

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.checkCircle}>
            <Check color={colors.primaryFg} size={36} strokeWidth={2.5} />
          </View>
          <Text style={styles.heroTitle}>Workout complete</Text>
          <Text style={styles.heroSub}>{MOCK_RESULT.workoutName} · {MOCK_RESULT.durationMin} min</Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard label="Total volume"  value={`${MOCK_RESULT.totalVolume.toLocaleString()}kg`} color={colors.primary} />
          <StatCard label="Sets"           value={`${MOCK_RESULT.totalSets}`}                       color={colors.blue}    />
          <StatCard label="Reps"           value={`${MOCK_RESULT.totalReps}`}                       color={colors.energy}  />
        </View>

        {/* Personal Records */}
        {MOCK_RESULT.personalRecords.length > 0 && (
          <View style={[styles.section, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '06' }]}>
            <View style={styles.sectionHeader}>
              <Trophy color={colors.primary} size={18} strokeWidth={1.75} />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>New personal records</Text>
            </View>
            {MOCK_RESULT.personalRecords.map((pr, i) => (
              <View key={i} style={styles.prRow}>
                <View>
                  <Text style={styles.prExercise}>{pr.exercise}</Text>
                  <Text style={styles.prOld}>Previous: {pr.oldValue}</Text>
                </View>
                <View style={styles.prNewWrap}>
                  <Text style={[styles.prNew, { color: colors.primary }]}>{pr.newValue}</Text>
                  <Text style={[styles.prDelta, { color: colors.primary }]}>{pr.delta}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tree impact */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trees color={colors.primary} size={18} strokeWidth={1.75} />
            <Text style={styles.sectionTitle}>Vitality Tree</Text>
          </View>
          <View style={styles.treeImpactRow}>
            <View style={styles.treeScore}>
              <Text style={styles.treeScoreLabel}>Before</Text>
              <Text style={[styles.treeScoreNum, { color: colors.mutedForeground }]}>{MOCK_RESULT.treeImpact.before}</Text>
            </View>
            <View style={styles.treeArrow}>
              <ChevronRight color={colors.primary} size={22} strokeWidth={2} />
            </View>
            <View style={styles.treeScore}>
              <Text style={styles.treeScoreLabel}>After</Text>
              <Text style={[styles.treeScoreNum, { color: colors.primary }]}>{MOCK_RESULT.treeImpact.after}</Text>
            </View>
            <View style={[styles.treeStageBadge, { backgroundColor: colors.primary + '18' }]}>
              <Text style={[styles.treeStageText, { color: colors.primary }]}>{MOCK_RESULT.treeImpact.label}</Text>
            </View>
          </View>
        </View>

        {/* Top sets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Zap color={colors.energy} size={18} strokeWidth={1.75} />
            <Text style={styles.sectionTitle}>Top sets</Text>
          </View>
          {MOCK_RESULT.topSets.map((s, i) => (
            <View key={i} style={styles.topSetRow}>
              <Text style={styles.topSetExercise}>{s.exercise}</Text>
              <Text style={[styles.topSetBest, { color: colors.energy }]}>{s.best}</Text>
            </View>
          ))}
        </View>

        {/* Share to Arena */}
        {MOCK_RESULT.personalRecords.length > 0 && (
          <TouchableOpacity
            style={[styles.shareBtn, shared && { backgroundColor: colors.card, borderColor: colors.primary }]}
            onPress={() => setShared(true)}
            activeOpacity={0.7}
          >
            {shared ? (
              <>
                <Check color={colors.primary} size={18} strokeWidth={2} />
                <Text style={[styles.shareBtnText, { color: colors.primary }]}>Posted to Arena</Text>
              </>
            ) : (
              <>
                <Share2 color={colors.primaryFg} size={18} strokeWidth={1.75} />
                <Text style={styles.shareBtnText}>Share PR to Arena</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Done button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.doneBtn} onPress={onDone}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  content:          { paddingHorizontal: spacing.screen, paddingTop: spacing.xl, paddingBottom: 100, gap: spacing.md },
  hero:             { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  checkCircle:      { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  heroTitle:        { fontSize: typography.size['2xl'], fontWeight: typography.weight.extrabold, color: colors.foreground },
  heroSub:          { fontSize: typography.size.base, color: colors.mutedForeground },
  statsGrid:        { flexDirection: 'row', gap: spacing.sm },
  statCard:         { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, alignItems: 'center', gap: 4 },
  statValue:        { fontSize: typography.size['2xl'], fontWeight: typography.weight.extrabold },
  statLabel:        { fontSize: typography.size.xs, color: colors.mutedForeground },
  section:          { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  sectionHeader:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle:     { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.foreground },
  prRow:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prExercise:       { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground },
  prOld:            { fontSize: typography.size.xs, color: colors.mutedForeground, marginTop: 2 },
  prNewWrap:        { alignItems: 'flex-end' },
  prNew:            { fontSize: typography.size.lg, fontWeight: typography.weight.extrabold },
  prDelta:          { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  treeImpactRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  treeScore:        { alignItems: 'center', gap: 3 },
  treeScoreLabel:   { fontSize: typography.size.xs, color: colors.mutedForeground },
  treeScoreNum:     { fontSize: typography.size['3xl'], fontWeight: typography.weight.extrabold },
  treeArrow:        { flex: 1, alignItems: 'center' },
  treeStageBadge:   { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  treeStageText:    { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  topSetRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topSetExercise:   { fontSize: typography.size.sm, color: colors.foreground },
  topSetBest:       { fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  shareBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: touchTarget.comfortable, backgroundColor: colors.primary, borderRadius: radius.full, borderWidth: 0.5, borderColor: 'transparent' },
  shareBtnText:     { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.primaryFg },
  bottomBar:        { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.screen, paddingBottom: spacing.xl, backgroundColor: colors.background, borderTopWidth: 0.5, borderTopColor: colors.border },
  doneBtn:          { height: touchTarget.comfortable, backgroundColor: colors.primary, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  doneBtnText:      { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.primaryFg },
})
```
