import { z } from 'zod';
import { WellType, SampleType } from '../../substance/types';

export const fqBaseFiltersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  parametro: z.string().optional(),
  substance: z.string().optional(),
  wellType: z.enum(Object.values(WellType) as [string, ...string[]]).optional(),
  area: z.string().optional(),
  wells: z.array(z.string()).optional(),
  sampleType: z
    .enum(Object.values(SampleType) as [string, ...string[]])
    .optional()
});
