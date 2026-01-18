import { z } from 'zod';

export const getFilesSchema = z.object({
  path: z.string().default('/')
});

export type GetFilesInput = z.infer<typeof getFilesSchema>;
