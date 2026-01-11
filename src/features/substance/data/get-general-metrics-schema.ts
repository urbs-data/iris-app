import { z } from 'zod';

export const getGeneralMetricsSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  substance: z.string().optional(),
  wellType: z.enum(['all', 'monitoring', 'pump']).default('all'),
  area: z.string().optional(),
  well: z.string().optional(),
  sampleType: z.enum(['water', 'soil']).default('water')
});

export type GetGeneralMetricsInput = z.infer<typeof getGeneralMetricsSchema>;
