import { z } from 'zod';
import { PRESET_TYPES, REPORT_TYPES } from '../lib/types';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const exportReportSchema = z.object({
  reportType: z.enum(REPORT_TYPES).optional(),
  preset: z.enum(PRESET_TYPES).optional(),
  fechaDesde: z.string().regex(dateRegex),
  fechaHasta: z.string().regex(dateRegex),
  pozos: z.array(z.string()).optional()
});

export type ExportReportInput = z.infer<typeof exportReportSchema>;

export const exportPresetReportSchema = z.object({
  preset: z.string().min(1),
  fechaDesde: z.string().regex(dateRegex),
  fechaHasta: z.string().regex(dateRegex),
  pozos: z.array(z.string()).optional()
});

export type ExportPresetReportInput = z.infer<typeof exportPresetReportSchema>;
