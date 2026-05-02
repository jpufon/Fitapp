import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Activity,
  AlertCircle,
  Award,
  Calendar as CalendarIcon,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Target,
  Trophy,
  Zap,
} from 'lucide-react-native';
import { borderRadius, colors, spacing, typography } from '../theme';
import {
  addDaysLocal,
  addMonthsLocal,
  formatLocalDate,
  startOfWeekLocal,
  useCalendarDay,
  useCalendarRange,
  type CalendarDayItem,
} from '../hooks/useCalendarData';

type DataState = 'loading' | 'success' | 'empty' | 'error';
type CalendarView = 'day' | 'week' | 'month';
type CalendarDayWithVitality = CalendarDayItem & { vitalityScore: number };

const PROTEIN_GOAL_G = 160;
const HYDRATION_GOAL_ML = 3000;

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<CalendarView>('week');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => formatLocalDate(new Date()));

  const rangeQuery = useCalendarRange(currentDate);
  const dayQuery = useCalendarDay(selectedDate);

  const days = rangeQuery.data?.days ?? [];
  const daysByDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);

  const state = useMemo<DataState>(() => {
    if (rangeQuery.isLoading && !rangeQuery.data) return 'loading';
    if (rangeQuery.isError && !rangeQuery.data) return 'error';
    if (!days.length) return 'empty';
    return 'success';
  }, [days.length, rangeQuery.data, rangeQuery.isError, rangeQuery.isLoading]);

  const monthLabel = useMemo(
    () =>
      currentDate.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      }),
    [currentDate],
  );

  const monthCells = useMemo(
    () => buildMondayFirstGrid(currentDate, days),
    [currentDate, days],
  );

  const weekDays = useMemo(() => {
    const start = startOfMondayWeekLocal(parseLocalDate(selectedDate));
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDaysLocal(start, index);
      const key = formatLocalDate(date);
      return daysByDate.get(key) ?? emptyCalendarDay(key);
    });
  }, [daysByDate, selectedDate]);

  const selectedDayPreview = useMemo<CalendarDayWithVitality>(() => {
    const day = daysByDate.get(selectedDate) ?? emptyCalendarDay(selectedDate);
    return { ...day, vitalityScore: day.score };
  }, [daysByDate, selectedDate]);
  const selectedDay = dayQuery.data ?? selectedDayPreview;
  const todayString = formatLocalDate(new Date());
  const stats = rangeQuery.data?.stats ?? getCalendarStats(days);
  const selectedScore = Math.round(selectedDay?.vitalityScore ?? selectedDay?.score ?? 0);

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate((current) => (current === date ? current : date));
  }, []);

  const navigateMonth = (direction: number) => {
    setCurrentDate((date) => addMonthsLocal(date, direction));
  };

  const now = new Date();
  const isFutureMonth =
    currentDate.getFullYear() > now.getFullYear() ||
    (currentDate.getFullYear() === now.getFullYear() &&
      currentDate.getMonth() >= now.getMonth());

  const trainingPct = selectedDay?.completed ? 100 : Math.round(selectedDay?.score ?? 0);
  const nutritionPct = selectedDay
    ? Math.min(100, Math.round((selectedDay.proteinG / PROTEIN_GOAL_G) * 100))
    : 0;
  const hydrationPct = selectedDay
    ? Math.min(100, Math.round((selectedDay.hydrationMl / HYDRATION_GOAL_ML) * 100))
    : 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xxl + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.primary + '20', colors.energy + '12', colors.card]}
          style={styles.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.kickerRow}>
                <CalendarIcon size={16} color={colors.primary} strokeWidth={1.75} />
                <Text style={styles.kickerText}>Training rhythm</Text>
              </View>
              <Text style={styles.screenTitle}>Calendar</Text>
              <Text style={styles.monthLabel}>{monthLabel}</Text>
            </View>
            <View style={styles.row8}>
              <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.iconButton}>
                <ChevronLeft size={20} color={colors.foreground} strokeWidth={1.75} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigateMonth(1)}
                disabled={isFutureMonth}
                style={[styles.iconButton, isFutureMonth && { opacity: 0.4 }]}
              >
                <ChevronRight size={20} color={colors.foreground} strokeWidth={1.75} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.signalRow}>
            <SignalPill icon={Dumbbell} label="Sessions" value={`${stats.workouts}`} color={colors.primary} />
            <SignalPill icon={Zap} label="Streak" value={`${stats.streak} days`} color={colors.energy} />
            <SignalPill icon={Activity} label="Average" value={`${stats.avgScore}`} color={colors.blue} />
          </View>
        </LinearGradient>

        <View style={styles.tabBar}>
          {(['day', 'week', 'month'] as CalendarView[]).map((item) => {
            const isActive = view === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setView(item)}
                style={[styles.tab, isActive && styles.tabActive]}
                testID={`calendar-tab-${item}`}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {capitalize(item)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {state === 'loading' ? <CalendarSkeleton /> : null}

        {state === 'error' ? (
          <FeedbackCard
            icon={AlertCircle}
            iconColor={colors.destructive}
            title="Couldn’t load calendar"
            message={
              rangeQuery.error instanceof Error
                ? rangeQuery.error.message
                : 'Please try again.'
            }
            actionLabel="Retry"
            onPress={() => {
              void rangeQuery.refetch();
            }}
          />
        ) : null}

        {state === 'empty' ? (
          <FeedbackCard
            icon={CalendarIcon}
            title="No calendar activity yet"
            message="Workouts, nutrition, and steps will appear here once you start logging."
          />
        ) : null}

        {state === 'success' ? (
          <>
            <FocusPanel
              view={view}
              selectedDate={selectedDate}
              selectedScore={selectedScore}
              stats={stats}
              selectedDay={selectedDay}
            />

            {view === 'day' ? (
              <DayView
                selectedDate={selectedDate}
                selectedDay={selectedDay}
                trainingPct={trainingPct}
                nutritionPct={nutritionPct}
                hydrationPct={hydrationPct}
              />
            ) : null}

            {view === 'week' ? (
              <WeekView
                weekDays={weekDays}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
              />
            ) : null}

            {view === 'month' ? (
              <MonthView
                monthCells={monthCells}
                selectedDate={selectedDate}
                todayString={todayString}
                stats={stats}
                onSelectDate={handleSelectDate}
              />
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function DayView({
  selectedDate,
  selectedDay,
  trainingPct,
  nutritionPct,
  hydrationPct,
}: {
  selectedDate: string;
  selectedDay: (CalendarDayItem & { vitalityScore: number }) | null | undefined;
  trainingPct: number;
  nutritionPct: number;
  hydrationPct: number;
}) {
  return (
    <View style={styles.viewContent}>
      <LinearGradient
        colors={[getVitalityColor(selectedDay?.vitalityScore ?? 0) + '22', colors.card]}
        style={styles.dayBreakdown}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.row8}>
          <CalendarIcon size={18} color={colors.primary} strokeWidth={1.75} />
          <Text style={styles.h2}>{formatHumanDate(selectedDate)}</Text>
        </View>
        <Text style={styles.bigPercent}>
          {Math.round(selectedDay?.vitalityScore ?? 0)}%
        </Text>
        <View style={{ gap: spacing.sm }}>
          <Bar label="Training" pct={trainingPct} />
          <Bar label="Nutrition" pct={nutritionPct} />
          <Bar label="Hydration" pct={hydrationPct} />
        </View>
      </LinearGradient>

      <View style={styles.statsGrid}>
        <StatCard label="Steps" value={(selectedDay?.stepsCount ?? 0).toLocaleString()} />
        <StatCard label="Protein" value={`${selectedDay?.proteinG ?? 0}g`} accent={colors.energy} />
        <StatCard label="Hydration" value={`${selectedDay?.hydrationMl ?? 0}ml`} accent={colors.blue} />
      </View>

      <View style={{ gap: spacing.sm + 4 }}>
        {selectedDay && selectedDay.workoutName ? (
          <View style={styles.feedCard}>
            <View style={styles.row8}>
              <Dumbbell size={20} color={colors.primary} strokeWidth={1.75} />
              <Text style={styles.feedTitle}>Workout</Text>
              <Text style={styles.muted}>· {selectedDay.durationMinutes} min</Text>
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>Training day</Text>
              </View>
            </View>
            <Text style={[styles.foregroundText, { marginTop: spacing.sm }]}>
              {selectedDay.workoutName}
            </Text>
            <Text style={styles.muted}>{selectedDay.exerciseCount} exercises</Text>
          </View>
        ) : selectedDay?.type === 'rest' ? (
          <View style={styles.feedCard}>
            <View style={styles.row8}>
              <Text style={styles.feedTitle}>Rest day</Text>
              <View style={[styles.dayBadge, { backgroundColor: colors.growth + '20' }]}>
                <Text style={[styles.dayBadgeText, { color: colors.growth }]} testID="calendar-rest-recovery-badge">Recovery</Text>
              </View>
            </View>
            <Text style={[styles.muted, { marginTop: spacing.xs }]}>
              Recovery counts — your streak is protected and hydration + protein still score.
            </Text>
          </View>
        ) : (
          <View style={styles.feedCard}>
            <View style={styles.row8}>
              <Text style={styles.feedTitle}>No workout logged</Text>
              <View style={[styles.dayBadge, { backgroundColor: colors.energy + '20' }]}>
                <Text style={[styles.dayBadgeText, { color: colors.energy }]}>Training day</Text>
              </View>
            </View>
            <Text style={[styles.muted, { marginTop: spacing.xs }]}>
              Activity for this day will appear here after logging.
            </Text>
          </View>
        )}

        {selectedDay && (selectedDay.score ?? 0) >= 90 ? (
          <View style={[styles.feedCard, { borderColor: colors.energy + '80' }]}>
            <View style={styles.row8}>
              <Trophy size={20} color={colors.energy} strokeWidth={1.75} />
              <Text style={styles.feedTitle}>Personal Record</Text>
            </View>
            <Text style={[styles.foregroundText, { marginTop: spacing.sm }]}>
              Strong session — top vitality day this week.
            </Text>
          </View>
        ) : null}

        {selectedDay?.notes ? (
          <View style={styles.feedCard}>
            <View style={styles.row8}>
              <Award size={20} color={colors.primary} strokeWidth={1.75} />
              <Text style={styles.feedTitle}>Notes</Text>
            </View>
            <Text style={[styles.foregroundText, { marginTop: spacing.sm }]}>
              {selectedDay.notes}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function WeekView({
  weekDays,
  selectedDate,
  onSelectDate,
}: {
  weekDays: CalendarDayItem[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const completedCount = weekDays.filter((day) => day.completed).length;
  const trainingDays = weekDays.filter((day) => day.type === 'training' || day.hasActivity);
  const scoredDays = weekDays.filter((day) => day.score > 0);
  const avgScore = scoredDays.length
    ? Math.round(scoredDays.reduce((sum, day) => sum + day.score, 0) / scoredDays.length)
    : 0;

  return (
    <View style={styles.viewContent}>
      <View style={styles.weekGrid}>
        {weekDays.map((day) => {
          const date = parseLocalDate(day.date);
          const isSelected = day.date === selectedDate;
          return (
            <TouchableOpacity
              key={day.date}
              onPress={() => onSelectDate(day.date)}
              delayPressIn={0}
              style={[
                styles.weekGridCell,
                day.completed && styles.weekGridCellCompleted,
                isSelected && styles.weekGridCellSelected,
                day.score >= 90 && !isSelected && styles.weekGridCellPeak,
              ]}
              activeOpacity={0.75}
            >
              <Text style={[styles.weekGridDay, isSelected && styles.dayTextSelected]}>
                {date.toLocaleDateString(undefined, { weekday: 'short' })}
              </Text>
              <Text style={[styles.weekGridDate, isSelected && styles.dayTextSelected]}>
                {date.getDate()}
              </Text>
              {day.hasActivity ? (
                <View
                  style={[
                    styles.vitalityDot,
                    {
                      backgroundColor: isSelected ? colors.primaryFg : getVitalityColor(day.score),
                    },
                  ]}
                />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Workouts" value={`${completedCount}/${trainingDays.length || 7}`} />
        <StatCard label="Avg Vitality" value={`${avgScore}`} accent={colors.primary} />
      </View>

      <View style={styles.weekConsistency}>
        <View style={styles.kickerRow}>
          <Activity size={14} color={colors.primary} strokeWidth={1.75} />
          <Text style={styles.muted}>{completedCount} of 7 days active this week</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Training Days</Text>
      {trainingDays.map((day) => (
        <TouchableOpacity
          key={day.date}
          onPress={() => onSelectDate(day.date)}
          style={styles.trainingRow}
          activeOpacity={0.75}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>
              {parseLocalDate(day.date).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.summaryValue}>
              {day.workoutName ?? (day.completed ? 'Workout complete' : 'Upcoming')}
            </Text>
          </View>
          {day.completed ? (
            <CheckCircle size={18} color={colors.primary} strokeWidth={1.75} />
          ) : null}
          {day.score > 0 ? (
            <Text style={[styles.scoreText, { color: getVitalityColor(day.score) }]}>
              {day.score}
            </Text>
          ) : null}
        </TouchableOpacity>
      ))}
    </View>
  );
}

function MonthView({
  monthCells,
  selectedDate,
  todayString,
  stats,
  onSelectDate,
}: {
  monthCells: Array<CalendarDayItem | null>;
  selectedDate: string;
  todayString: string;
  stats: { workouts: number; streak: number; avgScore: number };
  onSelectDate: (date: string) => void;
}) {
  return (
    <View style={styles.viewContent}>
      <View style={styles.calendarBox}>
        <View style={styles.weekRow}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => (
            <View key={i} style={styles.weekDayCell}>
              <Text style={styles.weekDayText}>{label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.dayGrid}>
          {monthCells.map((cell, idx) => {
            if (!cell) {
              return <View key={`b-${idx}`} style={styles.dayCellPlaceholder} />;
            }
            const dayNum = parseLocalDate(cell.date).getDate();
            const isSelected = cell.date === selectedDate;
            const isToday = cell.date === todayString;
            const score = cell.score;
            const hasPR = score >= 90;

            return (
              <Pressable
                key={cell.date}
                onPress={() => onSelectDate(cell.date)}
                unstable_pressDelay={0}
                style={[
                  styles.dayCell,
                  cell.hasActivity && !isSelected && {
                    backgroundColor: getVitalityColor(score) + '14',
                    borderColor: getVitalityColor(score) + '55',
                  },
                  isSelected && styles.dayCellSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.dayTextSelected,
                    isToday && !isSelected && styles.dayTextToday,
                  ]}
                >
                  {dayNum}
                </Text>
                {cell.hasActivity ? (
                  <View
                    style={[
                      styles.vitalityDot,
                      {
                        backgroundColor: isSelected
                          ? colors.primaryFg
                          : getVitalityColor(score),
                      },
                    ]}
                  />
                ) : null}
                {hasPR && !isSelected ? <View style={styles.prRing} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Workouts" value={`${stats.workouts}`} />
        <StatCard label="Streak" value={`${stats.streak}`} accent={colors.energy} />
        <StatCard label="Avg Vitality" value={`${stats.avgScore}`} accent={colors.primary} />
      </View>
    </View>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent ? { color: accent } : null]}>{value}</Text>
    </View>
  );
}

function SignalPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[styles.signalPill, { borderColor: color + '40' }]}>
      <Icon size={15} color={color} strokeWidth={1.75} />
      <View>
        <Text style={styles.signalLabel}>{label}</Text>
        <Text style={styles.signalValue}>{value}</Text>
      </View>
    </View>
  );
}

function FocusPanel({
  view,
  selectedDate,
  selectedScore,
  stats,
  selectedDay,
}: {
  view: CalendarView;
  selectedDate: string;
  selectedScore: number;
  stats: { workouts: number; streak: number; avgScore: number };
  selectedDay: (CalendarDayItem & { vitalityScore?: number }) | null | undefined;
}) {
  const hasWorkout = Boolean(selectedDay?.workoutName);
  const insight =
    view === 'month'
      ? `${stats.workouts} sessions logged this month.`
      : view === 'week'
        ? `Weekly rhythm is tracking at ${stats.avgScore || selectedScore} vitality.`
        : hasWorkout
          ? `${selectedDay?.workoutName} is on the board for this day.`
          : 'No session logged here yet.';

  return (
    <View style={styles.insightPanel}>
      <View style={styles.insightIcon}>
        <Target size={20} color={colors.primaryFg} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.insightTitle}>Day focus</Text>
        <Text style={styles.insightText}>
          {formatHumanDate(selectedDate)} · {insight}
        </Text>
      </View>
    </View>
  );
}

function Bar({ label, pct }: { label: string; pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <View style={styles.barRow}>
      <Text style={[styles.muted, { width: 96 }]}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${clamped}%` }]} />
      </View>
      <Text style={styles.foregroundText}>{clamped}%</Text>
    </View>
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

function CalendarSkeleton() {
  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.skeletonGrid} />
      <View style={styles.skeletonRow} />
      <View style={styles.skeletonCard} />
    </View>
  );
}

function getVitalityColor(score: number): string {
  if (score >= 76) return colors.primary;
  if (score >= 56) return colors.primary + '99';
  if (score >= 36) return colors.energy;
  return colors.mutedForeground;
}

function getCalendarStats(days: CalendarDayItem[]) {
  const workoutDays = days.filter((day) => day.hasActivity);
  const scoredDays = workoutDays.filter((day) => day.score > 0);
  let streak = 0;
  let current = 0;

  for (const day of days) {
    if (day.hasActivity) {
      current += 1;
      streak = Math.max(streak, current);
    } else {
      current = 0;
    }
  }

  return {
    workouts: workoutDays.length,
    streak,
    avgScore: scoredDays.length
      ? Math.round(scoredDays.reduce((sum, day) => sum + day.score, 0) / scoredDays.length)
      : 0,
  };
}

function emptyCalendarDay(date: string): CalendarDayItem {
  return {
    date,
    hasActivity: false,
    completed: false,
    type: 'rest',
    score: 0,
    workoutName: null,
    exerciseCount: 0,
    durationMinutes: 0,
    hydrationMl: 0,
    proteinG: 0,
    stepsCount: 0,
    notes: null,
  };
}

function startOfMondayWeekLocal(date: Date): Date {
  const sunStart = startOfWeekLocal(date);
  return addDaysLocal(sunStart, 1);
}

function buildMondayFirstGrid(
  currentDate: Date,
  days: CalendarDayItem[],
): Array<CalendarDayItem | null> {
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const sundayOffset = firstDay.getDay();
  const mondayOffset = (sundayOffset + 6) % 7;
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate();
  const byDate = new Map(days.map((day) => [day.date, day]));

  const leading: Array<CalendarDayItem | null> = Array.from(
    { length: mondayOffset },
    () => null,
  );
  const cells = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), index + 1);
    const key = formatLocalDate(date);
    return byDate.get(key) ?? emptyCalendarDay(key);
  });

  return [...leading, ...cells];
}

function parseLocalDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

function formatHumanDate(value: string): string {
  return parseLocalDate(value).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.lg,
    maxWidth: 672,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.primary + '35',
    padding: spacing.lg,
    gap: spacing.md,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  kickerText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  signalRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  signalPill: {
    flex: 1,
    minHeight: 58,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    backgroundColor: colors.black + '24',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  signalLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
    fontWeight: typography.fontWeight.semibold,
  },
  signalValue: {
    fontSize: typography.fontSize.sm,
    color: colors.foreground,
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
  },
  screenTitle: {
    fontSize: typography.fontSize['3xl'],
    color: colors.foreground,
    fontWeight: typography.fontWeight.extrabold,
    marginTop: spacing.xs,
  },
  monthLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
  },
  h1: {
    fontSize: typography.fontSize.xl,
    color: colors.foreground,
    fontWeight: typography.fontWeight.bold,
  },
  h2: {
    fontSize: typography.fontSize.lg,
    color: colors.foreground,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.black + '33',
    borderWidth: 1,
    borderColor: colors.border + '99',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: colors.primary + '18',
    borderWidth: 1,
    borderColor: colors.primary + '55',
  },
  tabText: {
    color: colors.mutedForeground,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  tabTextActive: {
    color: colors.primary,
  },
  insightPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '35',
    padding: spacing.md,
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  insightText: {
    fontSize: typography.fontSize.sm,
    color: colors.foreground,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  viewContent: {
    gap: spacing.lg,
  },
  calendarBox: {
    backgroundColor: colors.card + 'E6',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '24',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekDayCell: { flex: 1, alignItems: 'center' },
  weekDayText: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
    fontWeight: typography.fontWeight.semibold,
  },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayCellPlaceholder: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: typography.fontSize.sm,
    color: colors.foreground,
  },
  dayTextSelected: {
    color: colors.primaryFg,
    fontWeight: typography.fontWeight.bold,
  },
  dayTextToday: { textDecorationLine: 'underline' },
  weekGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  weekGridCell: {
    flex: 1,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: spacing.xs,
  },
  weekGridCellCompleted: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '12',
  },
  weekGridCellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weekGridCellPeak: {
    borderColor: colors.energy,
    backgroundColor: colors.energy + '12',
  },
  weekGridDay: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
    fontWeight: typography.fontWeight.semibold,
  },
  weekGridDate: {
    fontSize: typography.fontSize.lg,
    color: colors.foreground,
    fontWeight: typography.fontWeight.bold,
  },
  vitalityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  prRing: {
    position: 'absolute',
    top: 4,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.energy,
  },
  weekConsistency: { alignItems: 'center', gap: spacing.sm },
  consistencyDaysRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
  },
  consistencyDayCol: { flex: 1, alignItems: 'center', gap: spacing.xs },
  consistencyDot: { width: 8, height: 8, borderRadius: 4 },
  dayBreakdown: {
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '28',
    padding: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card + 'E6',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border + 'CC',
    padding: spacing.md,
    gap: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
    fontWeight: typography.fontWeight.semibold,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    color: colors.foreground,
    fontWeight: typography.fontWeight.bold,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.foreground,
    fontWeight: typography.fontWeight.semibold,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
    fontWeight: typography.fontWeight.semibold,
  },
  summaryValue: {
    fontSize: typography.fontSize.base,
    color: colors.foreground,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.xs,
  },
  trainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card + 'E6',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border + 'CC',
    padding: spacing.md,
  },
  scoreText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  bigPercent: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.muted + 'CC',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: colors.primary },
  foregroundText: {
    fontSize: typography.fontSize.sm,
    color: colors.foreground,
  },
  muted: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
  },
  feedCard: {
    backgroundColor: colors.card + 'E6',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border + 'CC',
    padding: spacing.md,
  },
  feedTitle: {
    fontSize: typography.fontSize.base,
    color: colors.foreground,
    fontWeight: typography.fontWeight.semibold,
  },
  dayBadge: {
    marginLeft: 'auto',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.primary + '18',
    borderRadius: borderRadius.full,
  },
  dayBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  feedbackCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.sm,
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
    textAlign: 'center',
    lineHeight: 22,
  },
  feedbackButton: {
    minHeight: 48,
    minWidth: 120,
    paddingHorizontal: spacing.lg,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
  feedbackButtonText: {
    color: colors.primaryFg,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  skeletonGrid: {
    height: 320,
    borderRadius: borderRadius.md,
    backgroundColor: colors.secondary,
  },
  skeletonRow: {
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.secondary,
  },
  skeletonCard: {
    height: 100,
    borderRadius: borderRadius.md,
    backgroundColor: colors.secondary,
  },
  row8: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
