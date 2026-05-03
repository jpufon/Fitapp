// waliFit — OnboardingFlowScreen
// Steps: Goal → Experience → Frequency → Equipment → Injuries → Units → Targets → Import → Complete
// Completable in under 3 minutes. Every extra screen costs sign-up rate.
// Each step persists locally to MMKV and PATCHes the server (queued if offline).
// Fires Wali AI cold-start 1.5s after onboardingComplete = true (backend).

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Check,
  Upload,
  ChevronRight,
  ArrowLeft,
  Zap,
  Trees,
  Wind,
  Cherry,
  Rocket,
  Sprout,
  Activity,
  Flame,
  Dumbbell,
  Home,
  Bike,
  Plus,
  Minus,
  Beef,
  Droplet,
  AlertCircle,
} from 'lucide-react-native';
import { colors, pillarColors, spacing, typography, radius, touchTarget } from '../theme';
import {
  useOnboardingStore,
  defaultsForGoal,
  STEP_ORDER,
  type Goal,
  type Experience,
  type Equipment,
  type Injury,
  type OnboardingStep,
} from '../lib/onboardingStore';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const GOALS: { id: Goal; label: string; sub: string; icon: React.ComponentType<{ color: string; size: number; strokeWidth: number }> }[] = [
  { id: 'hybrid', label: 'Hybrid Performance', sub: 'Strength + conditioning', icon: Zap },
  { id: 'strength', label: 'Strength', sub: 'Build muscle and power', icon: Trees },
  { id: 'running', label: 'Running', sub: 'Speed, endurance, racing', icon: Wind },
  { id: 'fat_loss', label: 'Fat Loss', sub: 'Lean out, stay athletic', icon: Cherry },
  { id: 'general', label: 'General Fitness', sub: 'Stay active and healthy', icon: Rocket },
];

const EXPERIENCE_LEVELS: { id: Experience; label: string; sub: string; icon: React.ComponentType<{ color: string; size: number; strokeWidth: number }> }[] = [
  { id: 'beginner', label: 'Beginner', sub: 'Less than 1 year of consistent training', icon: Sprout },
  { id: 'intermediate', label: 'Intermediate', sub: '1–3 years, comfortable with basics', icon: Activity },
  { id: 'advanced', label: 'Advanced', sub: '3+ years, dialled-in technique and program', icon: Flame },
];

const FREQUENCIES = [2, 3, 4, 5, 6, 7];

const EQUIPMENT_OPTIONS: { id: Equipment; label: string; icon: React.ComponentType<{ color: string; size: number; strokeWidth: number }> }[] = [
  { id: 'full_gym', label: 'Full gym', icon: Dumbbell },
  { id: 'home_gym', label: 'Home gym (rack + bar)', icon: Home },
  { id: 'dumbbells', label: 'Dumbbells only', icon: Dumbbell },
  { id: 'kettlebells', label: 'Kettlebells', icon: Dumbbell },
  { id: 'bodyweight', label: 'Bodyweight only', icon: Activity },
  { id: 'cardio', label: 'Cardio machines', icon: Bike },
];

const INJURY_OPTIONS: { id: Injury; label: string }[] = [
  { id: 'knee', label: 'Knee' },
  { id: 'lower_back', label: 'Lower back' },
  { id: 'shoulder', label: 'Shoulder' },
  { id: 'hip', label: 'Hip' },
  { id: 'ankle', label: 'Ankle' },
  { id: 'wrist', label: 'Wrist' },
  { id: 'none', label: 'None — fully healthy' },
];

