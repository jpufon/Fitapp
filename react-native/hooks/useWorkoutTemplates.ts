// Workout templates — list, create, edit, duplicate, delete (WF-011).
// Reads via useCachedQuery so the builder works offline once primed.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCachedQuery } from './useCachedQuery';
import { apiMutate, apiQuery, hasApiConfig } from '../lib/api';

export type TemplateExercise = {
  id?: string;
  exerciseName: string;
  exerciseId?: string | null;
  position: number;
  defaultSets?: number;
  defaultReps?: number | null;
  restS?: number | null;
  durationS?: number | null;
  rounds?: number | null;
  intervalWorkS?: number | null;
  intervalRestS?: number | null;
  notes?: string | null;
};

export type WorkoutTemplate = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  type: 'strength' | 'hybrid' | 'conditioning' | 'run' | 'rest';
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  exercises: TemplateExercise[];
};

type ListResponse = { templates: WorkoutTemplate[] };

export function useWorkoutTemplates() {
  return useCachedQuery<WorkoutTemplate[]>({
    queryKey: ['workout-templates'],
    cacheKey: 'query.workoutTemplates.all',
    queryFn: async () => {
      const res = await apiQuery<ListResponse>('/workout-templates');
      return res.templates;
    },
    enabled: hasApiConfig,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────

type CreateInput = {
  name: string;
  description?: string;
  type?: WorkoutTemplate['type'];
  exercises: Array<Omit<TemplateExercise, 'id'>>;
};

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInput) =>
      apiMutate<{ template: WorkoutTemplate }>({
        method: 'POST',
        path: '/workout-templates',
        body: input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-templates'] }),
  });
}

type UpdateInput = Partial<CreateInput> & { archived?: boolean };

export function useUpdateTemplate(templateId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInput) =>
      apiMutate<{ template: WorkoutTemplate }>({
        method: 'PATCH',
        path: `/workout-templates/${templateId}`,
        body: input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-templates'] }),
  });
}

export function useDuplicateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) =>
      apiMutate<{ template: WorkoutTemplate }>({
        method: 'POST',
        path: `/workout-templates/${templateId}/duplicate`,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-templates'] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) =>
      apiMutate<null>({
        method: 'DELETE',
        path: `/workout-templates/${templateId}`,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-templates'] }),
  });
}
