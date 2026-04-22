# waliFit — NutritionLogScreen

**Destination:** `apps/mobile/screens/NutritionLogScreen.tsx`

---

```tsx
// waliFit — NutritionLogScreen
// Tabs: Protein · Hydration · Steps (read-only from HealthKit/Google Fit)
// Steps are NEVER manually entered — only synced from device health APIs

import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { Plus, Minus, Footprints, Droplets, Beef, RotateCcw, Info } from 'lucide-react-native'
import { colors, spacing, typography, radius, touchTarget } from '../theme'

type NutritionTab = 'protein' | 'hydration' | 'steps'

const PROTEIN_PRESETS = [10, 25, 40, 60]
const WATER_PRESETS_ML = [250, 500, 750]
const GLASSES_PER_DAY   = 8
const ML_PER_GLASS      = 250

const MOCK_TODAY = {
  proteinG:     142,
  proteinGoal:  180,
  waterMl:      1875,
  waterGoal:    2500,
  steps:        6240,
  stepsGoal:    8000,
  proteinLog: [
    { id: '1', amount: 40, label: 'Chicken breast', time: '12:30' },
    { id: '2', amount: 60, label: 'Protein shake',  time: '15:00' },
    { id: '3', amount: 42, label: 'Greek yogurt',    time: '18:45' },
  ],
  waterLog: [
    { id: '1', amount: 500, time: '08:00' },
    { id: '2', amount: 250, time: '10:30' },
    { id: '3', amount: 500, time: '13:00' },
    { id: '4', amount: 375, time: '16:00' },
    { id: '5', amount: 250, time: '19:00' },
  ],
}

export default function NutritionLogScreen() {
  const [tab, setTab] = useState<NutritionTab>('protein')

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Nutrition</Text>
        <Text style={styles.date}>Today, Apr 20</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TabBtn icon={Beef}       label="Protein"    tab="protein"   active={tab} onPress={setTab} color={colors.energy}  />
        <TabBtn icon={Droplets}   label="Hydration"  tab="hydration" active={tab} onPress={setTab} color={colors.blue}    />
        <TabBtn icon={Footprints} label="Steps"      tab="steps"     active={tab} onPress={setTab} color={colors.primary} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {tab === 'protein'   && <ProteinTab />}
        {tab === 'hydration' && <HydrationTab />}
        {tab === 'steps'     && <StepsTab />}
      </ScrollView>
    </View>
  )
}

// ─── Protein tab ──────────────────────────────────────────────────────────────

function ProteinTab() {
  const [total, setTotal]   = useState(MOCK_TODAY.proteinG)
  const [custom, setCustom] = useState('')
  const goal = MOCK_TODAY.proteinGoal
  const pct  = Math.min((total / goal) * 100, 100)

  const add = (amount: number) => setTotal(t => Math.min(t + amount, 999))

  return (
    <View style={styles.tabContent}>
      {/* Progress card */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressNum} numberOfLines={1}>
            <Text style={[styles.progressMain, { color: colors.energy }]}>{total}</Text>
            <Text style={styles.progressGoal}>/{goal}g</Text>
          </Text>
          <Text style={styles.progressLabel}>protein today</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${pct}%` as any, backgroundColor: colors.energy }]} />
        </View>
        <Text style={styles.progressSub}>
          {goal - total > 0 ? `${goal - total}g remaining` : 'Daily goal reached!'}
        </Text>
      </View>

      {/* Quick add presets */}
      <Text style={styles.sectionLabel}>Quick add</Text>
      <View style={styles.presetsRow}>
        {PROTEIN_PRESETS.map((p) => (
          <TouchableOpacity key={p} style={styles.presetBtn} onPress={() => add(p)} activeOpacity={0.7}>
            <Text style={[styles.presetBtnText, { color: colors.energy }]}>+{p}g</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom amount */}
      <View style={styles.customRow}>
        <TextInput
          style={styles.customInput}
          value={custom}
          onChangeText={setCustom}
          placeholder="Custom amount"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="number-pad"
        />
        <Text style={styles.customUnit}>g</Text>
        <TouchableOpacity
          style={styles.customAddBtn}
          onPress={() => { if (custom) { add(parseInt(custom)); setCustom('') } }}
        >
          <Text style={styles.customAddBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Wali AI insight */}
      <View style={styles.insightCard}>
        <Text style={styles.insightLabel}>Wali AI</Text>
        <Text style={styles.insightText}>
          You're 38g short. A scoop of protein powder or a can of tuna gets you there. Protein timing matters after today's Push session.
        </Text>
      </View>

      {/* Today's log */}
      <Text style={styles.sectionLabel}>Today's log</Text>
      {MOCK_TODAY.proteinLog.map((entry) => (
        <View key={entry.id} style={styles.logRow}>
          <View>
            <Text style={styles.logLabel}>{entry.label}</Text>
            <Text style={styles.logTime}>{entry.time}</Text>
          </View>
          <Text style={[styles.logAmount, { color: colors.energy }]}>+{entry.amount}g</Text>
        </View>
      ))}
    </View>
  )
}

