'use server';

import { productsTable } from '@/db/schema';
import { getProductsSchema } from './get-products-schema';
import { eq, like, and, or, asc, desc, SQL, count } from 'drizzle-orm';
import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { Product } from '@/db/schema';

export const getProducts = authOrganizationActionClient
  .metadata({ actionName: 'getProducts' })
  .inputSchema(getProductsSchema)
  .action(async ({ ctx, parsedInput }) => {
    const page = parsedInput.page || 1;
    const limit = parsedInput.limit || 10;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (parsedInput.search) {
      conditions.push(
        or(
          like(productsTable.name, `%${parsedInput.search}%`),
          like(productsTable.description, `%${parsedInput.search}%`),
          like(productsTable.category, `%${parsedInput.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const columnMap: Record<string, any> = {
      id: productsTable.id,
      name: productsTable.name,
      description: productsTable.description,
      price: productsTable.price,
      category: productsTable.category,
      created_at: productsTable.created_at,
      updated_at: productsTable.updated_at,
      photo_url: productsTable.photo_url,
      user_id: productsTable.user_id
    };

    const orderByClause: SQL[] = [];
    if (parsedInput.sortBy) {
      const column = columnMap[parsedInput.sortBy];
      if (column) {
        const isDesc = parsedInput.sortDirection === 'desc';
        orderByClause.push(isDesc ? desc(column) : asc(column));
      }
    }

    const filteredProducts = await ctx.db
      .select()
      .from(productsTable)
      .where(and(whereClause, eq(productsTable.user_id, ctx.session.user.id)))
      .orderBy(
        ...(orderByClause.length > 0 ? orderByClause : [asc(productsTable.id)])
      )
      .limit(limit)
      .offset(offset);

    const [{ count: totalCount }] = await ctx.db
      .select({ count: count() })
      .from(productsTable)
      .where(and(whereClause, eq(productsTable.user_id, ctx.session.user.id)));

    return {
      products: filteredProducts as Product[],
      totalCount
    };
  });
