import { z } from 'zod';

export const deleteDocumentSchema = z.object({
  blobPath: z.string().min(1, 'La ruta del archivo es requerida')
});

export type DeleteDocumentInput = z.infer<typeof deleteDocumentSchema>;
