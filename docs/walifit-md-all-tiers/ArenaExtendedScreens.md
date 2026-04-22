# waliFit — ArenaExtendedScreens

**Destination:** `apps/mobile/screens/ArenaExtendedScreens.tsx`

---

```tsx
// waliFit — ArenaExtendedScreens
// Missing Arena screens: Friends, Add Friend, Friend Profile,
// Group Sessions, Create Session, Challenges, Badges, DMs

import React, { useState } from 'react'
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Modal,
} from 'react-native'
import {
  UserPlus, MessageCircle, Trophy, Clock, Users, ChevronRight,
  Search, Lock, Award, Zap, Check, X, Send,
} from 'lucide-react-native'
import { colors, spacing, typography, radius, touchTarget } from '../theme'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_FRIENDS = [
  { id: '1', name: 'Sarah M.',  initials: 'SM', streak: 45, compatibility: 91, mutual: true  },
  { id: '2', name: 'Mike T.',   initials: 'MT', streak: 38, compatibility: 87, mutual: true  },
  { id: '3', name: 'Emma K.',   initials: 'EK', streak: 30, compatibility: 79, mutual: true  },
  { id: '4', name: 'Tom R.',    initials: 'TR', streak: 22, compatibility: 74, mutual: false },
]

const MOCK_FRIEND_REQUESTS = [
  { id: '5', name: 'Alex P.',   initials: 'AP', mutualFriends: 3 },
]

const MOCK_CHALLENGES = [
  { id: '1', type: 'Volume',    title: '50,000kg Squad Volume',   days: 3,  participants: 5, userRank: 2, leader: 'Sarah M.',  active: true  },
  { id: '2', type: 'Streak',    title: '7-Day Consistency',       days: 5,  participants: 4, userRank: 1, leader: 'You',        active: true  },
  { id: '3', type: 'Run',       title: 'Fastest 5K this week',    days: 2,  participants: 6, userRank: 3, leader: 'Mike T.',    active: true  },
  { id: '4', type: 'Volume',    title: 'March Volume King',       days: -1, participants: 8, userRank: 2, leader: 'Emma K.',    active: false },
]

const MOCK_BADGES = [
  { id: '1', name: 'First Blood',    category: 'Strength',    rarity: 'Common',    earned: true,  desc: 'Log your first workout'            },
  { id: '2', name: 'Century Club',   category: 'Strength',    rarity: 'Rare',      earned: true,  desc: 'Lift 100kg on any exercise'        },
  { id: '3', name: 'Beast Mode',     category: 'Strength',    rarity: 'Epic',      earned: false, desc: '10,000kg volume in one session'    },
  { id: '4', name: 'Iron Will',      category: 'Consistency', rarity: 'Rare',      earned: true,  desc: '30-day streak'                     },
  { id: '5', name: 'Unbroken',       category: 'Consistency', rarity: 'Legendary', earned: false, desc: '100-day streak'                    },
  { id: '6', name: 'First Mile',     category: 'Running',     rarity: 'Common',    earned: true,  desc: 'Complete first tracked run'        },
  { id: '7', name: 'Sub-25 Club',    category: 'Running',     rarity: 'Rare',      earned: true,  desc: '5K under 25 minutes'               },
  { id: '8', name: 'Hype Machine',   category: 'Social',      rarity: 'Rare',      earned: false, desc: 'Give 100 reactions to others'      },
]

const MOCK_SESSIONS = [
  { id: '1', name: 'Sunday Grind', workout: 'Push Day B', date: 'Sun Apr 21 · 10:00am', members: 4, started: 3, ghostMode: true,  status: 'active'  },
  { id: '2', name: 'Morning Pull', workout: 'Pull Day A', date: 'Mon Apr 22 · 7:00am',  members: 3, started: 0, ghostMode: false, status: 'upcoming' },
]

const MOCK_DM_THREADS = [
  { id: '1', name: 'Sarah M.', initials: 'SM', lastMsg: 'Good luck on the challenge!', time: '2h ago', unread: 2 },
  { id: '2', name: 'Mike T.',  initials: 'MT', lastMsg: 'That PR was insane 🔥',        time: '1d ago', unread: 0 },
]

// ─── Friends Screen ───────────────────────────────────────────────────────────

export function FriendsScreen({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState('')
  const [showAddFriend, setShowAddFriend] = useState(false)

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <ChevronRight color={colors.foreground} size={20} strokeWidth={1.75} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Friends</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowAddFriend(true)}>
          <UserPlus color={colors.primary} size={20} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Search */}
        <View style={styles.searchRow}>
          <Search color={colors.mutedForeground} size={16} strokeWidth={1.75} />
          <TextInput style={styles.searchInput} value={query} onChangeText={setQuery}
            placeholder="Search friends" placeholderTextColor={colors.mutedForeground} />
        </View>

        {/* Pending requests */}
        {MOCK_FRIEND_REQUESTS.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Requests ({MOCK_FRIEND_REQUESTS.length})</Text>
            {MOCK_FRIEND_REQUESTS.map(req => (
              <View key={req.id} style={styles.requestCard}>
                <View style={[styles.avatar, { backgroundColor: colors.purple + '20' }]}>
                  <Text style={[styles.avatarText, { color: colors.purple }]}>{req.initials}</Text>
                </View>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{req.name}</Text>
                  <Text style={styles.friendSub}>{req.mutualFriends} mutual friends</Text>
                </View>
                <View style={styles.requestBtns}>
                  <TouchableOpacity style={styles.declineBtn}>
                    <X color={colors.destructive} size={16} strokeWidth={2} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.acceptBtn}>
                    <Check color={colors.primaryFg} size={16} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Friends list */}
        <Text style={styles.sectionLabel}>Friends ({MOCK_FRIENDS.filter(f => f.mutual).length})</Text>
        {MOCK_FRIENDS.map(friend => (
          <TouchableOpacity key={friend.id} style={styles.friendCard} activeOpacity={0.7}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{friend.initials}</Text>
            </View>
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{friend.name}</Text>
              <View style={styles.friendMeta}>
                <Text style={styles.friendSub}>{friend.streak} day streak</Text>
                <View style={[styles.compatBadge, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.compatText, { color: colors.primary }]}>{friend.compatibility}% match</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.dmBtn}>
              <MessageCircle color={colors.primary} size={18} strokeWidth={1.75} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add Friend Modal */}
      <Modal visible={showAddFriend} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.navTitle}>Add friend</Text>
              <TouchableOpacity style={styles.iconBtn} onPress={() => setShowAddFriend(false)}>
                <X color={colors.foreground} size={20} strokeWidth={1.75} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchRow}>
              <Search color={colors.mutedForeground} size={16} strokeWidth={1.75} />
              <TextInput style={styles.searchInput} placeholder="Search by username" placeholderTextColor={colors.mutedForeground} autoFocus />
            </View>
            <Text style={styles.sectionLabel}>Or share your invite link</Text>
            <TouchableOpacity style={styles.inviteLinkBtn}>
              <Text style={[styles.sectionLabel, { color: colors.primary }]}>Copy invite link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

// ─── Challenges Screen ────────────────────────────────────────────────────────

export function ChallengesScreen({ onBack }: { onBack: () => void }) {
  const active   = MOCK_CHALLENGES.filter(c => c.active)
  const past     = MOCK_CHALLENGES.filter(c => !c.active)

  const typeColor: Record<string, string> = {
    Volume: colors.primary, Streak: colors.energy, Run: colors.blue, PR: colors.purple,
  }

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <ChevronRight color={colors.foreground} size={20} strokeWidth={1.75} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Challenges</Text>
        <View style={{ width: touchTarget.min }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Active ({active.length})</Text>
        {active.map(c => (
          <View key={c.id} style={styles.challengeCard}>
            <View style={styles.challengeTop}>
              <View style={[styles.challengeTypeBadge, { backgroundColor: typeColor[c.type] + '18' }]}>
                <Text style={[styles.challengeTypeTxt, { color: typeColor[c.type] }]}>{c.type}</Text>
              </View>
              <View style={styles.timerBadge}>
                <Clock color={colors.mutedForeground} size={12} strokeWidth={1.75} />
                <Text style={styles.timerText}>{c.days}d left</Text>
              </View>
            </View>
            <Text style={styles.challengeTitle}>{c.title}</Text>
            <View style={styles.challengeMeta}>
              <View style={styles.challengeStatRow}>
                <Users color={colors.mutedForeground} size={13} strokeWidth={1.75} />
                <Text style={styles.challengeMetaTxt}>{c.participants} participants</Text>
              </View>
              <Text style={[styles.challengeMetaTxt, { color: typeColor[c.type] }]}>
                You: #{c.userRank}
              </Text>
            </View>
            <Text style={styles.challengeLeader}>Leading: {c.leader}</Text>
          </View>
        ))}

        {past.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Past</Text>
            {past.map(c => (
              <View key={c.id} style={[styles.challengeCard, { opacity: 0.6 }]}>
                <Text style={styles.challengeTitle}>{c.title}</Text>
                <Text style={styles.challengeMetaTxt}>Won by: {c.leader}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  )
}

// ─── Badges Screen ────────────────────────────────────────────────────────────

export function BadgesScreen({ onBack }: { onBack: () => void }) {
  const rarityColor: Record<string, string> = {
    Common: colors.mutedForeground, Rare: colors.blue,
    Epic: colors.purple, Legendary: colors.energy,
  }
  const categories = [...new Set(MOCK_BADGES.map(b => b.category))]

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <ChevronRight color={colors.foreground} size={20} strokeWidth={1.75} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Badges</Text>
        <View style={{ width: touchTarget.min }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.badgesEarned}>
          {MOCK_BADGES.filter(b => b.earned).length}/{MOCK_BADGES.length} earned
        </Text>

        {categories.map(cat => (
          <View key={cat}>
            <Text style={styles.sectionLabel}>{cat}</Text>
            <View style={styles.badgesGrid}>
              {MOCK_BADGES.filter(b => b.category === cat).map(badge => (
                <TouchableOpacity
                  key={badge.id}
                  style={[styles.badgeCard, !badge.earned && styles.badgeCardLocked]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.badgeIcon, { backgroundColor: badge.earned ? rarityColor[badge.rarity] + '20' : colors.muted }]}>
                    {badge.earned
                      ? <Award color={rarityColor[badge.rarity]} size={22} strokeWidth={1.75} />
                      : <Lock color={colors.mutedForeground} size={18} strokeWidth={1.75} />
                    }
                  </View>
                  <Text style={[styles.badgeName, !badge.earned && { color: colors.mutedForeground }]} numberOfLines={2}>
                    {badge.name}
                  </Text>
                  <View style={[styles.rarityTag, { backgroundColor: rarityColor[badge.rarity] + '18' }]}>
                    <Text style={[styles.rarityText, { color: rarityColor[badge.rarity] }]}>{badge.rarity}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

// ─── Sessions Screen ──────────────────────────────────────────────────────────

export function SessionsScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <ChevronRight color={colors.foreground} size={20} strokeWidth={1.75} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Group Sessions</Text>
        <TouchableOpacity style={[styles.createSessionBtn]}>
          <Text style={styles.createSessionBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {MOCK_SESSIONS.map(session => (
          <View key={session.id} style={[
            styles.sessionCard,
            session.status === 'active' && { borderColor: colors.primary, borderWidth: 1 },
          ]}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionName}>{session.name}</Text>
              <View style={[
                styles.sessionStatusBadge,
                { backgroundColor: session.status === 'active' ? colors.primary + '18' : colors.muted }
              ]}>
                <Text style={[styles.sessionStatusText, { color: session.status === 'active' ? colors.primary : colors.mutedForeground }]}>
                  {session.status === 'active' ? 'Active now' : 'Upcoming'}
                </Text>
              </View>
            </View>
            <Text style={styles.sessionWorkout}>{session.workout}</Text>
            <Text style={styles.sessionDate}>{session.date}</Text>
            <View style={styles.sessionMeta}>
              <View style={styles.sessionMetaRow}>
                <Users color={colors.mutedForeground} size={13} strokeWidth={1.75} />
                <Text style={styles.sessionMetaTxt}>{session.started}/{session.members} started</Text>
              </View>
              {session.ghostMode && (
                <View style={[styles.ghostBadge, { backgroundColor: colors.blue + '18' }]}>
                  <Text style={[styles.ghostBadgeTxt, { color: colors.blue }]}>Ghost Mode</Text>
                </View>
              )}
            </View>
            {session.status === 'active' && (
              <TouchableOpacity style={styles.sessionStartBtn}>
                <Text style={styles.sessionStartBtnText}>Start my session</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

// ─── DMs Screen ───────────────────────────────────────────────────────────────

export function DMsScreen({ onBack }: { onBack: () => void }) {
  const [activeThread, setActiveThread] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const thread = MOCK_DM_THREADS.find(t => t.id === activeThread)

  if (activeThread && thread) {
    return (
      <View style={styles.container}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setActiveThread(null)}>
            <ChevronRight color={colors.foreground} size={20} strokeWidth={1.75} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <View style={styles.dmThreadHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20', width: 32, height: 32, borderRadius: 16 }]}>
              <Text style={[styles.avatarText, { color: colors.primary, fontSize: 12 }]}>{thread.initials}</Text>
            </View>
            <Text style={styles.navTitle}>{thread.name}</Text>
          </View>
          <View style={{ width: touchTarget.min }} />
        </View>

        <ScrollView contentContainerStyle={styles.dmMessages}>
          <View style={[styles.msgRow]}>
            <View style={[styles.msgBubble, { backgroundColor: colors.card, maxWidth: '80%' }]}>
              <Text style={styles.msgText}>{thread.lastMsg}</Text>
              <Text style={styles.msgTime}>{thread.time}</Text>
            </View>
          </View>
          <View style={[styles.msgRow, styles.msgRowMe]}>
            <View style={[styles.msgBubble, { backgroundColor: colors.primary, maxWidth: '80%' }]}>
              <Text style={[styles.msgText, { color: colors.primaryFg }]}>Great job on that PR today! 💪</Text>
              <Text style={[styles.msgTime, { color: colors.primaryFg + 'AA' }]}>1h ago</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.dmInputBar}>
          <TextInput style={styles.dmInput} value={message} onChangeText={setMessage}
            placeholder="Message..." placeholderTextColor={colors.mutedForeground} />
          <TouchableOpacity style={[styles.dmSendBtn, !message && { opacity: 0.4 }]} disabled={!message}>
            <Send color={colors.primaryFg} size={16} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <ChevronRight color={colors.foreground} size={20} strokeWidth={1.75} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Messages</Text>
        <View style={{ width: touchTarget.min }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.dmNotice}>
          <Lock color={colors.mutedForeground} size={14} strokeWidth={1.75} />
          <Text style={styles.dmNoticeText}>DMs are available with mutual friends only</Text>
        </View>
        {MOCK_DM_THREADS.map(thread => (
          <TouchableOpacity key={thread.id} style={styles.dmThread} onPress={() => setActiveThread(thread.id)} activeOpacity={0.7}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{thread.initials}</Text>
              {thread.unread > 0 && (
                <View style={styles.unreadDot}>
                  <Text style={styles.unreadTxt}>{thread.unread}</Text>
                </View>
              )}
            </View>
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{thread.name}</Text>
              <Text style={styles.friendSub} numberOfLines={1}>{thread.lastMsg}</Text>
            </View>
            <Text style={styles.dmTime}>{thread.time}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.background },
  navBar:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm, paddingTop: spacing.xl, paddingBottom: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  navTitle:           { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.foreground },
  iconBtn:            { width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  content:            { paddingHorizontal: spacing.screen, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  sectionLabel:       { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.mutedForeground },
  searchRow:          { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, paddingHorizontal: spacing.md, height: touchTarget.comfortable },
  searchInput:        { flex: 1, fontSize: typography.size.base, color: colors.foreground },
  avatar:             { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:         { fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  friendCard:         { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md },
  requestCard:        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md },
  friendInfo:         { flex: 1 },
  friendName:         { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground },
  friendSub:          { fontSize: typography.size.xs, color: colors.mutedForeground, marginTop: 2 },
  friendMeta:         { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 3 },
  compatBadge:        { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  compatText:         { fontSize: 10, fontWeight: typography.weight.bold },
  dmBtn:              { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  requestBtns:        { flexDirection: 'row', gap: spacing.sm },
  declineBtn:         { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.destructive + '15', alignItems: 'center', justifyContent: 'center' },
  acceptBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  inviteLinkBtn:      { height: touchTarget.comfortable, backgroundColor: colors.card, borderRadius: radius.full, borderWidth: 0.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  challengeCard:      { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, gap: spacing.xs },
  challengeTop:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  challengeTypeBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  challengeTypeTxt:   { fontSize: typography.size.xs, fontWeight: typography.weight.bold },
  timerBadge:         { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerText:          { fontSize: typography.size.xs, color: colors.mutedForeground },
  challengeTitle:     { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.foreground },
  challengeMeta:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  challengeStatRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  challengeMetaTxt:   { fontSize: typography.size.sm, color: colors.mutedForeground },
  challengeLeader:    { fontSize: typography.size.xs, color: colors.mutedForeground },
  badgesEarned:       { fontSize: typography.size.base, color: colors.primary, fontWeight: typography.weight.semibold, textAlign: 'center' },
  badgesGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badgeCard:          { width: '30%', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.sm, alignItems: 'center', gap: spacing.xs },
  badgeCardLocked:    { opacity: 0.5 },
  badgeIcon:          { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  badgeName:          { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color: colors.foreground, textAlign: 'center' },
  rarityTag:          { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: radius.full },
  rarityText:         { fontSize: 9, fontWeight: typography.weight.bold },
  sessionCard:        { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, gap: spacing.xs },
  sessionHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sessionName:        { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.foreground },
  sessionStatusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  sessionStatusText:  { fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  sessionWorkout:     { fontSize: typography.size.sm, color: colors.foreground },
  sessionDate:        { fontSize: typography.size.xs, color: colors.mutedForeground },
  sessionMeta:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sessionMetaRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sessionMetaTxt:     { fontSize: typography.size.xs, color: colors.mutedForeground },
  ghostBadge:         { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  ghostBadgeTxt:      { fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  sessionStartBtn:    { height: touchTarget.comfortable, backgroundColor: colors.primary, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs },
  sessionStartBtnText:{ fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.primaryFg },
  createSessionBtn:   { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.primary, borderRadius: radius.full },
  createSessionBtnText:{ fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.primaryFg },
  dmThread:           { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md },
  dmNotice:           { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 0.5, borderColor: colors.border, padding: spacing.sm },
  dmNoticeText:       { fontSize: typography.size.xs, color: colors.mutedForeground },
  dmTime:             { fontSize: typography.size.xs, color: colors.mutedForeground },
  dmThreadHeader:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dmMessages:         { paddingHorizontal: spacing.screen, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  msgRow:             { flexDirection: 'row' },
  msgRowMe:           { justifyContent: 'flex-end' },
  msgBubble:          { borderRadius: radius.lg, padding: spacing.sm, gap: 3 },
  msgText:            { fontSize: typography.size.sm, color: colors.foreground, lineHeight: 20 },
  msgTime:            { fontSize: typography.size.xs, color: colors.mutedForeground },
  dmInputBar:         { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.screen, paddingBottom: spacing.xl, backgroundColor: colors.background, borderTopWidth: 0.5, borderTopColor: colors.border },
  dmInput:            { flex: 1, height: touchTarget.comfortable, backgroundColor: colors.card, borderRadius: radius.full, borderWidth: 0.5, borderColor: colors.border, paddingHorizontal: spacing.md, fontSize: typography.size.base, color: colors.foreground },
  dmSendBtn:          { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  unreadDot:          { position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.destructive, alignItems: 'center', justifyContent: 'center' },
  unreadTxt:          { fontSize: 9, fontWeight: typography.weight.bold, color: '#fff' },
  modalOverlay:       { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet:         { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  modalHandle:        { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center' },
  modalHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
})
```
