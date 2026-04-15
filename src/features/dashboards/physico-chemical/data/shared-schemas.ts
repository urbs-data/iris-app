import { z } from 'zod';

export const fqBaseFiltersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  parametro: z.string().optional(),
  substance: z.string().optional(),
  area: z.string().optional(),
  wells: z.array(z.string()).optional()
});
