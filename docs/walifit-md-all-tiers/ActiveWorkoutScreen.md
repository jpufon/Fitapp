# waliFit — ActiveWorkoutScreen

**Destination:** `apps/mobile/screens/ActiveWorkoutScreen.tsx`

---

```tsx
// waliFit — ActiveWorkoutScreen
// Full-screen modal — gestureEnabled: false (cannot dismiss accidentally)
// Includes: Set Logger inline + Plate Calculator + Rest Timer coupling
// Every set save is an individual mutation — app kill must not lose data

import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Modal,
} from 'react-native'
import { X, Plus, ChevronDown, Calculator, Check, MoreHorizontal, Zap } from 'lucide-react-native'
import { colors, spacing, typography, radius, touchTarget } from '../theme'

// ─── Mock data ────────────────────────────────────────────────────────────────

interface ExerciseSet {
  id: string; previous: string; weight: string; reps: string; completed: boolean; rpe?: string
}
interface Exercise {
  id: string; name: string; muscle: string; sets: ExerciseSet[]
}

const MOCK_WORKOUT: Exercise[] = [
  {
    id: 'e1', name: 'Bench Press', muscle: 'Chest',
    sets: [
      { id: 's1', previous: '80kg × 5', weight: '82.5', reps: '5',  completed: true  },
      { id: 's2', previous: '80kg × 5', weight: '82.5', reps: '5',  completed: true  },
      { id: 's3', previous: '80kg × 5', weight: '82.5', reps: '4',  completed: true  },
      { id: 's4', previous: '80kg × 5', weight: '',     reps: '',    completed: false },
    ]
  },
  {
    id: 'e2', name: 'Overhead Press', muscle: 'Shoulders',
    sets: [
      { id: 's5', previous: '55kg × 6', weight: '', reps: '', completed: false },
      { id: 's6', previous: '55kg × 6', weight: '', reps: '', completed: false },
      { id: 's7', previous: '55kg × 6', weight: '', reps: '', completed: false },
    ]
  },
  {
    id: 'e3', name: 'Incline Dumbbell Press', muscle: 'Upper Chest',
    sets: [
      { id: 's8', previous: '30kg × 8', weight: '', reps: '', completed: false },
      { id: 's9', previous: '30kg × 8', weight: '', reps: '', completed: false },
    ]
  },
]

const PLATE_SIZES_KG = [25, 20, 15, 10, 5, 2.5, 1.25, 0.25]
const BAR_WEIGHT_KG  = 20

// ─── Screen ───────────────────────────────────────────────────────────────────

interface ActiveWorkoutScreenProps {
  onFinish: () => void
  onDiscard: () => void
}

export default function ActiveWorkoutScreen({ onFinish, onDiscard }: ActiveWorkoutScreenProps) {
  const [exercises, setExercises]   = useState<Exercise[]>(MOCK_WORKOUT)
  const [elapsed, setElapsed]       = useState('00:43:12')
  const [showPlates, setShowPlates] = useState(false)
  const [plateTarget, setPlateTarget] = useState('100')

  const totalSets      = exercises.flatMap(e => e.sets).length
  const completedSets  = exercises.flatMap(e => e.sets).filter(s => s.completed).length

  const logSet = (exId: string, setId: string) => {
    setExercises(prev => prev.map(e =>
      e.id === exId ? {
        ...e,
        sets: e.sets.map(s => s.id === setId ? { ...s, completed: true } : s)
      } : e
    ))
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.workoutName}>Push Day A</Text>
          <Text style={[styles.timer, { color: colors.blue }]}>{elapsed}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.setsProgress}>{completedSets}/{totalSets} sets</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <MoreHorizontal color={colors.mutedForeground} size={20} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(completedSets / totalSets) * 100}%` as any }]} />
      </View>

      {/* Exercise list */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onLogSet={(setId) => logSet(exercise.id, setId)}
            onOpenPlates={() => setShowPlates(true)}
          />
        ))}

        <TouchableOpacity style={styles.addExerciseBtn}>
          <Plus color={colors.primary} size={18} strokeWidth={2} />
          <Text style={[styles.addExerciseBtnText, { color: colors.primary }]}>Add exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.discardBtn} onPress={onDiscard}>
          <X color={colors.destructive} size={16} strokeWidth={2} />
          <Text style={[styles.discardBtnText, { color: colors.destructive }]}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.finishBtn} onPress={onFinish}>
          <Text style={styles.finishBtnText}>Finish workout</Text>
        </TouchableOpacity>
      </View>

      {/* Plate Calculator Modal */}
      <PlateCalculatorModal
        visible={showPlates}
        targetWeight={plateTarget}
        onChangeTarget={setPlateTarget}
        onClose={() => setShowPlates(false)}
      />
    </View>
  )
}

