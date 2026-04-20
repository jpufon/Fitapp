# waliFit — TrainScreen.tsx

> `apps/mobile/screens/TrainScreen.tsx` — copy this file exactly

```typescript
// waliFit — TrainScreen
// Tab 2: Today's plan, custom builder, workout history
// Pillars: workout logging entry point + WaliRun entry point

import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet,
} from 'react-native'
import { Play, Plus, History, Zap, Timer, Search, ChevronRight } from 'lucide-react-native'
import { colors, spacing, typography, radius, touchTarget } from '../theme'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TODAYS_PLAN = [
  {
    id: '1',
    name: 'Upper Body Strength',
    type: 'AI Generated',
    exercises: 6,
    durationMin: 45,
    isRun: false,
  },
  {
    id: '2',
    name: 'Easy 5K Run',
    type: 'GPS Tracking',
    exercises: 1,
    durationMin: 30,
    isRun: true,
  },
]

const MOCK_HISTORY = [
  { id: '1', date: 'Today',     name: 'Upper Body Strength', volume: '4,820kg', prs: 1 },
  { id: '2', date: 'Yesterday', name: 'Easy 5K Run',         volume: '5.2km',   prs: 1 },
  { id: '3', date: 'Monday',    name: 'Lower Body Strength', volume: '6,140kg', prs: 0 },
]

const EXERCISE_CATEGORIES = ['Push', 'Pull', 'Legs', 'Core', 'Cardio', 'Olympic']

// ─── Screen ───────────────────────────────────────────────────────────────────

type Tab = 'start' | 'custom' | 'history'

export default function TrainScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('start')

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Train</Text>
        <Text style={styles.subtitle}>Let's build strength together</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TabButton icon={Play}    label="Start"   active={activeTab === 'start'}   onPress={() => setActiveTab('start')}   />
        <TabButton icon={Plus}    label="Custom"  active={activeTab === 'custom'}  onPress={() => setActiveTab('custom')}  />
        <TabButton icon={History} label="History" active={activeTab === 'history'} onPress={() => setActiveTab('history')} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'start'   && <StartTab />}
        {activeTab === 'custom'  && <CustomTab />}
        {activeTab === 'history' && <HistoryTab />}
      </ScrollView>
    </View>
  )
}

// ─── Start tab ────────────────────────────────────────────────────────────────

function StartTab() {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Today's Plan</Text>

      {MOCK_TODAYS_PLAN.map((workout) => (
        <TouchableOpacity key={workout.id} style={styles.workoutCard} activeOpacity={0.7}>
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutName}>{workout.name}</Text>
            <View style={styles.workoutMeta}>
              <View style={styles.metaChip}>
                <Zap color={colors.mutedForeground} size={13} strokeWidth={1.75} />
                <Text style={styles.metaText}>{workout.exercises} exercises</Text>
              </View>
              <View style={styles.metaChip}>
                <Timer color={colors.mutedForeground} size={13} strokeWidth={1.75} />
                <Text style={styles.metaText}>{workout.durationMin} min</Text>
              </View>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: colors.primary + '18' }]}>
              <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{workout.type}</Text>
            </View>
          </View>
          <View style={styles.playBtn}>
            <Play color={colors.primaryFg} size={22} strokeWidth={2} fill={colors.primaryFg} />
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.generateBtn} activeOpacity={0.7}>
        <Plus color={colors.primary} size={18} strokeWidth={2} />
        <Text style={styles.generateBtnText}>Generate New Plan with Wali AI</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Custom tab ───────────────────────────────────────────────────────────────

function CustomTab() {
  const [query, setQuery] = useState('')

  return (
    <View style={styles.tabContent}>
      {/* Search */}
      <View style={styles.searchRow}>
        <Search color={colors.mutedForeground} size={18} strokeWidth={1.75} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Add exercise */}
      <Text style={styles.sectionLabel}>Build Custom Workout</Text>
      <TouchableOpacity style={styles.addExerciseBtn} activeOpacity={0.7}>
        <Plus color={colors.primary} size={18} strokeWidth={2} />
        <Text style={[styles.addExerciseBtnText, { color: colors.primary }]}>Add Exercise</Text>
      </TouchableOpacity>

      {/* Categories */}
      <Text style={styles.sectionLabel}>Exercise Categories</Text>
      <View style={styles.categoriesGrid}>
        {EXERCISE_CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat} style={styles.categoryCard} activeOpacity={0.7}>
            <Text style={styles.categoryName}>{cat}</Text>
            <Text style={styles.categorySubtext}>Browse exercises</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

// ─── History tab ──────────────────────────────────────────────────────────────

function HistoryTab() {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Recent Workouts</Text>
      {MOCK_HISTORY.map((item) => (
        <TouchableOpacity key={item.id} style={styles.historyCard} activeOpacity={0.7}>
          <View style={styles.historyLeft}>
            <Text style={styles.historyDate}>{item.date}</Text>
            <Text style={styles.historyName}>{item.name}</Text>
            <Text style={styles.historyVolume}>{item.volume}</Text>
          </View>
          <View style={styles.historyRight}>
            {item.prs > 0 && (
              <View style={[styles.prBadge, { backgroundColor: colors.primary + '18' }]}>
                <Text style={[styles.prBadgeText, { color: colors.primary }]}>
                  {item.prs} PR
                </Text>
              </View>
            )}
            <ChevronRight color={colors.mutedForeground} size={18} strokeWidth={1.75} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabButton({ icon: Icon, label, active, onPress }: {
  icon: React.ElementType; label: string; active: boolean; onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon color={active ? colors.primary : colors.mutedForeground} size={15} strokeWidth={1.75} />
      <Text style={[styles.tabLabel, { color: active ? colors.primary : colors.mutedForeground }]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  header:          { paddingHorizontal: spacing.screen, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  title:           { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.foreground },
  subtitle:        { fontSize: typography.size.sm, color: colors.mutedForeground, marginTop: 2 },
  tabBar:          { flexDirection: 'row', marginHorizontal: spacing.screen, padding: 4, backgroundColor: colors.secondary, borderRadius: radius.xl, marginBottom: spacing.md },
  tab:             { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, paddingHorizontal: spacing.sm, borderRadius: radius.lg, minHeight: touchTarget.min },
  tabActive:       { backgroundColor: colors.card },
  tabLabel:        { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  scroll:          { flex: 1 },
  scrollContent:   { paddingBottom: spacing.xxl },
  tabContent:      { paddingHorizontal: spacing.screen, gap: spacing.sm },
  sectionTitle:    { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.foreground, marginBottom: spacing.xs },
  sectionLabel:    { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.mutedForeground },
  workoutCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, gap: spacing.md },
  workoutInfo:     { flex: 1, gap: spacing.xs },
  workoutName:     { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.foreground },
  workoutMeta:     { flexDirection: 'row', gap: spacing.md },
  metaChip:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:        { fontSize: typography.size.sm, color: colors.mutedForeground },
  typeBadge:       { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  typeBadgeText:   { fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  playBtn:         { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  generateBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.secondary, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, minHeight: touchTarget.comfortable },
  generateBtnText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.primary },
  searchRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, paddingHorizontal: spacing.md, height: touchTarget.comfortable },
  searchInput:     { flex: 1, fontSize: typography.size.base, color: colors.foreground },
  addExerciseBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', padding: spacing.md, minHeight: touchTarget.comfortable },
  addExerciseBtnText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
  categoriesGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryCard:    { width: '47%', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, gap: 4 },
  categoryName:    { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground },
  categorySubtext: { fontSize: typography.size.xs, color: colors.mutedForeground },
  historyCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md },
  historyLeft:     { flex: 1, gap: 3 },
  historyDate:     { fontSize: typography.size.xs, color: colors.mutedForeground },
  historyName:     { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.foreground },
  historyVolume:   { fontSize: typography.size.sm, color: colors.mutedForeground },
  historyRight:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  prBadge:         { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  prBadgeText:     { fontSize: typography.size.xs, fontWeight: typography.weight.bold },
})
```
