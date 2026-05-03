import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AlertCircle,
  BookOpen,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Dumbbell,
  Inbox,
  Library,
  Play,
  Plus,
  Sparkles,
} from 'lucide-react-native';
import { ChipSelector } from '../components/ChipSelector';
import { borderRadius, colors, spacing, touchTarget, typography } from '../theme';
import type { RootStackParamList } from '../App';
import { useTrainData, type TodayWorkout, type WorkoutHistoryItem } from '../hooks/useTrainData';

type DataState = 'loading' | 'success' | 'empty' | 'error';

interface RecentWorkoutCardData {
  id: string;
  date: string;
  primaryExercise: string;
  exerciseCount: number;
  duration: number;
  rpe?: number;
}

function deriveState(
  isLoading: boolean,
  isError: boolean,
  items: WorkoutHistoryItem[] | undefined,
): DataState {
  if (isLoading && !items) return 'loading';
  if (isError && !items) return 'error';
  if (!items || items.length === 0) return 'empty';
  return 'success';
}

export default function TrainScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [duration, setDuration] = useState<string[]>(['45 min']);
  const [focus, setFocus] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>(['Barbell', 'Dumbbells']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isWaliExpanded, setIsWaliExpanded] = useState(true);

  const { todayWorkout, history, historyQuery } = useTrainData(20);

  const inProgress = todayWorkout && !todayWorkout.finishedAt ? todayWorkout : null;

  const historyState = deriveState(
    historyQuery.isLoading,
    historyQuery.isError,
    historyQuery.data,
  );

  const recentWorkouts: RecentWorkoutCardData[] = history.slice(0, 6).map((w) => ({
    id: w.id,
    date: formatRecentDate(w.completedAt ?? w.finishedAt),
    primaryExercise: w.name,
    exerciseCount: w.exerciseCount,
    duration: w.durationMinutes,
  }));

  const handleStartBlankWorkout = () => {
    navigation.navigate('ActiveWorkout', {
      workout: {
        id: `blank-${Date.now()}`,
        name: 'Quick Workout',
        type: 'custom',
        exerciseCount: 0,
        durationMinutes: 0,
      },
    });
  };

  const handleOpenBuilder = () => {
    navigation.navigate('WorkoutBuilder');
  };

  const handleResumeWorkout = (workout: TodayWorkout) => {
    navigation.navigate('ActiveWorkout', {
      workout: {
        id: workout.id,
        name: workout.name,
        type: workout.type,
        exerciseCount: workout.sets.length,
        durationMinutes: 0,
      },
    });
  };

  const handleGenerateWorkout = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      handleStartBlankWorkout();
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 96 + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Resume in-progress workout */}
        {inProgress ? (
          <Pressable
            onPress={() => handleResumeWorkout(inProgress)}
            style={styles.resumeCard}
          >
            <View style={styles.iconCircleLarge}>
              <Dumbbell size={24} color={colors.primary} strokeWidth={1.75} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.resumeKicker}>In progress</Text>
              <Text style={styles.h2}>{inProgress.name}</Text>
              <Text style={styles.muted}>
                {inProgress.sets.length === 0
                  ? 'Started — no sets logged yet'
                  : `${inProgress.sets.length} set${inProgress.sets.length === 1 ? '' : 's'} logged · ${formatStartedAt(inProgress.startedAt)}`}
              </Text>
            </View>
            <View style={styles.resumeIconButton}>
              <Play size={20} color={colors.primaryFg} strokeWidth={2} />
            </View>
          </Pressable>
        ) : null}

        {/* Build Program empty card */}
        <View style={styles.buildProgramCard}>
          <View style={styles.iconCircleLarge}>
            <CalendarIcon size={24} color={colors.primary} strokeWidth={1.75} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.h2}>Build Your Program</Text>
            <Text style={styles.muted}>
              Create a custom training program with your own exercises, sets, and progression.
            </Text>
            <Pressable
              onPress={handleOpenBuilder}
              style={[styles.primaryButton, { marginTop: spacing.md }]}
              testID="train-create-program"
            >
              <Text style={styles.primaryButtonText}>Create Program</Text>
            </Pressable>
          </View>
        </View>

        {/* Ask Wali */}
        <View style={styles.waliCard}>
          <Pressable
            onPress={() => setIsWaliExpanded(!isWaliExpanded)}
            style={styles.waliHeader}
          >
            <View style={styles.iconCircleSmall}>
              <Sparkles size={20} color={colors.primary} strokeWidth={1.75} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.h2}>Ask Wali for a Workout</Text>
              <Text style={styles.muted}>Quick, personalised, ready in seconds</Text>
            </View>
            {isWaliExpanded ? (
              <ChevronUp size={20} color={colors.mutedForeground} strokeWidth={1.75} />
            ) : (
              <ChevronDown size={20} color={colors.mutedForeground} strokeWidth={1.75} />
            )}
          </Pressable>

          {isWaliExpanded && (
            <View style={styles.waliBody}>
              <View>
                <Text style={styles.tinyLabel}>Duration</Text>
                <ChipSelector
                  options={['20 min', '30 min', '45 min', '60 min', '90 min']}
                  selected={duration}
                  onSelect={setDuration}
                />
              </View>
              <View>
                <Text style={styles.tinyLabel}>Focus</Text>
                <ChipSelector
                  options={[
                    'Upper Body',
                    'Lower Body',
                    'Full Body',
                    'Push',
                    'Pull',
                    'Legs',
                    'Cardio',
                    'Core',
                  ]}
                  selected={focus}
                  onSelect={setFocus}
                />
              </View>
              <View>
                <Text style={styles.tinyLabel}>Equipment</Text>
                <ChipSelector
                  options={[
                    'Barbell',
                    'Dumbbells',
                    'Machines',
                    'Cables',
                    'Bodyweight',
                    'Kettlebell',
                  ]}
                  selected={equipment}
                  onSelect={setEquipment}
                  multiSelect
                />
              </View>
              <Pressable
                onPress={handleGenerateWorkout}
                disabled={isGenerating}
                style={[styles.primaryButtonLarge, isGenerating && { opacity: 0.6 }]}
              >
                {isGenerating ? (
                  <View style={styles.row8}>
                    <ActivityIndicator size="small" color={colors.primaryFg} />
                    <Text style={styles.primaryButtonText}>
                      Wali is building your workout…
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>Generate Workout</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {/* Recent */}
        <View>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.h3}>Recent</Text>
            <Pressable style={styles.row4}>
              <Text style={styles.linkPrimary}>See all</Text>
              <ChevronRight size={16} color={colors.primary} strokeWidth={1.75} />
            </Pressable>
          </View>

          {historyState === 'loading' ? (
            <View style={styles.recentLoadingRow}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={styles.recentSkeleton} />
              ))}
            </View>
          ) : historyState === 'error' ? (
            <View style={styles.feedbackCard}>
              <AlertCircle size={20} color={colors.destructive} strokeWidth={1.75} />
              <Text style={styles.feedbackTitle}>Couldn’t load history</Text>
              <Pressable
                onPress={() => {
                  void historyQuery.refetch();
                }}
                style={[styles.primaryButton, { marginTop: spacing.sm }]}
              >
                <Text style={styles.primaryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : historyState === 'empty' ? (
            <View style={styles.feedbackCard}>
              <Inbox size={20} color={colors.mutedForeground} strokeWidth={1.75} />
              <Text style={styles.feedbackTitle}>No recent workouts</Text>
              <Text style={styles.muted}>Completed sessions will appear here.</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: spacing.sm + 4,
                paddingBottom: spacing.sm,
              }}
            >
              {recentWorkouts.map((workout) => (
                <Pressable
                  key={workout.id}
                  onPress={handleStartBlankWorkout}
                  style={styles.recentCard}
                >
                  <Text style={styles.muted}>{workout.date}</Text>
                  <Text style={styles.recentTitle}>{workout.primaryExercise}</Text>
                  <View style={styles.recentMeta}>
                    <Text style={styles.recentMetaText}>
                      {workout.exerciseCount} exercises
                    </Text>
                    <Text style={styles.recentMetaText}>•</Text>
                    <Text style={styles.recentMetaText}>{workout.duration} min</Text>
                    {workout.rpe != null && (
                      <>
                        <Text style={styles.recentMetaText}>•</Text>
                        <View style={styles.rpePill}>
                          <Text style={styles.rpePillText}>RPE {workout.rpe}</Text>
                        </View>
                      </>
                    )}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Secondary actions */}
        <View style={{ gap: spacing.sm }}>
          <Pressable style={styles.actionRow}>
            <View style={styles.row12}>
              <BookOpen size={20} color={colors.primary} strokeWidth={1.75} />
              <View>
                <Text style={styles.actionTitle}>My Templates</Text>
                <Text style={styles.muted}>Saved templates</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.mutedForeground} strokeWidth={1.75} />
          </Pressable>

          <Pressable style={styles.actionRow}>
            <View style={styles.row12}>
              <Library size={20} color={colors.primary} strokeWidth={1.75} />
              <View>
                <Text style={styles.actionTitle}>Exercise Library</Text>
                <Text style={styles.muted}>500+ exercises</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.mutedForeground} strokeWidth={1.75} />
          </Pressable>
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={handleStartBlankWorkout}
        style={[styles.fab, { bottom: insets.bottom + spacing.lg + 60 }]}
      >
        <Plus size={24} color={colors.primaryFg} strokeWidth={2} />
      </Pressable>
    </SafeAreaView>
  );
}

