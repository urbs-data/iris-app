import { z } from 'zod';

export const getSasUriSchema = z.object({
  blobPath: z.string().min(1)
});
