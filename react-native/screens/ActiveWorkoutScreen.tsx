// waliFit — ActiveWorkoutScreen
// Full-screen modal — gestureEnabled: false (cannot dismiss accidentally)
// Includes: Set Logger inline + Plate Calculator + Rest Timer coupling
// Every set save is an individual mutation — app kill must not lose data

import React, { useEffect, useRef, useState } from 'react'
import {
  Alert, View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { X, Plus, ChevronDown, Calculator, Check, MoreHorizontal, Zap, Dumbbell, Timer, Repeat } from 'lucide-react-native'
import { colors, spacing, typography, radius, touchTarget } from '../theme'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../App'
import { useFinishWorkout, useLogSet, useStartWorkout } from '../hooks/useMutations'
import { useUnitSystem } from '../hooks/useUnitSystem'
import type { UnitSystem, WorkoutType } from 'walifit-shared'
import { calculatePlates } from 'walifit-shared'
import { RestTimerSheet } from '../components/RestTimerSheet'

// ─── Mock data ────────────────────────────────────────────────────────────────

type SetMode = 'strength' | 'interval' | 'rounds'
interface ExerciseSet {
  id: string; previous: string; weight: string; reps: string; completed: boolean; rpe?: string
  // Conditioning fields — populated when the parent exercise's mode != 'strength'.
  durationS?: string
  intervalWorkS?: string
  intervalRestS?: string
  roundNumber?: number
}
interface Exercise {
  id: string; name: string; muscle: string; sets: ExerciseSet[]
  mode?: SetMode  // defaults to 'strength' if unset (back-compat with MOCK_WORKOUT)
}

const MOCK_WORKOUT: Exercise[] = [
  {
    id: 'e1', name: 'Bench Press', muscle: 'Chest',
    sets: [
      { id: 's1', previous: '80kg × 5', weight: '82.5', reps: '5',  completed: false },
      { id: 's2', previous: '80kg × 5', weight: '82.5', reps: '5',  completed: false },
      { id: 's3', previous: '80kg × 5', weight: '82.5', reps: '4',  completed: false },
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

// ─── Screen ───────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveWorkout'>
type SaveState = 'idle' | 'starting' | 'ready' | 'queued' | 'error'

export default function ActiveWorkoutScreen({ navigation, route }: Props) {
  const workout = route.params.workout
  const onDiscard = () => navigation.goBack()

  const unitSystem = useUnitSystem()
  const [exercises, setExercises]   = useState<Exercise[]>(MOCK_WORKOUT)
  const [elapsed, setElapsed]       = useState('00:43:12')
  const [showPlates, setShowPlates] = useState(false)
  // Default plate-calc target depends on unit system (~100kg or ~225lb).
  const [plateTarget, setPlateTarget] = useState(unitSystem === 'imperial' ? '225' : '100')
  const [serverWorkoutId, setServerWorkoutId] = useState<string | null>(() =>
    isPersistedWorkoutId(workout.id) ? workout.id : createClientUuid()
  )
  const [saveState, setSaveState] = useState<SaveState>(() =>
    isPersistedWorkoutId(workout.id) ? 'ready' : 'idle'
  )
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [pendingSetIds, setPendingSetIds] = useState<Set<string>>(() => new Set())
  const [restTimerVisible, setRestTimerVisible] = useState(false)
  const didStartRef = useRef(false)

  const startWorkout = useStartWorkout()
  const logSetMutation = useLogSet(serverWorkoutId ?? '')
  const finishWorkout = useFinishWorkout(serverWorkoutId ?? '')

  const totalSets      = exercises.flatMap(e => e.sets).length
  const completedSets  = exercises.flatMap(e => e.sets).filter(s => s.completed).length

  useEffect(() => {
    if (!serverWorkoutId || isPersistedWorkoutId(workout.id) || didStartRef.current) return
    didStartRef.current = true

    const start = async () => {
      setSaveState('starting')
      setSaveMessage('Starting workout session...')
      try {
        const result = await startWorkout.mutateAsync({
          id: serverWorkoutId,
          name: workout.name || 'Quick Workout',
          type: normalizeWorkoutType(workout.type),
        })

        if (result.kind === 'sent') {
          setServerWorkoutId(result.data.workout.id)
          setSaveState('ready')
          setSaveMessage(null)
          return
        }

        setSaveState('queued')
        setSaveMessage('Workout start queued. Sets will sync after reconnect.')
      } catch (error) {
        setSaveState('error')
        setSaveMessage(error instanceof Error ? error.message : 'Unable to start workout.')
      }
    }

    void start()
  }, [serverWorkoutId, startWorkout, workout.id, workout.name, workout.type])

  const markSetCompleted = (exId: string, setId: string) => {
    setExercises(prev => prev.map(e =>
      e.id === exId ? {
        ...e,
        sets: e.sets.map(s => s.id === setId ? { ...s, completed: true } : s)
      } : e
    ))
  }

  const logSet = async (
    exId: string,
    setId: string,
    payload: { weight?: string; reps?: string; durationS?: string; intervalWorkS?: string; intervalRestS?: string },
  ) => {
    const exercise = exercises.find(e => e.id === exId)
    const set = exercise?.sets.find(s => s.id === setId)
    if (!exercise || !set) return

    if (!serverWorkoutId) {
      Alert.alert(
        'Workout is not synced yet',
        'This new workout needs a server session before sets can be queued against it.'
      )
      return
    }

    const mode: SetMode = exercise.mode ?? 'strength'
    const reps = Number.parseInt(payload.reps ?? '0', 10) || 0
    const weightKg = Number.parseFloat(payload.weight ?? '')
    const durationS = Number.parseInt(payload.durationS ?? '', 10)
    const intervalWorkS = Number.parseInt(payload.intervalWorkS ?? '', 10)
    const intervalRestS = Number.parseInt(payload.intervalRestS ?? '', 10)

    if (mode === 'strength' && (!Number.isFinite(reps) || reps < 0)) {
      Alert.alert('Reps required', 'Enter a valid rep count before saving this set.')
      return
    }
    if (mode === 'interval' && !Number.isFinite(durationS)) {
      Alert.alert('Duration required', 'Enter how long the interval lasts.')
      return
    }

    setPendingSetIds(prev => new Set(prev).add(setId))
    try {
      const setNumber = exercise.sets.findIndex((item) => item.id === set.id) + 1
      const result = await logSetMutation.mutateAsync({
        exerciseName: exercise.name,
        exerciseId: exercise.id,
        setNumber,
        reps,
        weightKg: mode === 'strength' && Number.isFinite(weightKg) ? weightKg : undefined,
        durationS: mode !== 'strength' && Number.isFinite(durationS) ? durationS : undefined,
        roundNumber: mode === 'rounds' ? setNumber : undefined,
        intervalWorkS: mode === 'interval' && Number.isFinite(intervalWorkS) ? intervalWorkS : undefined,
        intervalRestS: mode === 'interval' && Number.isFinite(intervalRestS) ? intervalRestS : undefined,
      })
      markSetCompleted(exId, setId)
      setSaveState(result.kind === 'queued' ? 'queued' : 'ready')
      setSaveMessage(result.kind === 'queued' ? 'Set queued for sync.' : null)
      setRestTimerVisible(true)
    } catch (error) {
      Alert.alert('Set not saved', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setPendingSetIds(prev => {
        const next = new Set(prev)
        next.delete(setId)
        return next
      })
    }
  }

  const onFinish = async () => {
    if (!serverWorkoutId) {
      Alert.alert('Workout is not synced yet', 'Wait for the workout session to start before finishing.')
      return
    }

    try {
      const result = await finishWorkout.mutateAsync({})
      setSaveState(result.kind === 'queued' ? 'queued' : 'ready')
      navigation.replace('WorkoutComplete')
    } catch (error) {
      Alert.alert('Workout not finished', error instanceof Error ? error.message : 'Please try again.')
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.workoutName}>{workout.name}</Text>
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

      {saveMessage ? (
        <View style={[
          styles.saveBanner,
          saveState === 'error' && styles.saveBannerError,
          saveState === 'queued' && styles.saveBannerQueued,
        ]}>
          <Text style={styles.saveBannerText}>{saveMessage}</Text>
        </View>
      ) : null}

      {/* Exercise list */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onLogSet={(setId, payload) => logSet(exercise.id, setId, payload)}
            onChangeMode={(mode) =>
              setExercises((curr) => curr.map((e) => (e.id === exercise.id ? { ...e, mode } : e)))
            }
            pendingSetIds={pendingSetIds}
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
        <TouchableOpacity
          style={[styles.finishBtn, (!serverWorkoutId || finishWorkout.isPending) && { opacity: 0.5 }]}
          onPress={onFinish}
          disabled={!serverWorkoutId || finishWorkout.isPending}
        >
          <Text style={styles.finishBtnText}>
            {finishWorkout.isPending ? 'Finishing...' : 'Finish workout'}
          </Text>
        </TouchableOpacity>
      </View>

      <RestTimerSheet
        visible={restTimerVisible}
        onExpand={() => {}}
        onComplete={() => setRestTimerVisible(false)}
      />

      {/* Plate Calculator Modal */}
      <PlateCalculatorModal
        visible={showPlates}
        targetWeight={plateTarget}
        onChangeTarget={setPlateTarget}
        unitSystem={unitSystem}
        onClose={() => setShowPlates(false)}
      />
    </SafeAreaView>
  )
}

// ─── Exercise card ────────────────────────────────────────────────────────────

type LogPayload = {
  weight?: string; reps?: string; durationS?: string; intervalWorkS?: string; intervalRestS?: string
}

function ExerciseCard({ exercise, onLogSet, onChangeMode, pendingSetIds, onOpenPlates }: {
  exercise: Exercise;
  onLogSet: (setId: string, payload: LogPayload) => void;
  onChangeMode: (mode: SetMode) => void;
  pendingSetIds: Set<string>;
  onOpenPlates: () => void
}) {
  const mode: SetMode = exercise.mode ?? 'strength'
  const isStrength = mode === 'strength'

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
        {isStrength ? (
          <TouchableOpacity onPress={onOpenPlates} style={styles.calcBtn} testID={`active-open-plates-${exercise.id}`}>
            <Calculator color={colors.blue} size={16} strokeWidth={1.75} />
            <Text style={[styles.calcBtnText, { color: colors.blue }]}>Plates</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Mode toggle — strength / interval / rounds */}
      <View style={styles.modeToggle}>
        <ModeToggleChip
          icon={<Dumbbell size={12} color={mode === 'strength' ? colors.primaryFg : colors.foreground} strokeWidth={1.75} />}
          label="Sets"
          active={mode === 'strength'}
          onPress={() => onChangeMode('strength')}
          testID={`active-mode-${exercise.id}-strength`}
        />
        <ModeToggleChip
          icon={<Timer size={12} color={mode === 'interval' ? colors.primaryFg : colors.foreground} strokeWidth={1.75} />}
          label="Interval"
          active={mode === 'interval'}
          onPress={() => onChangeMode('interval')}
          testID={`active-mode-${exercise.id}-interval`}
        />
        <ModeToggleChip
          icon={<Repeat size={12} color={mode === 'rounds' ? colors.primaryFg : colors.foreground} strokeWidth={1.75} />}
          label="Rounds"
          active={mode === 'rounds'}
          onPress={() => onChangeMode('rounds')}
          testID={`active-mode-${exercise.id}-rounds`}
        />
      </View>

      {/* Column headers */}
      {isStrength ? (
        <View style={styles.setHeader}>
          <Text style={[styles.setCol, styles.setColNum]}>Set</Text>
          <Text style={[styles.setCol, styles.setColPrev]}>Previous</Text>
          <Text style={[styles.setCol, styles.setColInput]}>kg</Text>
          <Text style={[styles.setCol, styles.setColInput]}>Reps</Text>
          <View style={{ width: 44 }} />
        </View>
      ) : (
        <View style={styles.setHeader}>
          <Text style={[styles.setCol, styles.setColNum]}>{mode === 'rounds' ? 'Round' : '#'}</Text>
          <Text style={[styles.setCol, styles.setColPrev]}>{mode === 'rounds' ? 'Reps' : 'Work / Rest'}</Text>
          <Text style={[styles.setCol, styles.setColInput, { flex: 1.2 }]}>Time (s)</Text>
          <View style={{ width: 44 }} />
        </View>
      )}

      {/* Set rows */}
      {exercise.sets.map((set, i) => (
        isStrength ? (
          <SetRow
            key={set.id}
            set={set}
            index={i + 1}
            pending={pendingSetIds.has(set.id)}
            onLog={(weight, reps) => onLogSet(set.id, { weight, reps })}
          />
        ) : (
          <ConditioningSetRow
            key={set.id}
            set={set}
            index={i + 1}
            mode={mode}
            pending={pendingSetIds.has(set.id)}
            onLog={(payload) => onLogSet(set.id, payload)}
          />
        )
      ))}

      {/* Add set */}
      <TouchableOpacity style={styles.addSetBtn}>
        <Plus color={colors.mutedForeground} size={14} strokeWidth={2} />
        <Text style={styles.addSetBtnText}>{mode === 'rounds' ? 'Add round' : 'Add set'}</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Set row ──────────────────────────────────────────────────────────────────

function SetRow({
  set,
  index,
  pending,
  onLog,
}: {
  set: ExerciseSet;
  index: number;
  pending: boolean;
  onLog: (weight: string, reps: string) => void;
}) {
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
        testID={`active-set-${set.id}-weight`}
      />
      <TextInput
        style={[styles.setCol, styles.setColInput, styles.setInput]}
        value={reps}
        onChangeText={setReps}
        keyboardType="number-pad"
        placeholder="—"
        placeholderTextColor={colors.mutedForeground}
        editable={!set.completed}
        testID={`active-set-${set.id}-reps`}
      />
      <TouchableOpacity
        style={[styles.logBtn, set.completed && styles.logBtnDone]}
        onPress={set.completed || pending ? undefined : () => onLog(weight, reps)}
        activeOpacity={set.completed || pending ? 1 : 0.7}
        testID={`active-set-${set.id}-log`}
      >
        <Check
          color={set.completed ? colors.primaryFg : pending ? colors.primary : colors.mutedForeground}
          size={16} strokeWidth={2.5}
        />
      </TouchableOpacity>
    </View>
  )
}

function ModeToggleChip({ icon, label, active, onPress, testID }: {
  icon: React.ReactNode; label: string; active: boolean; onPress: () => void; testID?: string
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.modeToggleChip, active && styles.modeToggleChipActive]}
      activeOpacity={0.7}
      testID={testID}
    >
      {icon}
      <Text style={[styles.modeToggleChipText, active && { color: colors.primaryFg }]}>{label}</Text>
    </TouchableOpacity>
  )
}

function ConditioningSetRow({
  set,
  index,
  mode,
  pending,
  onLog,
}: {
  set: ExerciseSet;
  index: number;
  mode: SetMode;
  pending: boolean;
  onLog: (payload: LogPayload) => void;
}) {
  const [duration, setDuration] = useState(set.durationS ?? '')
  const [workS, setWorkS] = useState(set.intervalWorkS ?? '')
  const [restS, setRestS] = useState(set.intervalRestS ?? '')
  const [reps, setReps] = useState(set.reps ?? '')

  const handleLog = () => {
    if (mode === 'interval') {
      onLog({ durationS: duration, intervalWorkS: workS, intervalRestS: restS })
    } else {
      onLog({ durationS: duration, reps })
    }
  }

  return (
    <View style={[styles.setRow, set.completed && styles.setRowDone]}>
      <Text style={[styles.setCol, styles.setColNum, styles.setNumText]}>{index}</Text>
      {mode === 'interval' ? (
        <View style={[styles.setColPrev, { flexDirection: 'row', gap: 4 }]}>
          <TextInput
            style={[styles.setInput, { flex: 1, textAlign: 'center' }]}
            value={workS}
            onChangeText={setWorkS}
            keyboardType="number-pad"
            placeholder="work"
            placeholderTextColor={colors.mutedForeground}
            editable={!set.completed}
            testID={`active-set-${set.id}-work`}
          />
          <Text style={styles.setPrevText}>/</Text>
          <TextInput
            style={[styles.setInput, { flex: 1, textAlign: 'center' }]}
            value={restS}
            onChangeText={setRestS}
            keyboardType="number-pad"
            placeholder="rest"
            placeholderTextColor={colors.mutedForeground}
            editable={!set.completed}
            testID={`active-set-${set.id}-rest`}
          />
        </View>
      ) : (
        <TextInput
          style={[styles.setCol, styles.setColPrev, styles.setInput]}
          value={reps}
          onChangeText={setReps}
          keyboardType="number-pad"
          placeholder="reps"
          placeholderTextColor={colors.mutedForeground}
          editable={!set.completed}
          testID={`active-set-${set.id}-reps`}
        />
      )}
      <TextInput
        style={[styles.setCol, styles.setColInput, styles.setInput, { flex: 1.2 }]}
        value={duration}
        onChangeText={setDuration}
        keyboardType="number-pad"
        placeholder="seconds"
        placeholderTextColor={colors.mutedForeground}
        editable={!set.completed}
        testID={`active-set-${set.id}-duration`}
      />
      <TouchableOpacity
        style={[styles.logBtn, set.completed && styles.logBtnDone]}
        onPress={set.completed || pending ? undefined : handleLog}
        activeOpacity={set.completed || pending ? 1 : 0.7}
        testID={`active-set-${set.id}-log`}
      >
        <Check
          color={set.completed ? colors.primaryFg : pending ? colors.primary : colors.mutedForeground}
          size={16} strokeWidth={2.5}
        />
      </TouchableOpacity>
    </View>
  )
}

function isPersistedWorkoutId(id: string): boolean {
  return !id.startsWith('blank-') && !id.startsWith('local-') && id.length > 0
}

function createClientUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = Math.floor(Math.random() * 16)
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8
    return value.toString(16)
  })
}

function normalizeWorkoutType(type: string): WorkoutType {
  if (type === 'hybrid' || type === 'conditioning' || type === 'run' || type === 'rest') {
    return type
  }
  return 'strength'
}

// ─── Plate Calculator ─────────────────────────────────────────────────────────

function PlateCalculatorModal({ visible, targetWeight, onChangeTarget, unitSystem, onClose }: {
  visible: boolean
  targetWeight: string
  onChangeTarget: (v: string) => void
  unitSystem: UnitSystem
  onClose: () => void
}) {
  const target = parseFloat(targetWeight) || 0
  const breakdown = calculatePlates(target, { system: unitSystem })
  const totalLoaded = breakdown.barWeight + breakdown.totalPlateWeight

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
                testID="plate-target-input"
              />
              <Text style={styles.targetUnit}>{breakdown.unit}</Text>
            </View>
          </View>

          <View style={styles.plateResult}>
            <Text style={styles.plateResultLabel}>
              Bar: {breakdown.barWeight}{breakdown.unit} + each side:
            </Text>
            <View style={styles.platesRow}>
              {breakdown.perSide.length > 0 ? breakdown.perSide.map((p, i) => (
                <View key={i} style={[styles.plateBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.plateBadgeText, { color: colors.primary }]} testID={`plate-badge-${p}`}>{p}</Text>
                </View>
              )) : (
                <Text style={styles.noPlatesText}>Just the bar</Text>
              )}
            </View>
            <Text style={styles.plateTotal}>
              Total: {totalLoaded}{breakdown.unit}
              {breakdown.remainder > 0 ? ` (short by ${breakdown.remainder}${breakdown.unit})` : ''}
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
  saveBanner:       { marginHorizontal: spacing.screen, marginTop: spacing.sm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm },
  saveBannerQueued: { borderColor: colors.energy + '60', backgroundColor: colors.energy + '12' },
  saveBannerError:  { borderColor: colors.destructive + '60', backgroundColor: colors.destructive + '12' },
  saveBannerText:   { fontSize: typography.size.xs, color: colors.mutedForeground },
  scroll:           { flex: 1 },
  scrollContent:    { paddingHorizontal: spacing.screen, paddingTop: spacing.md, paddingBottom: 120, gap: spacing.md },
  exerciseCard:     { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, overflow: 'hidden' },
  exerciseHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  exerciseName:     { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.foreground },
  muscleTag:        { marginTop: 3, alignSelf: 'flex-start', backgroundColor: colors.blue + '18', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  muscleTagText:    { fontSize: typography.size.xs, color: colors.blue, fontWeight: typography.weight.semibold },
  calcBtn:          { flexDirection: 'row', alignItems: 'center', gap: 4 },
  calcBtnText:      { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  modeToggle:       { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  modeToggleChip:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full, borderWidth: 0.5, borderColor: colors.border, backgroundColor: colors.muted, minHeight: touchTarget.min },
  modeToggleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeToggleChipText: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color: colors.foreground },
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
  modalOverlay:     { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
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