function formatRecentDate(value?: string | null): string {
  if (!value) return 'Recent';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recent';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatStartedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'started today';
  return `started ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.lg,
    maxWidth: 672,
    width: '100%',
    alignSelf: 'center',
  },
  h2: {
    fontSize: typography.fontSize.lg,
    color: colors.foreground,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  h3: {
    fontSize: typography.fontSize.lg,
    color: colors.foreground,
    fontWeight: typography.fontWeight.semibold,
  },
  muted: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
  },
  tinyLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  buildProgramCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  resumeCard: {
    backgroundColor: colors.card,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resumeKicker: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  resumeIconButton: {
    width: touchTarget.comfortable,
    height: touchTarget.comfortable,
    borderRadius: touchTarget.comfortable / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    width: '100%',
    minHeight: touchTarget.comfortable,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonLarge: {
    width: '100%',
    minHeight: touchTarget.workout,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.primaryFg,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.base,
  },
  linkPrimary: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
  },
  waliCard: {
    backgroundColor: colors.card,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  waliHeader: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  waliBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm + 4,
  },
  recentCard: {
    width: 256,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recentTitle: {
    fontSize: typography.fontSize.base,
    color: colors.foreground,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  recentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  recentMetaText: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
  },
  rpePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.primary + '33',
    borderRadius: borderRadius.sm,
  },
  rpePillText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
  recentLoadingRow: { flexDirection: 'row', gap: spacing.sm + 4 },
  recentSkeleton: {
    width: 256,
    height: 100,
    borderRadius: borderRadius.md,
    backgroundColor: colors.secondary,
  },
  feedbackCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  feedbackTitle: {
    fontSize: typography.fontSize.base,
    color: colors.foreground,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  actionRow: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionTitle: {
    fontSize: typography.fontSize.base,
    color: colors.foreground,
    fontWeight: typography.fontWeight.semibold,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: touchTarget.workout,
    height: touchTarget.workout,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  row4: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  row8: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  row12: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4 },
});
