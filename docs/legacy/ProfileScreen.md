# waliFit — ProfileScreen.tsx

> `apps/mobile/screens/ProfileScreen.tsx` — copy this file exactly

```typescript
// waliFit — ProfileScreen (Coach tab renamed in V1 Brief, this is profile/settings)
// NOTE: In the bottom nav this tab is reached via Settings from Home.
// The Coach tab (tab 4) is the Wali AI screen.
// This screen: user profile, stats, settings navigation, logout

import React from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native'
import {
  Settings, TrendingUp, Award, Bell, User,
  Shield, LogOut, ChevronRight, Bot,
} from 'lucide-react-native'
import { colors, spacing, typography, radius, touchTarget } from '../theme'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_USER = {
  displayName: 'Alex Rivera',
  username:    '@alexrivera',
  email:       'alex@example.com',
  memberSince: 'March 2026',
  initials:    'AR',
}

const MOCK_STATS = [
  { label: 'Total Workouts', value: '47',  color: colors.blue    },
  { label: 'Current Streak', value: '12',  color: colors.energy  },
  { label: 'PRs This Month', value: '8',   color: colors.primary },
]

const SETTINGS_ITEMS = [
  {
    id: 'coach',
    icon: Bot,
    label: 'Chat with Wali AI',
    description: 'Get personalised coaching',
    color: colors.purple,
  },
  {
    id: 'analytics',
    icon: TrendingUp,
    label: 'Progress & Analytics',
    description: 'View your stats and trends',
    color: colors.blue,
  },
  {
    id: 'notifications',
    icon: Bell,
    label: 'Notifications',
    description: 'Manage preferences',
    color: colors.energy,
  },
  {
    id: 'account',
    icon: User,
    label: 'Account Settings',
    description: 'Profile, units, targets',
    color: colors.mutedForeground,
  },
  {
    id: 'privacy',
    icon: Shield,
    label: 'Privacy & Legal',
    description: 'Terms, privacy, AI disclosure',
    color: colors.mutedForeground,
  },
]

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn} accessibilityLabel="Settings">
            <Settings color={colors.foreground} size={20} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>

        {/* User card */}
        <View style={[styles.userCard, { borderColor: colors.primary + '30', backgroundColor: colors.primary + '08' }]}>
          {/* Avatar + info */}
          <View style={styles.userRow}>
            <View style={[styles.avatarLg, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{MOCK_USER.initials}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{MOCK_USER.displayName}</Text>
              <Text style={styles.userHandle}>{MOCK_USER.username}</Text>
              <Text style={styles.userMember}>Member since {MOCK_USER.memberSince}</Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {MOCK_STATS.map((stat) => (
              <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card + 'CC' }]}>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings list */}
        <View style={styles.settingsSection}>
          {SETTINGS_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.settingsRow,
                i < SETTINGS_ITEMS.length - 1 && styles.settingsRowBorder,
              ]}
              activeOpacity={0.7}
            >
              <View style={[styles.settingsIcon, { backgroundColor: item.color + '18' }]}>
                <item.icon color={item.color} size={20} strokeWidth={1.75} />
              </View>
              <View style={styles.settingsText}>
                <Text style={styles.settingsLabel}>{item.label}</Text>
                <Text style={styles.settingsDesc}>{item.description}</Text>
              </View>
              <ChevronRight color={colors.mutedForeground} size={18} strokeWidth={1.75} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.settingsSection, styles.logoutBtn]} activeOpacity={0.7}>
          <View style={[styles.settingsIcon, { backgroundColor: colors.destructive + '18' }]}>
            <LogOut color={colors.destructive} size={20} strokeWidth={1.75} />
          </View>
          <View style={styles.settingsText}>
            <Text style={[styles.settingsLabel, { color: colors.destructive }]}>Log Out</Text>
            <Text style={styles.settingsDesc}>Sign out of your account</Text>
          </View>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>waliFit v1.0.0</Text>
          <Text style={styles.footerTagline}>Build the loop. Grow the tree. Compete with the world.</Text>
        </View>
      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  scroll:           { flex: 1 },
  scrollContent:    { paddingHorizontal: spacing.screen, paddingTop: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.md },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:            { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.foreground },
  settingsBtn:      { width: touchTarget.min, height: touchTarget.min, borderRadius: radius.full, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  userCard:         { borderRadius: radius.xl, borderWidth: 0.5, padding: spacing.md, gap: spacing.md },
  userRow:          { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarLg:         { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:       { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.primaryFg },
  userInfo:         { flex: 1, gap: 3 },
  userName:         { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.foreground },
  userHandle:       { fontSize: typography.size.sm, color: colors.mutedForeground },
  userMember:       { fontSize: typography.size.xs, color: colors.mutedForeground },
  statsRow:         { flexDirection: 'row', gap: spacing.sm },
  statCard:         { flex: 1, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', gap: 3 },
  statValue:        { fontSize: typography.size.xl, fontWeight: typography.weight.bold },
  statLabel:        { fontSize: 10, color: colors.mutedForeground, textAlign: 'center', lineHeight: 13 },
  settingsSection:  { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, overflow: 'hidden' },
  settingsRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, minHeight: touchTarget.comfortable },
  settingsRowBorder:{ borderBottomWidth: 0.5, borderBottomColor: colors.border },
  settingsIcon:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  settingsText:     { flex: 1, gap: 2 },
  settingsLabel:    { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground },
  settingsDesc:     { fontSize: typography.size.sm, color: colors.mutedForeground },
  logoutBtn:        { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  footer:           { alignItems: 'center', gap: spacing.xs, paddingTop: spacing.md },
  footerText:       { fontSize: typography.size.xs, color: colors.mutedForeground },
  footerTagline:    { fontSize: typography.size.xs, color: colors.mutedForeground, textAlign: 'center' },
})
```
