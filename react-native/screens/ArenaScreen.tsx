import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import {
  useArenaFeed,
  useMySquads,
  useReactToFeed,
  useSquadLeaderboard,
  type FeedItem,
  type LeaderboardEntry,
  type Squad,
} from '../hooks/useArenaData';

type ArenaTab = 'feed' | 'squads' | 'leaderboard';
type TabState = 'loading' | 'success' | 'empty' | 'error';

export default function ArenaScreen() {
  const [activeTab, setActiveTab] = useState<ArenaTab>('feed');

  const feedQuery = useArenaFeed();
  const squadsQuery = useMySquads();
  const leaderboardQuery = useSquadLeaderboard();
  const reactMutation = useReactToFeed();

  const feedState = useMemo<TabState>(() => {
    if (feedQuery.isLoading) {
      return 'loading';
    }
    if (feedQuery.isError && feedQuery.items.length === 0) {
      return 'error';
    }
    if (feedQuery.items.length === 0) {
      return 'empty';
    }
    return 'success';
  }, [feedQuery.isError, feedQuery.isLoading, feedQuery.items.length]);

  const squadsState = useMemo<TabState>(() => {
    if (squadsQuery.isLoading) {
      return 'loading';
    }
    if (squadsQuery.isError && !squadsQuery.data?.length) {
      return 'error';
    }
    if (!squadsQuery.data?.length) {
      return 'empty';
    }
    return 'success';
  }, [squadsQuery.data, squadsQuery.isError, squadsQuery.isLoading]);

  const leaderboardState = useMemo<TabState>(() => {
    if (leaderboardQuery.isLoading) {
      return 'loading';
    }
    if (leaderboardQuery.isError && !leaderboardQuery.data?.length) {
      return 'error';
    }
    if (!leaderboardQuery.data?.length) {
      return 'empty';
    }
    return 'success';
  }, [leaderboardQuery.data, leaderboardQuery.isError, leaderboardQuery.isLoading]);

  const refreshActiveTab = async () => {
    if (activeTab === 'feed') {
      await feedQuery.refetch();
      return;
    }
    if (activeTab === 'squads') {
      await squadsQuery.refetch();
      return;
    }
    await leaderboardQuery.refetch();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>The Arena</Text>
        <Text style={styles.subtitle}>Compete and connect</Text>
      </View>

      <View style={styles.tabBar}>
        <TabButton icon="trophy-outline" label="PR Feed" active={activeTab === 'feed'} onPress={() => setActiveTab('feed')} />
        <TabButton icon="people-outline" label="Squads" active={activeTab === 'squads'} onPress={() => setActiveTab('squads')} />
        <TabButton icon="trending-up-outline" label="Leaderboard" active={activeTab === 'leaderboard'} onPress={() => setActiveTab('leaderboard')} />
      </View>

      {activeTab === 'feed' ? (
        <PRFeed
          state={feedState}
          query={feedQuery}
          isReacting={reactMutation.isPending}
          onReact={(feedId) => reactMutation.mutate(feedId)}
          onRetry={() => {
            void feedQuery.refetch();
          }}
        />
      ) : null}

      {activeTab === 'squads' ? (
        <SquadsTab
          state={squadsState}
          query={squadsQuery}
          onRetry={() => {
            void squadsQuery.refetch();
          }}
        />
      ) : null}

      {activeTab === 'leaderboard' ? (
        <LeaderboardTab
          state={leaderboardState}
          query={leaderboardQuery}
          onRetry={() => {
            void leaderboardQuery.refetch();
          }}
        />
      ) : null}
    </View>
  );
}

