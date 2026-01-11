import { z } from 'zod';
import { WellType, SampleType } from '../types';

export const baseMetricsFiltersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  substance: z.string().optional(),
  wellType: z.enum(WellType).optional(),
  area: z.string().optional(),
  well: z.string().optional(),
  sampleType: z.enum(SampleType).optional()
});

export type BaseMetricsFilters = z.infer<typeof baseMetricsFiltersSchema>;
