import { z } from 'zod';
import { REPORT_TYPES } from '../lib/types';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const exportReportSchema = z.object({
  fechaDesde: z.string().regex(dateRegex),
  fechaHasta: z.string().regex(dateRegex),
  configuraciones: z
    .array(
      z.object({
        reporte: z.enum(REPORT_TYPES),
        pozos: z.array(z.string()).optional()
      })
    )
    .min(1)
});

export type ExportReportInput = z.infer<typeof exportReportSchema>;