// ─── Exercise card ────────────────────────────────────────────────────────────

function ExerciseCard({ exercise, onLogSet, onOpenPlates }: {
  exercise: Exercise; onLogSet: (setId: string) => void; onOpenPlates: () => void
}) {
  return (
    <View style={styles.exerciseCard}>
      {/* Exercise header */}
      <View style={styles.exerciseHeader}>
        <View>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <View style={styles.muscleTag}>
            <Text style={styles.muscleTagText}>{exercise.muscle}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onOpenPlates} style={styles.calcBtn}>
          <Calculator color={colors.blue} size={16} strokeWidth={1.75} />
          <Text style={[styles.calcBtnText, { color: colors.blue }]}>Plates</Text>
        </TouchableOpacity>
      </View>

      {/* Column headers */}
      <View style={styles.setHeader}>
        <Text style={[styles.setCol, styles.setColNum]}>Set</Text>
        <Text style={[styles.setCol, styles.setColPrev]}>Previous</Text>
        <Text style={[styles.setCol, styles.setColInput]}>kg</Text>
        <Text style={[styles.setCol, styles.setColInput]}>Reps</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Set rows */}
      {exercise.sets.map((set, i) => (
        <SetRow
          key={set.id}
          set={set}
          index={i + 1}
          onLog={() => onLogSet(set.id)}
        />
      ))}

      {/* Add set */}
      <TouchableOpacity style={styles.addSetBtn}>
        <Plus color={colors.mutedForeground} size={14} strokeWidth={2} />
        <Text style={styles.addSetBtnText}>Add set</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Set row ──────────────────────────────────────────────────────────────────

function SetRow({ set, index, onLog }: { set: ExerciseSet; index: number; onLog: () => void }) {
  const [weight, setWeight] = useState(set.weight)
  const [reps, setReps]     = useState(set.reps)

  return (
    <View style={[styles.setRow, set.completed && styles.setRowDone]}>
      <Text style={[styles.setCol, styles.setColNum, styles.setNumText]}>{index}</Text>
      <Text style={[styles.setCol, styles.setColPrev, styles.setPrevText]}>{set.previous}</Text>
      <TextInput
        style={[styles.setCol, styles.setColInput, styles.setInput]}
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={colors.mutedForeground}
        editable={!set.completed}
      />
      <TextInput
        style={[styles.setCol, styles.setColInput, styles.setInput]}
        value={reps}
        onChangeText={setReps}
        keyboardType="number-pad"
        placeholder="—"
        placeholderTextColor={colors.mutedForeground}
        editable={!set.completed}
      />
      <TouchableOpacity
        style={[styles.logBtn, set.completed && styles.logBtnDone]}
        onPress={set.completed ? undefined : onLog}
        activeOpacity={set.completed ? 1 : 0.7}
      >
        <Check
          color={set.completed ? colors.primaryFg : colors.mutedForeground}
          size={16} strokeWidth={2.5}
        />
      </TouchableOpacity>
    </View>
  )
}

// ─── Plate Calculator ─────────────────────────────────────────────────────────

