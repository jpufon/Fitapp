#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Module = require('module');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const babel = require('@babel/core');

const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);

global.IS_REACT_ACT_ENVIRONMENT = true;

require.extensions['.ts'] = compile;
require.extensions['.tsx'] = compile;

function compile(mod, filename) {
  if (filename.includes(`${path.sep}node_modules${path.sep}`)) {
    return mod._compile(fs.readFileSync(filename, 'utf8'), filename);
  }

  const source = fs.readFileSync(filename, 'utf8');
  const { code } = babel.transformSync(source, {
    filename,
    babelrc: false,
    configFile: false,
    presets: [
      ['@babel/preset-typescript', { isTSX: filename.endsWith('.tsx'), allExtensions: true }],
      ['@babel/preset-react', { runtime: 'classic' }],
    ],
    plugins: ['@babel/plugin-transform-modules-commonjs'],
    sourceMaps: 'inline',
  });
  mod._compile(code, filename);
}

const calls = {
  navigations: [],
  templates: [],
  sets: [],
  onboarding: [],
};

let unitSystem = 'imperial';
const reactNativeMock = {
  ActivityIndicator: host('ActivityIndicator'),
  Modal: ({ visible, children, ...props }) => visible ? React.createElement('Modal', props, children) : null,
  Platform: { OS: 'ios', select: (options) => options.ios ?? options.default },
  Pressable: host('Pressable'),
  ScrollView: host('ScrollView'),
  StyleSheet: { create: (styles) => styles, flatten: (style) => style },
  Text: host('Text'),
  TextInput: host('TextInput'),
  TouchableOpacity: host('TouchableOpacity'),
  View: host('View'),
  Alert: {
    alert: (_title, _message, buttons = []) => {
      const destructive = buttons.find((button) => button.style === 'destructive');
      const fallback = buttons.find((button) => typeof button.onPress === 'function');
      (destructive || fallback)?.onPress?.();
    },
  },
  useColorScheme: () => 'dark',
  Switch: host('Switch'),
};

function host(name) {
  return ({ children, ...props }) => React.createElement(name, props, children);
}

let onboardingState = {
  goal: null,
  experience: null,
  trainingDaysPerWeek: 4,
  equipment: [],
  injuries: [],
  injuryNotes: '',
  units: 'lbs',
  proteinTargetG: 130,
  waterTargetMl: 3000,
  importedFromApp: null,
  currentStep: 'goal',
};
const onboardingListeners = new Set();

function emitOnboarding() {
  for (const listener of onboardingListeners) listener();
}

function setOnboarding(patch) {
  onboardingState = { ...onboardingState, ...patch };
  emitOnboarding();
}

function deviceTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

const mockTemplates = [
  {
    id: 'tpl-1',
    userId: 'smoke-user',
    name: 'Push Day A',
    description: 'Existing smoke template',
    type: 'strength',
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    exercises: [
      {
        id: 'tex-1',
        exerciseName: 'Bench Press',
        exerciseId: 'bench',
        position: 0,
        defaultSets: 3,
        defaultReps: 8,
        restS: 90,
      },
    ],
  },
];

const mockExercises = [
  {
    id: 'bench',
    name: 'Bench Press',
    category: 'strength',
    primaryMuscles: ['Chest'],
    secondaryMuscles: [],
    equipment: ['Barbell'],
  },
];