function PRFeed({
  state,
  query,
  isReacting,
  onReact,
  onRetry,
}: {
  state: TabState;
  query: ReturnType<typeof useArenaFeed>;
  isReacting: boolean;
  onReact: (feedId: string) => void;
  onRetry: () => void;
}) {
  const renderItem = ({ item }: { item: FeedItem }) => {
    const accentColor = item.isRun
      ? colors.blue
      : item.eventType === 'Streak Milestone'
        ? colors.energy
        : item.eventType === 'Workout Complete'
          ? colors.mutedForeground
          : colors.primary;

    return (
      <View style={styles.feedCard}>
        <View style={styles.feedRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{item.initials}</Text>
          </View>

          <View style={styles.feedContent}>
            <View style={styles.feedMeta}>
              <View style={styles.feedNameRow}>
                <Text style={styles.feedUser}>{item.user}</Text>
                <View style={[styles.eventBadge, { backgroundColor: accentColor + '20' }]}>
                  <Text style={[styles.eventBadgeText, { color: accentColor }]}>{item.eventType}</Text>
                </View>
              </View>
              <Text style={styles.feedTime}>{item.time}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>{item.exercise}</Text>
              <View style={styles.statBoxValues}>
                <Text style={[styles.statBoxValue, { color: accentColor }]}>{item.value}</Text>
                {item.delta ? (
                  <Text style={[styles.statBoxDelta, { color: colors.primary }]}>{item.delta}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.reactionsRow}>
              <TouchableOpacity
                style={styles.reactionBtn}
                onPress={() => onReact(item.id)}
                disabled={query.isOfflineReadOnly || isReacting}
              >
                <Ionicons name="flame-outline" color={colors.mutedForeground} size={15} />
                <Text style={styles.reactionCount}>{item.reactions}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reactionBtn} disabled>
                <Ionicons name="chatbubble-outline" color={colors.mutedForeground} size={15} />
                <Text style={styles.reactionCount}>
                  {query.isOfflineReadOnly ? 'Read-only offline' : 'React'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={state === 'success' ? query.items : []}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage && !query.isOfflineReadOnly) {
          void query.fetchNextPage();
        }
      }}
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => {
            void query.refetch();
          }}
          tintColor={colors.primary}
        />
      }
      ListHeaderComponent={
        <View style={styles.tabContent}>
          {query.isOfflineFallback || query.isOfflineReadOnly ? (
            <InlineBanner message="Showing cached feed data while offline." />
          ) : null}
          <View style={styles.feedHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity disabled>
              <Text style={[styles.filterText, { color: colors.primary }]}>Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      }
      ListFooterComponent={
        query.isFetchingNextPage ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null
      }
      ListEmptyComponent={
        state === 'loading' ? (
          <ArenaSkeleton type="feed" />
        ) : state === 'empty' ? (
          <FeedbackCard
            icon="sparkles-outline"
            title="No PR feed yet"
            message="Once your squad starts training, auto-generated achievements will show up here."
          />
        ) : state === 'error' ? (
          <FeedbackCard
            icon="alert-circle-outline"
            title="Couldn’t load the feed"
            message={query.error instanceof Error ? query.error.message : 'Please try again.'}
            actionLabel="Retry"
            onPress={onRetry}
          />
        ) : null
      }
    />
  );
}

