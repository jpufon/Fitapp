# waliFit — OnboardingFlowScreen

**Destination:** `apps/mobile/screens/OnboardingFlowScreen.tsx`

---

```tsx
// waliFit — OnboardingFlowScreen
// Steps: Goal → Frequency → Units → Profile Import → Complete
// Completable in under 3 minutes. Every extra screen costs sign-up rate.
// Fires Wali AI cold-start 1.5s after onboardingComplete = true

import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Image,
} from 'react-native'
import { Check, Upload, ChevronRight, ArrowLeft, Zap, Trees, Wind, Cherry, Rocket } from 'lucide-react-native'
import { colors, spacing, typography, radius, touchTarget } from '../theme'

type Step = 'goal' | 'frequency' | 'units' | 'import' | 'complete'

interface OnboardingFlowProps {
  onComplete: () => void
}

const STEPS: Step[] = ['goal', 'frequency', 'units', 'import', 'complete']

const GOALS = [
  { id: 'hybrid',      label: 'Hybrid Performance', sub: 'Strength + conditioning',   icon: Zap    },
  { id: 'strength',    label: 'Strength',            sub: 'Build muscle and power',    icon: Trees  },
  { id: 'running',     label: 'Running',             sub: 'Speed, endurance, racing',  icon: Wind   },
  { id: 'fat_loss',    label: 'Fat Loss',            sub: 'Lean out, stay athletic',   icon: Cherry },
  { id: 'general',     label: 'General Fitness',     sub: 'Stay active and healthy',   icon: Rocket },
]

const FREQUENCIES = [2, 3, 4, 5, 6, 7]

export default function OnboardingFlowScreen({ onComplete }: OnboardingFlowProps) {
  const [step, setStep]           = useState<Step>('goal')
  const [selectedGoal, setGoal]   = useState<string | null>(null)
  const [frequency, setFreq]      = useState<number>(4)
  const [units, setUnits]         = useState<'kg' | 'lbs'>('kg')
  const [importDone, setImport]   = useState(false)

  const stepIndex = STEPS.indexOf(step)
  const progress  = (stepIndex / (STEPS.length - 1)) * 100

  const goNext = () => {
    const next = STEPS[stepIndex + 1]
    if (next) setStep(next)
  }
  const goBack = () => {
    const prev = STEPS[stepIndex - 1]
    if (prev) setStep(prev)
  }

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      {step !== 'complete' && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
        </View>
      )}

      {/* Back button */}
      {stepIndex > 0 && step !== 'complete' && (
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <ArrowLeft color={colors.foreground} size={20} strokeWidth={1.75} />
        </TouchableOpacity>
      )}

      {step === 'goal'      && <GoalStep      goal={selectedGoal}  onSelect={setGoal}  onNext={goNext} />}
      {step === 'frequency' && <FrequencyStep freq={frequency}     onSelect={setFreq}  onNext={goNext} />}
      {step === 'units'     && <UnitsStep     units={units}        onSelect={setUnits} onNext={goNext} />}
      {step === 'import'    && <ImportStep                                              onNext={goNext} onSkip={goNext} />}
      {step === 'complete'  && <CompleteStep                                            onDone={onComplete} />}
    </View>
  )
}

// ─── Goal step ────────────────────────────────────────────────────────────────

function GoalStep({ goal, onSelect, onNext }: {
  goal: string | null; onSelect: (g: string) => void; onNext: () => void
}) {
  return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepTitle}>What are you training for?</Text>
      <Text style={styles.stepSub}>This shapes your Vitality Tree and Wali AI coaching.</Text>

      <View style={styles.optionsList}>
        {GOALS.map((g) => {
          const active = goal === g.id
          return (
            <TouchableOpacity
              key={g.id}
              style={[styles.optionCard, active && styles.optionCardActive]}
              onPress={() => onSelect(g.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: active ? colors.primary + '20' : colors.muted }]}>
                <g.icon color={active ? colors.primary : colors.mutedForeground} size={22} strokeWidth={1.75} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, active && { color: colors.primary }]}>{g.label}</Text>
                <Text style={styles.optionSub}>{g.sub}</Text>
              </View>
              {active && <Check color={colors.primary} size={18} strokeWidth={2.5} />}
            </TouchableOpacity>
          )
        })}
      </View>

      <TouchableOpacity
        style={[styles.nextBtn, !goal && styles.nextBtnDisabled]}
        onPress={goal ? onNext : undefined}
        activeOpacity={goal ? 0.7 : 1}
      >
        <Text style={styles.nextBtnText}>Continue</Text>
        <ChevronRight color={colors.primaryFg} size={18} strokeWidth={2.5} />
      </TouchableOpacity>
    </ScrollView>
  )
}

// ─── Frequency step ───────────────────────────────────────────────────────────

function FrequencyStep({ freq, onSelect, onNext }: {
  freq: number; onSelect: (f: number) => void; onNext: () => void
}) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>How many days a week do you train?</Text>
      <Text style={styles.stepSub}>Wali AI will schedule your program around this.</Text>

      <View style={styles.freqGrid}>
        {FREQUENCIES.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.freqCard, freq === f && styles.freqCardActive]}
            onPress={() => onSelect(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.freqNum, freq === f && { color: colors.primary }]}>{f}</Text>
            <Text style={styles.freqLabel}>{f === 7 ? 'Every day' : `days`}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.freqInfo}>
        <Text style={styles.freqInfoText}>
          {freq <= 3 ? 'Great for beginners. Quality over quantity.' :
           freq <= 5 ? 'Optimal for most hybrid athletes.' :
                       'Elite territory — make sure recovery is dialled in.'}
        </Text>
      </View>

      <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
        <Text style={styles.nextBtnText}>Continue</Text>
        <ChevronRight color={colors.primaryFg} size={18} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  )
}

// ─── Units step ───────────────────────────────────────────────────────────────

function UnitsStep({ units, onSelect, onNext }: {
  units: 'kg' | 'lbs'; onSelect: (u: 'kg' | 'lbs') => void; onNext: () => void
}) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>How do you measure weight?</Text>
      <Text style={styles.stepSub}>This affects the plate calculator, logging, and Wali AI coaching. You can change it in Settings later.</Text>

      {/* Large prominent card selector — not a small toggle */}
      <View style={styles.unitsRow}>
        {(['kg', 'lbs'] as const).map((u) => (
          <TouchableOpacity
            key={u}
            style={[styles.unitCard, units === u && styles.unitCardActive]}
            onPress={() => onSelect(u)}
            activeOpacity={0.7}
          >
            <Text style={[styles.unitLabel, units === u && { color: colors.primary }]}>{u.toUpperCase()}</Text>
            <Text style={styles.unitSub}>{u === 'kg' ? 'Kilograms' : 'Pounds'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
        <Text style={styles.nextBtnText}>Continue</Text>
        <ChevronRight color={colors.primaryFg} size={18} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  )
}

// ─── Import step ──────────────────────────────────────────────────────────────

function ImportStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [loading, setLoading] = useState(false)
  const [parsed, setParsed]   = useState(false)

  const simulateImport = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); setParsed(true) }, 2000)
  }

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Already tracking somewhere?</Text>
      <Text style={styles.stepSub}>Wali AI can read a screenshot from Hevy, MyFitnessPal, Strava, or Strong and pre-fill your profile.</Text>

      {!parsed ? (
        <>
          <TouchableOpacity
            style={styles.importCard}
            onPress={simulateImport}
            activeOpacity={0.7}
          >
            {loading ? (
              <View style={styles.importLoading}>
                <Text style={[styles.importLoadingText, { color: colors.primary }]}>Reading your program...</Text>
                <Text style={styles.importLoadingSub}>Wali AI is extracting your PRs, goals, and history</Text>
              </View>
            ) : (
              <>
                <Upload color={colors.primary} size={32} strokeWidth={1.5} />
                <Text style={styles.importCardTitle}>Import from another app</Text>
                <Text style={styles.importCardSub}>Upload a screenshot or paste text. Supports Hevy, MFP, Strava, Strong.</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
            <Text style={styles.skipBtnText}>Skip for now</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={[styles.importCard, { borderColor: colors.primary }]}>
            <Check color={colors.primary} size={32} strokeWidth={2} />
            <Text style={[styles.importCardTitle, { color: colors.primary }]}>Import successful</Text>
            <View style={styles.parsedItems}>
              {['5 PRs detected', 'Body weight: 82kg', 'Training frequency: 4x/week', 'Goal: Hybrid performance'].map((item) => (
                <View key={item} style={styles.parsedItem}>
                  <Check color={colors.primary} size={13} strokeWidth={2.5} />
                  <Text style={styles.parsedItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
          <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
            <Text style={styles.nextBtnText}>Looks good — continue</Text>
            <ChevronRight color={colors.primaryFg} size={18} strokeWidth={2.5} />
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}

// ─── Complete step ────────────────────────────────────────────────────────────

function CompleteStep({ onDone }: { onDone: () => void }) {
  return (
    <View style={styles.completeContainer}>
      <View style={styles.completTree}>
        <Text style={{ fontSize: 80 }}>🌱</Text>
      </View>
      <Text style={styles.completeTitle}>Your tree is planted.</Text>
      <Text style={styles.completeSub}>
        Every workout feeds it.{'\n'}Every PR makes it stronger.{'\n'}Log protein and water to keep it growing.
      </Text>
      <TouchableOpacity style={styles.nextBtn} onPress={onDone}>
        <Text style={styles.nextBtnText}>Meet Wali AI</Text>
        <ChevronRight color={colors.primaryFg} size={18} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  progressBar:      { height: 3, backgroundColor: colors.muted, marginTop: 44 },
  progressFill:     { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  backBtn:          { width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm, marginTop: spacing.sm },
  stepContent:      { flex: 1, paddingHorizontal: spacing.screen, paddingTop: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  stepTitle:        { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.foreground },
  stepSub:          { fontSize: typography.size.sm, color: colors.mutedForeground, lineHeight: 20 },
  optionsList:      { gap: spacing.sm, flex: 1 },
  optionCard:       { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, minHeight: touchTarget.comfortable },
  optionCardActive: { borderColor: colors.primary, borderWidth: 1.5 },
  optionIconWrap:   { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optionText:       { flex: 1 },
  optionLabel:      { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground },
  optionSub:        { fontSize: typography.size.xs, color: colors.mutedForeground, marginTop: 2 },
  freqGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  freqCard:         { width: '30%', aspectRatio: 1.2, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 3 },
  freqCardActive:   { borderColor: colors.primary, borderWidth: 1.5, backgroundColor: colors.primary + '08' },
  freqNum:          { fontSize: typography.size['3xl'], fontWeight: typography.weight.extrabold, color: colors.foreground },
  freqLabel:        { fontSize: typography.size.xs, color: colors.mutedForeground },
  freqInfo:         { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 0.5, borderColor: colors.border },
  freqInfoText:     { fontSize: typography.size.sm, color: colors.mutedForeground, textAlign: 'center' },
  unitsRow:         { flexDirection: 'row', gap: spacing.md },
  unitCard:         { flex: 1, height: 100, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  unitCardActive:   { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primary + '08' },
  unitLabel:        { fontSize: typography.size['3xl'], fontWeight: typography.weight.extrabold, color: colors.foreground },
  unitSub:          { fontSize: typography.size.xs, color: colors.mutedForeground },
  importCard:       { backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  importLoading:    { alignItems: 'center', gap: spacing.sm },
  importLoadingText:{ fontSize: typography.size.lg, fontWeight: typography.weight.semibold },
  importLoadingSub: { fontSize: typography.size.sm, color: colors.mutedForeground, textAlign: 'center' },
  importCardTitle:  { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.foreground, textAlign: 'center' },
  importCardSub:    { fontSize: typography.size.sm, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20 },
  parsedItems:      { width: '100%', gap: spacing.xs },
  parsedItem:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  parsedItemText:   { fontSize: typography.size.sm, color: colors.foreground },
  skipBtn:          { alignItems: 'center', paddingVertical: spacing.md, minHeight: touchTarget.min },
  skipBtnText:      { fontSize: typography.size.base, color: colors.mutedForeground },
  nextBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: touchTarget.comfortable, backgroundColor: colors.primary, borderRadius: radius.full },
  nextBtnDisabled:  { opacity: 0.4 },
  nextBtnText:      { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.primaryFg },
  completeContainer:{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.screen, paddingBottom: spacing.xxl, gap: spacing.lg },
  completTree:      { width: 160, height: 160, borderRadius: 80, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  completeTitle:    { fontSize: 28, fontWeight: typography.weight.extrabold, color: colors.foreground, textAlign: 'center' },
  completeSub:      { fontSize: typography.size.base, color: colors.mutedForeground, textAlign: 'center', lineHeight: 26 },
})
```