function smokeFilterExercises(exercises, opts) {
  const q = opts.query?.trim().toLowerCase() ?? '';
  const muscle = opts.muscle && opts.muscle !== 'All' ? opts.muscle : null;
  const equipment = opts.equipment && opts.equipment !== 'All' ? opts.equipment : null;
  if (!q && !muscle && !equipment) return exercises;
  return exercises.filter((ex) => {
    if (q && !ex.name.toLowerCase().includes(q)) return false;
    if (muscle && !ex.primaryMuscles.includes(muscle) && !ex.secondaryMuscles.includes(muscle)) {
      return false;
    }
    if (equipment && !ex.equipment.includes(equipment)) return false;
    return true;
  });
}

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'react-native') {
    return reactNativeMock;
  }

  if (request === 'walifit-shared') {
    return {
      calculatePlates: (targetWeight, options) => {
        const isImperial = options.system === 'imperial';
        const unit = isImperial ? 'lb' : 'kg';
        const barWeight = options.barWeight ?? (isImperial ? 45 : 20);
        const inventory = (options.plates ?? (isImperial ? [45, 35, 25, 10, 5, 2.5, 1.25] : [25, 20, 15, 10, 5, 2.5, 1.25, 0.5])).slice().sort((a, b) => b - a);
        let remaining = Math.max(0, (targetWeight - barWeight) / 2);
        const perSide = [];
        for (const plate of inventory) {
          while (remaining >= plate - 1e-6) {
            perSide.push(plate);
            remaining -= plate;
          }
        }
        const loaded = perSide.reduce((sum, plate) => sum + plate, 0);
        return {
          perSide,
          totalPlateWeight: loaded * 2,
          barWeight,
          unit,
          remainder: Math.round(remaining * 2 * 100) / 100,
        };
      },
    };
  }

  if (request === 'lucide-react-native') {
    return new Proxy({}, {
      get: (_target, prop) => function Icon() {
        return React.createElement('Icon', { name: String(prop) });
      },
    });
  }

  if (request === 'expo-linear-gradient') {
    return {
      LinearGradient: ({ children, ...props }) =>
        React.createElement(reactNativeMock.View, props, children),
    };
  }

  if (request === 'react-native-safe-area-context') {
    const { View } = reactNativeMock;
    return {
      SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
      useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    };
  }

  if (request === '@react-navigation/native') {
    return {
      useNavigation: () => ({
        navigate: (name, params) => calls.navigations.push({ name, params }),
      }),
    };
  }

  if (request.endsWith('/components/RestTimerSheet') || request === '../components/RestTimerSheet') {
    return {
      RestTimerSheet: ({ visible }) =>
        React.createElement(reactNativeMock.View, { testID: visible ? 'rest-timer-visible' : 'rest-timer-hidden' }),
    };
  }

  if (request.endsWith('/hooks/useTrainData') || request === '../hooks/useTrainData') {
    return {
      useTrainData: () => ({
        todayWorkout: null,
        history: [{ id: 'h1', name: 'Upper Body', exerciseCount: 4, durationMinutes: 40, completedAt: new Date().toISOString() }],
        historyQuery: { isLoading: false, isError: false, data: [{}] },
      }),
    };
  }

  if (request.endsWith('/hooks/useWorkoutTemplates') || request === '../hooks/useWorkoutTemplates') {
    const mutation = (type) => ({
      isPending: false,
      mutate: (payload) => calls.templates.push({ type, payload }),
      mutateAsync: async (payload) => {
        calls.templates.push({ type, payload });
        return { kind: 'sent', data: { template: mockTemplates[0] } };
      },
    });
    return {
      useWorkoutTemplates: () => ({ data: mockTemplates, isLoading: false, error: null }),
      useCreateTemplate: () => mutation('create'),
      useUpdateTemplate: (templateId) => ({
        isPending: false,
        mutateAsync: async (payload) => {
          calls.templates.push({ type: 'update', templateId, payload });
          return { kind: 'sent', data: { template: mockTemplates[0] } };
        },
      }),
      useDuplicateTemplate: () => mutation('duplicate'),
      useDeleteTemplate: () => mutation('delete'),
    };
  }

  if (request.endsWith('/hooks/useExerciseLibrary') || request === '../hooks/useExerciseLibrary') {
    return {
      useExerciseLibrary: () => ({ data: mockExercises, isLoading: false }),
      filterExercises: smokeFilterExercises,
      useFilteredExercises: (exercises, opts, options) => {
        const filtered = smokeFilterExercises(exercises ?? [], {
          query: opts.query,
          muscle: opts.muscle,
          equipment: opts.equipment,
        });
        const max = options?.maxResults;
        return max != null ? filtered.slice(0, max) : filtered;
      },
      useMuscleGroups: (_exercises) => ['All', 'Chest'],
    };
  }

  if (request.endsWith('/hooks/useUnitSystem') || request === '../hooks/useUnitSystem') {
    return { useUnitSystem: () => unitSystem };
  }

  if (request.endsWith('/hooks/useMutations') || request === '../hooks/useMutations') {
    const sent = (data) => ({ kind: 'sent', data });
    return {
      useStartWorkout: () => ({ mutateAsync: async () => sent({ workout: { id: 'persisted-workout-1' } }) }),
      useFinishWorkout: () => ({ isPending: false, mutateAsync: async () => sent({ workout: {}, newPRs: [] }) }),
      useLogSet: (workoutId) => ({
        mutateAsync: async (body) => {
          calls.sets.push({ workoutId, body });
          return sent({ set: body });
        },
      }),
    };
  }

  if (request.endsWith('/hooks/useCalendarData') || request === '../hooks/useCalendarData') {
    const today = formatLocalDate(new Date());
    const restDay = {
      date: today,
      hasActivity: false,
      completed: false,
      type: 'rest',
      score: 52,
      workoutName: null,
      exerciseCount: 0,
      durationMinutes: 0,
      hydrationMl: 2200,
      proteinG: 120,
      stepsCount: 4100,
      notes: null,
      vitalityScore: 52,
    };
    return {
      addDaysLocal: (date, amount) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount),
      addMonthsLocal: (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1),
      formatLocalDate,
      startOfWeekLocal: (date) => {
        const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        copy.setDate(copy.getDate() - copy.getDay());
        return copy;
      },
      useCalendarRange: () => ({ data: { days: [restDay], stats: { workouts: 0, streak: 0, avgScore: 52 } }, isLoading: false, isError: false }),
      useCalendarDay: () => ({ data: restDay, isLoading: false, isError: false }),
    };
  }

  if (request.endsWith('/lib/onboardingStore') || request === '../lib/onboardingStore') {
    const STEP_ORDER = ['goal', 'experience', 'frequency', 'equipment', 'injuries', 'units', 'targets', 'import', 'complete'];
    const apiSave = (state) => {
      calls.onboarding.push({
        path: '/users/me/onboarding',
        body: {
          goal: state.goal,
          experience: state.experience,
          trainingDaysPerWeek: state.trainingDaysPerWeek,
          equipment: state.equipment,
          injuries: state.injuries,
          injuryNotes: state.injuryNotes,
          unitSystem: state.units,
          proteinTargetG: state.proteinTargetG,
          waterTargetMl: state.waterTargetMl,
          onboardingStep: state.currentStep,
          timezone: deviceTimezone(),
        },
      });
    };
    const storeApi = {
      update: (patch) => setOnboarding(patch),
      next: () => {
        const idx = STEP_ORDER.indexOf(onboardingState.currentStep);
        const next = STEP_ORDER[idx + 1] || null;
        if (!next) return null;
        const merged = { ...onboardingState, currentStep: next };
        onboardingState = merged;
        apiSave(merged);
        emitOnboarding();
        return next;
      },
      back: () => null,
      reset: () => setOnboarding({ currentStep: 'goal' }),
      finish: async () => {},
    };
    return {
      STEP_ORDER,
      defaultsForGoal: () => ({ proteinTargetG: 130, waterTargetMl: 3000 }),
      useOnboardingStore: (selector) => React.useSyncExternalStore(
        (listener) => {
          onboardingListeners.add(listener);
          return () => onboardingListeners.delete(listener);
        },
        () => selector({ ...onboardingState, ...storeApi }),
        () => selector({ ...onboardingState, ...storeApi }),
      ),
    };
  }

  return originalLoad.apply(this, arguments);
};

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function render(element) {
  const { ThemeProvider } = require('../theme/ThemeProvider');
  let root;
  TestRenderer.act(() => {
    root = TestRenderer.create(React.createElement(ThemeProvider, null, element));
  });
  return root;
}

