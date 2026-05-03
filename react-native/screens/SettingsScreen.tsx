// waliFit — SettingsScreen
// All 9 settings screens: Home, Edit Profile, Preferences,
// Notifications, Account, Delete Confirm, Data Export, Legal, About
// Apple App Store: account deletion is a hard requirement

import React, { useMemo, useState } from 'react'
import {
  Alert, Linking, View, Text, TextInput, TouchableOpacity, ScrollView,
  Switch, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ArrowLeft, User, Sliders, Bell, Shield, Info,
  ChevronRight, LogOut, Trash2, Download, Check, AlertTriangle,
} from 'lucide-react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { colors, spacing, typography, radius, touchTarget } from '../theme'
import type { AppearancePreference, SurfaceTokens } from '../theme/surfaceTheme'
import { useWalifitTheme } from '../theme/ThemeProvider'
import type { RootStackParamList } from '../App'
import { apiMutate, apiQuery } from '../lib/api'
import { hasSupabaseConfig, supabase } from '../utils/supabase'

type SettingsView =
  | 'home' | 'profile' | 'preferences' | 'notifications'
  | 'account' | 'delete' | 'export' | 'legal' | 'about'

const MOCK_USER = {
  displayName: 'Marcus T.',
  username:    'marcus_t',
  email:       'marcus@example.com',
  units:       'kg' as 'kg' | 'lbs',
  proteinGoal: 180,
  waterGoal:   2500,
  stepsGoal:   8000,
  restTimer:   90,
  trainingDays: ['Mon', 'Tue', 'Thu', 'Fri'],
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function createSettingsStyles(s: SurfaceTokens) {
  return StyleSheet.create({
    container:          { flex: 1, backgroundColor: s.background },
    flex:               { flex: 1 },
    navBar:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm, paddingTop: spacing.xl, paddingBottom: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: s.border },
    navTitle:           { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: s.foreground },
    iconBtn:            { width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
    content:            { paddingHorizontal: spacing.screen, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
    sectionBlock:       { gap: spacing.xs },
    sectionTitle:       { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: s.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.5 },
    card:               { backgroundColor: s.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: s.border, overflow: 'hidden' },
    settingsRow:        { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, minHeight: touchTarget.comfortable },
    settingsRowBorder:  { borderBottomWidth: 0.5, borderBottomColor: s.border },
    settingsIcon:       { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    settingsText:       { flex: 1, gap: 2 },
    settingsLabel:      { fontSize: typography.size.base, fontWeight: typography.weight.medium, color: s.foreground },
    settingsDesc:       { fontSize: typography.size.sm, color: s.mutedForeground },
    disclaimer:         { backgroundColor: s.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: s.border, borderLeftWidth: 3, borderLeftColor: colors.primary, padding: spacing.md, gap: spacing.xs },
    disclaimerTitle:    { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.primary },
    disclaimerText:     { fontSize: typography.size.xs, color: s.mutedForeground, lineHeight: 18 },
    logoutBtn:          { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
    avatarSection:      { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
    avatarLg:           { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    avatarText:         { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.primaryFg },
    link:               { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
    fieldLabel:         { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: s.mutedForeground },
    fieldInput:         { height: touchTarget.comfortable, backgroundColor: s.card, borderRadius: radius.md, borderWidth: 0.5, borderColor: s.border, paddingHorizontal: spacing.md, fontSize: typography.size.base, color: s.foreground },
    saveBtn:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: touchTarget.comfortable, backgroundColor: colors.primary, borderRadius: radius.full, borderWidth: 0.5, borderColor: 'transparent' },
    saveBtnText:        { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.primaryFg },
    switchRow:          { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
    footNote:           { fontSize: typography.size.xs, color: s.mutedForeground, textAlign: 'center', lineHeight: 18 },
    unitsToggle:        { flexDirection: 'row', backgroundColor: s.secondary, borderRadius: radius.xl, padding: 4, gap: 4 },
    unitOption:         { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg },
    unitOptionActive:   { backgroundColor: s.card, borderWidth: 0.5, borderColor: colors.primary },
    unitOptionText:     { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: s.mutedForeground },
    daysRow:            { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
    dayPill:            { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: s.card, borderRadius: radius.full, borderWidth: 0.5, borderColor: s.border, minHeight: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
    dayPillActive:      { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
    dayPillText:        { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: s.mutedForeground },
    inlineInputRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    inlineInput:        { width: 70, height: 36, backgroundColor: s.muted, borderRadius: radius.sm, paddingHorizontal: spacing.sm, fontSize: typography.size.base, color: s.foreground, textAlign: 'right', borderWidth: 0.5, borderColor: s.border },
    stepsGoalValue:     { fontSize: typography.size.base, color: s.mutedForeground, fontWeight: typography.weight.semibold },
    deleteBtn:          { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.destructive + '08', borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.destructive + '30', padding: spacing.md, minHeight: touchTarget.comfortable },
    warningCard:        { backgroundColor: colors.destructive + '08', borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.destructive + '40', padding: spacing.lg, alignItems: 'center', gap: spacing.sm },
    warningTitle:       { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.destructive },
    warningText:        { fontSize: typography.size.sm, color: s.foreground, textAlign: 'center', lineHeight: 22 },
    deleteInput:        { height: touchTarget.comfortable, backgroundColor: s.card, borderRadius: radius.md, borderWidth: 1, borderColor: s.border, paddingHorizontal: spacing.md, fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.destructive, textAlign: 'center' },
    deleteConfirmBtn:   { height: touchTarget.comfortable, backgroundColor: colors.destructive, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
    deleteConfirmBtnText:{ fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.white },
    cancelBtn:          { height: touchTarget.comfortable, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
    cancelBtnText:      { fontSize: typography.size.base, color: s.mutedForeground },
    exportItem:         { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    exportItemText:     { fontSize: typography.size.sm, color: s.foreground },
    tagline:            { fontSize: typography.size.sm, color: s.mutedForeground, textAlign: 'center' },
  })
}

type SettingsStyles = ReturnType<typeof createSettingsStyles>

export default function SettingsScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Settings'>) {
  const { surfaces, appearance, setAppearance } = useWalifitTheme()
  const styles = useMemo(() => createSettingsStyles(surfaces), [surfaces])
  const onClose = () => navigation.goBack()
  const [view, setView]   = useState<SettingsView>('home')
  const [user, setUser]   = useState(MOCK_USER)

  const back = () => setView('home')
  const saveProfile = async (patch: Partial<typeof MOCK_USER>) => {
    setUser({ ...user, ...patch })
    await apiMutate({
      method: 'PATCH',
      path: '/users/me',
      body: {
        displayName: patch.displayName,
        username: patch.username,
        unitSystem: patch.units,
        proteinTargetG: patch.proteinGoal,
        waterTargetMl: patch.waterGoal,
        stepsGoal: patch.stepsGoal,
        trainingDays: patch.trainingDays?.map(dayToIndex).filter((day) => day >= 0),
      },
    })
    back()
  }

  const deleteAccount = async () => {
    try {
      await apiMutate({ method: 'DELETE', path: '/users/me' })
      if (hasSupabaseConfig && supabase) {
        await supabase.auth.signOut()
      }
      navigation.reset({ index: 0, routes: [{ name: 'Auth' }] })
    } catch (error) {
      Alert.alert('Could not delete account', error instanceof Error ? error.message : 'Please try again.')
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {view === 'home'          && <SettingsHome    user={user} onNav={setView} onClose={onClose} styles={styles} surfaces={surfaces} />}
      {view === 'profile'       && <EditProfile     user={user} onSave={u => { void saveProfile(u).catch(showSaveError) }} onBack={back} styles={styles} surfaces={surfaces} />}
      {view === 'preferences'   && <Preferences     user={user} onSave={u => { void saveProfile(u).catch(showSaveError) }} onBack={back} styles={styles} surfaces={surfaces} appearance={appearance} setAppearance={setAppearance} />}
      {view === 'notifications' && <NotificationPrefs onBack={back} styles={styles} surfaces={surfaces} />}
      {view === 'account'       && <AccountManagement onNav={setView} onBack={back} styles={styles} surfaces={surfaces} />}
      {view === 'delete'        && <DeleteAccount   onConfirm={deleteAccount} onBack={back} styles={styles} surfaces={surfaces} />}
      {view === 'export'        && <DataExport      onBack={back} styles={styles} surfaces={surfaces} />}
      {view === 'legal'         && <LegalPrivacy    onBack={back} styles={styles} surfaces={surfaces} />}
      {view === 'about'         && <About           onBack={back} styles={styles} surfaces={surfaces} />}
    </SafeAreaView>
  )
}

// ─── Settings Home ────────────────────────────────────────────────────────────

function SettingsHome({ user, onNav, onClose, styles, surfaces }: {
  user: typeof MOCK_USER; onNav: (v: SettingsView) => void; onClose: () => void
  styles: SettingsStyles; surfaces: SurfaceTokens
}) {
  const SECTIONS = [
    {
      title: 'Your account',
      items: [
        { id: 'profile',       icon: User,    label: 'Edit Profile',          desc: user.displayName },
        { id: 'preferences',   icon: Sliders, label: 'Training Preferences',  desc: `${user.units} · ${user.proteinGoal}g protein` },
        { id: 'notifications', icon: Bell,    label: 'Notifications',          desc: 'Manage alerts' },
      ]
    },
    {
      title: 'Account & data',
      items: [
        { id: 'account', icon: Shield,   label: 'Account Management', desc: user.email },
        { id: 'export',  icon: Download, label: 'Export my data',      desc: 'Download JSON' },
      ]
    },
    {
      title: 'Legal',
      items: [
        { id: 'legal', icon: Shield, label: 'Privacy & Legal', desc: 'Terms, privacy, AI' },
        { id: 'about', icon: Info,   label: 'About waliFit',   desc: 'v1.0.0' },
      ]
    },
  ]

  return (
    <View style={styles.flex}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
          <ArrowLeft color={surfaces.foreground} size={20} strokeWidth={1.75} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Settings</Text>
        <View style={{ width: touchTarget.min }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.settingsRow, i < section.items.length - 1 && styles.settingsRowBorder]}
                  onPress={() => onNav(item.id as SettingsView)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.settingsIcon, { backgroundColor: colors.primary + '15' }]}>
                    <item.icon color={colors.primary} size={18} strokeWidth={1.75} />
                  </View>
                  <View style={styles.settingsText}>
                    <Text style={styles.settingsLabel}>{item.label}</Text>
                    <Text style={styles.settingsDesc}>{item.desc}</Text>
                  </View>
                  <ChevronRight color={surfaces.mutedForeground} size={16} strokeWidth={1.75} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Log out */}
        <TouchableOpacity style={[styles.card, styles.logoutBtn]} activeOpacity={0.7}>
          <LogOut color={colors.destructive} size={18} strokeWidth={1.75} />
          <Text style={[styles.settingsLabel, { color: colors.destructive }]}>Log out</Text>
        </TouchableOpacity>

        {/* AI disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>Wali AI Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            Wali AI is a training assistant. It does not provide medical advice. Results vary.
            Consult a qualified professional before making significant changes to your training or diet.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

// ─── Edit Profile ─────────────────────────────────────────────────────────────

function EditProfile({ user, onSave, onBack, styles, surfaces }: {
  user: typeof MOCK_USER; onSave: (u: Partial<typeof MOCK_USER>) => void; onBack: () => void
  styles: SettingsStyles; surfaces: SurfaceTokens
}) {
  const [name, setName]     = useState(user.displayName)
  const [username, setUser] = useState(user.username)

  return (
    <View style={styles.flex}>
      <SubNavBar title="Edit Profile" onBack={onBack} styles={styles} surfaces={surfaces} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarLg}>
            <Text style={styles.avatarText}>{name.slice(0, 2).toUpperCase()}</Text>
          </View>
          <TouchableOpacity><Text style={[styles.link, { color: colors.primary }]}>Change photo</Text></TouchableOpacity>
        </View>
        <FormField label="Display name"  value={name}     onChange={setName}  surfaces={surfaces} styles={styles} />
        <FormField label="Username"      value={username} onChange={setUser}  surfaces={surfaces} styles={styles} />
        <TouchableOpacity style={styles.saveBtn} onPress={() => onSave({ displayName: name, username })}>
          <Text style={styles.saveBtnText}>Save changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

// ─── Preferences ──────────────────────────────────────────────────────────────

function Preferences({ user, onSave, onBack, styles, surfaces, appearance, setAppearance }: {
  user: typeof MOCK_USER; onSave: (u: Partial<typeof MOCK_USER>) => void; onBack: () => void
  styles: SettingsStyles; surfaces: SurfaceTokens
  appearance: AppearancePreference
  setAppearance: (v: AppearancePreference) => void
}) {
  const [units, setUnits]   = useState<'kg' | 'lbs'>(user.units)
  const [protein, setProtein] = useState(String(user.proteinGoal))
  const [water, setWater]   = useState(String(user.waterGoal))
  const [trainingDays, setTrainingDays] = useState<string[]>(user.trainingDays)

  const toggleDay = (day: string) =>
    setTrainingDays(d => d.includes(day) ? d.filter(x => x !== day) : [...d, day])

  return (
    <View style={styles.flex}>
      <SubNavBar title="Preferences" onBack={onBack} styles={styles} surfaces={surfaces} />
      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.sectionTitle}>Appearance</Text>
        <Text style={[styles.settingsDesc, { paddingHorizontal: 0, marginBottom: spacing.xs }]}>
          Workout and Analytics screens can switch the shell automatically (see docs/waliFit_Theme_Precedence.md).
        </Text>
        <View style={styles.unitsToggle}>
          {(['dark', 'light', 'system'] as const).map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.unitOption, appearance === opt && styles.unitOptionActive]}
              onPress={() => setAppearance(opt)}
              activeOpacity={0.7}
            >
              <Text style={[styles.unitOptionText, appearance === opt && { color: colors.primary }]}>
                {opt === 'system' ? 'System' : opt === 'dark' ? 'Dark' : 'Light'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Units</Text>
        <View style={styles.unitsToggle}>
          {(['kg', 'lbs'] as const).map(u => (
            <TouchableOpacity
              key={u} style={[styles.unitOption, units === u && styles.unitOptionActive]}
              onPress={() => setUnits(u)} activeOpacity={0.7}
            >
              <Text style={[styles.unitOptionText, units === u && { color: colors.primary }]}>{u.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Daily targets</Text>
        <View style={styles.card}>
          <FormRowInline label="Protein goal"  value={protein} onChange={setProtein} unit="g"       styles={styles} />
          <FormRowInline label="Water goal"    value={water}   onChange={setWater}   unit="ml"      styles={styles} />
          <View style={[styles.settingsRow, styles.settingsRowBorder]}>
            <View style={styles.settingsText}>
              <Text style={styles.settingsLabel}>Steps goal</Text>
              <Text style={styles.settingsDesc}>Set automatically from your step goal in Health settings.</Text>
            </View>
            <Text style={styles.stepsGoalValue}>{user.stepsGoal.toLocaleString()}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Training days</Text>
        <View style={styles.daysRow}>
          {DAYS.map(day => (
            <TouchableOpacity
              key={day}
              style={[styles.dayPill, trainingDays.includes(day) && styles.dayPillActive]}
              onPress={() => toggleDay(day)} activeOpacity={0.7}
            >
              <Text style={[styles.dayPillText, trainingDays.includes(day) && { color: colors.primary }]}>{day}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={() => onSave({ units, proteinGoal: Number.parseInt(protein, 10), waterGoal: Number.parseInt(water, 10), stepsGoal: user.stepsGoal, trainingDays })}>
          <Text style={styles.saveBtnText}>Save preferences</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

// ─── Notifications ────────────────────────────────────────────────────────────

function NotificationPrefs({ onBack, styles, surfaces }: { onBack: () => void; styles: SettingsStyles; surfaces: SurfaceTokens }) {
  const [prefs, setPrefs] = useState({
    workoutReminder: true,
    streakAlert:     true,
    hydrationNudge:  true,
    squadActivity:   true,
    sessionReminder: true,
    prCelebration:   true,
  })
  const toggle = (key: keyof typeof prefs) => setPrefs(p => ({ ...p, [key]: !p[key] }))

  const items = [
    { key: 'workoutReminder', label: 'Workout reminders',  desc: 'On your scheduled training days' },
    { key: 'streakAlert',     label: 'Streak at risk',     desc: 'Evening reminder if goal not hit' },
    { key: 'hydrationNudge',  label: 'Hydration nudge',    desc: 'Mid-day if water goal not met' },
    { key: 'squadActivity',   label: 'Squad activity',     desc: 'PRs, reactions, friend requests' },
    { key: 'sessionReminder', label: 'Session reminders',  desc: '60 min before accepted sessions' },
    { key: 'prCelebration',   label: 'PR celebrations',    desc: 'When you hit a new personal best' },
  ]

  return (
    <View style={styles.flex}>
      <SubNavBar title="Notifications" onBack={onBack} styles={styles} surfaces={surfaces} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {items.map((item, i) => (
            <View key={item.key} style={[styles.switchRow, i < items.length - 1 && styles.settingsRowBorder]}>
              <View style={styles.settingsText}>
                <Text style={styles.settingsLabel}>{item.label}</Text>
                <Text style={styles.settingsDesc}>{item.desc}</Text>
              </View>
              <Switch
                value={prefs[item.key as keyof typeof prefs]}
                onValueChange={() => toggle(item.key as keyof typeof prefs)}
                trackColor={{ false: surfaces.muted, true: colors.primary }}
                thumbColor={surfaces.foreground}
              />
            </View>
          ))}
        </View>
        <Text style={styles.footNote}>Notification permission requested after your first completed workout — never at app launch.</Text>
      </ScrollView>
    </View>
  )
}

// ─── Account Management ───────────────────────────────────────────────────────

function AccountManagement({ onNav, onBack, styles, surfaces }: { onNav: (v: SettingsView) => void; onBack: () => void; styles: SettingsStyles; surfaces: SurfaceTokens }) {
  return (
    <View style={styles.flex}>
      <SubNavBar title="Account" onBack={onBack} styles={styles} surfaces={surfaces} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <SettingsLink label="Change email"    desc="Update your login email"  onPress={() => {}} styles={styles} surfaces={surfaces} />
          <SettingsLink label="Change password" desc="Update your password"     onPress={() => {}} styles={styles} surfaces={surfaces} last />
        </View>
        <View style={styles.card}>
          <SettingsLink label="Export my data" desc="Download all your data as JSON" onPress={() => onNav('export')} styles={styles} surfaces={surfaces} last />
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onNav('delete')} activeOpacity={0.7}>
          <Trash2 color={colors.destructive} size={16} strokeWidth={1.75} />
          <Text style={[styles.settingsLabel, { color: colors.destructive }]}>Delete account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

// ─── Delete Account ───────────────────────────────────────────────────────────

function DeleteAccount({ onConfirm, onBack, styles, surfaces }: { onConfirm: () => void; onBack: () => void; styles: SettingsStyles; surfaces: SurfaceTokens }) {
  const [typed, setTyped] = useState('')
  const confirmed = typed === 'DELETE'

  return (
    <View style={styles.flex}>
      <SubNavBar title="Delete account" onBack={onBack} styles={styles} surfaces={surfaces} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.warningCard]}>
          <AlertTriangle color={colors.destructive} size={28} strokeWidth={1.75} />
          <Text style={styles.warningTitle}>This cannot be undone</Text>
          <Text style={styles.warningText}>
            All your workouts, runs, PRs, and squad history will be permanently deleted after 30 days.
            Your account will be deactivated immediately.
          </Text>
        </View>
        <Text style={styles.sectionTitle}>Type DELETE to confirm</Text>
        <TextInput
          style={[styles.deleteInput, confirmed && { borderColor: colors.destructive }]}
          value={typed}
          onChangeText={setTyped}
          placeholder="Type DELETE"
          placeholderTextColor={surfaces.mutedForeground}
          autoCapitalize="characters"
        />
        <TouchableOpacity
          style={[styles.deleteConfirmBtn, !confirmed && { opacity: 0.4 }]}
          onPress={confirmed ? onConfirm : undefined}
          activeOpacity={confirmed ? 0.7 : 1}
        >
          <Text style={styles.deleteConfirmBtnText}>Delete my account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

// ─── Data Export ──────────────────────────────────────────────────────────────

function DataExport({ onBack, styles, surfaces }: { onBack: () => void; styles: SettingsStyles; surfaces: SurfaceTokens }) {
  const [exported, setExported] = useState(false)
  const [loading, setLoading] = useState(false)
  const exportData = async () => {
    setLoading(true)
    try {
      await apiQuery('/users/me/export')
      setExported(true)
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <View style={styles.flex}>
      <SubNavBar title="Export data" onBack={onBack} styles={styles} surfaces={surfaces} />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.settingsLabel}>Your export will include:</Text>
          {['All workout logs and set history', 'All run sessions and GPS data', 'Nutrition logs (protein, hydration)', 'Vitality scores and streak history', 'Profile and preference settings'].map(item => (
            <View key={item} style={styles.exportItem}>
              <Check color={colors.primary} size={14} strokeWidth={2.5} />
              <Text style={styles.exportItemText}>{item}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={[styles.saveBtn, exported && { backgroundColor: surfaces.card, borderColor: colors.primary }]} onPress={exportData}>
          <Download color={exported ? colors.primary : colors.primaryFg} size={16} strokeWidth={1.75} />
          <Text style={[styles.saveBtnText, exported && { color: colors.primary }]}>
            {loading ? 'Preparing export...' : exported ? 'Export requested' : 'Export my data'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── Legal & Privacy ──────────────────────────────────────────────────────────

function LegalPrivacy({ onBack, styles, surfaces }: { onBack: () => void; styles: SettingsStyles; surfaces: SurfaceTokens }) {
  const [aiOptOut, setAiOptOut] = useState(false)
  const updateOptOut = (value: boolean) => {
    setAiOptOut(value)
    void apiMutate({
      method: 'PATCH',
      path: '/users/me',
      body: { aiTrainingOptOut: value },
    }).catch(showSaveError)
  }
  return (
    <View style={styles.flex}>
      <SubNavBar title="Privacy & Legal" onBack={onBack} styles={styles} surfaces={surfaces} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <SettingsLink label="Privacy Policy"    desc="How we handle your data"        onPress={() => { void Linking.openURL('https://walifit.app/privacy') }} styles={styles} surfaces={surfaces} />
          <SettingsLink label="Terms of Service"  desc="Rules and AI disclaimer"        onPress={() => { void Linking.openURL('https://walifit.app/terms') }} styles={styles} surfaces={surfaces} last />
        </View>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.settingsText}>
              <Text style={styles.settingsLabel}>Opt out of AI training</Text>
              <Text style={styles.settingsDesc}>Your data will not be used to improve AI models</Text>
            </View>
            <Switch value={aiOptOut} onValueChange={updateOptOut}
              trackColor={{ false: surfaces.muted, true: colors.primary }}
              thumbColor={surfaces.foreground}
            />
          </View>
        </View>
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>Wali AI Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            Wali AI is a training assistant only. It does not provide medical, nutritional, or clinical advice.
            Always consult a qualified professional for health decisions. Assumption of risk applies to all training advice.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

function dayToIndex(day: string): number {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day)
}

function showSaveError(error: unknown) {
  Alert.alert('Save failed', error instanceof Error ? error.message : 'Please try again.')
}

// ─── About ────────────────────────────────────────────────────────────────────

function About({ onBack, styles, surfaces }: { onBack: () => void; styles: SettingsStyles; surfaces: SurfaceTokens }) {
  return (
    <View style={styles.flex}>
      <SubNavBar title="About" onBack={onBack} styles={styles} surfaces={surfaces} />
      <View style={styles.content}>
        <View style={styles.card}>
          <InfoRow label="Version"     value="1.0.0" styles={styles} />
          <InfoRow label="Build"       value="2026.04.20" styles={styles} />
          <InfoRow label="Support"     value="support@walifit.app" styles={styles} />
          <InfoRow label="Licenses"    value="Open source" styles={styles} last />
        </View>
        <Text style={styles.tagline}>Build the loop. Grow the tree. Compete with the world.</Text>
      </View>
    </View>
  )
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

function SubNavBar({ title, onBack, styles, surfaces }: { title: string; onBack: () => void; styles: SettingsStyles; surfaces: SurfaceTokens }) {
  return (
    <View style={styles.navBar}>
      <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
        <ArrowLeft color={surfaces.foreground} size={20} strokeWidth={1.75} />
      </TouchableOpacity>
      <Text style={styles.navTitle}>{title}</Text>
      <View style={{ width: touchTarget.min }} />
    </View>
  )
}

function FormField({ label, value, onChange, surfaces, styles }: { label: string; value: string; onChange: (v: string) => void; surfaces: SurfaceTokens; styles: SettingsStyles }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.fieldInput} value={value} onChangeText={onChange} placeholderTextColor={surfaces.mutedForeground} />
    </View>
  )
}

function FormRowInline({ label, value, onChange, unit, styles }: { label: string; value: string; onChange: (v: string) => void; unit: string; styles: SettingsStyles }) {
  return (
    <View style={[styles.settingsRow, styles.settingsRowBorder]}>
      <Text style={styles.settingsLabel}>{label}</Text>
      <View style={styles.inlineInputRow}>
        <TextInput style={styles.inlineInput} value={value} onChangeText={onChange} keyboardType="number-pad" />
        <Text style={styles.settingsDesc}>{unit}</Text>
      </View>
    </View>
  )
}

function SettingsLink({ label, desc, onPress, last, styles, surfaces }: { label: string; desc: string; onPress: () => void; last?: boolean; styles: SettingsStyles; surfaces: SurfaceTokens }) {
  return (
    <TouchableOpacity style={[styles.settingsRow, !last && styles.settingsRowBorder]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingsText}>
        <Text style={styles.settingsLabel}>{label}</Text>
        <Text style={styles.settingsDesc}>{desc}</Text>
      </View>
      <ChevronRight color={surfaces.mutedForeground} size={16} strokeWidth={1.75} />
    </TouchableOpacity>
  )
}

function InfoRow({ label, value, last, styles }: { label: string; value: string; last?: boolean; styles: SettingsStyles }) {
  return (
    <View style={[styles.settingsRow, !last && styles.settingsRowBorder]}>
      <Text style={styles.settingsLabel}>{label}</Text>
      <Text style={styles.settingsDesc}>{value}</Text>
    </View>
  )
}
