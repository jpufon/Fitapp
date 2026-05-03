import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  TrendingUp, PlusCircle, Leaf, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react-native';
import { colors, pillarColors, spacing, borderRadius, typography } from '../theme';
import type { SurfaceTokens } from '../theme/surfaceTheme';
import { useWalifitTheme } from '../theme/ThemeProvider';
import VitalityTree from '../components/VitalityTree';
import type { RootStackParamList } from '../App';
import { useUser } from '../hooks/useUser';
import { useHomeSnapshot, useTodaySteps } from '../hooks/useHomeData';
import { useLogNutrition, useUpdateDailyTargets } from '../hooks/useMutations';
import { formatLocalDate } from '../hooks/useCalendarData';
import { getCachedJson, setCachedJson } from '../lib/storage';

type ScreenState = 'loading' | 'success' | 'empty' | 'error';
type WaterUnit = 'ml' | 'oz';
type ProgressEditor = 'water' | 'protein' | 'steps' | null;

const WATER_UNIT_KEY = 'home.water-unit';
const ML_PER_OUNCE = 29.5735;

function waterToDisplay(ml: number, unit: WaterUnit): number {
  return unit === 'oz' ? Math.round(ml / ML_PER_OUNCE) : Math.round(ml);
}

function waterToMl(value: number, unit: WaterUnit): number {
  return unit === 'oz' ? Math.round(value * ML_PER_OUNCE) : Math.round(value);
}

function parsePositiveInt(value: string): number | null {
  const parsed = Number(value.replace(/,/g, '').trim());
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed);
}

