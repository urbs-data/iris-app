'use server';

import { productsTable } from '@/db/schema';
import { getProductByIdSchema } from './get-product-by-id-schema';
import { Product } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authOrganizationActionClient } from '@/lib/actions/safe-action';

export const getProductById = authOrganizationActionClient
  .metadata({ actionName: 'getProductById' })
  .inputSchema(getProductByIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    const product = await ctx.db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, parsedInput.id))
      .limit(1);

    return product[0] as Product;
  });
