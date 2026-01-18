import { z } from 'zod';

export const getDocumentsSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
  q: z.string().optional(),
  year: z.string().optional(),
  classification: z.string().optional(),
  subClassification: z.string().optional(),
  fileType: z.string().optional()
});

export type GetDocumentsInput = z.infer<typeof getDocumentsSchema>;
