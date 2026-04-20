import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import {
  addDaysLocal,
  addMonthsLocal,
  buildMonthGrid,
  formatLocalDate,
  startOfWeekLocal,
  useCalendarDay,
  useCalendarRange,
  type CalendarDayItem,
} from '../hooks/useCalendarData';

type ViewMode = 'day' | 'week' | 'month';
type ScreenState = 'loading' | 'success' | 'empty' | 'error';

export default function CalendarScreen() {
  const [view, setView] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => formatLocalDate(new Date()));
  const [isModalVisible, setIsModalVisible] = useState(false);

  const rangeQuery = useCalendarRange(currentDate);
  const dayQuery = useCalendarDay(selectedDate);

  const rangeData = rangeQuery.data;
  const days = rangeData?.days ?? [];
  const monthStats = rangeData?.stats ?? { workouts: 0, streak: 0, avgScore: 0 };

  const state = useMemo<ScreenState>(() => {
    if (rangeQuery.isLoading) {
      return 'loading';
    }
    if (rangeQuery.isError && !rangeQuery.data) {
      return 'error';
    }
    if (!days.some((day) => day.hasActivity)) {
      return 'empty';
    }
    return 'success';
  }, [days, rangeQuery.data, rangeQuery.isError, rangeQuery.isLoading]);

  const monthLabel = useMemo(
    () => currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    [currentDate]
  );

  const weekDays = useMemo(() => {
    const start = startOfWeekLocal(currentDate);
    const byDate = new Map(days.map((day) => [day.date, day]));

    return Array.from({ length: 7 }, (_, index) => {
      const date = addDaysLocal(start, index);
      const key = formatLocalDate(date);
      return byDate.get(key) ?? {
        date: key,
        hasActivity: false,
        completed: false,
        type: 'rest' as const,
        score: 0,
        workoutName: null,
        exerciseCount: 0,
        durationMinutes: 0,
        hydrationMl: 0,
        proteinG: 0,
        stepsCount: 0,
        notes: null,
      };
    });
  }, [currentDate, days]);

  const monthGrid = useMemo(() => buildMonthGrid(currentDate, days), [currentDate, days]);
  const selectedDay = dayQuery.data;
  const offlineBanner = rangeQuery.isOfflineFallback || dayQuery.isOfflineFallback;

  const handlePrevious = () => {
    setCurrentDate((date) => {
      if (view === 'day') {
        return addDaysLocal(date, -1);
      }
      if (view === 'week') {
        return addDaysLocal(date, -7);
      }
      return addMonthsLocal(date, -1);
    });
  };

  const handleNext = () => {
    setCurrentDate((date) => {
      if (view === 'day') {
        return addDaysLocal(date, 1);
      }
      if (view === 'week') {
        return addDaysLocal(date, 7);
      }
      return addMonthsLocal(date, 1);
    });
  };

  const handleDatePress = (date: string) => {
    setSelectedDate(date);
    setIsModalVisible(true);
  };

  const retry = () => {
    void Promise.all([rangeQuery.refetch(), dayQuery.refetch()]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Calendar</Text>
        </View>
        <View style={styles.dateNav}>
          <TouchableOpacity style={styles.navBtn} accessibilityLabel="Previous" onPress={handlePrevious}>
            <Ionicons name="chevron-back" color={colors.foreground} size={20} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity style={styles.navBtn} accessibilityLabel="Next" onPress={handleNext}>
            <Ionicons name="chevron-forward" color={colors.foreground} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabBar}>
        {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.tab, view === mode && styles.tabActive]}
            onPress={() => setView(mode)}
          >
            <Text style={[styles.tabLabel, { color: view === mode ? colors.primary : colors.mutedForeground }]}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {offlineBanner ? (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color={colors.energy} />
            <Text style={styles.offlineBannerText}>Showing cached calendar data while reconnecting.</Text>
          </View>
        ) : null}

        {state === 'loading' ? <CalendarSkeleton /> : null}
        {state === 'empty' ? (
          <FeedbackCard
            icon="calendar-outline"
            title="No calendar activity yet"
            message="Your workouts, nutrition, and steps will appear here once you start logging."
          />
        ) : null}
        {state === 'error' ? (
          <FeedbackCard
            icon="alert-circle-outline"
            title="Couldn’t load calendar"
            message={rangeQuery.error instanceof Error ? rangeQuery.error.message : 'Please try again.'}
            actionLabel="Retry"
            onPress={retry}
          />
        ) : null}

        {state === 'success' ? (
          <>
            {view === 'day' ? (
              <DayView
                day={selectedDay}
                selectedDate={selectedDate}
                onDatePress={() => setIsModalVisible(true)}
                isLoading={dayQuery.isLoading}
              />
            ) : null}
            {view === 'week' ? <WeekView days={weekDays} onDatePress={handleDatePress} /> : null}
            {view === 'month' ? <MonthView cells={monthGrid} stats={monthStats} onDatePress={handleDatePress} /> : null}
          </>
        ) : null}
      </ScrollView>

      <DayDetailModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        date={selectedDate}
        day={selectedDay}
        isLoading={dayQuery.isLoading}
      />
    </View>
  );
}

