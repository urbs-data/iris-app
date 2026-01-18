import { z } from 'zod';

export const getWellsSchema = z.object({
  area: z.string().optional()
});

export type GetWellsInput = z.infer<typeof getWellsSchema>;
