import { z } from 'zod';

export const getRecentExportsSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10)
});

export type GetRecentExportsInput = z.infer<typeof getRecentExportsSchema>;
