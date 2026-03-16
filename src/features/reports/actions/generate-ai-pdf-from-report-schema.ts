import { z } from 'zod';

export const generateAiPdfFromReportSchema = z.object({
  reportId: z.string().min(1),
  forceRegenerate: z.boolean().optional().default(false)
});

export type GenerateAiPdfFromReportInput = z.infer<
  typeof generateAiPdfFromReportSchema
>;
