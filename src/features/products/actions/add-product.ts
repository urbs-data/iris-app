'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { addProductSchema } from './add-product-schema';
import { productsTable } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { ValidationError } from '@/lib/errors';
import { and, eq } from 'drizzle-orm';
import { createProductData } from '../lib/product-factory';

export const addProduct = authOrganizationActionClient
  .metadata({ actionName: 'addProduct' })
  .inputSchema(addProductSchema)
  .action(async ({ parsedInput, ctx }) => {
    const productData = createProductData(
      {
        name: parsedInput.name,
        category: parsedInput.category,
        price: parsedInput.price,
        description: parsedInput.description
      },
      ctx.session.user.id
    );

    const existingProduct = await ctx.db
      .select()
      .from(productsTable)
      .where(
        and(
          eq(productsTable.name, productData.name),
          eq(productsTable.user_id, ctx.session.user.id)
        )
      );
    if (existingProduct.length > 0) {
      throw new ValidationError('Product already exists');
    }

    await ctx.db.insert(productsTable).values(productData);

    revalidatePath('/dashboard/product');
    return { message: 'Add product successful' };
  });