// ─── Hydration tab ────────────────────────────────────────────────────────────

function HydrationTab() {
  const [waterMl, setWaterMl] = useState(MOCK_TODAY.waterMl)
  const goal    = MOCK_TODAY.waterGoal
  const glasses = Math.floor(waterMl / ML_PER_GLASS)
  const goalGlasses = Math.floor(goal / ML_PER_GLASS)
  const pct = Math.min((waterMl / goal) * 100, 100)

  const addGlass  = () => setWaterMl(w => Math.min(w + ML_PER_GLASS, 9999))
  const addAmount = (ml: number) => setWaterMl(w => Math.min(w + ml, 9999))

  return (
    <View style={styles.tabContent}>
      {/* Glasses visual */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressNum}>
            <Text style={[styles.progressMain, { color: colors.blue }]}>{glasses}</Text>
            <Text style={styles.progressGoal}>/{goalGlasses} glasses</Text>
          </Text>
          <Text style={styles.progressLabel}>{waterMl}ml of {goal}ml</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${pct}%` as any, backgroundColor: colors.blue }]} />
        </View>
        {/* Tappable glass icons */}
        <View style={styles.glassesRow}>
          {Array.from({ length: goalGlasses }).map((_, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.glassIcon, i < glasses && { backgroundColor: colors.blue }]}
              onPress={i === glasses ? addGlass : undefined}
              activeOpacity={0.7}
            >
              <Droplets
                color={i < glasses ? colors.primaryFg : colors.blue}
                size={14} strokeWidth={1.75}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick add */}
      <Text style={styles.sectionLabel}>Quick add</Text>
      <View style={styles.presetsRow}>
        {WATER_PRESETS_ML.map((ml) => (
          <TouchableOpacity key={ml} style={styles.presetBtn} onPress={() => addAmount(ml)} activeOpacity={0.7}>
            <Text style={[styles.presetBtnText, { color: colors.blue }]}>+{ml}ml</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.presetBtn} onPress={addGlass} activeOpacity={0.7}>
          <Text style={[styles.presetBtnText, { color: colors.blue }]}>+1 glass</Text>
        </TouchableOpacity>
      </View>

      {/* Today's log */}
      <Text style={styles.sectionLabel}>Today's log</Text>
      {MOCK_TODAY.waterLog.map((entry) => (
        <View key={entry.id} style={styles.logRow}>
          <Text style={styles.logTime}>{entry.time}</Text>
          <Text style={[styles.logAmount, { color: colors.blue }]}>+{entry.amount}ml</Text>
        </View>
      ))}
    </View>
  )
}

// ─── Steps tab (read-only) ────────────────────────────────────────────────────

function StepsTab() {
  const steps    = MOCK_TODAY.steps
  const goal     = MOCK_TODAY.stepsGoal
  const pct      = Math.min((steps / goal) * 100, 100)
  const remaining = Math.max(0, goal - steps)

  return (
    <View style={styles.tabContent}>
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressNum}>
            <Text style={[styles.progressMain, { color: colors.primary }]}>{steps.toLocaleString()}</Text>
            <Text style={styles.progressGoal}>/{goal.toLocaleString()}</Text>
          </Text>
          <Text style={styles.progressLabel}>steps today</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${pct}%` as any, backgroundColor: colors.primary }]} />
        </View>
        <Text style={styles.progressSub}>
          {remaining > 0 ? `${remaining.toLocaleString()} steps to goal` : 'Daily goal reached!'}
        </Text>
      </View>

      {/* Auto-sync notice */}
      <View style={styles.syncNotice}>
        <Info color={colors.primary} size={16} strokeWidth={1.75} />
        <Text style={styles.syncNoticeText}>
          Steps sync automatically from Apple Health (iOS) or Google Fit (Android). No manual entry needed — just carry your phone.
        </Text>
      </View>

      {/* Vitality contribution */}
      <View style={styles.insightCard}>
        <Text style={styles.insightLabel}>Tree contribution</Text>
        <Text style={styles.insightText}>
          Steps count for 40% of your daily Vitality score. You're at {Math.round(pct)}% of today's step goal — contributing {Math.round(pct * 0.4)}pts to your tree health.
        </Text>
      </View>

      {/* WaliRun note */}
      <View style={[styles.syncNotice, { borderColor: colors.blue + '40', backgroundColor: colors.blue + '08' }]}>
        <Footprints color={colors.blue} size={16} strokeWidth={1.75} />
        <Text style={[styles.syncNoticeText, { color: colors.blue }]}>
          WaliRun GPS sessions count automatically toward your daily steps. Running days are never penalised.
        </Text>
      </View>
    </View>
  )
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabBtn({ icon: Icon, label, tab, active, onPress, color }: {
  icon: React.ElementType; label: string; tab: NutritionTab
  active: NutritionTab; onPress: (t: NutritionTab) => void; color: string
}) {
  const isActive = active === tab
  return (
    <TouchableOpacity
      style={[styles.tab, isActive && styles.tabActive]}
      onPress={() => onPress(tab)}
      activeOpacity={0.7}
    >
      <Icon color={isActive ? color : colors.mutedForeground} size={15} strokeWidth={1.75} />
      <Text style={[styles.tabLabel, { color: isActive ? color : colors.mutedForeground }]}>{label}</Text>
    </TouchableOpacity>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  header:          { paddingHorizontal: spacing.screen, paddingTop: spacing.xl, paddingBottom: spacing.sm, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  title:           { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.foreground },
  date:            { fontSize: typography.size.sm, color: colors.mutedForeground },
  tabBar:          { flexDirection: 'row', marginHorizontal: spacing.screen, padding: 4, backgroundColor: colors.secondary, borderRadius: radius.xl, marginBottom: spacing.md },
  tab:             { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: radius.lg, minHeight: touchTarget.min },
  tabActive:       { backgroundColor: colors.card },
  tabLabel:        { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  scroll:          { flex: 1 },
  scrollContent:   { paddingBottom: spacing.xxl },
  tabContent:      { paddingHorizontal: spacing.screen, gap: spacing.md },
  progressCard:    { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  progressHeader:  { gap: 2 },
  progressNum:     { fontSize: typography.size.base },
  progressMain:    { fontSize: typography.size['4xl'], fontWeight: typography.weight.extrabold },
  progressGoal:    { fontSize: typography.size.lg, color: colors.mutedForeground },
  progressLabel:   { fontSize: typography.size.sm, color: colors.mutedForeground },
  progressBarTrack:{ height: 8, backgroundColor: colors.muted, borderRadius: radius.full, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: radius.full },
  progressSub:     { fontSize: typography.size.xs, color: colors.mutedForeground },
  glassesRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  glassIcon:       { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: colors.border },
  sectionLabel:    { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.mutedForeground },
  presetsRow:      { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  presetBtn:       { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.card, borderRadius: radius.full, borderWidth: 0.5, borderColor: colors.border, minHeight: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  presetBtnText:   { fontSize: typography.size.base, fontWeight: typography.weight.bold },
  customRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  customInput:     { flex: 1, height: touchTarget.comfortable, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 0.5, borderColor: colors.border, paddingHorizontal: spacing.md, fontSize: typography.size.base, color: colors.foreground },
  customUnit:      { fontSize: typography.size.base, color: colors.mutedForeground },
  customAddBtn:    { height: touchTarget.comfortable, paddingHorizontal: spacing.lg, backgroundColor: colors.primary, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  customAddBtnText:{ fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.primaryFg },
  insightCard:     { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, borderLeftWidth: 3, borderLeftColor: colors.primary, padding: spacing.md, gap: 4 },
  insightLabel:    { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.primary },
  insightText:     { fontSize: typography.size.sm, color: colors.foreground, lineHeight: 20 },
  logRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  logLabel:        { fontSize: typography.size.sm, color: colors.foreground, fontWeight: typography.weight.medium },
  logTime:         { fontSize: typography.size.xs, color: colors.mutedForeground },
  logAmount:       { fontSize: typography.size.base, fontWeight: typography.weight.bold },
  syncNotice:      { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.primary + '08', borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.primary + '30', padding: spacing.md },
  syncNoticeText:  { flex: 1, fontSize: typography.size.sm, color: colors.foreground, lineHeight: 20 },
})
```