const ProgressMini = ({ label, value, color, styles }: { label: string; value: number; color: string; styles: HomeStyles }) => (
  <View style={styles.progressMini}>
    <Text style={styles.progressMiniLabel}>{label}</Text>
    <Text style={[styles.progressMiniValue, { color }]}>{Math.round(value)}%</Text>
  </View>
);

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { surfaces } = useWalifitTheme();
  const styles = useMemo(() => createStyles(surfaces), [surfaces]);
  const userQuery = useUser();
  const homeQuery = useHomeSnapshot();
  const snap = homeQuery.data;
  const stepsTarget = snap?.pillars.steps.target ?? 10_000;
  const stepsQuery = useTodaySteps(stepsTarget);
  const todayKey = formatLocalDate(new Date());
  const logNutrition = useLogNutrition(todayKey);
  const updateDailyTargets = useUpdateDailyTargets();
  const lastSyncedSteps = useRef<{ date: string; steps: number } | null>(null);
  const [waterUnit, setWaterUnit] = useState<WaterUnit>(() => getCachedJson<WaterUnit>(WATER_UNIT_KEY) ?? 'ml');
  const [progressExpanded, setProgressExpanded] = useState(false);
  const [expandedEditor, setExpandedEditor] = useState<ProgressEditor>(null);
  const [draft, setDraft] = useState({
    waterCurrent: '0',
    waterGoal: '3000',
    proteinCurrent: '0',
    proteinGoal: '150',
    stepsGoal: '10000',
  });
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

  const steps = useMemo(() => {
    const backendSteps = snap?.pillars.steps;
    const deviceSteps = stepsQuery.data;
    const current = deviceSteps?.steps ?? backendSteps?.current ?? 0;
    const target = backendSteps?.target ?? deviceSteps?.target ?? 10_000;
    const progress = Math.round(Math.min(100, Math.max(0, (current / Math.max(1, target)) * 100)));

    return {
      steps: current,
      target,
      progress,
    };
  }, [snap?.pillars.steps, stepsQuery.data]);

  useEffect(() => {
    if (!snap) return;
    setDraft({
      waterCurrent: String(waterToDisplay(snap.pillars.hydration.current, waterUnit)),
      waterGoal: String(waterToDisplay(snap.pillars.hydration.target, waterUnit)),
      proteinCurrent: String(Math.round(snap.pillars.protein.current)),
      proteinGoal: String(Math.round(snap.pillars.protein.target)),
      stepsGoal: String(Math.round(snap.pillars.steps.target)),
    });
  }, [snap, waterUnit]);

  useEffect(() => {
    const deviceSteps = stepsQuery.data?.steps;
    if (!deviceSteps || deviceSteps <= 0) return;
    if (deviceSteps === snap?.pillars.steps.current) return;
    const last = lastSyncedSteps.current;
    if (last && last.date === todayKey && last.steps === deviceSteps) return;

    lastSyncedSteps.current = { date: todayKey, steps: deviceSteps };
    logNutrition.mutate({ stepsCount: deviceSteps });
  }, [logNutrition, snap?.pillars.steps.current, stepsQuery.data?.steps, todayKey]);

  const computedVitalityScore = Math.round(
    nutrition.hydration.progress * 0.3 +
      nutrition.protein.progress * 0.3 +
      steps.progress * 0.4
  );
  const vitalityScore = vitality.score > 0 ? vitality.score : computedVitalityScore;

  const handleRefresh = async () => {
    await Promise.all([homeQuery.refetch(), stepsQuery.refetch()]);
  };

  const handleRetry = () => {
    void handleRefresh();
  };

  const handleWaterUnitChange = (unit: WaterUnit) => {
    setWaterUnit(unit);
    setCachedJson<WaterUnit>(WATER_UNIT_KEY, unit);
  };

  const saveTargets = () => {
    const waterGoal = parsePositiveInt(draft.waterGoal);
    const proteinGoal = parsePositiveInt(draft.proteinGoal);
    const stepsGoal = parsePositiveInt(draft.stepsGoal);
    if (waterGoal == null || proteinGoal == null || stepsGoal == null) {
      Alert.alert('Check goals', 'Enter valid daily goals for water, protein, and steps.');
      return;
    }
    updateDailyTargets.mutate({
      waterTargetMl: waterToMl(waterGoal, waterUnit),
      proteinTargetG: proteinGoal,
      stepsGoal,
    });
  };

  // Amount is in the user's chosen water unit (ml or oz); backend always
  // takes ml, so convert before sending. Backend echoes the new total via
  // /home invalidation — no optimistic client sum.
  const addWater = (amount: number) => {
    logNutrition.mutate({ waterDeltaMl: waterToMl(amount, waterUnit) });
  };

  const addProtein = (amount: number) => {
    logNutrition.mutate({ proteinDeltaG: amount });
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

        {state === 'loading' ? <HomeSkeleton styles={styles} /> : null}

        {state === 'empty' ? (
          <FeedbackCard
            icon={Leaf}
            title="Welcome to waliFit"
            message="Sign in and complete your setup to start syncing your vitality data."
            styles={styles}
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
            styles={styles}
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
                <UserCircle size={24} color={surfaces.mutedForeground} strokeWidth={1.75} />
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
                treeStage={snap?.vitality.treeState}
                todayScore={{
                  hydration: nutrition.hydration.progress,
                  protein: nutrition.protein.progress,
                  steps: steps.progress,
                }}
              />
            </View>

            <View style={styles.section}>
              <TouchableOpacity
                style={styles.progressSummaryCard}
                activeOpacity={0.75}
                onPress={() => {
                  setProgressExpanded((current) => {
                    if (current) setExpandedEditor(null);
                    return !current;
                  });
                }}
                accessibilityRole="button"
                accessibilityLabel={`${progressExpanded ? 'Collapse' : 'Expand'} today's progress`}
              >
                <View style={styles.progressSummaryHeader}>
                  <View>
                    <Text style={styles.sectionTitleCompact}>Today's Progress</Text>
                    <Text style={styles.progressSummaryText}>{vitalityScore}% daily completion</Text>
                  </View>
                  <View style={styles.progressSummaryRight}>
                    <Text style={[styles.progressPercent, { color: colors.primary }]}>{vitalityScore}%</Text>
                    {progressExpanded ? (
                      <ChevronUp color={surfaces.mutedForeground} size={18} strokeWidth={1.75} />
                    ) : (
                      <ChevronDown color={surfaces.mutedForeground} size={18} strokeWidth={1.75} />
                    )}
                  </View>
                </View>
                <View style={styles.progressMiniRow}>
                  <ProgressMini label="Water" value={nutrition.hydration.progress} color={pillarColors.hydration} styles={styles} />
                  <ProgressMini label="Protein" value={nutrition.protein.progress} color={pillarColors.protein} styles={styles} />
                  <ProgressMini label="Steps" value={steps.progress} color={pillarColors.steps} styles={styles} />
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${vitalityScore}%`, backgroundColor: colors.primary }]} />
                </View>
              </TouchableOpacity>

              {progressExpanded ? (
                <>
                  <View style={styles.progressControlsRow}>
                    <WaterUnitToggle value={waterUnit} onChange={handleWaterUnitChange} styles={styles} />
                  </View>
                  <View style={styles.progressStack}>
                    <EditableProgressCard
                      icon={Droplets}
                      label="Water"
                      value={draft.waterCurrent}
                      goalValue={draft.waterGoal}
                      unit={waterUnit}
                      progress={nutrition.hydration.progress}
                      color={pillarColors.hydration}
                      isExpanded={expandedEditor === 'water'}
                      onToggleExpanded={() => setExpandedEditor((current) => current === 'water' ? null : 'water')}
                      keyboardType="number-pad"
                      onChangeGoal={(value) => setDraft((current) => ({ ...current, waterGoal: value }))}
                      onSaveGoal={saveTargets}
                      quickActions={waterUnit === 'oz' ? [
                        { label: '+8 oz', onPress: () => addWater(8) },
                        { label: '+16 oz', onPress: () => addWater(16) },
                      ] : [
                        { label: '+250 ml', onPress: () => addWater(250) },
                        { label: '+500 ml', onPress: () => addWater(500) },
                      ]}
                      disabled={logNutrition.isPending}
                      styles={styles}
                    />
                    <EditableProgressCard
                      icon={Utensils}
                      label="Protein"
                      value={draft.proteinCurrent}
                      goalValue={draft.proteinGoal}
                      unit="g"
                      progress={nutrition.protein.progress}
                      color={pillarColors.protein}
                      isExpanded={expandedEditor === 'protein'}
                      onToggleExpanded={() => setExpandedEditor((current) => current === 'protein' ? null : 'protein')}
                      keyboardType="number-pad"
                      onChangeGoal={(value) => setDraft((current) => ({ ...current, proteinGoal: value }))}
                      onSaveGoal={saveTargets}
                      quickActions={[
                        { label: '+20 g', onPress: () => addProtein(20) },
                        { label: '+40 g', onPress: () => addProtein(40) },
                      ]}
                      disabled={logNutrition.isPending}
                      styles={styles}
                    />
                    <ReadOnlyProgressCard
                      icon={Footprints}
                      label="Steps"
                      value={formatNumber(steps.steps)}
                      goalValue={draft.stepsGoal}
                      unit="steps"
                      progress={steps.progress}
                      color={pillarColors.steps}
                      isExpanded={expandedEditor === 'steps'}
                      onToggleExpanded={() => setExpandedEditor((current) => current === 'steps' ? null : 'steps')}
                      onChangeGoal={(value) => setDraft((current) => ({ ...current, stepsGoal: value }))}
                      onSaveGoal={saveTargets}
                      disabled={updateDailyTargets.isPending}
                      styles={styles}
                    />
                  </View>
                </>
              ) : null}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Today's Workout</Text>
                <Text style={styles.sectionSubtitle}>{formatWeekday()}</Text>
              </View>
              {workout ? (
                <TouchableOpacity style={styles.workoutCard} onPress={handleStartWorkout}>
                  <LinearGradient
                    colors={[surfaces.card + 'CC', surfaces.card + '80']}
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
                  styles={styles}
                />
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <QuickActionCard icon={MessageCircle} label="Wali AI" color={colors.purple} onPress={() => navigation.navigate('Coach')} styles={styles} />
                <QuickActionCard icon={Users} label="Squad" color={colors.blue} styles={styles} />
                <QuickActionCard icon={TrendingUp} label="Progress" color={colors.primary} styles={styles} />
                <QuickActionCard icon={PlusCircle} label="Quick Log" color={colors.energy} onPress={() => navigation.navigate('NutritionLog')} styles={styles} />
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function EditableProgressCard({
  icon: Icon,
  label,
  value,
  goalValue,
  unit,
  progress,
  color,
  isExpanded,
  onToggleExpanded,
  keyboardType,
  onChangeGoal,
  onSaveGoal,
  quickActions,
  disabled,
  styles,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  goalValue: string;
  unit: string;
  progress: number;
  color: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  keyboardType: 'number-pad';
  onChangeGoal: (value: string) => void;
  onSaveGoal: () => void;
  quickActions: Array<{ label: string; onPress: () => void }>;
  disabled?: boolean;
  styles: HomeStyles;
}) {
  const { surfaces } = useWalifitTheme();
  return (
    <View style={[styles.progressCard, { borderColor: color + '30' }]}>
      <TouchableOpacity
        style={styles.progressCardHeader}
        activeOpacity={0.75}
        onPress={onToggleExpanded}
        accessibilityRole="button"
        accessibilityLabel={`${isExpanded ? 'Close' : 'Edit'} ${label}`}
      >
        <View style={[styles.statIcon, { backgroundColor: color + '1A' }]}>
          <Icon color={color} size={22} strokeWidth={1.75} />
        </View>
        <View style={styles.progressTitleWrap}>
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={styles.statUnit}>
            {formatNumber(parsePositiveInt(value) ?? 0)} {unit} of {formatNumber(parsePositiveInt(goalValue) ?? 0)} {unit}
          </Text>
        </View>
        <Text style={[styles.progressPercent, { color }]}>{Math.round(progress)}%</Text>
        <View style={styles.expandIcon}>
          {isExpanded ? (
            <ChevronUp color={surfaces.mutedForeground} size={18} strokeWidth={1.75} />
          ) : (
            <ChevronDown color={surfaces.mutedForeground} size={18} strokeWidth={1.75} />
          )}
        </View>
      </TouchableOpacity>

      {isExpanded ? (
        <>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Consumed</Text>
              <View style={styles.valueInputWrap}>
                <Text style={[styles.valueInput, { color }]} accessibilityLabel={`${label} consumed`}>
                  {value || '0'}
                </Text>
                <Text style={styles.inputUnit}>{unit}</Text>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Goal</Text>
              <View style={styles.valueInputWrap}>
                <TextInput
                  value={goalValue}
                  onChangeText={onChangeGoal}
                  onSubmitEditing={onSaveGoal}
                  onBlur={onSaveGoal}
                  keyboardType={keyboardType}
                  returnKeyType="done"
                  editable={!disabled}
                  selectTextOnFocus
                  style={styles.valueInput}
                />
                <Text style={styles.inputUnit}>{unit}</Text>
              </View>
            </View>
          </View>

          <View style={styles.quickLogRow}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={[styles.quickLogButton, { borderColor: color + '40' }]}
                onPress={action.onPress}
                disabled={disabled}
              >
                <Text style={[styles.quickLogText, { color }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function ReadOnlyProgressCard({
  icon: Icon,
  label,
  value,
  goalValue,
  unit,
  progress,
  color,
  isExpanded,
  onToggleExpanded,
  onChangeGoal,
  onSaveGoal,
  disabled,
  styles,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  goalValue: string;
  unit: string;
  progress: number;
  color: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onChangeGoal: (value: string) => void;
  onSaveGoal: () => void;
  disabled?: boolean;
  styles: HomeStyles;
}) {
  const { surfaces } = useWalifitTheme();
  return (
    <View style={[styles.progressCard, { borderColor: color + '30' }]}>
      <TouchableOpacity
        style={styles.progressCardHeader}
        activeOpacity={0.75}
        onPress={onToggleExpanded}
        accessibilityRole="button"
        accessibilityLabel={`${isExpanded ? 'Close' : 'Edit'} ${label} goal`}
      >
        <View style={[styles.statIcon, { backgroundColor: color + '1A' }]}>
          <Icon color={color} size={22} strokeWidth={1.75} />
        </View>
        <View style={styles.progressTitleWrap}>
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={styles.statUnit}>
            {value} of {formatNumber(parsePositiveInt(goalValue) ?? 0)} {unit}
          </Text>
        </View>
        <Text style={[styles.progressPercent, { color }]}>{Math.round(progress)}%</Text>
        <View style={styles.expandIcon}>
          {isExpanded ? (
            <ChevronUp color={surfaces.mutedForeground} size={18} strokeWidth={1.75} />
          ) : (
            <ChevronDown color={surfaces.mutedForeground} size={18} strokeWidth={1.75} />
          )}
        </View>
      </TouchableOpacity>

      {isExpanded ? (
        <>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Today</Text>
              <View style={[styles.valueInputWrap, styles.readOnlyInputWrap]}>
                <Text style={[styles.valueInputText, { color }]}>{value}</Text>
                <Text style={styles.inputUnit}>{unit}</Text>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Goal</Text>
              <View style={styles.valueInputWrap}>
                <TextInput
                  value={goalValue}
                  onChangeText={onChangeGoal}
                  onSubmitEditing={onSaveGoal}
                  onBlur={onSaveGoal}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  editable={!disabled}
                  selectTextOnFocus
                  style={styles.valueInput}
                />
                <Text style={styles.inputUnit}>{unit}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.readOnlyNote}>Steps use the phone’s 24-hour count when health permissions are available.</Text>
        </>
      ) : null}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function WaterUnitToggle({ value, onChange, styles }: { value: WaterUnit; onChange: (unit: WaterUnit) => void; styles: HomeStyles }) {
  return (
    <View style={styles.unitToggle}>
      {(['ml', 'oz'] as WaterUnit[]).map((unit) => {
        const active = value === unit;
        return (
          <TouchableOpacity
            key={unit}
            style={[styles.unitToggleButton, active && styles.unitToggleButtonActive]}
            onPress={() => onChange(unit)}
          >
            <Text style={[styles.unitToggleText, active && styles.unitToggleTextActive]}>{unit}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function QuickActionCard({ icon: Icon, label, color, onPress, styles }: {
  icon: React.ElementType;
  label: string;
  color: string;
  onPress?: () => void;
  styles: HomeStyles;
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

function HomeSkeleton({ styles }: { styles: HomeStyles }) {
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
  styles,
}: {
  icon: React.ElementType;
  iconColor?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onPress?: () => void;
  styles: HomeStyles;
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

function FeedbackPanel({ title, message, styles }: { title: string; message: string; styles: HomeStyles }) {
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

type HomeStyles = ReturnType<typeof createStyles>;

function createStyles(s: SurfaceTokens) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: s.background,
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
    color: s.mutedForeground,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 1,
    marginBottom: 4,
  },
  nameText: {
    fontSize: typography.fontSize['3xl'],
    color: s.foreground,
    fontWeight: typography.fontWeight.bold,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.xl,
    backgroundColor: s.secondary + '80',
    borderWidth: 1,
    borderColor: s.border + '80',
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
    color: s.mutedForeground,
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
    color: s.foreground,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  sectionTitleCompact: {
    fontSize: typography.fontSize.xl,
    color: s.foreground,
    fontWeight: typography.fontWeight.bold,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: s.mutedForeground,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md - 4,
  },
  progressStack: {
    gap: spacing.md,
  },
  progressSummaryCard: {
    backgroundColor: s.card + '80',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: s.border + '80',
    gap: spacing.md,
  },
  progressSummaryHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  progressSummaryText: {
    fontSize: typography.fontSize.sm,
    color: s.mutedForeground,
    marginTop: spacing.xs,
  },
  progressSummaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressMiniRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  progressMini: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: s.background + '40',
    paddingHorizontal: spacing.sm,
    gap: 2,
  },
  progressMiniLabel: {
    fontSize: typography.fontSize.xs,
    color: s.mutedForeground,
    fontWeight: typography.fontWeight.medium,
  },
  progressMiniValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.mono,
  },
  progressControlsRow: {
    alignItems: 'flex-end',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  progressCard: {
    backgroundColor: s.card + '80',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
  },
  progressTitleWrap: {
    flex: 1,
  },
  progressPercent: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.mono,
  },
  expandIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCard: {
    flex: 1,
    backgroundColor: s.card + '80',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: s.mutedForeground,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.mono,
    marginBottom: 2,
  },
  statUnit: {
    fontSize: typography.fontSize.xs,
    color: s.mutedForeground,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  inputLabel: {
    fontSize: typography.fontSize.xs,
    color: s.mutedForeground,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueInputWrap: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: s.border + '80',
    backgroundColor: s.background + '66',
    paddingHorizontal: spacing.md,
  },
  readOnlyInputWrap: {
    backgroundColor: s.muted + '20',
  },
  valueInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.lg,
    color: s.foreground,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.mono,
  },
  valueInputText: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.mono,
  },
  inputUnit: {
    fontSize: typography.fontSize.xs,
    color: s.mutedForeground,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
  },
  quickLogRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickLogButton: {
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    backgroundColor: s.background + '40',
  },
  quickLogText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  readOnlyNote: {
    fontSize: typography.fontSize.xs,
    color: s.mutedForeground,
    lineHeight: 17,
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: s.border + '80',
    backgroundColor: s.card + '80',
  },
  unitToggleButton: {
    minHeight: 36,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
  },
  unitToggleButtonActive: {
    backgroundColor: colors.primary,
  },
  unitToggleText: {
    fontSize: typography.fontSize.xs,
    color: s.mutedForeground,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  unitToggleTextActive: {
    color: colors.black,
  },
  progressBar: {
    height: 8,
    backgroundColor: s.muted + '33',
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
    borderColor: s.border + '80',
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
    color: s.foreground,
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
    color: s.mutedForeground,
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
    backgroundColor: s.card + '80',
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
    color: s.foreground,
    fontWeight: typography.fontWeight.bold,
  },
  feedbackCard: {
    alignItems: 'center',
    backgroundColor: s.card + 'CC',
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: s.border + '80',
    padding: spacing.xl,
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  feedbackTitle: {
    fontSize: typography.fontSize.xl,
    color: s.foreground,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  feedbackMessage: {
    fontSize: typography.fontSize.base,
    color: s.mutedForeground,
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
    backgroundColor: s.card + '80',
    borderWidth: 1,
    borderColor: s.border + '80',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  feedbackPanelTitle: {
    fontSize: typography.fontSize.lg,
    color: s.foreground,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  feedbackPanelMessage: {
    fontSize: typography.fontSize.base,
    color: s.mutedForeground,
    lineHeight: 22,
  },
  skeletonBar: {
    backgroundColor: s.secondary,
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
    backgroundColor: s.secondary,
  },
  skeletonBadge: {
    width: 140,
    height: 48,
    borderRadius: borderRadius.xl,
    backgroundColor: s.secondary,
    marginBottom: spacing.lg,
  },
  skeletonTree: {
    height: 420,
    borderRadius: borderRadius.xxl,
    backgroundColor: s.card,
    borderWidth: 1,
    borderColor: s.border,
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
    backgroundColor: s.card,
    borderWidth: 1,
    borderColor: s.border,
  },
  skeletonWorkout: {
    height: 132,
    borderRadius: borderRadius.xl,
    backgroundColor: s.card,
    borderWidth: 1,
    borderColor: s.border,
  },
  });
}