function destroy(root) {
  TestRenderer.act(() => {
    root.unmount();
  });
}

async function press(root, testID) {
  const node = root.root.findByProps({ testID });
  if (typeof node.props.onPress !== 'function') {
    throw new Error(`${testID} is not pressable`);
  }
  await TestRenderer.act(async () => {
    await node.props.onPress();
  });
}

async function changeText(root, testID, value) {
  const node = root.root.findByProps({ testID });
  if (typeof node.props.onChangeText !== 'function') {
    throw new Error(`${testID} is not editable`);
  }
  await TestRenderer.act(async () => {
    node.props.onChangeText(value);
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function smokeTrainToBuilder() {
  const TrainScreen = require('../screens/TrainScreen').default;
  const root = render(React.createElement(TrainScreen));
  await press(root, 'train-create-program');
  assert(calls.navigations.some((call) => call.name === 'WorkoutBuilder'), 'Train Create Program did not navigate to WorkoutBuilder');
  destroy(root);
  return 'Train tab Create Program opens WorkoutBuilder';
}

async function smokeWorkoutBuilder() {
  const WorkoutBuilderScreen = require('../screens/WorkoutBuilderScreen').default;
  const navigation = { goBack: () => calls.navigations.push({ name: 'goBack' }) };
  const root = render(React.createElement(WorkoutBuilderScreen, { navigation, route: { name: 'WorkoutBuilder' } }));

  await press(root, 'builder-create-template');
  await changeText(root, 'builder-template-name', 'Smoke Hybrid Template');
  await press(root, 'builder-add-exercise');
  await press(root, 'builder-pick-exercise-bench');
  await press(root, 'builder-confirm-exercises');
  await press(root, 'builder-row-Bench Press-interval');
  assert(JSON.stringify(root.toJSON()).includes('Work (s)'), 'Builder interval mode did not render interval fields');
  await press(root, 'builder-row-Bench Press-rounds');
  assert(JSON.stringify(root.toJSON()).includes('Reps/round'), 'Builder rounds mode did not render rounds fields');
  await press(root, 'builder-row-Bench Press-strength');
  await press(root, 'builder-save-template');

  const editRoot = render(React.createElement(WorkoutBuilderScreen, { navigation, route: { name: 'WorkoutBuilder' } }));
  await press(editRoot, 'builder-duplicate-tpl-1');
  await press(editRoot, 'builder-delete-tpl-1');
  const duplicate = calls.templates.find((call) => call.type === 'duplicate' && call.payload === 'tpl-1');
  const removed = calls.templates.find((call) => call.type === 'delete' && call.payload === 'tpl-1');
  const created = calls.templates.find((call) => call.type === 'create');
  assert(duplicate, 'Builder duplicate mutation did not fire');
  assert(removed, 'Builder delete mutation did not fire');
  assert(created?.payload?.exercises?.[0]?.exerciseName === 'Bench Press', 'Builder create mutation did not include selected exercise');
  assert(created.payload.exercises[0].intervalWorkS == null && created.payload.exercises[0].rounds == null, 'Builder strength mode did not clear conditioning fields before save');
  destroy(root);
  destroy(editRoot);
  return 'WorkoutBuilder create, row mode switching, save, duplicate, and delete passed';
}

async function smokeActiveWorkout() {
  const ActiveWorkoutScreen = require('../screens/ActiveWorkoutScreen').default;
  const navigation = { goBack: () => {}, replace: () => {} };
  const route = {
    params: {
      workout: { id: 'persisted-workout-1', name: 'Smoke Workout', type: 'strength' },
    },
  };
  const root = render(React.createElement(ActiveWorkoutScreen, { navigation, route }));

  await changeText(root, 'active-set-s1-weight', '100');
  await changeText(root, 'active-set-s1-reps', '5');
  await press(root, 'active-set-s1-log');
  await press(root, 'active-mode-e1-interval');
  await changeText(root, 'active-set-s2-work', '30');
  await changeText(root, 'active-set-s2-rest', '15');
  await changeText(root, 'active-set-s2-duration', '120');
  await press(root, 'active-set-s2-log');
  await press(root, 'active-mode-e1-rounds');
  await changeText(root, 'active-set-s3-reps', '10');
  await changeText(root, 'active-set-s3-duration', '90');
  await press(root, 'active-set-s3-log');

  assert(calls.sets.some((call) => call.body.weightKg === 100 && call.body.reps === 5), 'Strength set payload missing');
  assert(calls.sets.some((call) => call.body.intervalWorkS === 30 && call.body.intervalRestS === 15 && call.body.durationS === 120), 'Interval set payload missing');
  assert(calls.sets.some((call) => call.body.roundNumber === 3 && call.body.reps === 10 && call.body.durationS === 90), 'Rounds set payload missing');
  destroy(root);
  return 'ActiveWorkout mode chips logged strength, interval, and rounds payloads';
}

async function smokePlateCalcImperial() {
  const ActiveWorkoutScreen = require('../screens/ActiveWorkoutScreen').default;
  unitSystem = 'imperial';
  const root = render(React.createElement(ActiveWorkoutScreen, {
    navigation: { goBack: () => {}, replace: () => {} },
    route: { params: { workout: { id: 'persisted-workout-1', name: 'Plate Smoke', type: 'strength' } } },
  }));
  await press(root, 'active-open-plates-e1');
  const flat = JSON.stringify(root.toJSON());
  assert(root.root.findAllByProps({ testID: 'plate-badge-45' }).length > 0, 'Imperial plate calculator did not show 45lb plates');
  assert(flat.includes('45') && flat.includes('lb'), 'Imperial plate calculator did not show 45lb bar and lb units');
  destroy(root);
  return 'Plate calculator shows imperial bar and lb plate inventory';
}

async function smokeOnboardingTimezone() {
  const OnboardingFlowScreen = require('../screens/OnboardingFlowScreen').default;
  onboardingState = { ...onboardingState, goal: null, currentStep: 'goal' };
  calls.onboarding.length = 0;
  const root = render(React.createElement(OnboardingFlowScreen, { onComplete: () => {} }));
  await press(root, 'onboarding-goal-hybrid');
  await press(root, 'onboarding-continue');
  const payload = calls.onboarding[0]?.body;
  assert(payload?.timezone === deviceTimezone(), `Onboarding timezone ${payload?.timezone} did not match ${deviceTimezone()}`);
  assert(payload.timezone !== 'UTC', 'Onboarding timezone fell back to UTC');
  destroy(root);
  return `Onboarding step writes timezone ${payload.timezone}`;
}

async function smokeCalendarRestBadge() {
  const CalendarScreen = require('../screens/CalendarScreen').default;
  const root = render(React.createElement(CalendarScreen));
  await press(root, 'calendar-tab-day');
  root.root.findByProps({ testID: 'calendar-rest-recovery-badge' });
  assert(!JSON.stringify(root.toJSON()).includes('No workout logged'), 'Rest day rendered No workout logged');
  destroy(root);
  return 'Calendar day view renders Rest day Recovery badge';
}

(async () => {
  const results = [];
  for (const run of [
    smokeTrainToBuilder,
    smokeWorkoutBuilder,
    smokeActiveWorkout,
    smokePlateCalcImperial,
    smokeOnboardingTimezone,
    smokeCalendarRestBadge,
  ]) {
    results.push(await run());
  }

  console.log('UI smoke results:');
  for (const result of results) {
    console.log(`- ${result}`);
  }
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
