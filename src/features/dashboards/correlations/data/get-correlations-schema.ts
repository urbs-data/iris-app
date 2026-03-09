import { z } from 'zod';

export const getCorrelationsSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  substance: z.string(),
  area: z.string().optional(),
  wells: z.array(z.string())
});