function DayView({
  day,
  selectedDate,
  onDatePress,
  isLoading,
}: {
  day: ReturnType<typeof useCalendarDay>['data'];
  selectedDate: string;
  onDatePress: () => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <CalendarSkeleton compact />;
  }

  if (!day) {
    return (
      <View style={styles.viewContent}>
        <FeedbackPanel
          title="No activity for this day"
          message={`Nothing logged for ${formatSelectedDate(selectedDate)}.`}
          onPress={onDatePress}
          actionLabel="View day detail"
        />
      </View>
    );
  }

  return (
    <View style={styles.viewContent}>
      <TouchableOpacity style={styles.card} onPress={onDatePress} activeOpacity={0.8}>
        <Text style={styles.cardTitle}>{formatSelectedDate(selectedDate)}</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Workout</Text>
          <View style={styles.completedRow}>
            <Ionicons
              name={day.completed ? 'checkmark-circle' : 'ellipse-outline'}
              color={day.completed ? colors.primary : colors.mutedForeground}
              size={14}
            />
            <Text style={[styles.completedText, { color: day.completed ? colors.primary : colors.mutedForeground }]}>
              {day.completed ? 'Complete' : 'Not complete'}
            </Text>
          </View>
        </View>
        <Text style={styles.summaryValue}>{day.workoutName ?? 'Rest / recovery'}</Text>

        <View style={styles.divider} />

        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Steps</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{day.stepsCount.toLocaleString()}</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Protein</Text>
            <Text style={[styles.statValue, { color: colors.energy }]}>{day.proteinG}g</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Hydration</Text>
            <Text style={[styles.statValue, { color: colors.blue }]}>{day.hydrationMl}ml</Text>
          </View>
        </View>

        {day.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{day.notes}</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <View style={[styles.card, { borderColor: colors.primary + '40' }]}>
        <View style={styles.vitalityRow}>
          <View>
            <Text style={styles.summaryLabel}>Vitality Score</Text>
            <Text style={[styles.heroNumber, { color: colors.primary }]}>{day.vitalityScore}</Text>
          </View>
          <View style={[styles.vitalityCircle, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="checkmark-circle" color={colors.primary} size={32} />
          </View>
        </View>
      </View>
    </View>
  );
}

function WeekView({ days, onDatePress }: { days: CalendarDayItem[]; onDatePress: (date: string) => void }) {
  const workouts = days.filter((day) => day.type === 'training');
  const completed = workouts.filter((day) => day.completed).length;
  const avgScore = workouts.filter((day) => day.score > 0).reduce((sum, day, _, arr) => {
    return arr.length ? Math.round((sum + day.score) / arr.length) : 0;
  }, 0);

  return (
    <View style={styles.viewContent}>
      <View style={styles.weekGrid}>
        {days.map((day) => {
          const date = new Date(`${day.date}T12:00:00`);
          return (
            <TouchableOpacity
              key={day.date}
              style={[
                styles.dayCell,
                day.completed && { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
              ]}
              activeOpacity={0.7}
              onPress={() => onDatePress(day.date)}
            >
              <Text style={styles.dayCellDay}>
                {date.toLocaleDateString(undefined, { weekday: 'short' })}
              </Text>
              <Text style={styles.dayCellDate}>{date.getDate()}</Text>
              {day.type === 'training' ? (
                <View style={[styles.dayCellDot, { backgroundColor: day.completed ? colors.primary : colors.mutedForeground }]} />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Workouts</Text>
          <Text style={styles.statBig}>{completed}/{workouts.length}</Text>
          <Text style={styles.statSub}>completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Avg Vitality</Text>
          <Text style={[styles.statBig, { color: colors.primary }]}>{avgScore}</Text>
          <Text style={styles.statSub}>this week</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Training Days</Text>
      {workouts.map((day) => {
        const date = new Date(`${day.date}T12:00:00`);
        return (
          <TouchableOpacity key={day.date} style={[styles.card, styles.trainingRow]} onPress={() => onDatePress(day.date)}>
            <View>
              <Text style={styles.summaryLabel}>
                {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
              <Text style={styles.summaryValue}>{day.completed ? 'Workout Complete' : 'Upcoming'}</Text>
            </View>
            {day.score > 0 ? (
              <Text style={[styles.scoreText, { color: colors.primary }]}>{day.score}</Text>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MonthView({
  cells,
  stats,
  onDatePress,
}: {
  cells: Array<CalendarDayItem | null>;
  stats: { workouts: number; streak: number; avgScore: number };
  onDatePress: (date: string) => void;
}) {
  return (
    <View style={styles.viewContent}>
      <View style={styles.weekdayRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
          <Text key={label} style={styles.weekdayLabel}>{label}</Text>
        ))}
      </View>

      <View style={styles.monthGrid}>
        {cells.map((day, index) => {
          if (!day) {
            return <View key={`blank-${index}`} style={styles.monthCellBlank} />;
          }

          const date = new Date(`${day.date}T12:00:00`);
          return (
            <TouchableOpacity
              key={day.date}
              style={[
                styles.monthCell,
                day.hasActivity && {
                  borderColor: colors.primary,
                  backgroundColor: colors.primary + '15',
                },
                !day.hasActivity && { opacity: 0.5 },
              ]}
              activeOpacity={0.7}
              onPress={() => onDatePress(day.date)}
            >
              <Text style={styles.monthDate}>{date.getDate()}</Text>
              {day.hasActivity ? <View style={[styles.monthDot, { backgroundColor: colors.primary }]} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.monthStats}>
        <View style={styles.monthStatCard}>
          <Text style={[styles.monthStatValue, { color: colors.primary }]}>{stats.workouts}</Text>
          <Text style={styles.monthStatLabel}>Workouts</Text>
        </View>
        <View style={styles.monthStatCard}>
          <Text style={[styles.monthStatValue, { color: colors.energy }]}>{stats.streak}</Text>
          <Text style={styles.monthStatLabel}>Day Streak</Text>
        </View>
        <View style={styles.monthStatCard}>
          <Text style={[styles.monthStatValue, { color: colors.primary }]}>{stats.avgScore}%</Text>
          <Text style={styles.monthStatLabel}>Avg Score</Text>
        </View>
      </View>
    </View>
  );
}

function DayDetailModal({
  visible,
  onClose,
  date,
  day,
  isLoading,
}: {
  visible: boolean;
  onClose: () => void;
  date: string;
  day: ReturnType<typeof useCalendarDay>['data'];
  isLoading: boolean;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.cardTitle}>Day Detail</Text>
              <Text style={styles.summaryLabel}>{formatSelectedDate(date)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.navBtn}>
              <Ionicons name="close" color={colors.foreground} size={20} />
            </TouchableOpacity>
          </View>

          {isLoading ? <CalendarSkeleton compact /> : null}

          {!isLoading && !day ? (
            <FeedbackPanel
              title="No activity for this day"
              message="There’s no workout, nutrition, or step detail logged here yet."
            />
          ) : null}

          {!isLoading && day ? (
            <View style={styles.modalBody}>
              <View style={styles.card}>
                <Text style={styles.summaryLabel}>Workout</Text>
                <Text style={styles.summaryValue}>{day.workoutName ?? 'Rest / recovery'}</Text>
                <View style={styles.divider} />
                <Text style={styles.notesText}>
                  {day.exerciseCount > 0 ? `${day.exerciseCount} exercises · ${day.durationMinutes} min` : 'No workout details'}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Nutrition + Steps</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statCell}>
                    <Text style={styles.statLabel}>Protein</Text>
                    <Text style={[styles.statValue, { color: colors.energy }]}>{day.proteinG}g</Text>
                  </View>
                  <View style={styles.statCell}>
                    <Text style={styles.statLabel}>Hydration</Text>
                    <Text style={[styles.statValue, { color: colors.blue }]}>{day.hydrationMl}ml</Text>
                  </View>
                  <View style={styles.statCell}>
                    <Text style={styles.statLabel}>Steps</Text>
                    <Text style={[styles.statValue, { color: colors.primary }]}>{day.stepsCount.toLocaleString()}</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.card, styles.trainingRow]}>
                <View>
                  <Text style={styles.summaryLabel}>Vitality Score</Text>
                  <Text style={[styles.heroNumber, { color: colors.primary }]}>{day.vitalityScore}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
              </View>

              {day.notes ? (
                <View style={styles.card}>
                  <Text style={styles.notesLabel}>Notes</Text>
                  <Text style={styles.notesText}>{day.notes}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
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

function FeedbackPanel({
  title,
  message,
  actionLabel,
  onPress,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.feedbackPanel}>
      <Text style={styles.feedbackPanelTitle}>{title}</Text>
      <Text style={styles.feedbackPanelMessage}>{message}</Text>
      {actionLabel && onPress ? (
        <TouchableOpacity onPress={onPress} style={styles.feedbackInlineButton}>
          <Text style={styles.feedbackInlineButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function CalendarSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.viewContent}>
      <View style={[styles.skeletonCard, compact && styles.skeletonCardCompact]} />
      <View style={styles.skeletonGrid}>
        {Array.from({ length: compact ? 2 : 7 }, (_, index) => (
          <View key={index} style={styles.skeletonCell} />
        ))}
      </View>
      {!compact ? <View style={styles.skeletonCard} /> : null}
    </View>
  );
}

function formatSelectedDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.sm, gap: spacing.md },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.foreground },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.foreground },
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.lg,
    minHeight: 44,
  },
  tabActive: { backgroundColor: colors.card },
  tabLabel: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  offlineBanner: {
    minHeight: 44,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
  offlineBannerText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.energy,
    fontWeight: typography.fontWeight.medium,
  },
  viewContent: { paddingHorizontal: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.foreground },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { fontSize: typography.fontSize.sm, color: colors.mutedForeground },
  summaryValue: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.foreground },
  completedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  completedText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
  divider: { height: 1, backgroundColor: colors.border },
  statsGrid: { flexDirection: 'row', gap: spacing.sm },
  statCell: { flex: 1, gap: 3 },
  statLabel: { fontSize: typography.fontSize.xs, color: colors.mutedForeground },
  statValue: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.foreground },
  notesBox: { backgroundColor: colors.secondary, borderRadius: borderRadius.md, padding: spacing.sm, gap: 3 },
  notesLabel: { fontSize: typography.fontSize.xs, color: colors.mutedForeground },
  notesText: { fontSize: typography.fontSize.sm, color: colors.foreground },
  vitalityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroNumber: { fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.extrabold },
  vitalityCircle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  weekGrid: { flexDirection: 'row', gap: spacing.xs },
  dayCell: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayCellDay: { fontSize: 9, color: colors.mutedForeground },
  dayCellDate: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.foreground },
  dayCellDot: { width: 5, height: 5, borderRadius: 3 },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statBig: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.foreground },
  statSub: { fontSize: typography.fontSize.xs, color: colors.mutedForeground },
  sectionTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.foreground },
  trainingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreText: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold },
  weekdayRow: { flexDirection: 'row' },
  weekdayLabel: { flex: 1, textAlign: 'center', fontSize: typography.fontSize.xs, color: colors.mutedForeground, paddingVertical: spacing.xs },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  monthCellBlank: { width: '12.5%', aspectRatio: 1 },
  monthCell: {
    width: '12.5%',
    aspectRatio: 1,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  monthDate: { fontSize: 11, fontWeight: typography.fontWeight.semibold, color: colors.foreground },
  monthDot: { width: 4, height: 4, borderRadius: 2 },
  monthStats: { flexDirection: 'row', gap: spacing.sm },
  monthStatCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 3,
  },
  monthStatValue: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold },
  monthStatLabel: { fontSize: typography.fontSize.xs, color: colors.mutedForeground },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '84%',
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalBody: { gap: spacing.md },
  feedbackCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
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
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  feedbackPanelTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.foreground,
  },
  feedbackPanelMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    lineHeight: 20,
  },
  feedbackInlineButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.primary,
    justifyContent: 'center',
  },
  feedbackInlineButtonText: {
    color: colors.black,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  skeletonCard: {
    height: 140,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonCardCompact: {
    height: 100,
  },
  skeletonGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  skeletonCell: {
    flexGrow: 1,
    minWidth: 40,
    height: 64,
    borderRadius: borderRadius.md,
    backgroundColor: colors.secondary,
  },
});
