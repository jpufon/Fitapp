// waliFit — WaliRunScreen
// Run tab inside Train + Pre-Run Checklist + Active Run (full-screen)
// + Lap Split overlay + Run Summary + Run History
// Foreground GPS only in V1 — screen stays on during run

import React, { useMemo, useState } from 'react'
import {
  Alert, View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Play, Square, Pause, MapPin, Battery,
  ChevronRight, Award, Share2, ArrowLeft,
} from 'lucide-react-native'
import { colors, spacing, typography, radius, touchTarget } from '../theme'
import type { SurfaceTokens } from '../theme/surfaceTheme'
import { useWalifitTheme } from '../theme/ThemeProvider'
import { apiMutate } from '../lib/api'

type RunView = 'tab' | 'prerun' | 'active' | 'summary'

// ─── Mock data ────────────────────────────────────────────────────────────────

const DISTANCE_MODES = ['1K', '2K', '5K', '10K', 'Half marathon', 'Free run']

const MOCK_ACTIVE = {
  distanceKm:   3.24,
  elapsedTime:  '18:42',
  currentPace:  '5:45',
  avgPace:      '5:46',
  splits: [
    { km: 1, pace: '5:41', delta: '-4s' },
    { km: 2, pace: '5:44', delta: '-1s' },
    { km: 3, pace: '5:51', delta: '+6s' },
  ]
}

const MOCK_SUMMARY = {
  distance:    5.0,
  totalTime:   '25:18',
  avgPaceKm:   '5:04',
  avgPaceMi:   '8:09',
  isPR:        true,
  prevBest:    '26:02',
  delta:       '-44s',
  splits: [
    { km: 1, time: '5:02' },
    { km: 2, time: '5:07' },
    { km: 3, time: '5:03' },
    { km: 4, time: '5:01' },
    { km: 5, time: '5:05' },
  ],
  calories:    312,
}

const MOCK_RUN_HISTORY = [
  { id: '1', date: 'Apr 18', label: '5K',   time: '25:18', distance: '5.0 km', isPR: true },
  { id: '2', date: 'Apr 15', label: '5K',   time: '26:02', distance: '5.0 km', isPR: false },
  { id: '3', date: 'Apr 12', label: 'Free', time: '32:14', distance: '5.8 km', isPR: false },
]

// ─── Screen router ────────────────────────────────────────────────────────────

export default function WaliRunScreen() {
  const { surfaces } = useWalifitTheme()
  const styles = useMemo(() => createStyles(surfaces), [surfaces])
  const [view, setView]       = useState<RunView>('tab')
  const [selectedMode, setMode] = useState('5K')
  const [paused, setPaused]   = useState(false)

  const finishRun = async () => {
    const workoutId = createClientUuid()
    try {
      await apiMutate({
        method: 'POST',
        path: '/workouts',
        body: {
          id: workoutId,
          name: `${selectedMode} Run`,
          type: 'run',
        },
      })
      await apiMutate({
        method: 'PATCH',
        path: `/workouts/${workoutId}`,
        body: {
          runDistanceM: Math.round(MOCK_SUMMARY.distance * 1000),
          runDurationS: parseDurationSeconds(MOCK_SUMMARY.totalTime),
          runPaceSPerKm: parsePaceSeconds(MOCK_SUMMARY.avgPaceKm),
          runType: selectedMode === 'Free run' ? 'free' : 'preset',
          runDistancePreset: presetForMode(selectedMode),
          runSplitPaces: MOCK_SUMMARY.splits.map((split) => ({
            km: split.km,
            seconds: parsePaceSeconds(split.time),
          })),
        },
      })
      setView('summary')
    } catch (error) {
      Alert.alert('Run not saved', error instanceof Error ? error.message : 'Please try again.')
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {view === 'tab'     && <RunTab      selectedMode={selectedMode} onSelectMode={setMode} onStart={() => setView('prerun')} styles={styles} surfaces={surfaces} />}
      {view === 'prerun'  && <PreRunCheck onBack={() => setView('tab')} onStart={() => setView('active')} mode={selectedMode} styles={styles} surfaces={surfaces} />}
      {view === 'active'  && <ActiveRun   onFinish={finishRun} mode={selectedMode} paused={paused} onPause={() => setPaused(!paused)} styles={styles} surfaces={surfaces} />}
      {view === 'summary' && <RunSummary  onDone={() => setView('tab')} styles={styles} surfaces={surfaces} />}
    </SafeAreaView>
  )
}

function createClientUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = Math.floor(Math.random() * 16)
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8
    return value.toString(16)
  })
}

