// WF-011 — Custom Workout Builder. Lists saved templates, lets the user create
// new ones from the exercise library, and supports save / duplicate / delete /
// archive. Conditioning slots reuse the same row but expose interval/rounds
// fields when the user picks that mode.

import React, { useState } from 'react'
import {
  Alert, View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Modal, Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ChevronLeft, Plus, Search, Trash2, Copy, Edit3, Save, X, Timer, Repeat, Dumbbell,
} from 'lucide-react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../App'
import { colors, spacing, typography, radius, touchTarget } from '../theme'
import {
  useWorkoutTemplates, useCreateTemplate, useUpdateTemplate,
  useDuplicateTemplate, useDeleteTemplate,
  type WorkoutTemplate, type TemplateExercise,
} from '../hooks/useWorkoutTemplates'
import {
  useExerciseLibrary, useFilteredExercises, type Exercise,
} from '../hooks/useExerciseLibrary'

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutBuilder'>

type ExerciseDraft = TemplateExercise & { mode: 'strength' | 'interval' | 'rounds' }

export default function WorkoutBuilderScreen({ navigation }: Props) {
  const { data: templates, isLoading, error } = useWorkoutTemplates()
  const duplicate = useDuplicateTemplate()
  const remove = useDeleteTemplate()

  const [editing, setEditing] = useState<WorkoutTemplate | null>(null)
  const [creating, setCreating] = useState(false)

  const list = templates ?? []

  const handleDuplicate = (id: string) => {
    duplicate.mutate(id)
  }

  const handleDelete = (template: WorkoutTemplate) => {
    Alert.alert(
      'Delete template?',
      `"${template.name}" will be removed. Logged sessions are not affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(template.id) },
      ],
    )
  }

  if (creating || editing) {
    return (
      <TemplateEditor
        initial={editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
      />
    )
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ChevronLeft size={22} color={colors.foreground} strokeWidth={1.75} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Workout Builder</Text>
        <TouchableOpacity onPress={() => setCreating(true)} style={styles.iconBtn} testID="builder-create-template">
          <Plus size={22} color={colors.primary} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {isLoading && list.length === 0 ? (
          <View style={styles.stateBox}><Text style={styles.stateText}>Loading templates…</Text></View>
        ) : error && list.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>Couldn't load templates.</Text>
          </View>
        ) : list.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>No templates yet.</Text>
            <TouchableOpacity onPress={() => setCreating(true)} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Create your first template</Text>
            </TouchableOpacity>
          </View>
        ) : (
          list.map((template) => (
            <View key={template.id} style={styles.templateCard}>
              <View style={styles.templateHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templateMeta}>
                    {template.exercises.length} exercise{template.exercises.length === 1 ? '' : 's'} · {template.type}
                  </Text>
                </View>
              </View>
              {template.description ? (
                <Text style={styles.templateDescription}>{template.description}</Text>
              ) : null}
              <View style={styles.templateActions}>
                <TouchableOpacity onPress={() => setEditing(template)} style={styles.actionBtn}>
                  <Edit3 size={16} color={colors.foreground} strokeWidth={1.75} />
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDuplicate(template.id)} style={styles.actionBtn} testID={`builder-duplicate-${template.id}`}>
                  <Copy size={16} color={colors.foreground} strokeWidth={1.75} />
                  <Text style={styles.actionBtnText}>Duplicate</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(template)} style={styles.actionBtn} testID={`builder-delete-${template.id}`}>
                  <Trash2 size={16} color={colors.destructive} strokeWidth={1.75} />
                  <Text style={[styles.actionBtnText, { color: colors.destructive }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Editor ────────────────────────────────────────────────────────────────

function TemplateEditor({ initial, onClose }: { initial: WorkoutTemplate | null; onClose: () => void }) {
  const create = useCreateTemplate()
  const update = useUpdateTemplate(initial?.id ?? '')

  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [exercises, setExercises] = useState<ExerciseDraft[]>(
    (initial?.exercises ?? []).map(toDraft),
  )
  const [showLibrary, setShowLibrary] = useState(false)

  const isSaving = create.isPending || update.isPending
  const canSave = name.trim().length > 0 && exercises.length > 0 && !isSaving

  const handleAddExercises = (selected: Exercise[]) => {
    setShowLibrary(false)
    setExercises((current) => [
      ...current,
      ...selected.map((ex, idx) => ({
        exerciseName: ex.name,
        exerciseId: ex.id,
        position: current.length + idx,
        defaultSets: 3,
        defaultReps: 8,
        restS: 90,
        mode: 'strength' as const,
      })),
    ])
  }

  const handleSave = async () => {
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      type: hasConditioning(exercises) ? ('hybrid' as const) : ('strength' as const),
      exercises: exercises.map((ex, idx) => ({ ...stripDraft(ex), position: idx })),
    }
    try {
      if (initial) await update.mutateAsync(payload)
      else await create.mutateAsync(payload)
      onClose()
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
          <X size={22} color={colors.foreground} strokeWidth={1.75} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{initial ? 'Edit Template' : 'New Template'}</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          style={[styles.iconBtn, !canSave && { opacity: 0.4 }]}
          testID="builder-save-template"
        >
          <Save size={22} color={colors.primary} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.fieldLabel}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Push Day A"
          placeholderTextColor={colors.mutedForeground}
          testID="builder-template-name"
        />

        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput
          style={[styles.input, { minHeight: 60 }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Optional notes about this template"
          placeholderTextColor={colors.mutedForeground}
          multiline
        />

        <Text style={styles.fieldLabel}>Exercises</Text>
        {exercises.map((ex, idx) => (
          <ExerciseDraftRow
            key={`${ex.exerciseId ?? ex.exerciseName}-${idx}`}
            draft={ex}
            onChange={(patch) => setExercises((curr) => curr.map((x, i) => (i === idx ? { ...x, ...patch } : x)))}
            onRemove={() => setExercises((curr) => curr.filter((_, i) => i !== idx))}
          />
        ))}

        <TouchableOpacity onPress={() => setShowLibrary(true)} style={styles.addExerciseBtn} testID="builder-add-exercise">
          <Plus size={18} color={colors.primary} strokeWidth={1.75} />
          <Text style={styles.addExerciseBtnText}>Add exercise from library</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showLibrary} animationType="slide" presentationStyle="pageSheet">
        <ExercisePicker onCancel={() => setShowLibrary(false)} onConfirm={handleAddExercises} />
      </Modal>
    </SafeAreaView>
  )
}

// ─── Exercise draft row ────────────────────────────────────────────────────

function ExerciseDraftRow({
  draft, onChange, onRemove,
}: {
  draft: ExerciseDraft
  onChange: (patch: Partial<ExerciseDraft>) => void
  onRemove: () => void
}) {
  const setMode = (mode: ExerciseDraft['mode']) => {
    if (mode === draft.mode) return
    if (mode === 'strength') {
      onChange({ mode, durationS: null, rounds: null, intervalWorkS: null, intervalRestS: null, defaultSets: 3, defaultReps: 8 })
    } else if (mode === 'interval') {
      onChange({ mode, intervalWorkS: 30, intervalRestS: 30, durationS: 600, defaultReps: null, rounds: null })
    } else if (mode === 'rounds') {
      onChange({ mode, rounds: 5, durationS: null, intervalWorkS: null, intervalRestS: null, defaultReps: 10 })
    }
  }

  return (
    <View style={styles.draftRow}>
      <View style={styles.draftHeader}>
        <Text style={styles.draftName}>{draft.exerciseName}</Text>
        <TouchableOpacity onPress={onRemove}>
          <Trash2 size={16} color={colors.destructive} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>

      <View style={styles.modePicker}>
        <ModeChip
          icon={<Dumbbell size={14} color={draft.mode === 'strength' ? colors.primaryFg : colors.foreground} strokeWidth={1.75} />}
          label="Strength"
          active={draft.mode === 'strength'}
          onPress={() => setMode('strength')}
          testID={`builder-row-${draft.exerciseName}-strength`}
        />
        <ModeChip
          icon={<Timer size={14} color={draft.mode === 'interval' ? colors.primaryFg : colors.foreground} strokeWidth={1.75} />}
          label="Interval"
          active={draft.mode === 'interval'}
          onPress={() => setMode('interval')}
          testID={`builder-row-${draft.exerciseName}-interval`}
        />
        <ModeChip
          icon={<Repeat size={14} color={draft.mode === 'rounds' ? colors.primaryFg : colors.foreground} strokeWidth={1.75} />}
          label="Rounds"
          active={draft.mode === 'rounds'}
          onPress={() => setMode('rounds')}
          testID={`builder-row-${draft.exerciseName}-rounds`}
        />
      </View>

      {draft.mode === 'strength' ? (
        <View style={styles.draftFields}>
          <NumField label="Sets" value={draft.defaultSets} onChange={(v) => onChange({ defaultSets: v ?? undefined })} />
          <NumField label="Reps" value={draft.defaultReps ?? null} onChange={(v) => onChange({ defaultReps: v })} />
          <NumField label="Rest (s)" value={draft.restS ?? null} onChange={(v) => onChange({ restS: v })} />
        </View>
      ) : draft.mode === 'interval' ? (
        <View style={styles.draftFields}>
          <NumField label="Work (s)" value={draft.intervalWorkS ?? null} onChange={(v) => onChange({ intervalWorkS: v })} />
          <NumField label="Rest (s)" value={draft.intervalRestS ?? null} onChange={(v) => onChange({ intervalRestS: v })} />
          <NumField label="Total (s)" value={draft.durationS ?? null} onChange={(v) => onChange({ durationS: v })} />
        </View>
      ) : (
        <View style={styles.draftFields}>
          <NumField label="Rounds" value={draft.rounds ?? null} onChange={(v) => onChange({ rounds: v })} />
          <NumField label="Reps/round" value={draft.defaultReps ?? null} onChange={(v) => onChange({ defaultReps: v })} />
          <NumField label="Rest (s)" value={draft.restS ?? null} onChange={(v) => onChange({ restS: v })} />
        </View>
      )}
    </View>
  )
}

function ModeChip({ icon, label, active, onPress, testID }: {
  icon: React.ReactNode; label: string; active: boolean; onPress: () => void; testID?: string
}) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.modeChip, active && styles.modeChipActive]} testID={testID}>
      {icon}
      <Text style={[styles.modeChipText, active && { color: colors.primaryFg }]}>{label}</Text>
    </TouchableOpacity>
  )
}

function NumField({ label, value, onChange }: {
  label: string; value: number | null | undefined; onChange: (v: number | null) => void
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.numLabel}>{label}</Text>
      <TextInput
        style={styles.numInput}
        value={value == null ? '' : String(value)}
        onChangeText={(text) => {
          const n = parseInt(text, 10)
          onChange(Number.isFinite(n) ? n : null)
        }}
        keyboardType="number-pad"
        placeholderTextColor={colors.mutedForeground}
      />
    </View>
  )
}

// ─── Exercise picker (modal) ──────────────────────────────────────────────

function ExercisePicker({
  onCancel, onConfirm,
}: {
  onCancel: () => void; onConfirm: (selected: Exercise[]) => void
}) {
  const { data, isLoading } = useExerciseLibrary()
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filtered = useFilteredExercises(data, { query }, { debounceMs: 200, maxResults: 200 })

  const toggle = (id: string) => {
    setSelectedIds((curr) => {
      const next = new Set(curr)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirm = () => {
    if (!data) return
    const picks = data.filter((ex) => selectedIds.has(ex.id))
    onConfirm(picks)
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onCancel} style={styles.iconBtn}>
          <X size={22} color={colors.foreground} strokeWidth={1.75} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Pick exercises</Text>
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={selectedIds.size === 0}
          style={[styles.iconBtn, selectedIds.size === 0 && { opacity: 0.4 }]}
          testID="builder-confirm-exercises"
        >
          <Plus size={22} color={colors.primary} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Search size={16} color={colors.mutedForeground} strokeWidth={1.75} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises"
          placeholderTextColor={colors.mutedForeground}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.screen, paddingBottom: spacing.xxl }}>
        {isLoading && filtered.length === 0 ? (
          <Text style={styles.stateText}>Loading…</Text>
        ) : filtered.length === 0 ? (
          <Text style={styles.stateText}>No matches.</Text>
        ) : (
          filtered.map((ex) => {
            const isSelected = selectedIds.has(ex.id)
            return (
              <Pressable
                key={ex.id}
                onPress={() => toggle(ex.id)}
                style={[styles.pickerRow, isSelected && styles.pickerRowActive]}
                testID={`builder-pick-exercise-${ex.id}`}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerName}>{ex.name}</Text>
                  <Text style={styles.pickerMeta}>
                    {ex.primaryMuscles[0] ?? ex.category}
                    {ex.equipment[0] ? ` · ${ex.equipment[0]}` : ''}
                  </Text>
                </View>
                {isSelected && <Plus size={18} color={colors.primary} strokeWidth={2} style={{ transform: [{ rotate: '45deg' }] }} />}
              </Pressable>
            )
          })
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────

function toDraft(ex: TemplateExercise): ExerciseDraft {
  if (ex.intervalWorkS != null) return { ...ex, mode: 'interval' }
  if (ex.rounds != null) return { ...ex, mode: 'rounds' }
  return { ...ex, mode: 'strength' }
}

function stripDraft({ mode: _m, id: _id, ...rest }: ExerciseDraft): TemplateExercise {
  return rest
}

function hasConditioning(exercises: ExerciseDraft[]): boolean {
  return exercises.some((ex) => ex.mode !== 'strength')
}

// ─── styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: colors.background },
  navBar:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm, paddingTop: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  navTitle:           { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.foreground },
  iconBtn:            { width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  scroll:             { padding: spacing.screen, paddingBottom: spacing.xxl, gap: spacing.md },
  stateBox:           { paddingTop: spacing.xl, alignItems: 'center', gap: spacing.md },
  stateText:          { fontSize: typography.size.base, color: colors.mutedForeground, textAlign: 'center' },
  primaryBtn:         { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.full, minHeight: touchTarget.comfortable, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText:     { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.primaryFg },
  templateCard:       { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  templateHeader:     { flexDirection: 'row', alignItems: 'center' },
  templateName:       { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.foreground },
  templateMeta:       { fontSize: typography.size.xs, color: colors.mutedForeground, marginTop: 2 },
  templateDescription:{ fontSize: typography.size.sm, color: colors.foreground },
  templateActions:    { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  actionBtn:          { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radius.md, backgroundColor: colors.muted },
  actionBtnText:      { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color: colors.foreground },
  fieldLabel:         { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color: colors.mutedForeground, marginTop: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.6 },
  input:              { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 0.5, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: typography.size.base, color: colors.foreground, minHeight: touchTarget.comfortable },
  draftRow:           { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  draftHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  draftName:          { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground, flex: 1 },
  draftFields:        { flexDirection: 'row', gap: spacing.sm },
  modePicker:         { flexDirection: 'row', gap: spacing.xs },
  modeChip:           { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full, borderWidth: 0.5, borderColor: colors.border, backgroundColor: colors.muted, minHeight: touchTarget.min },
  modeChipActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  modeChipText:       { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color: colors.foreground },
  numLabel:           { fontSize: 10, color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  numInput:           { backgroundColor: colors.background, borderRadius: radius.sm, borderWidth: 0.5, borderColor: colors.border, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, fontSize: typography.size.base, color: colors.foreground, minHeight: touchTarget.min, textAlign: 'center' },
  addExerciseBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary + '60', backgroundColor: colors.primary + '08' },
  addExerciseBtnText: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.primary },
  searchRow:          { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.screen, marginTop: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, height: touchTarget.comfortable },
  searchInput:        { flex: 1, fontSize: typography.size.base, color: colors.foreground },
  pickerRow:          { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.border, gap: spacing.md },
  pickerRowActive:    { backgroundColor: colors.primary + '10' },
  pickerName:         { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground },
  pickerMeta:         { fontSize: typography.size.xs, color: colors.mutedForeground, marginTop: 2 },
})
