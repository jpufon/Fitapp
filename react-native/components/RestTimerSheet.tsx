// waliFit — RestTimerSheet + RestTimerFullScreen
// Persists across all tabs during an active workout
// Haptic at 10s remaining, audio + haptic at 0s
// +/- 15s adjustments, skip, pause

import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native'
import { X, Plus, Minus, SkipForward, ChevronUp } from 'lucide-react-native'
import { colors, spacing, typography, radius, touchTarget } from '../theme'

const DEFAULT_REST_S = 90

// ─── Bottom Sheet (persistent during workout) ─────────────────────────────────

interface RestTimerSheetProps {
  visible:      boolean
  onExpand:     () => void
  onComplete:   () => void
}

export function RestTimerSheet({ visible, onExpand, onComplete }: RestTimerSheetProps) {
  const [seconds, setSeconds]   = useState(DEFAULT_REST_S)
  const [running, setRunning]   = useState(true)
  const timerRef                = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!visible) return
    setSeconds(DEFAULT_REST_S)
    setRunning(true)
  }, [visible])

  useEffect(() => {
    if (!running) { if (timerRef.current) clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(timerRef.current!)
          onComplete()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [running])

  if (!visible) return null

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  const progress = seconds / DEFAULT_REST_S

  return (
    <View style={styles.sheet}>
      {/* Progress bar */}
      <View style={styles.sheetProgress}>
        <View style={[styles.sheetProgressFill, { width: `${(1 - progress) * 100}%` as any }]} />
      </View>

      <View style={styles.sheetRow}>
        <Text style={styles.sheetLabel}>Rest</Text>
        <TouchableOpacity style={styles.sheetTimer} onPress={onExpand} activeOpacity={0.7}>
          <Text style={[styles.sheetTime, seconds <= 10 && { color: colors.destructive }]}>{display}</Text>
          <ChevronUp color={colors.mutedForeground} size={14} strokeWidth={1.75} />
        </TouchableOpacity>
        <View style={styles.sheetBtns}>
          <TouchableOpacity style={styles.sheetAdjBtn} onPress={() => setSeconds(s => Math.max(0, s - 15))}>
            <Minus color={colors.mutedForeground} size={14} strokeWidth={2} />
            <Text style={styles.sheetAdjText}>15s</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sheetAdjBtn} onPress={() => setSeconds(s => s + 15)}>
            <Plus color={colors.primary} size={14} strokeWidth={2} />
            <Text style={[styles.sheetAdjText, { color: colors.primary }]}>15s</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sheetSkipBtn} onPress={onComplete}>
            <SkipForward color={colors.mutedForeground} size={16} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

// ─── Full Screen Timer (expanded) ─────────────────────────────────────────────

interface RestTimerFullScreenProps {
  visible:    boolean
  onCollapse: () => void
  onComplete: () => void
}

export function RestTimerFullScreen({ visible, onCollapse, onComplete }: RestTimerFullScreenProps) {
  const [seconds, setSeconds] = useState(DEFAULT_REST_S)
  const [running, setRunning] = useState(true)
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!running) { if (timerRef.current) clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(timerRef.current!); onComplete(); return 0 }
        if (s === 10) { /* trigger haptic here in production */ }
        return s - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [running])

  const mins    = Math.floor(seconds / 60)
  const secs    = seconds % 60
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  // Preset options
  const PRESETS = [60, 90, 120, 180]

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.fullContainer}>
        {/* Close */}
        <TouchableOpacity style={styles.collapseBtn} onPress={onCollapse}>
          <X color={colors.foreground} size={20} strokeWidth={1.75} />
        </TouchableOpacity>

        <Text style={styles.fullTitle}>Rest timer</Text>

        {/* Ring */}
        <View style={styles.ringContainer}>
          <View style={styles.ringOuter}>
            <View style={[styles.ringInner, { borderColor: seconds <= 10 ? colors.destructive : colors.primary }]}>
              <Text style={[styles.fullTime, seconds <= 10 && { color: colors.destructive }]}>{display}</Text>
              <Text style={styles.fullSubTime}>remaining</Text>
            </View>
          </View>
        </View>

        {/* Adjustments */}
        <View style={styles.adjustRow}>
          <TouchableOpacity style={styles.adjustBtn} onPress={() => setSeconds(s => Math.max(0, s - 15))}>
            <Minus color={colors.foreground} size={20} strokeWidth={2} />
            <Text style={styles.adjustLabel}>−15s</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pauseBtn, { backgroundColor: running ? colors.card : colors.primary }]}
            onPress={() => setRunning(r => !r)}
          >
            <Text style={[styles.pauseBtnText, { color: running ? colors.foreground : colors.primaryFg }]}>
              {running ? 'Pause' : 'Resume'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.adjustBtn} onPress={() => setSeconds(s => s + 15)}>
            <Plus color={colors.primary} size={20} strokeWidth={2} />
            <Text style={[styles.adjustLabel, { color: colors.primary }]}>+15s</Text>
          </TouchableOpacity>
        </View>

        {/* Skip */}
        <TouchableOpacity style={styles.skipBtn} onPress={onComplete}>
          <SkipForward color={colors.mutedForeground} size={18} strokeWidth={1.75} />
          <Text style={styles.skipBtnText}>Skip rest</Text>
        </TouchableOpacity>

        {/* Preset durations */}
        <View style={styles.presetsSection}>
          <Text style={styles.presetsLabel}>Set default</Text>
          <View style={styles.presetsRow}>
            {PRESETS.map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.presetPill, seconds === p && styles.presetPillActive]}
                onPress={() => setSeconds(p)}
              >
                <Text style={[styles.presetPillText, seconds === p && { color: colors.primary }]}>
                  {p >= 60 ? `${p / 60}m` : `${p}s`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheet:              { backgroundColor: colors.card, borderTopWidth: 0.5, borderTopColor: colors.border, paddingHorizontal: spacing.screen, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  sheetProgress:      { height: 3, backgroundColor: colors.muted, borderRadius: 2, overflow: 'hidden', marginBottom: spacing.sm },
  sheetProgressFill:  { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  sheetRow:           { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sheetLabel:         { fontSize: typography.size.sm, color: colors.mutedForeground, width: 32 },
  sheetTimer:         { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sheetTime:          { fontSize: typography.size['2xl'], fontWeight: typography.weight.extrabold, color: colors.foreground },
  sheetBtns:          { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sheetAdjBtn:        { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: colors.muted, borderRadius: radius.sm, minHeight: touchTarget.min },
  sheetAdjText:       { fontSize: typography.size.xs, color: colors.mutedForeground, fontWeight: typography.weight.semibold },
  sheetSkipBtn:       { width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  fullContainer:      { flex: 1, backgroundColor: colors.background, alignItems: 'center', paddingHorizontal: spacing.screen, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  collapseBtn:        { alignSelf: 'flex-start', width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  fullTitle:          { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.mutedForeground, marginTop: spacing.xl },
  ringContainer:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ringOuter:          { width: 220, height: 220, borderRadius: 110, borderWidth: 6, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  ringInner:          { width: 200, height: 200, borderRadius: 100, borderWidth: 4, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  fullTime:           { fontSize: 56, fontWeight: typography.weight.extrabold, color: colors.foreground },
  fullSubTime:        { fontSize: typography.size.sm, color: colors.mutedForeground },
  adjustRow:          { flexDirection: 'row', alignItems: 'center', gap: spacing.md, width: '100%', marginBottom: spacing.lg },
  adjustBtn:          { flex: 1, alignItems: 'center', gap: 4 },
  adjustLabel:        { fontSize: typography.size.sm, color: colors.mutedForeground },
  pauseBtn:           { flex: 2, height: touchTarget.comfortable, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: colors.border },
  pauseBtnText:       { fontSize: typography.size.base, fontWeight: typography.weight.bold },
  skipBtn:            { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  skipBtnText:        { fontSize: typography.size.base, color: colors.mutedForeground },
  presetsSection:     { width: '100%', gap: spacing.sm },
  presetsLabel:       { fontSize: typography.size.sm, color: colors.mutedForeground, textAlign: 'center' },
  presetsRow:         { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  presetPill:         { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.card, borderRadius: radius.full, borderWidth: 0.5, borderColor: colors.border, minHeight: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  presetPillActive:   { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  presetPillText:     { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.mutedForeground },
})