function SquadsTab({
  state,
  query,
  onRetry,
}: {
  state: TabState;
  query: ReturnType<typeof useMySquads>;
  onRetry: () => void;
}) {
  const squads = query.data ?? [];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => {
            void query.refetch();
          }}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.tabContent}>
        <View style={styles.feedHeader}>
          <Text style={styles.sectionTitle}>My Squads</Text>
          <TouchableOpacity style={styles.joinBtn}>
            <Ionicons name="add" color={colors.black} size={14} />
            <Text style={styles.joinBtnText}>Join Squad</Text>
          </TouchableOpacity>
        </View>

        {state === 'loading' ? <ArenaSkeleton type="squads" /> : null}

        {state === 'error' ? (
          <FeedbackCard
            icon="alert-circle-outline"
            title="Couldn’t load squads"
            message={query.error instanceof Error ? query.error.message : 'Please try again.'}
            actionLabel="Retry"
            onPress={onRetry}
          />
        ) : null}

        {state === 'empty' ? (
          <FeedbackCard
            icon="people-outline"
            title="No squad yet"
            message="You’re new here. Invite friends and create your first squad to unlock the social layer."
            actionLabel="Invite Squad"
            onPress={() => {}}
          />
        ) : null}

        {state === 'success'
          ? squads.map((squad) => (
              <TouchableOpacity key={squad.id} style={styles.squadCard} activeOpacity={0.7}>
                <View style={styles.squadTop}>
                  <View style={styles.squadInfo}>
                    <Text style={styles.squadName}>{squad.name}</Text>
                    <Text style={styles.squadType}>{squad.type}</Text>
                  </View>
                  <View style={[styles.rankBadge, { backgroundColor: colors.energy + '18' }]}>
                    <Ionicons name="medal-outline" color={colors.energy} size={14} />
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

                <View style={styles.healthBarTrack}>
                  <View style={[styles.healthBarFill, { width: `${squad.forestHealth}%`, backgroundColor: colors.primary }]} />
                </View>
              </TouchableOpacity>
            ))
          : null}

        {state === 'success' ? (
          <View style={[styles.createSquadCard, { borderColor: colors.primary + '30', backgroundColor: colors.primary + '08' }]}>
            <View style={[styles.createSquadIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="people-outline" color={colors.primary} size={22} />
            </View>
            <View style={styles.createSquadText}>
              <Text style={styles.createSquadTitle}>Create Your Squad</Text>
              <Text style={styles.createSquadSub}>Train together, grow together</Text>
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function LeaderboardTab({
  state,
  query,
  onRetry,
}: {
  state: TabState;
  query: ReturnType<typeof useSquadLeaderboard>;
  onRetry: () => void;
}) {
  const leaderboard = query.data ?? [];
  const medalColors: Record<number, string> = { 1: colors.energy, 2: '#94a3b8', 3: '#c2410c' };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => {
            void query.refetch();
          }}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Squad Leaderboard</Text>
        <Text style={styles.leaderboardSub}>Based on this week's vitality scores</Text>

        {state === 'loading' ? <ArenaSkeleton type="leaderboard" /> : null}

        {state === 'error' ? (
          <FeedbackCard
            icon="alert-circle-outline"
            title="Couldn’t load leaderboard"
            message={query.error instanceof Error ? query.error.message : 'Please try again.'}
            actionLabel="Retry"
            onPress={onRetry}
          />
        ) : null}

        {state === 'empty' ? (
          <FeedbackCard
            icon="trophy-outline"
            title="No leaderboard yet"
            message="Once your squad starts logging workouts, rankings will appear here."
          />
        ) : null}

        {state === 'success'
          ? leaderboard.map((user) => (
              <View
                key={`${user.rank}-${user.name}`}
                style={[
                  styles.leaderCard,
                  user.isYou && { borderColor: colors.primary, backgroundColor: colors.primary + '06' },
                ]}
              >
                <View style={styles.rankCell}>
                  {user.rank <= 3 ? (
                    <Ionicons name="medal-outline" color={medalColors[user.rank]} size={22} />
                  ) : (
                    <Text style={styles.rankNumber}>#{user.rank}</Text>
                  )}
                </View>

                <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>{user.initials}</Text>
                </View>

                <View style={styles.leaderInfo}>
                  <Text style={[styles.leaderName, user.isYou && { color: colors.primary }]}>{user.name}</Text>
                  <Text style={styles.leaderStreak}>{user.streak} day streak</Text>
                </View>

                <View style={styles.scoreCell}>
                  <Text style={[styles.scoreValue, { color: colors.primary }]}>{user.score.toLocaleString()}</Text>
                  <Text style={styles.scoreLabel}>pts</Text>
                </View>
              </View>
            ))
          : null}
      </View>
    </ScrollView>
  );
}

function TabButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} color={active ? colors.primary : colors.mutedForeground} size={14} />
      <Text style={[styles.tabLabel, { color: active ? colors.primary : colors.mutedForeground }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function InlineBanner({ message }: { message: string }) {
  return (
    <View style={styles.inlineBanner}>
      <Ionicons name="cloud-offline-outline" size={16} color={colors.energy} />
      <Text style={styles.inlineBannerText}>{message}</Text>
    </View>
  );
}

function FeedbackCard({
  icon,
  title,
  message,
  actionLabel,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.feedbackCard}>
      <Ionicons
        name={icon}
        size={28}
        color={icon === 'alert-circle-outline' ? colors.destructive : colors.primary}
      />
      <Text style={styles.feedbackTitle}>{title}</Text>
      <Text style={styles.feedbackMessage}>{message}</Text>
      {actionLabel && onPress ? (
        <TouchableOpacity onPress={onPress} style={styles.feedbackButton}>
          <Text style={styles.feedbackButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function ArenaSkeleton({ type }: { type: 'feed' | 'squads' | 'leaderboard' }) {
  const count = type === 'feed' ? 3 : type === 'squads' ? 2 : 4;

  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.skeletonCard} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  title: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.foreground },
  subtitle: { fontSize: typography.fontSize.sm, color: colors.mutedForeground, marginTop: 2 },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    padding: 4,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: borderRadius.lg,
    minHeight: 44,
  },
  tabActive: { backgroundColor: colors.card },
  tabLabel: { fontSize: 12, fontWeight: typography.fontWeight.semibold },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  listContent: { paddingBottom: spacing.xxl },
  tabContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  feedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.foreground },
  filterText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
  feedCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  feedRow: { flexDirection: 'row', gap: spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  feedContent: { flex: 1, gap: spacing.sm },
  feedMeta: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  feedNameRow: { gap: 4 },
  feedUser: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.foreground },
  eventBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 999 },
  eventBadgeText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold },
  feedTime: { fontSize: typography.fontSize.xs, color: colors.mutedForeground },
  statBox: { backgroundColor: colors.secondary, borderRadius: borderRadius.md, padding: spacing.sm, gap: 3 },
  statBoxLabel: { fontSize: typography.fontSize.xs, color: colors.mutedForeground },
  statBoxValues: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statBoxValue: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  statBoxDelta: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
  reactionsRow: { flexDirection: 'row', gap: spacing.lg },
  reactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reactionCount: { fontSize: typography.fontSize.sm, color: colors.mutedForeground },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  joinBtnText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.black },
  squadCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  squadTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  squadInfo: { gap: 3 },
  squadName: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.foreground },
  squadType: { fontSize: typography.fontSize.sm, color: colors.mutedForeground },
  rankBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 999 },
  rankText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
  squadStats: { flexDirection: 'row' },
  squadStat: { flex: 1, gap: 3 },
  squadStatLabel: { fontSize: typography.fontSize.xs, color: colors.mutedForeground },
  squadStatValue: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.foreground },
  healthBarTrack: { height: 6, backgroundColor: colors.muted, borderRadius: 999, overflow: 'hidden' },
  healthBarFill: { height: '100%', borderRadius: 999 },
  createSquadCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.md },
  createSquadIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  createSquadText: { gap: 3 },
  createSquadTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.foreground },
  createSquadSub: { fontSize: typography.fontSize.sm, color: colors.mutedForeground },
  leaderboardSub: { fontSize: typography.fontSize.sm, color: colors.mutedForeground, marginTop: -4, marginBottom: spacing.sm },
  leaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rankCell: { width: 28, alignItems: 'center' },
  rankNumber: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.mutedForeground },
  leaderInfo: { flex: 1, gap: 2 },
  leaderName: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.foreground },
  leaderStreak: { fontSize: typography.fontSize.xs, color: colors.mutedForeground },
  scoreCell: { alignItems: 'flex-end', gap: 1 },
  scoreValue: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  scoreLabel: { fontSize: typography.fontSize.xs, color: colors.mutedForeground },
  inlineBanner: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.energy + '33',
    backgroundColor: colors.energy + '14',
  },
  inlineBannerText: { flex: 1, fontSize: typography.fontSize.sm, color: colors.energy, fontWeight: typography.fontWeight.medium },
  feedbackCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  feedbackTitle: {
    fontSize: typography.fontSize.xl,
    color: colors.foreground,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  feedbackMessage: {
    fontSize: typography.fontSize.base,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 22,
  },
  feedbackButton: {
    minHeight: 48,
    minWidth: 120,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  feedbackButtonText: { fontSize: typography.fontSize.base, color: colors.black, fontWeight: typography.fontWeight.bold },
  skeletonCard: {
    height: 132,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
  },
});
