// waliFit — Remaining V1 Screens
// TreeDetailScreen, StreakModal, TreeAtRiskModal,
// ExerciseDetailScreen, ExerciseLibraryScreen, OfflineSyncComponents

import { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal,
} from 'react-native'
import {
  AlertTriangle, Search, ChevronRight,
  WifiOff, RefreshCw, X, Info,
} from 'lucide-react-native'
import { colors, spacing, typography, radius, touchTarget } from '../theme'
import { useExerciseLibrary, useMuscleGroups, useFilteredExercises, type Exercise } from '../hooks/useExerciseLibrary'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TREE = {
  score:        85,
  stage:        'Growing',
  stageNext:    'Thriving',
  pointsToNext: 6,
  history:      [72, 68, 75, 80, 85, 81, 85],
}

// ─── Tree Detail Screen ───────────────────────────────────────────────────────

export function TreeDetailScreen({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
          <X color={colors.foreground} size={20} strokeWidth={1.75} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Vitality Tree</Text>
        <View style={{ width: touchTarget.min }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Score hero */}
        <View style={styles.treeHero}>
          <View style={[styles.treeCircle]}>
            <Text style={{ fontSize: 56 }}>🌳</Text>
          </View>
          <Text style={[styles.treeScore, { color: colors.primary }]}>{MOCK_TREE.score}</Text>
          <View style={styles.stageBadge}>
            <Text style={styles.stageText}>{MOCK_TREE.stage}</Text>
          </View>
          <Text style={styles.treeNextInfo}>
            {MOCK_TREE.pointsToNext} points to {MOCK_TREE.stageNext}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Growth progress</Text>
        <View style={styles.growthCard}>
          <View style={styles.growthHeader}>
            <Text style={styles.growthValue}>{MOCK_TREE.score}%</Text>
            <Text style={styles.growthCopy}>Your tree is in the {MOCK_TREE.stage.toLowerCase()} stage.</Text>
          </View>
          <View style={styles.growthTrack}>
            <View style={[styles.growthFill, { width: `${MOCK_TREE.score}%` as any }]} />
          </View>
          <Text style={styles.growthHint}>
            Update Today's Progress on Home to feed this score throughout the day.
          </Text>
        </View>

        {/* 7-day history */}
        <Text style={styles.sectionLabel}>Last 7 days</Text>
        <View style={styles.historyCard}>
          {MOCK_TREE.history.map((score, i) => {
            const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
            const isToday = i === MOCK_TREE.history.length - 1
            return (
              <View key={i} style={styles.historyBar}>
                <View style={[styles.historyBarFill, { height: `${score}%` as any, backgroundColor: isToday ? colors.primary : colors.border }]} />
                <Text style={[styles.historyDay, isToday && { color: colors.primary }]}>{days[i]}</Text>
                <Text style={[styles.historyScore, isToday && { color: colors.primary }]}>{score}</Text>
              </View>
            )
          })}
        </View>

        {/* Tree stages */}
        <Text style={styles.sectionLabel}>Tree stages</Text>
        <View style={styles.stagesCard}>
          {[
            { label: 'Wilted',      range: '0–15',  stage: MOCK_TREE.score <= 15 },
            { label: 'Recovering',  range: '16–35', stage: MOCK_TREE.score <= 35 },
            { label: 'Sprout',      range: '36–55', stage: MOCK_TREE.score <= 55 },
            { label: 'Growing',     range: '56–75', stage: MOCK_TREE.score <= 75 },
            { label: 'Thriving',    range: '76–90', stage: MOCK_TREE.score <= 90 },
            { label: 'Full Vitality',range:'91–100', stage: MOCK_TREE.score > 90 },
          ].map((s, i) => (
            <View key={i} style={[styles.stageRow, i < 5 && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
              <Text style={[styles.stageRange, { color: colors.mutedForeground }]}>{s.range}</Text>
              <Text style={[styles.stageName, MOCK_TREE.stage === s.label && { color: colors.primary, fontWeight: typography.weight.bold }]}>
                {s.label}
                {MOCK_TREE.stage === s.label ? ' ← you' : ''}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.stepsNotice}>
          <Info color={colors.primary} size={14} strokeWidth={1.75} />
          <Text style={styles.stepsNoticeText}>
            Steps sync from Apple Health / Google Fit automatically. Workouts are a bonus multiplier — your tree score is primarily driven by daily habits.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

// ─── Streak Modal ─────────────────────────────────────────────────────────────

export function StreakModal({ visible, streak, onClose }: {
  visible: boolean; streak: number; onClose: () => void
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.streakSheet}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X color={colors.mutedForeground} size={18} strokeWidth={1.75} />
          </TouchableOpacity>
          <Text style={{ fontSize: 64 }}>🔥</Text>
          <Text style={[styles.treeScore, { color: colors.energy }]}>{streak} day streak</Text>
          <Text style={styles.streakSub}>
            You've hit your daily goal {streak} days in a row. Keep the tree alive.
          </Text>
          <View style={styles.streakMilestones}>
            {[7, 14, 30, 60, 100].map(m => (
              <View key={m} style={[styles.milestoneDot, streak >= m && { backgroundColor: colors.energy }]}>
                <Text style={[styles.milestoneTxt, streak >= m && { color: colors.black }]}>{m}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.stagesNotice}>Tap anywhere to dismiss</Text>
          <TouchableOpacity style={styles.streakCloseBtn} onPress={onClose}>
            <Text style={styles.streakCloseBtnText}>Keep it going</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ─── Tree At Risk Modal ───────────────────────────────────────────────────────

export function TreeAtRiskModal({ visible, onClose, onFixNow }: {
  visible: boolean; onClose: () => void; onFixNow: () => void
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.streakSheet, { borderColor: colors.energy + '60' }]}>
          <AlertTriangle color={colors.energy} size={40} strokeWidth={1.5} />
          <Text style={[styles.treeScore, { color: colors.energy }]}>Tree at risk</Text>
          <Text style={styles.streakSub}>
            It's 7pm and your tree is below 50%. Log your protein and water to keep it alive tonight.
          </Text>
          <View style={styles.riskPillars}>
            <View style={[styles.riskPillar, { borderColor: colors.energy + '40' }]}>
              <Text style={styles.riskPillarLabel}>Protein</Text>
              <Text style={[styles.riskPillarValue, { color: colors.energy }]}>40%</Text>
            </View>
            <View style={[styles.riskPillar, { borderColor: colors.blue + '40' }]}>
              <Text style={styles.riskPillarLabel}>Water</Text>
              <Text style={[styles.riskPillarValue, { color: colors.blue }]}>55%</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.streakCloseBtn, { backgroundColor: colors.energy }]} onPress={onFixNow}>
            <Text style={[styles.streakCloseBtnText, { color: colors.black }]}>Log now</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.stagesNotice}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ─── Exercise Library Screen ──────────────────────────────────────────────────

export function ExerciseLibraryScreen({
  onBack, onSelect, mode = 'browse',
}: {
  onBack: () => void; onSelect?: (id: string) => void; mode?: 'browse' | 'pick'
}) {
  const [query, setQuery]   = useState('')
  const [muscle, setMuscle] = useState('All')

  const { data, isLoading, error, refetch } = useExerciseLibrary()
  const exercises  = data ?? []
  const groups     = useMuscleGroups(data)
  const filtered   = useFilteredExercises(data, { query, muscle }, { debounceMs: 220 })

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <ChevronRight color={colors.foreground} size={20} strokeWidth={1.75} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{mode === 'pick' ? 'Add Exercise' : 'Exercise Library'}</Text>
        <View style={{ width: touchTarget.min }} />
      </View>

      <View style={styles.libraryFilters}>
        <View style={styles.searchRow}>
          <Search color={colors.mutedForeground} size={16} strokeWidth={1.75} />
          <TextInput style={styles.searchInput} value={query} onChangeText={setQuery}
            placeholder="Search exercises" placeholderTextColor={colors.mutedForeground} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.muscleFilter}>
          {groups.map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.muscleChip, muscle === m && styles.muscleChipActive]}
              onPress={() => setMuscle(m)} activeOpacity={0.7}
            >
              <Text style={[styles.muscleChipText, muscle === m && { color: colors.primary }]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading && exercises.length === 0 ? (
        <View style={styles.libraryStateBox}>
          <Text style={styles.libraryStateText}>Loading exercise library...</Text>
        </View>
      ) : error && exercises.length === 0 ? (
        <View style={styles.libraryStateBox}>
          <Text style={styles.libraryStateText}>Couldn't load exercises.</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.libraryStateBtn}>
            <Text style={styles.libraryStateBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.libraryStateBox}>
          <Text style={styles.libraryStateText}>No exercises match your filters.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.exerciseList}>
          {filtered.map((ex) => (
            <ExerciseRow
              key={ex.id}
              exercise={ex}
              mode={mode}
              onSelect={() => onSelect?.(ex.id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

function ExerciseRow({ exercise, mode, onSelect }: {
  exercise: Exercise; mode: 'browse' | 'pick'; onSelect: () => void
}) {
  const primaryMuscle = exercise.primaryMuscles[0] ?? exercise.category
  const equipmentLabel = exercise.equipment[0] ?? 'Bodyweight'
  return (
    <TouchableOpacity style={styles.exerciseRow} onPress={onSelect} activeOpacity={0.7}>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <View style={styles.exerciseTags}>
          <View style={styles.exerciseTag}><Text style={styles.exerciseTagText}>{primaryMuscle}</Text></View>
          <View style={styles.exerciseTag}><Text style={styles.exerciseTagText}>{equipmentLabel}</Text></View>
          {exercise.movementType && (
            <View style={styles.exerciseTag}><Text style={styles.exerciseTagText}>{exercise.movementType}</Text></View>
          )}
        </View>
      </View>
      {mode === 'pick'
        ? <TouchableOpacity style={styles.addExBtn} onPress={onSelect}>
            <Text style={styles.addExBtnText}>Add</Text>
          </TouchableOpacity>
        : <ChevronRight color={colors.mutedForeground} size={16} strokeWidth={1.75} />
      }
    </TouchableOpacity>
  )
}

// ─── Offline Sync Components ──────────────────────────────────────────────────

export function OfflineBanner({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <View style={styles.offlineBanner}>
      <WifiOff color={colors.energy} size={14} strokeWidth={1.75} />
      <Text style={styles.offlineBannerText}>Offline — logging to sync queue</Text>
    </View>
  )
}

export function SyncStatusIndicator({ pendingCount, onSync }: {
  pendingCount: number; onSync: () => void
}) {
  if (pendingCount === 0) return null
  return (
    <TouchableOpacity style={styles.syncIndicator} onPress={onSync} activeOpacity={0.7}>
      <RefreshCw color={colors.foreground} size={13} strokeWidth={2} />
      <Text style={styles.syncIndicatorText}>{pendingCount} pending sync</Text>
    </TouchableOpacity>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  navBar:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm, paddingTop: spacing.xl, paddingBottom: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  navTitle:         { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.foreground },
  iconBtn:          { width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  content:          { paddingHorizontal: spacing.screen, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  sectionLabel:     { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.mutedForeground },
  treeHero:         { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  treeCircle:       { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  treeScore:        { fontSize: 52, fontWeight: typography.weight.extrabold },
  stageBadge:       { backgroundColor: colors.primary + '18', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  stageText:        { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.primary },
  treeNextInfo:     { fontSize: typography.size.sm, color: colors.mutedForeground },
  growthCard:       { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  growthHeader:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  growthValue:      { fontSize: typography.size['3xl'], fontWeight: typography.weight.extrabold, color: colors.primary },
  growthCopy:       { flex: 1, fontSize: typography.size.sm, color: colors.foreground, lineHeight: 20 },
  growthTrack:      { height: 8, backgroundColor: colors.muted, borderRadius: radius.full, overflow: 'hidden' },
  growthFill:       { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
  growthHint:       { fontSize: typography.size.xs, color: colors.mutedForeground, lineHeight: 18 },
  historyCard:      { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, height: 100, gap: spacing.xs },
  historyBar:       { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 3 },
  historyBarFill:   { width: '100%', borderRadius: 2 },
  historyDay:       { fontSize: 9, color: colors.mutedForeground },
  historyScore:     { fontSize: 9, color: colors.mutedForeground },
  stagesCard:       { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, overflow: 'hidden' },
  stageRow:         { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  stageRange:       { width: 60, fontSize: typography.size.xs, color: colors.mutedForeground },
  stageName:        { fontSize: typography.size.sm, color: colors.foreground },
  stagesNotice:     { fontSize: typography.size.xs, color: colors.mutedForeground, textAlign: 'center' },
  stepsNotice:      { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.primary + '08', borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.primary + '30', padding: spacing.md },
  stepsNoticeText:  { flex: 1, fontSize: typography.size.xs, color: colors.mutedForeground, lineHeight: 18 },
  overlay:          { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.screen },
  streakSheet:      { width: '100%', backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 0.5, borderColor: colors.border, padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  closeBtn:         { alignSelf: 'flex-end', width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  streakSub:        { fontSize: typography.size.sm, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20 },
  streakMilestones: { flexDirection: 'row', gap: spacing.sm },
  milestoneDot:     { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: colors.border },
  milestoneTxt:     { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.mutedForeground },
  streakCloseBtn:   { width: '100%', height: touchTarget.comfortable, backgroundColor: colors.primary, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  streakCloseBtnText:{ fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.primaryFg },
  riskPillars:      { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  riskPillar:       { flex: 1, backgroundColor: colors.muted, borderRadius: radius.lg, borderWidth: 0.5, padding: spacing.md, alignItems: 'center', gap: spacing.xs },
  riskPillarLabel:  { fontSize: typography.size.xs, color: colors.mutedForeground },
  riskPillarValue:  { fontSize: typography.size.xl, fontWeight: typography.weight.extrabold },
  libraryFilters:   { paddingHorizontal: spacing.screen, paddingTop: spacing.sm, gap: spacing.sm },
  searchRow:        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, paddingHorizontal: spacing.md, height: touchTarget.comfortable },
  searchInput:      { flex: 1, fontSize: typography.size.base, color: colors.foreground },
  muscleFilter:     { flexGrow: 0 },
  muscleChip:       { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.card, borderRadius: radius.full, borderWidth: 0.5, borderColor: colors.border, marginRight: spacing.xs, minHeight: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  muscleChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  muscleChipText:   { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.mutedForeground },
  libraryStateBox:  { paddingHorizontal: spacing.screen, paddingTop: spacing.xl, alignItems: 'center', gap: spacing.md },
  libraryStateText: { fontSize: typography.size.base, color: colors.mutedForeground, textAlign: 'center' },
  libraryStateBtn:  { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.full, minHeight: touchTarget.comfortable, alignItems: 'center', justifyContent: 'center' },
  libraryStateBtnText: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.primaryFg },
  exerciseList:     { paddingHorizontal: spacing.screen, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  exerciseRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.border, gap: spacing.md },
  exerciseInfo:     { flex: 1, gap: spacing.xs },
  exerciseName:     { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground },
  exerciseTags:     { flexDirection: 'row', gap: spacing.xs },
  exerciseTag:      { paddingHorizontal: spacing.sm, paddingVertical: 2, backgroundColor: colors.muted, borderRadius: radius.full },
  exerciseTagText:  { fontSize: 10, color: colors.mutedForeground },
  addExBtn:         { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.primary, borderRadius: radius.full, minHeight: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  addExBtnText:     { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.primaryFg },
  offlineBanner:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.energy + '18', paddingHorizontal: spacing.screen, paddingVertical: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: colors.energy + '40' },
  offlineBannerText:{ fontSize: typography.size.sm, color: colors.energy, fontWeight: typography.weight.semibold },
  syncIndicator:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 0.5, borderColor: colors.border },
  syncIndicatorText:{ fontSize: typography.size.xs, color: colors.foreground },
})
