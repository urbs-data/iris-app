import * as z from 'zod';

export const getProductByIdSchema = z.object({
  id: z.number()
});

export type GetProductByIdSchema = z.infer<typeof getProductByIdSchema>;
