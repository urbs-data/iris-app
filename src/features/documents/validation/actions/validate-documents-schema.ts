import { z } from 'zod';
import { DocumentType } from '../lib/models';

export const validateDocumentsSchema = z.object({
  documents: z
    .array(
      z.object({
        documentType: z.enum(DocumentType),
        file: z.instanceof(File)
      })
    )
    .min(1, 'validation.atLeastOneDocument')
});

export type ValidateDocumentsInput = z.infer<typeof validateDocumentsSchema>;