export default function OnboardingFlowScreen({ onComplete }: OnboardingFlowProps) {
  const step = useOnboardingStore((s) => s.currentStep);

  const visibleSteps: OnboardingStep[] = STEP_ORDER.filter((s) => s !== 'complete');
  const stepIndex = visibleSteps.indexOf(step);
  const progress = stepIndex >= 0 ? (stepIndex / (visibleSteps.length - 1)) * 100 : 100;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {step !== 'complete' && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` as `${number}%` }]} />
        </View>
      )}

      {step !== 'goal' && step !== 'complete' && <BackButton />}

      {step === 'goal' && <GoalStep />}
      {step === 'experience' && <ExperienceStep />}
      {step === 'frequency' && <FrequencyStep />}
      {step === 'equipment' && <EquipmentStep />}
      {step === 'injuries' && <InjuriesStep />}
      {step === 'units' && <UnitsStep />}
      {step === 'targets' && <TargetsStep />}
      {step === 'import' && <ImportStep />}
      {step === 'complete' && <CompleteStep onDone={onComplete} />}
    </SafeAreaView>
  );
}

// ─── Shared building blocks ───────────────────────────────────────────────────

function BackButton() {
  const back = useOnboardingStore((s) => s.back);
  return (
    <TouchableOpacity style={styles.backBtn} onPress={() => back()} accessibilityLabel="Go back">
      <ArrowLeft color={colors.foreground} size={20} strokeWidth={1.75} />
    </TouchableOpacity>
  );
}

function ContinueButton({
  label = 'Continue',
  disabled = false,
  onPress,
}: {
  label?: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.nextBtn, disabled && styles.nextBtnDisabled]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
      accessibilityState={{ disabled }}
      testID="onboarding-continue"
    >
      <Text style={styles.nextBtnText}>{label}</Text>
      <ChevronRight color={colors.primaryFg} size={18} strokeWidth={2.5} />
    </TouchableOpacity>
  );
}

// ─── Goal step ────────────────────────────────────────────────────────────────

function GoalStep() {
  const goal = useOnboardingStore((s) => s.goal);
  const update = useOnboardingStore((s) => s.update);
  const next = useOnboardingStore((s) => s.next);

  return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepTitle}>What are you training for?</Text>
      <Text style={styles.stepSub}>This shapes your Vitality Tree and Wali AI coaching.</Text>

      <View style={styles.optionsList}>
        {GOALS.map((g) => {
          const active = goal === g.id;
          return (
            <TouchableOpacity
              key={g.id}
              style={[styles.optionCard, active && styles.optionCardActive]}
              onPress={() => update({ goal: g.id })}
              activeOpacity={0.7}
              testID={`onboarding-goal-${g.id}`}
            >
              <View
                style={[
                  styles.optionIconWrap,
                  { backgroundColor: active ? colors.primary + '20' : colors.muted },
                ]}
              >
                <g.icon
                  color={active ? colors.primary : colors.mutedForeground}
                  size={22}
                  strokeWidth={1.75}
                />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, active && { color: colors.primary }]}>
                  {g.label}
                </Text>
                <Text style={styles.optionSub}>{g.sub}</Text>
              </View>
              {active && <Check color={colors.primary} size={18} strokeWidth={2.5} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ContinueButton disabled={!goal} onPress={() => next()} />
    </ScrollView>
  );
}

// ─── Experience step ──────────────────────────────────────────────────────────

function ExperienceStep() {
  const experience = useOnboardingStore((s) => s.experience);
  const update = useOnboardingStore((s) => s.update);
  const next = useOnboardingStore((s) => s.next);

  return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepTitle}>How long have you been training?</Text>
      <Text style={styles.stepSub}>
        Honest answer — Wali AI calibrates volume and intensity to where you actually are.
      </Text>

      <View style={styles.optionsList}>
        {EXPERIENCE_LEVELS.map((opt) => {
          const active = experience === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.optionCard, active && styles.optionCardActive]}
              onPress={() => update({ experience: opt.id })}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.optionIconWrap,
                  { backgroundColor: active ? colors.primary + '20' : colors.muted },
                ]}
              >
                <opt.icon
                  color={active ? colors.primary : colors.mutedForeground}
                  size={22}
                  strokeWidth={1.75}
                />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, active && { color: colors.primary }]}>
                  {opt.label}
                </Text>
                <Text style={styles.optionSub}>{opt.sub}</Text>
              </View>
              {active && <Check color={colors.primary} size={18} strokeWidth={2.5} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ContinueButton disabled={!experience} onPress={() => next()} />
    </ScrollView>
  );
}

// ─── Frequency step ───────────────────────────────────────────────────────────

function FrequencyStep() {
  const freq = useOnboardingStore((s) => s.trainingDaysPerWeek);
  const update = useOnboardingStore((s) => s.update);
  const next = useOnboardingStore((s) => s.next);

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>How many days a week do you train?</Text>
      <Text style={styles.stepSub}>Wali AI will schedule your program around this.</Text>

      <View style={styles.freqGrid}>
        {FREQUENCIES.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.freqCard, freq === f && styles.freqCardActive]}
            onPress={() => update({ trainingDaysPerWeek: f })}
            activeOpacity={0.7}
          >
            <Text style={[styles.freqNum, freq === f && { color: colors.primary }]}>{f}</Text>
            <Text style={styles.freqLabel}>{f === 7 ? 'Every day' : 'days'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.freqInfo}>
        <Text style={styles.freqInfoText}>
          {freq <= 3
            ? 'Great for beginners. Quality over quantity.'
            : freq <= 5
              ? 'Optimal for most hybrid athletes.'
              : 'Elite territory — make sure recovery is dialled in.'}
        </Text>
      </View>

      <ContinueButton onPress={() => next()} />
    </View>
  );
}

// ─── Equipment step ───────────────────────────────────────────────────────────

function EquipmentStep() {
  const equipment = useOnboardingStore((s) => s.equipment);
  const update = useOnboardingStore((s) => s.update);
  const next = useOnboardingStore((s) => s.next);

  const toggle = (id: Equipment) => {
    const has = equipment.includes(id);
    update({ equipment: has ? equipment.filter((e) => e !== id) : [...equipment, id] });
  };

  return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepTitle}>What can you train with?</Text>
      <Text style={styles.stepSub}>Pick everything that applies. Wali AI only programs what you can do.</Text>

      <View style={styles.chipGrid}>
        {EQUIPMENT_OPTIONS.map((opt) => {
          const active = equipment.includes(opt.id);
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggle(opt.id)}
              activeOpacity={0.7}
            >
              <opt.icon
                color={active ? colors.primary : colors.mutedForeground}
                size={18}
                strokeWidth={1.75}
              />
              <Text style={[styles.chipLabel, active && { color: colors.primary }]}>
                {opt.label}
              </Text>
              {active && <Check color={colors.primary} size={16} strokeWidth={2.5} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ContinueButton disabled={equipment.length === 0} onPress={() => next()} />
    </ScrollView>
  );
}

// ─── Injuries step ────────────────────────────────────────────────────────────

function InjuriesStep() {
  const injuries = useOnboardingStore((s) => s.injuries);
  const injuryNotes = useOnboardingStore((s) => s.injuryNotes);
  const update = useOnboardingStore((s) => s.update);
  const next = useOnboardingStore((s) => s.next);

  const toggle = (id: Injury) => {
    if (id === 'none') {
      update({ injuries: injuries.includes('none') ? [] : ['none'] });
      return;
    }
    const without_none = injuries.filter((i) => i !== 'none');
    const has = without_none.includes(id);
    update({
      injuries: has ? without_none.filter((i) => i !== id) : [...without_none, id],
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>Anything Wali should work around?</Text>
      <Text style={styles.stepSub}>
        Pick any current or recurring issues. We'll avoid programming aggravating movements.
      </Text>

      <View style={styles.chipGrid}>
        {INJURY_OPTIONS.map((opt) => {
          const active = injuries.includes(opt.id);
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggle(opt.id)}
              activeOpacity={0.7}
            >
              {opt.id === 'none' ? (
                <Check
                  color={active ? colors.primary : colors.mutedForeground}
                  size={16}
                  strokeWidth={2}
                />
              ) : (
                <AlertCircle
                  color={active ? colors.primary : colors.mutedForeground}
                  size={16}
                  strokeWidth={1.75}
                />
              )}
              <Text style={[styles.chipLabel, active && { color: colors.primary }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>Anything else? (optional)</Text>
      <TextInput
        style={styles.textArea}
        placeholder="e.g. tight hip flexors, recovering from minor surgery"
        placeholderTextColor={colors.mutedForeground}
        value={injuryNotes}
        onChangeText={(t) => update({ injuryNotes: t })}
        multiline
        maxLength={300}
      />

      <ContinueButton onPress={() => next()} />
    </ScrollView>
  );
}

// ─── Units step ───────────────────────────────────────────────────────────────

function UnitsStep() {
  const units = useOnboardingStore((s) => s.units);
  const update = useOnboardingStore((s) => s.update);
  const next = useOnboardingStore((s) => s.next);

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>How do you measure weight?</Text>
      <Text style={styles.stepSub}>
        Affects the plate calculator, logging, and Wali AI coaching. You can change it in Settings later.
      </Text>

      <View style={styles.unitsRow}>
        {(['kg', 'lbs'] as const).map((u) => (
          <TouchableOpacity
            key={u}
            style={[styles.unitCard, units === u && styles.unitCardActive]}
            onPress={() => update({ units: u })}
            activeOpacity={0.7}
          >
            <Text style={[styles.unitLabel, units === u && { color: colors.primary }]}>
              {u.toUpperCase()}
            </Text>
            <Text style={styles.unitSub}>{u === 'kg' ? 'Kilograms' : 'Pounds'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ContinueButton onPress={() => next()} />
    </View>
  );
}

// ─── Targets step ─────────────────────────────────────────────────────────────

function TargetsStep() {
  const goal = useOnboardingStore((s) => s.goal);
  const proteinTargetG = useOnboardingStore((s) => s.proteinTargetG);
  const waterTargetMl = useOnboardingStore((s) => s.waterTargetMl);
  const update = useOnboardingStore((s) => s.update);
  const next = useOnboardingStore((s) => s.next);

  const suggestion = defaultsForGoal(goal);
  const usingSuggestion =
    proteinTargetG === suggestion.proteinTargetG && waterTargetMl === suggestion.waterTargetMl;

  return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepTitle}>Daily protein and water targets</Text>
      <Text style={styles.stepSub}>
        These power 60% of your Vitality Tree. Adjust to whatever fits you — you can change these any time.
      </Text>

      <View style={styles.targetRow}>
        <View style={[styles.targetIconWrap, { backgroundColor: pillarColors.protein + '20' }]}>
          <Beef color={pillarColors.protein} size={20} strokeWidth={1.75} />
        </View>
        <View style={styles.targetTextWrap}>
          <Text style={styles.targetLabel}>Protein</Text>
          <Text style={styles.targetValue}>{proteinTargetG}<Text style={styles.targetUnit}> g/day</Text></Text>
        </View>
        <Stepper
          value={proteinTargetG}
          step={10}
          min={40}
          max={400}
          onChange={(v) => update({ proteinTargetG: v })}
        />
      </View>

      <View style={styles.targetRow}>
        <View style={[styles.targetIconWrap, { backgroundColor: pillarColors.hydration + '20' }]}>
          <Droplet color={pillarColors.hydration} size={20} strokeWidth={1.75} />
        </View>
        <View style={styles.targetTextWrap}>
          <Text style={styles.targetLabel}>Water</Text>
          <Text style={styles.targetValue}>{waterTargetMl}<Text style={styles.targetUnit}> ml/day</Text></Text>
        </View>
        <Stepper
          value={waterTargetMl}
          step={250}
          min={1000}
          max={6000}
          onChange={(v) => update({ waterTargetMl: v })}
        />
      </View>

      {!usingSuggestion && (
        <TouchableOpacity
          style={styles.suggestionBtn}
          onPress={() =>
            update({
              proteinTargetG: suggestion.proteinTargetG,
              waterTargetMl: suggestion.waterTargetMl,
            })
          }
        >
          <Text style={styles.suggestionBtnText}>
            Use suggestion · {suggestion.proteinTargetG}g protein, {suggestion.waterTargetMl}ml water
          </Text>
        </TouchableOpacity>
      )}

      <ContinueButton onPress={() => next()} />
    </ScrollView>
  );
}

function Stepper({
  value,
  step,
  min,
  max,
  onChange,
}: {
  value: number;
  step: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  return (
    <View style={styles.stepperWrap}>
      <TouchableOpacity
        style={[styles.stepperBtn, value <= min && styles.stepperBtnDisabled]}
        onPress={dec}
        activeOpacity={0.7}
        disabled={value <= min}
      >
        <Minus color={colors.foreground} size={16} strokeWidth={2} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.stepperBtn, value >= max && styles.stepperBtnDisabled]}
        onPress={inc}
        activeOpacity={0.7}
        disabled={value >= max}
      >
        <Plus color={colors.foreground} size={16} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Import step ──────────────────────────────────────────────────────────────

function ImportStep() {
  const update = useOnboardingStore((s) => s.update);
  const next = useOnboardingStore((s) => s.next);
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState(false);

  // V1: Gemini Vision import is backend Phase 6 — UI only for now.
  const simulateImport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setParsed(true);
      update({ importedFromApp: 'simulated' });
    }, 2000);
  };

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Already tracking somewhere?</Text>
      <Text style={styles.stepSub}>
        Wali AI can read a screenshot from Hevy, MyFitnessPal, Strava, or Strong and pre-fill your profile.
      </Text>

      {!parsed ? (
        <>
          <TouchableOpacity style={styles.importCard} onPress={simulateImport} activeOpacity={0.7}>
            {loading ? (
              <View style={styles.importLoading}>
                <Text style={[styles.importLoadingText, { color: colors.primary }]}>
                  Reading your program...
                </Text>
                <Text style={styles.importLoadingSub}>
                  Wali AI is extracting your PRs, goals, and history
                </Text>
              </View>
            ) : (
              <>
                <Upload color={colors.primary} size={32} strokeWidth={1.5} />
                <Text style={styles.importCardTitle}>Import from another app</Text>
                <Text style={styles.importCardSub}>
                  Upload a screenshot or paste text. Supports Hevy, MFP, Strava, Strong.
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={() => next()}>
            <Text style={styles.skipBtnText}>Skip for now</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={[styles.importCard, { borderColor: colors.primary }]}>
            <Check color={colors.primary} size={32} strokeWidth={2} />
            <Text style={[styles.importCardTitle, { color: colors.primary }]}>Import successful</Text>
            <View style={styles.parsedItems}>
              {[
                '5 PRs detected',
                'Body weight: 82kg',
                'Training frequency: 4x/week',
                'Goal: Hybrid performance',
              ].map((item) => (
                <View key={item} style={styles.parsedItem}>
                  <Check color={colors.primary} size={13} strokeWidth={2.5} />
                  <Text style={styles.parsedItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
          <ContinueButton label="Looks good — continue" onPress={() => next()} />
        </>
      )}
    </View>
  );
}

// ─── Complete step ────────────────────────────────────────────────────────────

function CompleteStep({ onDone }: { onDone: () => void }) {
  const finish = useOnboardingStore((s) => s.finish);

  // CompleteStep is reached via next() which already moved currentStep to 'complete'
  // and PATCHed onboardingStep. finish() is called when user taps the CTA — it sets
  // onboardingComplete: true so the cold-start AI can fire 1.5s later (backend).
  const handleDone = async () => {
    await finish();
    onDone();
  };

  return (
    <View style={styles.completeContainer}>
      <View style={styles.completTree}>
        <Text style={{ fontSize: 80 }}>🌱</Text>
      </View>
      <Text style={styles.completeTitle}>Your tree is planted.</Text>
      <Text style={styles.completeSub}>
        Every workout feeds it.{'\n'}Every PR makes it stronger.{'\n'}Log protein and water to keep
        it growing.
      </Text>
      <TouchableOpacity style={styles.nextBtn} onPress={handleDone}>
        <Text style={styles.nextBtnText}>Meet Wali AI</Text>
        <ChevronRight color={colors.primaryFg} size={18} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  progressBar: { height: 3, backgroundColor: colors.muted, marginTop: 44 },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  backBtn: {
    width: touchTarget.min,
    height: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    marginTop: spacing.sm,
  },
  stepContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  stepTitle: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.foreground,
  },
  stepSub: { fontSize: typography.size.sm, color: colors.mutedForeground, lineHeight: 20 },
  optionsList: { gap: spacing.sm, flex: 1 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: touchTarget.comfortable,
  },
  optionCardActive: { borderColor: colors.primary, borderWidth: 1.5 },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionText: { flex: 1 },
  optionLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.foreground,
  },
  optionSub: { fontSize: typography.size.xs, color: colors.mutedForeground, marginTop: 2 },
  freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  freqCard: {
    width: '30%',
    aspectRatio: 1.2,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 0.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  freqCardActive: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: colors.primary + '08',
  },
  freqNum: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.extrabold,
    color: colors.foreground,
  },
  freqLabel: { fontSize: typography.size.xs, color: colors.mutedForeground },
  freqInfo: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  freqInfoText: { fontSize: typography.size.sm, color: colors.mutedForeground, textAlign: 'center' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.full,
    borderWidth: 0.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: touchTarget.min,
  },
  chipActive: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: colors.primary + '10',
  },
  chipLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.foreground,
  },
  fieldLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.mutedForeground,
    marginTop: spacing.md,
  },
  textArea: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 88,
    color: colors.foreground,
    fontSize: typography.size.sm,
    textAlignVertical: 'top',
  },
  unitsRow: { flexDirection: 'row', gap: spacing.md },
  unitCard: {
    flex: 1,
    height: 100,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 0.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  unitCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primary + '08',
  },
  unitLabel: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.extrabold,
    color: colors.foreground,
  },
  unitSub: { fontSize: typography.size.xs, color: colors.mutedForeground },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: spacing.md,
  },
  targetIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetTextWrap: { flex: 1 },
  targetLabel: {
    fontSize: typography.size.sm,
    color: colors.mutedForeground,
    fontWeight: typography.weight.medium,
  },
  targetValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.extrabold,
    color: colors.foreground,
  },
  targetUnit: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.mutedForeground,
  },
  stepperWrap: { flexDirection: 'row', gap: spacing.xs },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: { opacity: 0.4 },
  suggestionBtn: { paddingVertical: spacing.sm, alignItems: 'center' },
  suggestionBtnText: {
    fontSize: typography.size.sm,
    color: colors.primary,
    fontWeight: typography.weight.semibold,
  },
  importCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  importLoading: { alignItems: 'center', gap: spacing.sm },
  importLoadingText: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold },
  importLoadingSub: {
    fontSize: typography.size.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  importCardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.foreground,
    textAlign: 'center',
  },
  importCardSub: {
    fontSize: typography.size.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
  parsedItems: { width: '100%', gap: spacing.xs },
  parsedItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  parsedItemText: { fontSize: typography.size.sm, color: colors.foreground },
  skipBtn: { alignItems: 'center', paddingVertical: spacing.md, minHeight: touchTarget.min },
  skipBtnText: { fontSize: typography.size.base, color: colors.mutedForeground },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: touchTarget.comfortable,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.primaryFg,
  },
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  completTree: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: typography.weight.extrabold,
    color: colors.foreground,
    textAlign: 'center',
  },
  completeSub: {
    fontSize: typography.size.base,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 26,
  },
});
