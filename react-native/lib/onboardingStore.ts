// Onboarding state — Zustand store + MMKV persistence.
// Local state persists per-edit (so app kill mid-step doesn't lose typing).
// Server save fires on step advance via apiMutate (auto-queued if offline).

import { create } from 'zustand';
import { MMKV } from './mmkv-shim';
import { apiMutate } from './api';

export type Goal = 'hybrid' | 'strength' | 'running' | 'fat_loss' | 'general';
export type Experience = 'beginner' | 'intermediate' | 'advanced';
export type Equipment =
  | 'full_gym'
  | 'home_gym'
  | 'dumbbells'
  | 'kettlebells'
  | 'bodyweight'
  | 'cardio';
export type Injury =
  | 'knee'
  | 'lower_back'
  | 'shoulder'
  | 'hip'
  | 'ankle'
  | 'wrist'
  | 'none';

export type OnboardingStep =
  | 'goal'
  | 'experience'
  | 'frequency'
  | 'equipment'
  | 'injuries'
  | 'units'
  | 'targets'
  | 'import'
  | 'complete';

export const STEP_ORDER: OnboardingStep[] = [
  'goal',
  'experience',
  'frequency',
  'equipment',
  'injuries',
  'units',
  'targets',
  'import',
  'complete',
];

export type OnboardingData = {
  goal: Goal | null;
  experience: Experience | null;
  trainingDaysPerWeek: number;
  equipment: Equipment[];
  injuries: Injury[];
  injuryNotes: string;
  units: 'kg' | 'lbs';
  proteinTargetG: number;
  waterTargetMl: number;
  importedFromApp: string | null;
  currentStep: OnboardingStep;
};

const STORAGE_KEY = 'onboarding.state';
const storage = new MMKV({ id: 'walifit-onboarding' });

function defaultUnits(): 'kg' | 'lbs' {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
    return locale.startsWith('en-US') ? 'lbs' : 'kg';
  } catch {
    return 'kg';
  }
}

const initialData: OnboardingData = {
  goal: null,
  experience: null,
  trainingDaysPerWeek: 4,
  equipment: [],
  injuries: [],
  injuryNotes: '',
  units: defaultUnits(),
  proteinTargetG: 130,
  waterTargetMl: 3000,
  importedFromApp: null,
  currentStep: 'goal',
};

export function defaultsForGoal(goal: Goal | null): {
  proteinTargetG: number;
  waterTargetMl: number;
} {
  switch (goal) {
    case 'hybrid':
      return { proteinTargetG: 140, waterTargetMl: 3000 };
    case 'strength':
      return { proteinTargetG: 160, waterTargetMl: 3000 };
    case 'running':
      return { proteinTargetG: 110, waterTargetMl: 3500 };
    case 'fat_loss':
      return { proteinTargetG: 130, waterTargetMl: 3000 };
    case 'general':
      return { proteinTargetG: 100, waterTargetMl: 2500 };
    default:
      return { proteinTargetG: 130, waterTargetMl: 3000 };
  }
}

function loadFromStorage(): OnboardingData {
  const raw = storage.getString(STORAGE_KEY);
  if (!raw) return initialData;
  try {
    return { ...initialData, ...(JSON.parse(raw) as Partial<OnboardingData>) };
  } catch {
    return initialData;
  }
}

function persist(data: OnboardingData): void {
  storage.set(STORAGE_KEY, JSON.stringify(data));
}

async function saveToServer(data: OnboardingData): Promise<void> {
  // Fire-and-forget — apiMutate auto-queues if offline or backend route missing.
  await apiMutate({
    method: 'PATCH',
    path: '/users/me/onboarding',
    body: {
      goal: data.goal,
      experience: data.experience,
      trainingDaysPerWeek: data.trainingDaysPerWeek,
      equipment: data.equipment,
      injuries: data.injuries,
      injuryNotes: data.injuryNotes,
      unitSystem: data.units,
      proteinTargetG: data.proteinTargetG,
      waterTargetMl: data.waterTargetMl,
      onboardingStep: data.currentStep,
    },
  });
}

type Store = OnboardingData & {
  update: (patch: Partial<OnboardingData>) => void;
  next: () => OnboardingStep | null;
  back: () => OnboardingStep | null;
  reset: () => void;
  finish: () => Promise<void>;
};

export const useOnboardingStore = create<Store>((set, get) => ({
  ...loadFromStorage(),

  update: (patch) => {
    set((s) => {
      const merged: OnboardingData = { ...s, ...patch };
      persist(merged);
      return merged;
    });
  },

  next: () => {
    const { currentStep } = get();
    const idx = STEP_ORDER.indexOf(currentStep);
    const nextStep = STEP_ORDER[idx + 1] ?? null;
    if (!nextStep) return null;

    set((s) => {
      const merged: OnboardingData = { ...s, currentStep: nextStep };
      persist(merged);
      void saveToServer(merged).catch(() => {});
      return merged;
    });
    return nextStep;
  },

  back: () => {
    const { currentStep } = get();
    const idx = STEP_ORDER.indexOf(currentStep);
    const prev = idx > 0 ? STEP_ORDER[idx - 1] : null;
    if (!prev) return null;

    set((s) => {
      const merged: OnboardingData = { ...s, currentStep: prev };
      persist(merged);
      return merged;
    });
    return prev;
  },

  reset: () => {
    persist(initialData);
    set(initialData);
  },

  finish: async () => {
    set((s) => {
      const merged: OnboardingData = { ...s, currentStep: 'complete' };
      persist(merged);
      return merged;
    });
    try {
      await apiMutate({
        method: 'PATCH',
        path: '/users/me/onboarding',
        body: { onboardingComplete: true },
      });
    } catch {
      // queued — pick up on reconnect
    }
  },
}));
