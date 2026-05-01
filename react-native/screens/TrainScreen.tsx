import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  CloudOff, Play, Clock, Sparkles, Dumbbell,
  Check, Inbox, AlertCircle,
} from 'lucide-react-native';
import { colors, borderRadius, spacing, typography } from '../theme';
import type { RootStackParamList } from '../App';
import {
  fetchTodaysPlan,
  fetchWorkoutHistory,
  generateProgram,
  type WorkoutSummary,
} from '../lib/workouts';
import { useCachedQuery } from '../hooks/useCachedQuery';

type TrainTab = 'start' | 'history';
type DataState = 'loading' | 'success' | 'empty' | 'error';

function deriveState(
  isLoading: boolean,
  isError: boolean,
  items: WorkoutSummary[] | undefined,
): DataState {
  if (isLoading && !items) return 'loading';
  if (isError && !items) return 'error';
  if (!items || items.length === 0) return 'empty';
  return 'success';
}

export default function TrainScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<TrainTab>('start');
  const [isGenerating, setIsGenerating] = useState(false);

  const todayQuery = useCachedQuery<WorkoutSummary[]>({
    queryKey: ['train', 'today'],
    cacheKey: 'query.train.today',
    queryFn: fetchTodaysPlan,
  });

  const historyQuery = useCachedQuery<WorkoutSummary[]>({
    queryKey: ['train', 'history', 20],
    cacheKey: 'query.train.history.20',
    queryFn: () => fetchWorkoutHistory(20),
  });

  const todayItems = todayQuery.data ?? [];
  const historyItems = historyQuery.data ?? [];

  const todayState = deriveState(todayQuery.isLoading, todayQuery.isError, todayQuery.data);
  const historyState = deriveState(
    historyQuery.isLoading,
    historyQuery.isError,
    historyQuery.data,
  );

  const todayError = todayQuery.error instanceof Error ? todayQuery.error.message : null;
  const historyError = historyQuery.error instanceof Error ? historyQuery.error.message : null;

  const isRefreshing = todayQuery.isRefetching || historyQuery.isRefetching;

  const handleRefresh = useCallback(async () => {
    await Promise.all([todayQuery.refetch(), historyQuery.refetch()]);
  }, [historyQuery, todayQuery]);

  const handleGeneratePlan = useCallback(async () => {
    setIsGenerating(true);
    try {
      await generateProgram();
      Alert.alert('Plan generated', 'Your training plan has been refreshed.');
      await todayQuery.refetch();
    } catch (error) {
      Alert.alert(
        'Unable to generate plan',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  }, [todayQuery]);

  const offlineBanner = useMemo(() => {
    if (activeTab === 'start' && todayQuery.isOfflineFallback && todayQuery.dataUpdatedAt) {
      return `Offline cache from ${formatCachedAt(todayQuery.dataUpdatedAt)}`;
    }

    if (activeTab === 'history' && historyQuery.isOfflineFallback && historyQuery.dataUpdatedAt) {
      return `Offline cache from ${formatCachedAt(historyQuery.dataUpdatedAt)}`;
    }

    return null;
  }, [
    activeTab,
    historyQuery.dataUpdatedAt,
    historyQuery.isOfflineFallback,
    todayQuery.dataUpdatedAt,
    todayQuery.isOfflineFallback,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>TRAIN</Text>
          <Text style={styles.headerTitle}>Build strength, push limits</Text>
        </View>

        <View style={styles.tabBar}>
          <TabButton
            label="Start"
            icon={Play}
            active={activeTab === 'start'}
            onPress={() => setActiveTab('start')}
          />
          <TabButton
            label="History"
            icon={Clock}
            active={activeTab === 'history'}
            onPress={() => setActiveTab('history')}
          />
        </View>

        {offlineBanner ? (
          <View style={styles.offlineBanner}>
            <CloudOff size={16} color={colors.energy} strokeWidth={1.75} />
            <Text style={styles.offlineBannerText}>{offlineBanner}</Text>
          </View>
        ) : null}

        {activeTab === 'start' ? (
          <StartTab
            state={todayState}
            error={todayError}
            items={todayItems}
            isGenerating={isGenerating}
            onGenerate={handleGeneratePlan}
            onRetry={() => { void todayQuery.refetch(); }}
            onStartWorkout={(workout) => navigation.navigate('ActiveWorkout', { workout })}
          />
        ) : (
          <HistoryTab
            state={historyState}
            error={historyError}
            items={historyItems}
            onRetry={() => { void historyQuery.refetch(); }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TabButton({
  active,
  icon: Icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: React.ElementType;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tabButton, active && styles.tabButtonActive]}
    >
      <Icon
        size={16}
        color={active ? colors.primary : colors.mutedForeground}
        strokeWidth={1.75}
      />
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function StartTab({
  state,
  error,
  items,
  isGenerating,
  onGenerate,
  onRetry,
  onStartWorkout,
}: {
  state: DataState;
  error: string | null;
  items: WorkoutSummary[];
  isGenerating: boolean;
  onGenerate: () => void;
  onRetry: () => void;
  onStartWorkout: (workout: WorkoutSummary) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Today's Plan</Text>

      {state === 'loading' ? <LoadingCards count={2} /> : null}

      {state === 'error' ? (
        <ErrorState
          title="Couldn’t load today’s plan"
          message={error ?? 'Check your API connection and try again.'}
          onRetry={onRetry}
        />
      ) : null}

      {state === 'empty' ? (
        <EmptyState
          title="No workout scheduled"
          message="Generate a fresh plan with Wali AI to build today's training."
        />
      ) : null}

      {state === 'success'
        ? items.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              onStartWorkout={() => onStartWorkout(workout)}
            />
          ))
        : null}

      <TouchableOpacity
        onPress={onGenerate}
        disabled={isGenerating}
        style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
      >
        {isGenerating ? (
          <ActivityIndicator color={colors.black} />
        ) : (
          <>
            <Sparkles size={20} color={colors.black} strokeWidth={1.75} />
            <Text style={styles.generateButtonText}>Generate New Plan with Wali AI</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

function HistoryTab({
  state,
  error,
  items,
  onRetry,
}: {
  state: DataState;
  error: string | null;
  items: WorkoutSummary[];
  onRetry: () => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Workouts</Text>

      {state === 'loading' ? <LoadingCards count={3} /> : null}

      {state === 'error' ? (
        <ErrorState
          title="Couldn’t load workout history"
          message={error ?? 'Check your API connection and try again.'}
          onRetry={onRetry}
        />
      ) : null}

      {state === 'empty' ? (
        <EmptyState
          title="No recent workouts"
          message="Completed sessions will show up here once you start training."
        />
      ) : null}

      {state === 'success'
        ? items.map((item) => <HistoryCard key={item.id} workout={item} />)
        : null}
    </View>
  );
}

function WorkoutCard({
  workout,
  onStartWorkout,
}: {
  workout: WorkoutSummary;
  onStartWorkout: () => void;
}) {
  return (
    <View style={styles.workoutCard}>
      <View style={styles.workoutHeaderRow}>
        <View style={styles.workoutTextBlock}>
          <Text style={styles.workoutTitle}>{workout.name}</Text>
          <View style={styles.workoutMetaRow}>
            <View style={styles.metaItem}>
              <Dumbbell size={16} color={colors.primary} strokeWidth={1.75} />
              <Text style={styles.metaItemText}>{workout.exerciseCount} exercises</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={16} color={colors.energy} strokeWidth={1.75} />
              <Text style={styles.metaItemText}>{workout.durationMinutes} min</Text>
            </View>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{workout.type.toUpperCase()}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={onStartWorkout} style={styles.playButton}>
          <Play size={26} color={colors.black} strokeWidth={2} fill={colors.black} style={styles.playIcon} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onStartWorkout} style={styles.startWorkoutButton}>
        <Text style={styles.startWorkoutButtonText}>Start workout</Text>
      </TouchableOpacity>
    </View>
  );
}

function HistoryCard({ workout }: { workout: WorkoutSummary }) {
  return (
    <View style={styles.historyCard}>
      <View>
        <Text style={styles.historyDate}>
          {formatHistoryDate(workout.completedAt)}
        </Text>
        <Text style={styles.historyTitle}>{workout.name}</Text>
      </View>
      <View style={styles.historyCheck}>
        <Check size={18} color={colors.primary} strokeWidth={2.5} />
      </View>
    </View>
  );
}

function LoadingCards({ count }: { count: number }) {
  return (
    <View style={styles.loadingGroup}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.loadingCard}>
          <View style={[styles.loadingBar, styles.loadingBarWide]} />
          <View style={[styles.loadingBar, styles.loadingBarMedium]} />
          <View style={[styles.loadingBar, styles.loadingBarShort]} />
        </View>
      ))}
    </View>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.feedbackCard}>
      <Inbox size={24} color={colors.mutedForeground} strokeWidth={1.75} />
      <Text style={styles.feedbackTitle}>{title}</Text>
      <Text style={styles.feedbackMessage}>{message}</Text>
    </View>
  );
}

function ErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.feedbackCard}>
      <AlertCircle size={24} color={colors.destructive} strokeWidth={1.75} />
      <Text style={styles.feedbackTitle}>{title}</Text>
      <Text style={styles.feedbackMessage}>{message}</Text>
      <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

function formatHistoryDate(value?: string | null): string {
  if (!value) {
    return 'Completed workout';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCachedAt(value: number): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'recently';
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 120,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  headerEyebrow: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    color: colors.foreground,
    fontWeight: typography.fontWeight.bold,
  },
  tabBar: {
    minHeight: 56,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.xs,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButton: {
    minHeight: 44,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.md,
  },
  tabButtonActive: {
    backgroundColor: colors.card,
  },
  tabButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    fontWeight: typography.fontWeight.semibold,
  },
  tabButtonTextActive: {
    color: colors.primary,
  },
  offlineBanner: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.energy + '14',
    borderWidth: 1,
    borderColor: colors.energy + '33',
  },
  offlineBannerText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.energy,
    fontWeight: typography.fontWeight.medium,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    color: colors.foreground,
    fontWeight: typography.fontWeight.bold,
  },
  workoutCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  workoutHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  workoutTextBlock: {
    flex: 1,
    gap: spacing.sm,
  },
  workoutTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.foreground,
    fontWeight: typography.fontWeight.bold,
  },
  workoutMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaItemText: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    fontWeight: typography.fontWeight.medium,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: 999,
    backgroundColor: colors.primary + '1A',
    borderWidth: 1,
    borderColor: colors.primary + '33',
  },
  typeBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.6,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 2,
  },
  startWorkoutButton: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startWorkoutButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.black,
    fontWeight: typography.fontWeight.bold,
  },
  generateButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.black,
    fontWeight: typography.fontWeight.bold,
  },
  historyCard: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  historyDate: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
  historyTitle: {
    fontSize: typography.fontSize.base,
    color: colors.foreground,
    fontWeight: typography.fontWeight.bold,
  },
  historyCheck: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingGroup: {
    gap: spacing.md,
  },
  loadingCard: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  loadingBar: {
    height: 14,
    borderRadius: 999,
    backgroundColor: colors.secondary,
  },
  loadingBarWide: {
    width: '70%',
  },
  loadingBarMedium: {
    width: '50%',
  },
  loadingBarShort: {
    width: '35%',
  },
  feedbackCard: {
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  feedbackTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.foreground,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  feedbackMessage: {
    fontSize: typography.fontSize.base,
    color: colors.mutedForeground,
    lineHeight: 22,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    minWidth: 120,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.black,
    fontWeight: typography.fontWeight.bold,
  },
});