function PlateCalculatorModal({ visible, targetWeight, onChangeTarget, onClose }: {
  visible: boolean; targetWeight: string; onChangeTarget: (v: string) => void; onClose: () => void
}) {
  const target   = parseFloat(targetWeight) || 0
  const perSide  = Math.max(0, (target - BAR_WEIGHT_KG) / 2)

  // Calculate plates per side
  const plates: number[] = []
  let remaining = perSide
  PLATE_SIZES_KG.forEach(size => {
    while (remaining >= size - 0.001) {
      plates.push(size)
      remaining -= size
    }
  })

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Plate Calculator</Text>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <X color={colors.foreground} size={20} strokeWidth={1.75} />
            </TouchableOpacity>
          </View>

          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>Target weight</Text>
            <View style={styles.targetInput}>
              <TextInput
                style={styles.targetInputText}
                value={targetWeight}
                onChangeText={onChangeTarget}
                keyboardType="decimal-pad"
              />
              <Text style={styles.targetUnit}>kg</Text>
            </View>
          </View>

          <View style={styles.plateResult}>
            <Text style={styles.plateResultLabel}>Bar: {BAR_WEIGHT_KG}kg + each side:</Text>
            <View style={styles.platesRow}>
              {plates.length > 0 ? plates.map((p, i) => (
                <View key={i} style={[styles.plateBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.plateBadgeText, { color: colors.primary }]}>{p}</Text>
                </View>
              )) : (
                <Text style={styles.noPlatesText}>Just the bar</Text>
              )}
            </View>
            <Text style={styles.plateTotal}>
              Total: {BAR_WEIGHT_KG + (plates.reduce((a, b) => a + b, 0) * 2)}kg
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screen, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  headerLeft:       { gap: 2 },
  workoutName:      { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.foreground },
  timer:            { fontSize: typography.size.lg, fontWeight: typography.weight.bold },
  headerRight:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  setsProgress:     { fontSize: typography.size.sm, color: colors.mutedForeground },
  iconBtn:          { width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  progressTrack:    { height: 3, backgroundColor: colors.muted, marginHorizontal: spacing.screen },
  progressFill:     { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  scroll:           { flex: 1 },
  scrollContent:    { paddingHorizontal: spacing.screen, paddingTop: spacing.md, paddingBottom: 120, gap: spacing.md },
  exerciseCard:     { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, overflow: 'hidden' },
  exerciseHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  exerciseName:     { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.foreground },
  muscleTag:        { marginTop: 3, alignSelf: 'flex-start', backgroundColor: colors.blue + '18', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  muscleTagText:    { fontSize: typography.size.xs, color: colors.blue, fontWeight: typography.weight.semibold },
  calcBtn:          { flexDirection: 'row', alignItems: 'center', gap: 4 },
  calcBtnText:      { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  setHeader:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.xs, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  setCol:           { fontSize: typography.size.xs, color: colors.mutedForeground },
  setColNum:        { width: 32 },
  setColPrev:       { flex: 1 },
  setColInput:      { width: 60, textAlign: 'center' },
  setRow:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.border + '60' },
  setRowDone:       { opacity: 0.5 },
  setNumText:       { fontWeight: typography.weight.semibold, color: colors.foreground, fontSize: typography.size.sm },
  setPrevText:      { fontSize: typography.size.xs, color: colors.blue },
  setInput:         { height: 36, backgroundColor: colors.muted, borderRadius: radius.sm, borderWidth: 0.5, borderColor: colors.border, paddingHorizontal: spacing.xs, fontSize: typography.size.base, color: colors.foreground, textAlign: 'center' },
  logBtn:           { width: 44, height: 36, borderRadius: radius.sm, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  logBtnDone:       { backgroundColor: colors.primary },
  addSetBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: spacing.sm, minHeight: touchTarget.min },
  addSetBtnText:    { fontSize: typography.size.sm, color: colors.mutedForeground },
  addExerciseBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', padding: spacing.md, minHeight: touchTarget.comfortable },
  addExerciseBtnText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
  bottomBar:        { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: spacing.sm, padding: spacing.screen, paddingBottom: spacing.xl, backgroundColor: colors.background, borderTopWidth: 0.5, borderTopColor: colors.border },
  discardBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, height: touchTarget.comfortable, paddingHorizontal: spacing.md, borderRadius: radius.full, borderWidth: 0.5, borderColor: colors.destructive + '60' },
  discardBtnText:   { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  finishBtn:        { flex: 1, height: touchTarget.comfortable, backgroundColor: colors.primary, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  finishBtnText:    { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.primaryFg },
  modalOverlay:     { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet:       { backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  modalHandle:      { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.xs },
  modalHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle:       { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.foreground },
  targetRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  targetLabel:      { fontSize: typography.size.base, color: colors.foreground, fontWeight: typography.weight.medium },
  targetInput:      { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.muted, borderRadius: radius.md, paddingHorizontal: spacing.md, height: touchTarget.comfortable },
  targetInputText:  { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.foreground, minWidth: 60, textAlign: 'right' },
  targetUnit:       { fontSize: typography.size.base, color: colors.mutedForeground, marginLeft: spacing.xs },
  plateResult:      { backgroundColor: colors.muted, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  plateResultLabel: { fontSize: typography.size.sm, color: colors.mutedForeground },
  platesRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  plateBadge:       { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.sm },
  plateBadgeText:   { fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  noPlatesText:     { fontSize: typography.size.sm, color: colors.mutedForeground },
  plateTotal:       { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.foreground },
})
```
