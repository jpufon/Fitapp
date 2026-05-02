// Shape passed as a navigation param into ActiveWorkoutScreen.
// Used by TrainScreen (when starting / resuming) and by App.tsx's
// RootStackParamList. Keep this minimal — anything richer should come
// from a real query (see hooks/useTrainData.ts).

export type WorkoutSummary = {
  id: string;
  name: string;
  type: string;
  exerciseCount: number;
  durationMinutes: number;
  completedAt?: string | null;
};
