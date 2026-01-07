import * as z from 'zod';

export const getProductsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional()
});

export type GetProductsSchema = z.infer<typeof getProductsSchema>;
