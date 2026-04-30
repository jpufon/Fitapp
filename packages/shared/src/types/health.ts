import { z } from 'zod';

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  env: z.enum(['development', 'test', 'production']),
  time: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