function parseDurationSeconds(value: string): number {
  const [minutes = '0', seconds = '0'] = value.split(':')
  return Number(minutes) * 60 + Number(seconds)
}

function parsePaceSeconds(value: string): number {
  return parseDurationSeconds(value)
}

function presetForMode(mode: string) {
  switch (mode) {
    case '2K':
      return 'two_k'
    case '5K':
      return 'five_k'
    default:
      return undefined
  }
}

// ─── Run Tab ──────────────────────────────────────────────────────────────────

function RunTab({ selectedMode, onSelectMode, onStart, styles, surfaces }: {
  selectedMode: string; onSelectMode: (m: string) => void; onStart: () => void
  styles: WaliRunStyles; surfaces: SurfaceTokens
}) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>WaliRun</Text>
      <Text style={styles.subtitle}>Track your runs, feed your tree</Text>

      {/* Distance modes */}
      <Text style={styles.sectionLabel}>Distance</Text>
      <View style={styles.modesGrid}>
        {DISTANCE_MODES.map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.modeCard, selectedMode === mode && styles.modeCardActive]}
            onPress={() => onSelectMode(mode)}
            activeOpacity={0.7}
          >
            <Text style={[styles.modeLabel, selectedMode === mode && { color: colors.blue }]}>{mode}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Start button */}
      <TouchableOpacity style={styles.startBtn} onPress={onStart} activeOpacity={0.7}>
        <Play color={colors.primaryFg} size={24} strokeWidth={2} fill={colors.primaryFg} />
        <Text style={styles.startBtnText}>Start {selectedMode}</Text>
      </TouchableOpacity>

      {/* Run history */}
      <Text style={styles.sectionLabel}>Recent runs</Text>
      {MOCK_RUN_HISTORY.map((run) => (
        <TouchableOpacity key={run.id} style={styles.historyCard} activeOpacity={0.7}>
          <View style={styles.historyLeft}>
            <Text style={styles.historyDate}>{run.date}</Text>
            <Text style={styles.historyName}>{run.label} — {run.distance}</Text>
          </View>
          <View style={styles.historyRight}>
            {run.isPR && (
              <View style={[styles.prBadge, { backgroundColor: colors.blue + '18' }]}>
                <Award color={colors.blue} size={11} strokeWidth={2} />
                <Text style={[styles.prBadgeText, { color: colors.blue }]}>PR</Text>
              </View>
            )}
            <Text style={[styles.historyTime, { color: colors.blue }]}>{run.time}</Text>
            <ChevronRight color={surfaces.mutedForeground} size={16} strokeWidth={1.75} />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

// ─── Pre-run Checklist ────────────────────────────────────────────────────────

function PreRunCheck({ onBack, onStart, mode, styles, surfaces }: {
  onBack: () => void; onStart: () => void; mode: string
  styles: WaliRunStyles; surfaces: SurfaceTokens
}) {
  const [gpsStrength] = useState<'strong' | 'weak' | 'none'>('strong')
  const [battery]     = useState(78)

  return (
    <View style={styles.flex}>
      <View style={styles.prerunHeader}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <ArrowLeft color={surfaces.foreground} size={20} strokeWidth={1.75} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Ready to run?</Text>
        <View style={{ width: touchTarget.min }} />
      </View>

      <ScrollView contentContainerStyle={styles.prerunContent}>
        <Text style={styles.prerunMode}>{mode}</Text>

        {/* Checks */}
        <View style={styles.checksList}>
          <CheckRow
            icon={<MapPin color={gpsStrength === 'strong' ? colors.primary : colors.energy} size={20} strokeWidth={1.75} />}
            label="GPS signal"
            status={gpsStrength === 'strong' ? 'Strong signal' : 'Finding signal...'}
            ok={gpsStrength === 'strong'}
            styles={styles}
          />
          <CheckRow
            icon={<Battery color={battery > 20 ? colors.primary : colors.destructive} size={20} strokeWidth={1.75} />}
            label="Battery"
            status={`${battery}% — ${battery > 20 ? 'Good to go' : 'Low battery'}`}
            ok={battery > 20}
            styles={styles}
          />
        </View>

        {/* Screen on warning */}
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Keep screen on during your run for accurate GPS tracking. Your phone will not lock automatically while WaliRun is active.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.startBtn, gpsStrength === 'none' && { opacity: 0.4 }]}
          onPress={gpsStrength !== 'none' ? onStart : undefined}
        >
          <Play color={colors.primaryFg} size={22} strokeWidth={2} fill={colors.primaryFg} />
          <Text style={styles.startBtnText}>Start run</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

// ─── Active Run ───────────────────────────────────────────────────────────────

function ActiveRun({ onFinish, mode, paused, onPause, styles, surfaces }: {
  onFinish: () => void; mode: string; paused: boolean; onPause: () => void
  styles: WaliRunStyles; surfaces: SurfaceTokens
}) {
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const data = MOCK_ACTIVE
  // TODO: expo-keep-awake activate

  return (
    <View style={styles.activeContainer}>
      {/* Header */}
      <View style={styles.activeHeader}>
        <View style={[styles.gpsIndicator, { backgroundColor: colors.primary + '20' }]}>
          <View style={[styles.gpsDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.gpsText, { color: colors.primary }]}>GPS</Text>
        </View>
        <Text style={styles.activeModeLabel}>{mode}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Main stats */}
      <View style={styles.activeStats}>
        <Text style={[styles.distanceLarge, { color: colors.blue }]}>
          {data.distanceKm.toFixed(2)}
        </Text>
        <Text style={styles.distanceUnit}>km</Text>

        <View style={styles.activeStatRow}>
          <View style={styles.activeStatCell}>
            <Text style={styles.activeStatValue}>{data.elapsedTime}</Text>
            <Text style={styles.activeStatLabel}>time</Text>
          </View>
          <View style={styles.activeStatDivider} />
          <View style={styles.activeStatCell}>
            <Text style={styles.activeStatValue}>{data.currentPace}</Text>
            <Text style={styles.activeStatLabel}>pace /km</Text>
          </View>
          <View style={styles.activeStatDivider} />
          <View style={styles.activeStatCell}>
            <Text style={[styles.activeStatValue, { color: surfaces.mutedForeground }]}>{data.avgPace}</Text>
            <Text style={styles.activeStatLabel}>avg pace</Text>
          </View>
        </View>
      </View>

      {/* Splits */}
      <View style={styles.splitsRow}>
        {data.splits.map((split) => (
          <View key={split.km} style={[styles.splitChip, { backgroundColor: colors.blue + '18' }]}>
            <Text style={[styles.splitChipText, { color: colors.blue }]}>KM {split.km}: {split.pace}</Text>
          </View>
        ))}
      </View>

      {/* Map placeholder */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapRoute} />
        <View style={styles.mapDot} />
      </View>

      {/* Controls */}
      <View style={styles.activeControls}>
        <TouchableOpacity style={styles.controlSide} activeOpacity={0.7}>
          <Text style={styles.controlSideText}>Audio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pauseBtn} onPress={onPause} activeOpacity={0.7}>
          {paused
            ? <Play color={colors.primaryFg} size={28} strokeWidth={2} fill={colors.primaryFg} />
            : <Pause color={colors.primaryFg} size={28} strokeWidth={2} />
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlSide} onPress={() => setShowFinishConfirm(true)} activeOpacity={0.7}>
          <Text style={[styles.controlSideText, { color: colors.destructive }]}>Stop</Text>
        </TouchableOpacity>
      </View>

      {/* Finish confirm */}
      <Modal visible={showFinishConfirm} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmSheet}>
            <Text style={styles.confirmTitle}>Finish run?</Text>
            <Text style={styles.confirmDesc}>{data.distanceKm.toFixed(2)}km · {data.elapsedTime}</Text>
            <TouchableOpacity style={styles.confirmFinishBtn} onPress={onFinish}>
              <Square color={colors.primaryFg} size={16} strokeWidth={2} />
              <Text style={styles.confirmFinishBtnText}>Finish run</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setShowFinishConfirm(false)}>
              <Text style={styles.confirmCancelText}>Keep running</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

// ─── Run Summary ──────────────────────────────────────────────────────────────

function RunSummary({ onDone, styles, surfaces }: {
  onDone: () => void
  styles: WaliRunStyles; surfaces: SurfaceTokens
}) {
  const s = MOCK_SUMMARY

  return (
    <ScrollView contentContainerStyle={styles.summaryContent} showsVerticalScrollIndicator={false}>
      {/* PR Banner */}
      {s.isPR && (
        <View style={[styles.prBanner, { backgroundColor: colors.blue }]}>
          <Award color={colors.blueFg} size={20} strokeWidth={2} />
          <Text style={styles.prBannerText}>NEW 5K BEST · {s.delta}</Text>
        </View>
      )}

      {/* Stats */}
      <View style={styles.summaryStatsGrid}>
        <StatCard label="Distance"  value={`${s.distance} km`}  color={colors.blue}    styles={styles} />
        <StatCard label="Time"      value={s.totalTime}          color={surfaces.foreground} styles={styles} />
        <StatCard label="Avg pace"  value={`${s.avgPaceKm}/km`} color={colors.blue}    styles={styles} />
        <StatCard label="Calories"  value={`${s.calories} cal`}  color={colors.energy}  styles={styles} />
      </View>

      {/* Splits */}
      <View style={styles.splitsCard}>
        <Text style={styles.sectionLabel}>Splits</Text>
        {s.splits.map((split, i) => (
          <View key={i} style={[styles.splitRow, i < s.splits.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: surfaces.border }]}>
            <Text style={styles.splitKm}>KM {split.km}</Text>
            <View style={[styles.splitBar, { width: `${(parseFloat(split.time) / 6) * 100}%` as any }]} />
            <Text style={[styles.splitTime, { color: colors.blue }]}>{split.time}</Text>
          </View>
        ))}
      </View>

      {/* Map placeholder */}
      <View style={styles.summaryMapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>Route map</Text>
      </View>

      {/* Actions */}
      <View style={styles.summaryActions}>
        <TouchableOpacity style={styles.shareRunBtn} activeOpacity={0.7}>
          <Share2 color={colors.primaryFg} size={16} strokeWidth={1.75} />
          <Text style={styles.shareRunBtnText}>Share stats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.doneBtn} onPress={onDone}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CheckRow({ icon, label, status, ok, styles }: {
  icon: React.ReactNode; label: string; status: string; ok: boolean
  styles: WaliRunStyles
}) {
  return (
    <View style={styles.checkRow}>
      {icon}
      <View style={styles.flex}>
        <Text style={styles.checkLabel}>{label}</Text>
        <Text style={[styles.checkStatus, { color: ok ? colors.primary : colors.energy }]}>{status}</Text>
      </View>
    </View>
  )
}

function StatCard({ label, value, color, styles }: {
  label: string; value: string; color: string
  styles: WaliRunStyles
}) {
  return (
    <View style={styles.summaryStatCard}>
      <Text style={[styles.summaryStatValue, { color }]}>{value}</Text>
      <Text style={styles.summaryStatLabel}>{label}</Text>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

type WaliRunStyles = ReturnType<typeof createStyles>

function createStyles(s: SurfaceTokens) {
  return StyleSheet.create({
    container:          { flex: 1, backgroundColor: s.background },
    flex:               { flex: 1 },
    content:            { paddingHorizontal: spacing.screen, paddingTop: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.md },
    title:              { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: s.foreground },
    subtitle:           { fontSize: typography.size.sm, color: s.mutedForeground, marginTop: -spacing.sm },
    sectionLabel:       { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: s.mutedForeground },
    modesGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    modeCard:           { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: s.card, borderRadius: radius.full, borderWidth: 0.5, borderColor: s.border, minHeight: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
    modeCardActive:     { borderColor: colors.blue, backgroundColor: colors.blue + '10', borderWidth: 1.5 },
    modeLabel:          { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: s.foreground },
    startBtn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: touchTarget.large, backgroundColor: colors.blue, borderRadius: radius.full },
    startBtnText:       { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.blueFg },
    historyCard:        { flexDirection: 'row', alignItems: 'center', backgroundColor: s.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: s.border, padding: spacing.md },
    historyLeft:        { flex: 1, gap: 3 },
    historyDate:        { fontSize: typography.size.xs, color: s.mutedForeground },
    historyName:        { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: s.foreground },
    historyRight:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    historyTime:        { fontSize: typography.size.base, fontWeight: typography.weight.bold },
    prBadge:            { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: radius.full },
    prBadgeText:        { fontSize: 10, fontWeight: typography.weight.bold },
    prerunHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm, paddingTop: spacing.xl, paddingBottom: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: s.border },
    navTitle:           { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: s.foreground },
    iconBtn:            { width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
    prerunContent:      { paddingHorizontal: spacing.screen, paddingTop: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.md },
    prerunMode:         { fontSize: typography.size['2xl'], fontWeight: typography.weight.extrabold, color: colors.blue, textAlign: 'center' },
    checksList:         { gap: spacing.sm },
    checkRow:           { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: s.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: s.border, padding: spacing.md },
    checkLabel:         { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: s.foreground },
    checkStatus:        { fontSize: typography.size.sm },
    warningBox:         { backgroundColor: colors.energy + '10', borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.energy + '30', padding: spacing.md },
    warningText:        { fontSize: typography.size.sm, color: s.foreground, lineHeight: 20 },
    activeContainer:    { flex: 1, backgroundColor: colors.runBackground },
    activeHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screen, paddingTop: spacing.xl, paddingBottom: spacing.md },
    gpsIndicator:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
    gpsDot:             { width: 7, height: 7, borderRadius: 4 },
    gpsText:            { fontSize: typography.size.xs, fontWeight: typography.weight.bold },
    activeModeLabel:    { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: s.foreground },
    activeStats:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.screen },
    distanceLarge:      { fontSize: 80, fontWeight: typography.weight.extrabold, lineHeight: 88 },
    distanceUnit:       { fontSize: typography.size.xl, color: s.mutedForeground, marginTop: -spacing.sm },
    activeStatRow:      { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: spacing.xl },
    activeStatCell:     { flex: 1, alignItems: 'center', gap: 3 },
    activeStatDivider:  { width: 0.5, height: 40, backgroundColor: s.border },
    activeStatValue:    { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: s.foreground },
    activeStatLabel:    { fontSize: typography.size.xs, color: s.mutedForeground },
    splitsRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.screen, marginBottom: spacing.sm },
    splitChip:          { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
    splitChipText:      { fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
    mapPlaceholder:     { height: 160, backgroundColor: colors.mapSurface, marginHorizontal: spacing.screen, borderRadius: radius.lg, overflow: 'hidden', position: 'relative', marginBottom: spacing.md },
    mapRoute:           { position: 'absolute', top: 40, left: 30, right: 60, height: 3, backgroundColor: colors.blue, borderRadius: 2 },
    mapDot:             { position: 'absolute', bottom: 40, right: 40, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.blue, borderWidth: 2, borderColor: colors.white },
    activeControls:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, paddingTop: spacing.md },
    controlSide:        { width: 60, alignItems: 'center' },
    controlSideText:    { fontSize: typography.size.sm, color: s.mutedForeground },
    pauseBtn:           { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
    confirmOverlay:     { flex: 1, backgroundColor: s.overlay, alignItems: 'center', justifyContent: 'flex-end' },
    confirmSheet:       { width: '100%', backgroundColor: s.card, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxl, alignItems: 'center' },
    confirmTitle:       { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: s.foreground },
    confirmDesc:        { fontSize: typography.size.base, color: s.mutedForeground },
    confirmFinishBtn:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, width: '100%', height: touchTarget.comfortable, backgroundColor: colors.destructive, borderRadius: radius.full, justifyContent: 'center' },
    confirmFinishBtnText:{ fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.white },
    confirmCancelBtn:   { height: touchTarget.comfortable, alignItems: 'center', justifyContent: 'center' },
    confirmCancelText:  { fontSize: typography.size.base, color: s.mutedForeground },
    summaryContent:     { paddingHorizontal: spacing.screen, paddingTop: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    prBanner:           { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, padding: spacing.md },
    prBannerText:       { fontSize: typography.size.base, fontWeight: typography.weight.extrabold, color: colors.blueFg },
    summaryStatsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    summaryStatCard:    { width: '47%', backgroundColor: s.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: s.border, padding: spacing.md, alignItems: 'center', gap: 4 },
    summaryStatValue:   { fontSize: typography.size['2xl'], fontWeight: typography.weight.extrabold },
    summaryStatLabel:   { fontSize: typography.size.xs, color: s.mutedForeground },
    splitsCard:         { backgroundColor: s.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: s.border, padding: spacing.md, gap: spacing.sm },
    splitRow:           { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.md },
    splitKm:            { width: 36, fontSize: typography.size.sm, color: s.mutedForeground },
    splitBar:           { flex: 1, height: 4, backgroundColor: colors.blue + '40', borderRadius: 2 },
    splitTime:          { width: 48, fontSize: typography.size.sm, fontWeight: typography.weight.bold, textAlign: 'right' },
    summaryMapPlaceholder:{ height: 160, backgroundColor: colors.mapSurface, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
    mapPlaceholderText: { fontSize: typography.size.sm, color: s.mutedForeground },
    summaryActions:     { flexDirection: 'row', gap: spacing.sm },
    shareRunBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, height: touchTarget.comfortable, backgroundColor: colors.blue, borderRadius: radius.full },
    shareRunBtnText:    { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.blueFg },
    doneBtn:            { flex: 1, height: touchTarget.comfortable, backgroundColor: s.card, borderRadius: radius.full, borderWidth: 0.5, borderColor: s.border, alignItems: 'center', justifyContent: 'center' },
    doneBtnText:        { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: s.foreground },
  })
}
