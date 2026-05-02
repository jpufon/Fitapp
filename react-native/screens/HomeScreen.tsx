import React, { useMemo } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CloudOff, UserCircle, Flame, Dumbbell, Clock, Play,
  Droplets, Utensils, Footprints, MessageCircle, Users,
  TrendingUp, PlusCircle, Leaf, AlertCircle,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../theme';
import VitalityTree from '../components/VitalityTree';
import type { RootStackParamList } from '../App';
import { useUser } from '../hooks/useUser';
import { useHomeSnapshot, useTodaySteps } from '../hooks/useHomeData';

type ScreenState = 'loading' | 'success' | 'empty' | 'error';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const userQuery = useUser();
  const homeQuery = useHomeSnapshot();
  const stepsQuery = useTodaySteps();

  const snap = homeQuery.data;
  const nutrition = useMemo(() => {
    if (!snap) {
      return {
        protein: { current: 0, target: 150, progress: 0 },
        hydration: { current: 0, target: 3000, progress: 0 },
      };
    }
    const pct = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 100);
    return {
      protein: {
        current: snap.pillars.protein.current,
        target: snap.pillars.protein.target,
        progress: pct(snap.pillars.protein.progress),
      },
      hydration: {
        current: snap.pillars.hydration.current,
        target: snap.pillars.hydration.target,
        progress: pct(snap.pillars.hydration.progress),
      },
    };
  }, [snap]);

  const vitality = useMemo(() => {
    if (!snap) return { streak: 0, score: 0 };
    return {
      streak: snap.vitality.streak,
      score: Math.round(Math.max(0, Math.min(1, snap.vitality.score)) * 100),
    };
  }, [snap]);

  const workout = useMemo(() => {
    if (!snap?.workout) return null;
    return {
      id: snap.workout.id,
      name: snap.workout.name,
      type: snap.workout.type,
      exerciseCount: 0,
      durationMinutes: 0,
      completedAt: snap.workout.finishedAt,
    };
  }, [snap]);

  const state = useMemo<ScreenState>(() => {
    if (userQuery.isLoading && !userQuery.user) {
      return 'loading';
    }

    if (!userQuery.user && userQuery.error) {
      return 'error';
    }

    return 'success';
  }, [
    userQuery.error,
    userQuery.isLoading,
    userQuery.user,
  ]);

  const offlineBanner = useMemo(() => {
    const usingCache = homeQuery.isOfflineFallback || stepsQuery.isOfflineFallback;
    const liveDataUnavailable = homeQuery.isError || stepsQuery.isError;
    if (liveDataUnavailable) {
      return 'Some live data is unavailable. Showing your latest local dashboard.';
    }
    return usingCache ? 'Showing cached data while the app reconnects.' : null;
  }, [
    homeQuery.isError,
    homeQuery.isOfflineFallback,
    stepsQuery.isError,
    stepsQuery.isOfflineFallback,
  ]);

  const displayName = useMemo(() => {
    const user = userQuery.user;
    if (!user) {
      return 'Athlete';
    }

    const metadata = user.user_metadata as Record<string, unknown> | undefined;
    const preferredName = metadata?.displayName ?? metadata?.full_name ?? metadata?.name;
    if (typeof preferredName === 'string' && preferredName.trim().length > 0) {
      return preferredName;
    }

    if (user.email) {
      return user.email.split('@')[0];
    }

    return 'Athlete';
  }, [userQuery.user]);

  const steps = stepsQuery.data ?? { steps: 0, target: 10000, progress: 0 };

  const vitalityScore = vitality.score > 0
    ? vitality.score
    : Math.round(
        nutrition.hydration.progress * 0.3 +
          nutrition.protein.progress * 0.3 +
          steps.progress * 0.4
      );

  const handleRefresh = async () => {
    await Promise.all([homeQuery.refetch(), stepsQuery.refetch()]);
  };

  const handleRetry = () => {
    void handleRefresh();
  };

  const handleStartWorkout = () => {
    if (!workout) {
      Alert.alert('No workout scheduled', 'Generate or sync today’s plan first.');
      return;
    }

    navigation.navigate('ActiveWorkout', { workout });
  };

  return (
    <View style={styles.container}>
      <View style={styles.ambientContainer}>
        <LinearGradient
          colors={[colors.primary + '40', 'transparent']}
          style={[styles.ambientGradient, { top: 0, left: '25%' }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={[colors.energy + '30', 'transparent']}
          style={[styles.ambientGradient, { bottom: '25%', right: '25%' }]}
          start={{ x: 1, y: 1 }}
          end={{ x: 0, y: 0 }}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.lg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={homeQuery.isRefetching || stepsQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {offlineBanner ? (
          <View style={styles.offlineBanner}>
            <CloudOff size={16} color={colors.energy} strokeWidth={1.75} />
            <Text style={styles.offlineBannerText}>{offlineBanner}</Text>
          </View>
        ) : null}

        {state === 'loading' ? <HomeSkeleton /> : null}

        {state === 'empty' ? (
          <FeedbackCard
            icon={Leaf}
            title="Welcome to waliFit"
            message="Sign in and complete your setup to start syncing your vitality data."
          />
        ) : null}

        {state === 'error' ? (
          <FeedbackCard
            icon={AlertCircle}
            iconColor={colors.destructive}
            title="Couldn’t load your dashboard"
            message={
              userQuery.error?.message ??
              homeQuery.error?.message ??
              stepsQuery.error?.message ??
              'Please try again.'
            }
            actionLabel="Retry"
            onPress={handleRetry}
          />
        ) : null}

        {state === 'success' ? (
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.welcomeText}>WELCOME BACK</Text>
                <Text style={styles.nameText}>{displayName}</Text>
              </View>
              <TouchableOpacity
                style={styles.notificationButton}
                accessibilityLabel="Profile"
                onPress={() => navigation.navigate('Profile')}
              >
                <UserCircle size={24} color={colors.mutedForeground} strokeWidth={1.75} />
              </TouchableOpacity>
            </View>

            <LinearGradient
              colors={[colors.energy + '33', colors.energy + '1A']}
              style={styles.streakBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Flame size={24} color={colors.energy} strokeWidth={1.75} />
              <View style={styles.streakTextContainer}>
                <Text style={styles.streakNumber}>{vitality.streak}</Text>
                <Text style={styles.streakLabel}>day streak</Text>
              </View>
            </LinearGradient>

            <View style={styles.treeContainer}>
              <VitalityTree
                score={vitalityScore}
                todayScore={{
                  hydration: nutrition.hydration.progress,
                  protein: nutrition.protein.progress,
                  steps: steps.progress,
                }}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today's Progress</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  icon={Droplets}
                  label="Water"
                  value={`${Math.round(nutrition.hydration.current)}/${Math.round(nutrition.hydration.target)}`}
                  unit="ml"
                  progress={nutrition.hydration.progress}
                  color={colors.blue}
                />
                <StatCard
                  icon={Utensils}
                  label="Protein"
                  value={`${Math.round(nutrition.protein.current)}/${Math.round(nutrition.protein.target)}`}
                  unit="grams"
                  progress={nutrition.protein.progress}
                  color={colors.energy}
                />
                <StatCard
                  icon={Footprints}
                  label="Steps"
                  value={formatNumber(steps.steps)}
                  unit={`of ${formatNumber(steps.target)}`}
                  progress={steps.progress}
                  color={colors.primary}
                />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Today's Workout</Text>
                <Text style={styles.sectionSubtitle}>{formatWeekday()}</Text>
              </View>
              {workout ? (
                <TouchableOpacity style={styles.workoutCard} onPress={handleStartWorkout}>
                  <LinearGradient
                    colors={[colors.card + 'CC', colors.card + '80']}
                    style={styles.workoutCardGradient}
                  >
                    <View style={styles.workoutContent}>
                      <View style={styles.workoutInfo}>
                        <Text style={styles.workoutTitle}>{workout.name}</Text>
                        <View style={styles.workoutMeta}>
                          <View style={styles.workoutMetaItem}>
                            <Dumbbell size={16} color={colors.primary} strokeWidth={1.75} />
                            <Text style={styles.workoutMetaText}>{workout.exerciseCount} exercises</Text>
                          </View>
                          <View style={styles.workoutMetaItem}>
                            <Clock size={16} color={colors.energy} strokeWidth={1.75} />
                            <Text style={styles.workoutMetaText}>{workout.durationMinutes} min</Text>
                          </View>
                        </View>
                        <View style={styles.workoutBadge}>
                          <Text style={styles.workoutBadgeText}>{workout.type.toUpperCase()}</Text>
                        </View>
                      </View>
                      <LinearGradient
                        colors={[colors.primary, colors.vitalityLight]}
                        style={styles.playButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Play size={32} color={colors.black} strokeWidth={2} fill={colors.black} style={{ marginLeft: 4 }} />
                      </LinearGradient>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <FeedbackPanel
                  title="No workout scheduled"
                  message="Your plan hasn’t generated today’s session yet."
                />
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <QuickActionCard icon={MessageCircle} label="Wali AI" color={colors.purple} onPress={() => navigation.navigate('Coach')} />
                <QuickActionCard icon={Users} label="Squad" color={colors.blue} />
                <QuickActionCard icon={TrendingUp} label="Progress" color={colors.primary} />
                <QuickActionCard icon={PlusCircle} label="Quick Log" color={colors.energy} onPress={() => navigation.navigate('NutritionLog')} />
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function StatCard({ icon: Icon, label, value, unit, progress, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  progress: number;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderColor: color + '30' }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '1A' }]}>
        <Icon color={color} size={24} strokeWidth={1.75} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function QuickActionCard({ icon: Icon, label, color, onPress }: {
  icon: React.ElementType;
  label: string;
  color: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.quickActionCard, { borderColor: color + '30' }]} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '1A' }]}>
        <Icon color={color} size={28} strokeWidth={1.75} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function HomeSkeleton() {
  return (
    <>
      <View style={styles.header}>
        <View>
          <View style={[styles.skeletonBar, styles.skeletonHeaderEyebrow]} />
          <View style={[styles.skeletonBar, styles.skeletonHeaderName]} />
        </View>
        <View style={styles.skeletonCircle} />
      </View>

      <View style={styles.skeletonBadge} />
      <View style={styles.skeletonTree} />
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonStatCard} />
        <View style={styles.skeletonStatCard} />
        <View style={styles.skeletonStatCard} />
      </View>
      <View style={styles.skeletonWorkout} />
    </>
  );
}

function FeedbackCard({
  icon: Icon,
  iconColor,
  title,
  message,
  actionLabel,
  onPress,
}: {
  icon: React.ElementType;
  iconColor?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.feedbackCard}>
      <Icon size={28} color={iconColor ?? colors.primary} strokeWidth={1.75} />
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

function FeedbackPanel({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.feedbackPanel}>
      <Text style={styles.feedbackPanelTitle}>{title}</Text>
      <Text style={styles.feedbackPanelMessage}>{message}</Text>
    </View>
  );
}

function formatWeekday(): string {
  return new Date().toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  ambientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  ambientGradient: {
    position: 'absolute',
    width: 384,
    height: 384,
    borderRadius: 192,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  offlineBanner: {
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
    marginBottom: spacing.lg,
  },
  offlineBannerText: {
    flex: 1,
    color: colors.energy,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  welcomeText: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 1,
    marginBottom: 4,
  },
  nameText: {
    fontSize: typography.fontSize['3xl'],
    color: colors.foreground,
    fontWeight: typography.fontWeight.bold,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.secondary + '80',
    borderWidth: 1,
    borderColor: colors.border + '80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.md - 2,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.energy + '30',
    marginBottom: spacing.lg,
    gap: spacing.md - 2,
  },
  streakTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  streakNumber: {
    fontSize: typography.fontSize['2xl'],
    color: colors.energy,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.mono,
  },
  streakLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    fontWeight: typography.fontWeight.medium,
  },
  treeContainer: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    color: colors.foreground,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md - 4,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card + '80',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md - 2,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.mono,
    marginBottom: 2,
  },
  statUnit: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.muted + '33',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  workoutCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  workoutCardGradient: {
    borderWidth: 1,
    borderColor: colors.border + '80',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  workoutContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: typography.fontSize['2xl'],
    color: colors.foreground,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md - 2,
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: spacing.md + 4,
    marginBottom: spacing.md,
  },
  workoutMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  workoutMetaText: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    fontWeight: typography.fontWeight.medium,
  },
  workoutBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.primary + '1A',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderRadius: borderRadius.lg,
  },
  workoutBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md - 4,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: colors.card + '80',
    borderRadius: borderRadius.xl,
    padding: spacing.md + 4,
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  quickActionLabel: {
    fontSize: typography.fontSize.base,
    color: colors.foreground,
    fontWeight: typography.fontWeight.bold,
  },
  feedbackCard: {
    alignItems: 'center',
    backgroundColor: colors.card + 'CC',
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.border + '80',
    padding: spacing.xl,
    gap: spacing.sm,
    marginTop: spacing.xxl,
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
  feedbackButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.black,
    fontWeight: typography.fontWeight.bold,
  },
  feedbackPanel: {
    backgroundColor: colors.card + '80',
    borderWidth: 1,
    borderColor: colors.border + '80',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  feedbackPanelTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.foreground,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  feedbackPanelMessage: {
    fontSize: typography.fontSize.base,
    color: colors.mutedForeground,
    lineHeight: 22,
  },
  skeletonBar: {
    backgroundColor: colors.secondary,
    borderRadius: 999,
  },
  skeletonHeaderEyebrow: {
    width: 120,
    height: 12,
    marginBottom: spacing.sm,
  },
  skeletonHeaderName: {
    width: 180,
    height: 30,
  },
  skeletonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
  },
  skeletonBadge: {
    width: 140,
    height: 48,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.secondary,
    marginBottom: spacing.lg,
  },
  skeletonTree: {
    height: 420,
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: spacing.md - 4,
    marginBottom: spacing.lg,
  },
  skeletonStatCard: {
    flex: 1,
    height: 160,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonWorkout: {
    height: 132,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
