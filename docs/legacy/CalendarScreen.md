# waliFit — CalendarScreen.tsx

> `apps/mobile/screens/CalendarScreen.tsx` — copy this file exactly

```typescript
// waliFit — CalendarScreen
// Tab 3: Day / Week / Month views of all logged activity
// Mock data: realistic workout + vitality history

import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native'
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react-native'
import { colors, spacing, typography, radius, touchTarget } from '../theme'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_WEEK = [
  { day: 'Mon', date: 14, type: 'training', completed: true,  score: 90 },
  { day: 'Tue', date: 15, type: 'rest',     completed: true,  score: 72 },
  { day: 'Wed', date: 16, type: 'training', completed: true,  score: 85 },
  { day: 'Thu', date: 17, type: 'rest',     completed: true,  score: 68 },
  { day: 'Fri', date: 18, type: 'training', completed: false, score: 0  },
  { day: 'Sat', date: 19, type: 'training', completed: false, score: 0  },
  { day: 'Sun', date: 20, type: 'rest',     completed: false, score: 0  },
]

const MOCK_DAY = {
  workout:    'Upper Body Strength',
  completed:  true,
  hydrationMl: 1875,
  proteinG:   142,
  stepsCount: 6240,
  vitalityScore: 85,
  notes:      'Felt strong today, hit a PR on bench press!',
}

// Generate 30 days of mock month data
const MOCK_MONTH = Array.from({ length: 30 }, (_, i) => ({
  date:        i + 1,
  hasActivity: i < 18 && Math.random() > 0.35,
  score:       i < 18 ? Math.floor(Math.random() * 35) + 60 : 0,
}))

const MONTH_STATS = { workouts: 18, streak: 12, avgScore: 82 }

// ─── Screen ───────────────────────────────────────────────────────────────────

type View = 'day' | 'week' | 'month'

export default function CalendarScreen() {
  const [view, setView] = useState<View>('week')
  const [currentDate] = useState(new Date())

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Calendar</Text>
        </View>
        {/* Date nav */}
        <View style={styles.dateNav}>
          <TouchableOpacity style={styles.navBtn} accessibilityLabel="Previous">
            <ChevronLeft color={colors.foreground} size={20} strokeWidth={1.75} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity style={styles.navBtn} accessibilityLabel="Next">
            <ChevronRight color={colors.foreground} size={20} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>
      </View>

      {/* View tabs */}
      <View style={styles.tabBar}>
        {(['day', 'week', 'month'] as View[]).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.tab, view === v && styles.tabActive]}
            onPress={() => setView(v)}
          >
            <Text style={[styles.tabLabel, { color: view === v ? colors.primary : colors.mutedForeground }]}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {view === 'day'   && <DayView />}
        {view === 'week'  && <WeekView />}
        {view === 'month' && <MonthView />}
      </ScrollView>
    </View>
  )
}

// ─── Day view ─────────────────────────────────────────────────────────────────

function DayView() {
  return (
    <View style={styles.viewContent}>
      {/* Summary card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Summary</Text>

        {/* Workout row */}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Workout</Text>
          <View style={styles.completedRow}>
            <CheckCircle color={colors.primary} size={14} strokeWidth={2} />
            <Text style={[styles.completedText, { color: colors.primary }]}>Complete</Text>
          </View>
        </View>
        <Text style={styles.summaryValue}>{MOCK_DAY.workout}</Text>

        <View style={styles.divider} />

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Steps</Text>
            <Text style={[styles.statValue, { color: colors.pillars?.steps ?? colors.primary }]}>
              {MOCK_DAY.stepsCount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Protein</Text>
            <Text style={[styles.statValue, { color: colors.energy }]}>{MOCK_DAY.proteinG}g</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Hydration</Text>
            <Text style={[styles.statValue, { color: colors.blue }]}>{MOCK_DAY.hydrationMl}ml</Text>
          </View>
        </View>

        {/* Notes */}
        {MOCK_DAY.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{MOCK_DAY.notes}</Text>
          </View>
        )}
      </View>

      {/* Vitality score */}
      <View style={[styles.card, { borderColor: colors.primary + '40' }]}>
        <View style={styles.vitalityRow}>
          <View>
            <Text style={styles.summaryLabel}>Vitality Score</Text>
            <Text style={[styles.heroNumber, { color: colors.primary }]}>{MOCK_DAY.vitalityScore}</Text>
          </View>
          <View style={[styles.vitalityCircle, { backgroundColor: colors.primary + '20' }]}>
            <CheckCircle color={colors.primary} size={32} strokeWidth={1.75} />
          </View>
        </View>
      </View>
    </View>
  )
}

// ─── Week view ────────────────────────────────────────────────────────────────

function WeekView() {
  return (
    <View style={styles.viewContent}>
      {/* 7-day grid */}
      <View style={styles.weekGrid}>
        {MOCK_WEEK.map((day, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.dayCell,
              day.completed && { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
            ]}
            activeOpacity={0.7}
          >
            <Text style={styles.dayCellDay}>{day.day}</Text>
            <Text style={styles.dayCellDate}>{day.date}</Text>
            {day.type === 'training' && (
              <View style={[styles.dayCellDot, { backgroundColor: day.completed ? colors.primary : colors.muted }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Week stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Workouts</Text>
          <Text style={styles.statBig}>3/4</Text>
          <Text style={styles.statSub}>completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Avg Vitality</Text>
          <Text style={[styles.statBig, { color: colors.primary }]}>78</Text>
          <Text style={styles.statSub}>this week</Text>
        </View>
      </View>

      {/* Training day breakdown */}
      <Text style={styles.sectionTitle}>Training Days</Text>
      {MOCK_WEEK.filter(d => d.type === 'training').map((day, i) => (
        <View key={i} style={[styles.card, styles.trainingRow]}>
          <View>
            <Text style={styles.summaryLabel}>{day.day}, Apr {day.date}</Text>
            <Text style={styles.summaryValue}>
              {day.completed ? 'Workout Complete' : 'Upcoming'}
            </Text>
          </View>
          {day.completed && (
            <Text style={[styles.scoreText, { color: colors.primary }]}>{day.score}</Text>
          )}
        </View>
      ))}
    </View>
  )
}

// ─── Month view ───────────────────────────────────────────────────────────────

function MonthView() {
  return (
    <View style={styles.viewContent}>
      {/* Day headers */}
      <View style={styles.weekdayRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <Text key={d} style={styles.weekdayLabel}>{d}</Text>
        ))}
      </View>

      {/* Month grid */}
      <View style={styles.monthGrid}>
        {MOCK_MONTH.map((day, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.monthCell,
              day.hasActivity && {
                borderColor: colors.primary,
                backgroundColor: colors.primary + '15',
              },
              !day.hasActivity && { opacity: 0.5 },
            ]}
            activeOpacity={0.7}
          >
            <Text style={styles.monthDate}>{day.date}</Text>
            {day.hasActivity && (
              <View style={[styles.monthDot, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Month summary */}
      <View style={styles.monthStats}>
        <View style={styles.monthStatCard}>
          <Text style={[styles.monthStatValue, { color: colors.primary }]}>{MONTH_STATS.workouts}</Text>
          <Text style={styles.monthStatLabel}>Workouts</Text>
        </View>
        <View style={styles.monthStatCard}>
          <Text style={[styles.monthStatValue, { color: colors.energy }]}>{MONTH_STATS.streak}</Text>
          <Text style={styles.monthStatLabel}>Day Streak</Text>
        </View>
        <View style={styles.monthStatCard}>
          <Text style={[styles.monthStatValue, { color: colors.primary }]}>{MONTH_STATS.avgScore}%</Text>
          <Text style={styles.monthStatLabel}>Avg Score</Text>
        </View>
      </View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.background },
  header:         { paddingHorizontal: spacing.screen, paddingTop: spacing.xl, paddingBottom: spacing.sm, gap: spacing.md },
  headerTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:          { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.foreground },
  dateNav:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn:         { width: touchTarget.min, height: touchTarget.min, borderRadius: radius.full, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  monthLabel:     { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.foreground },
  tabBar:         { flexDirection: 'row', marginHorizontal: spacing.screen, padding: 4, backgroundColor: colors.secondary, borderRadius: radius.xl, marginBottom: spacing.md },
  tab:            { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: radius.lg, minHeight: touchTarget.min },
  tabActive:      { backgroundColor: colors.card },
  tabLabel:       { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  scroll:         { flex: 1 },
  scrollContent:  { paddingBottom: spacing.xxl },
  viewContent:    { paddingHorizontal: spacing.screen, gap: spacing.md },
  card:           { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  cardTitle:      { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.foreground },
  summaryRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel:   { fontSize: typography.size.sm, color: colors.mutedForeground },
  summaryValue:   { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground },
  completedRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  completedText:  { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  divider:        { height: 0.5, backgroundColor: colors.border },
  statsGrid:      { flexDirection: 'row', gap: spacing.sm },
  statCell:       { flex: 1, gap: 3 },
  statLabel:      { fontSize: typography.size.xs, color: colors.mutedForeground },
  statValue:      { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.foreground },
  notesBox:       { backgroundColor: colors.secondary, borderRadius: radius.md, padding: spacing.sm, gap: 3 },
  notesLabel:     { fontSize: typography.size.xs, color: colors.mutedForeground },
  notesText:      { fontSize: typography.size.sm, color: colors.foreground },
  vitalityRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroNumber:     { fontSize: typography.size['3xl'], fontWeight: typography.weight.extrabold },
  vitalityCircle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  weekGrid:       { flexDirection: 'row', gap: spacing.xs },
  dayCell:        { flex: 1, aspectRatio: 0.85, borderRadius: radius.md, borderWidth: 0.5, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dayCellDay:     { fontSize: 9, color: colors.mutedForeground },
  dayCellDate:    { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.foreground },
  dayCellDot:     { width: 5, height: 5, borderRadius: 3 },
  statsRow:       { flexDirection: 'row', gap: spacing.sm },
  statCard:       { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, alignItems: 'center', gap: 2 },
  statBig:        { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.foreground },
  statSub:        { fontSize: typography.size.xs, color: colors.mutedForeground },
  sectionTitle:   { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground },
  trainingRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreText:      { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold },
  weekdayRow:     { flexDirection: 'row' },
  weekdayLabel:   { flex: 1, textAlign: 'center', fontSize: typography.size.xs, color: colors.mutedForeground, paddingVertical: spacing.xs },
  monthGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  monthCell:      { width: '12.5%', aspectRatio: 1, borderRadius: radius.sm, borderWidth: 0.5, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', gap: 2 },
  monthDate:      { fontSize: 11, fontWeight: typography.weight.semibold, color: colors.foreground },
  monthDot:       { width: 4, height: 4, borderRadius: 2 },
  monthStats:     { flexDirection: 'row', gap: spacing.sm },
  monthStatCard:  { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, alignItems: 'center', gap: 3 },
  monthStatValue: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold },
  monthStatLabel: { fontSize: typography.size.xs, color: colors.mutedForeground },
})
```
