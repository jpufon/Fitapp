# waliFit — ArenaScreen.tsx

> `apps/mobile/screens/ArenaScreen.tsx` — copy this file exactly

```typescript
// waliFit — ArenaScreen
// Tab 5: PR Feed · Squads · Leaderboard
// Every post is auto-generated from real training data — no manual posting

import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native'
import { Trophy, Users, TrendingUp, Flame, MessageCircle, Medal, Plus } from 'lucide-react-native'
import { colors, spacing, typography, radius, touchTarget } from '../theme'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_FEED = [
  {
    id: '1', user: 'Sarah M.', initials: 'SM',
    eventType: 'Strength PR', exercise: 'Deadlift',
    value: '140kg', delta: '+5kg', time: '2h ago', reactions: 12, isRun: false,
  },
  {
    id: '2', user: 'Mike T.', initials: 'MT',
    eventType: 'Run PR', exercise: '5K',
    value: '24:31', delta: '-45s', time: '5h ago', reactions: 8, isRun: true,
  },
  {
    id: '3', user: 'Emma K.', initials: 'EK',
    eventType: 'Streak Milestone', exercise: '30-Day Streak',
    value: 'Longest ever', delta: null, time: '1d ago', reactions: 24, isRun: false,
  },
  {
    id: '4', user: 'You', initials: 'ME',
    eventType: 'Workout Complete', exercise: 'Upper Body Strength',
    value: '4,820kg volume', delta: null, time: 'Today', reactions: 5, isRun: false,
  },
]

const MOCK_SQUADS = [
  { id: '1', name: 'Morning Warriors', type: 'Workout Squad', members: 12, activeToday: 8,  forestHealth: 85, rank: 3 },
  { id: '2', name: '5K Crushers',       type: 'Run Club',      members: 8,  activeToday: 5,  forestHealth: 92, rank: 1 },
]

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Sarah M.',  initials: 'SM', score: 2450, streak: 45, isYou: false },
  { rank: 2, name: 'Mike T.',   initials: 'MT', score: 2380, streak: 38, isYou: false },
  { rank: 3, name: 'You',       initials: 'ME', score: 2210, streak: 12, isYou: true  },
  { rank: 4, name: 'Emma K.',   initials: 'EK', score: 2150, streak: 30, isYou: false },
  { rank: 5, name: 'Tom R.',    initials: 'TR', score: 2090, streak: 22, isYou: false },
]

// ─── Screen ───────────────────────────────────────────────────────────────────

type ArenaTab = 'feed' | 'squads' | 'leaderboard'

export default function ArenaScreen() {
  const [activeTab, setActiveTab] = useState<ArenaTab>('feed')

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>The Arena</Text>
        <Text style={styles.subtitle}>Compete and connect</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TabButton icon={Trophy}     label="PR Feed"     active={activeTab === 'feed'}        onPress={() => setActiveTab('feed')}        />
        <TabButton icon={Users}      label="Squads"      active={activeTab === 'squads'}      onPress={() => setActiveTab('squads')}      />
        <TabButton icon={TrendingUp} label="Leaderboard" active={activeTab === 'leaderboard'} onPress={() => setActiveTab('leaderboard')} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'feed'        && <PRFeed />}
        {activeTab === 'squads'      && <SquadsTab />}
        {activeTab === 'leaderboard' && <LeaderboardTab />}
      </ScrollView>
    </View>
  )
}

// ─── PR Feed ──────────────────────────────────────────────────────────────────

function PRFeed() {
  return (
    <View style={styles.tabContent}>
      <View style={styles.feedHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity>
          <Text style={[styles.filterText, { color: colors.primary }]}>Filter</Text>
        </TouchableOpacity>
      </View>

      {MOCK_FEED.map((event) => {
        const accentColor = event.isRun
          ? colors.blue
          : event.eventType === 'Streak Milestone'
          ? colors.energy
          : event.eventType === 'Workout Complete'
          ? colors.mutedForeground
          : colors.primary

        return (
          <View key={event.id} style={styles.feedCard}>
            <View style={styles.feedRow}>
              {/* Avatar */}
              <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>{event.initials}</Text>
              </View>

              {/* Content */}
              <View style={styles.feedContent}>
                <View style={styles.feedMeta}>
                  <View style={styles.feedNameRow}>
                    <Text style={styles.feedUser}>{event.user}</Text>
                    <View style={[styles.eventBadge, { backgroundColor: accentColor + '20' }]}>
                      <Text style={[styles.eventBadgeText, { color: accentColor }]}>{event.eventType}</Text>
                    </View>
                  </View>
                  <Text style={styles.feedTime}>{event.time}</Text>
                </View>

                {/* Stat box */}
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>{event.exercise}</Text>
                  <View style={styles.statBoxValues}>
                    <Text style={[styles.statBoxValue, { color: accentColor }]}>{event.value}</Text>
                    {event.delta && (
                      <Text style={[styles.statBoxDelta, { color: colors.primary }]}>{event.delta}</Text>
                    )}
                  </View>
                </View>

                {/* Reactions */}
                <View style={styles.reactionsRow}>
                  <TouchableOpacity style={styles.reactionBtn}>
                    <Flame color={colors.mutedForeground} size={15} strokeWidth={1.75} />
                    <Text style={styles.reactionCount}>{event.reactions}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.reactionBtn}>
                    <MessageCircle color={colors.mutedForeground} size={15} strokeWidth={1.75} />
                    <Text style={styles.reactionCount}>React</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )
      })}
    </View>
  )
}

// ─── Squads tab ───────────────────────────────────────────────────────────────

function SquadsTab() {
  return (
    <View style={styles.tabContent}>
      <View style={styles.feedHeader}>
        <Text style={styles.sectionTitle}>My Squads</Text>
        <TouchableOpacity style={styles.joinBtn}>
          <Plus color={colors.primaryFg} size={14} strokeWidth={2.5} />
          <Text style={styles.joinBtnText}>Join Squad</Text>
        </TouchableOpacity>
      </View>

      {MOCK_SQUADS.map((squad) => (
        <TouchableOpacity key={squad.id} style={styles.squadCard} activeOpacity={0.7}>
          <View style={styles.squadTop}>
            <View style={styles.squadInfo}>
              <Text style={styles.squadName}>{squad.name}</Text>
              <Text style={styles.squadType}>{squad.type}</Text>
            </View>
            <View style={[styles.rankBadge, { backgroundColor: colors.energy + '18' }]}>
              <Medal color={colors.energy} size={14} strokeWidth={1.75} />
              <Text style={[styles.rankText, { color: colors.energy }]}>#{squad.rank}</Text>
            </View>
          </View>

          <View style={styles.squadStats}>
            <View style={styles.squadStat}>
              <Text style={styles.squadStatLabel}>Members</Text>
              <Text style={styles.squadStatValue}>{squad.members}</Text>
            </View>
            <View style={styles.squadStat}>
              <Text style={styles.squadStatLabel}>Active Today</Text>
              <Text style={[styles.squadStatValue, { color: colors.primary }]}>{squad.activeToday}</Text>
            </View>
            <View style={styles.squadStat}>
              <Text style={styles.squadStatLabel}>Forest Health</Text>
              <Text style={[styles.squadStatValue, { color: colors.primary }]}>{squad.forestHealth}%</Text>
            </View>
          </View>

          {/* Health bar */}
          <View style={styles.healthBarTrack}>
            <View style={[styles.healthBarFill, { width: `${squad.forestHealth}%` as any, backgroundColor: colors.primary }]} />
          </View>
        </TouchableOpacity>
      ))}

      {/* Create squad CTA */}
      <View style={[styles.createSquadCard, { borderColor: colors.primary + '30', backgroundColor: colors.primary + '08' }]}>
        <View style={[styles.createSquadIcon, { backgroundColor: colors.primary + '20' }]}>
          <Users color={colors.primary} size={22} strokeWidth={1.75} />
        </View>
        <View style={styles.createSquadText}>
          <Text style={styles.createSquadTitle}>Create Your Squad</Text>
          <Text style={styles.createSquadSub}>Train together, grow together</Text>
        </View>
      </View>
    </View>
  )
}

// ─── Leaderboard tab ──────────────────────────────────────────────────────────

function LeaderboardTab() {
  const medalColors: Record<number, string> = { 1: '#fbbf24', 2: '#94a3b8', 3: '#c2410c' }

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Squad Leaderboard</Text>
      <Text style={styles.leaderboardSub}>Based on this week's vitality scores</Text>

      {MOCK_LEADERBOARD.map((user) => (
        <View
          key={user.rank}
          style={[
            styles.leaderCard,
            user.isYou && { borderColor: colors.primary, backgroundColor: colors.primary + '06' },
          ]}
        >
          {/* Rank */}
          <View style={styles.rankCell}>
            {user.rank <= 3 ? (
              <Medal color={medalColors[user.rank]} size={22} strokeWidth={1.75} />
            ) : (
              <Text style={styles.rankNumber}>#{user.rank}</Text>
            )}
          </View>

          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{user.initials}</Text>
          </View>

          {/* Name + streak */}
          <View style={styles.leaderInfo}>
            <Text style={[styles.leaderName, user.isYou && { color: colors.primary }]}>{user.name}</Text>
            <Text style={styles.leaderStreak}>{user.streak} day streak</Text>
          </View>

          {/* Score */}
          <View style={styles.scoreCell}>
            <Text style={[styles.scoreValue, { color: colors.primary }]}>{user.score.toLocaleString()}</Text>
            <Text style={styles.scoreLabel}>pts</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabButton({ icon: Icon, label, active, onPress }: {
  icon: React.ElementType; label: string; active: boolean; onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon color={active ? colors.primary : colors.mutedForeground} size={14} strokeWidth={1.75} />
      <Text style={[styles.tabLabel, { color: active ? colors.primary : colors.mutedForeground }]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  header:           { paddingHorizontal: spacing.screen, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  title:            { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.foreground },
  subtitle:         { fontSize: typography.size.sm, color: colors.mutedForeground, marginTop: 2 },
  tabBar:           { flexDirection: 'row', marginHorizontal: spacing.screen, padding: 4, backgroundColor: colors.secondary, borderRadius: radius.xl, marginBottom: spacing.md },
  tab:              { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: radius.lg, minHeight: touchTarget.min },
  tabActive:        { backgroundColor: colors.card },
  tabLabel:         { fontSize: 12, fontWeight: typography.weight.semibold },
  scroll:           { flex: 1 },
  scrollContent:    { paddingBottom: spacing.xxl },
  tabContent:       { paddingHorizontal: spacing.screen, gap: spacing.sm },
  feedHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle:     { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.foreground },
  filterText:       { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  feedCard:         { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md },
  feedRow:          { flexDirection: 'row', gap: spacing.sm },
  avatar:           { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:       { fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  feedContent:      { flex: 1, gap: spacing.sm },
  feedMeta:         { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  feedNameRow:      { gap: 4 },
  feedUser:         { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.foreground },
  eventBadge:       { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  eventBadgeText:   { fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  feedTime:         { fontSize: typography.size.xs, color: colors.mutedForeground },
  statBox:          { backgroundColor: colors.secondary, borderRadius: radius.md, padding: spacing.sm, gap: 3 },
  statBoxLabel:     { fontSize: typography.size.xs, color: colors.mutedForeground },
  statBoxValues:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statBoxValue:     { fontSize: typography.size.xl, fontWeight: typography.weight.bold },
  statBoxDelta:     { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  reactionsRow:     { flexDirection: 'row', gap: spacing.lg },
  reactionBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reactionCount:    { fontSize: typography.size.sm, color: colors.mutedForeground },
  joinBtn:          { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md },
  joinBtnText:      { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.primaryFg },
  squadCard:        { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  squadTop:         { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  squadInfo:        { gap: 3 },
  squadName:        { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.foreground },
  squadType:        { fontSize: typography.size.sm, color: colors.mutedForeground },
  rankBadge:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  rankText:         { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  squadStats:       { flexDirection: 'row' },
  squadStat:        { flex: 1, gap: 3 },
  squadStatLabel:   { fontSize: typography.size.xs, color: colors.mutedForeground },
  squadStatValue:   { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.foreground },
  healthBarTrack:   { height: 6, backgroundColor: colors.muted, borderRadius: radius.full, overflow: 'hidden' },
  healthBarFill:    { height: '100%', borderRadius: radius.full },
  createSquadCard:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, borderWidth: 0.5, padding: spacing.md },
  createSquadIcon:  { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  createSquadText:  { gap: 3 },
  createSquadTitle: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.foreground },
  createSquadSub:   { fontSize: typography.size.sm, color: colors.mutedForeground },
  leaderboardSub:   { fontSize: typography.size.sm, color: colors.mutedForeground, marginTop: -4 },
  leaderCard:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md },
  rankCell:         { width: 28, alignItems: 'center' },
  rankNumber:       { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.mutedForeground },
  leaderInfo:       { flex: 1, gap: 2 },
  leaderName:       { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.foreground },
  leaderStreak:     { fontSize: typography.size.xs, color: colors.mutedForeground },
  scoreCell:        { alignItems: 'flex-end', gap: 1 },
  scoreValue:       { fontSize: typography.size.xl, fontWeight: typography.weight.bold },
  scoreLabel:       { fontSize: typography.size.xs, color: colors.mutedForeground },
})
```
