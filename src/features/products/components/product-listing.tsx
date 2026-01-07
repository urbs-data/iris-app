import { searchParamsCache } from '@/features/products/searchparams';
import { ProductTable } from './product-tables';
import { columns } from './product-tables/columns';
import { resolveActionResult } from '@/lib/actions/client';
import { getProducts } from '../data/get-products';

type ProductListingPage = {};

export default async function ProductListingPage({}: ProductListingPage) {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const categories = searchParamsCache.get('category');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(categories && { categories: categories })
  };

  const data = await resolveActionResult(getProducts(filters));
  const totalProducts = data.totalCount;
  const products = data.products;

  return (
    <ProductTable
      data={products}
      totalItems={totalProducts}
      columns={columns}
    />
  );
}
