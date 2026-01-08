import { notFound } from 'next/navigation';
import ProductForm from './product-form';
import { resolveActionResult } from '@/lib/actions/client';
import { getProductById } from '../data/get-product-by-id';

type TProductViewPageProps = {
  productId: string;
};

export default async function ProductViewPage({
  productId
}: TProductViewPageProps) {
  let product = null;
  let pageTitle = 'Create New Product';

  if (productId !== 'new') {
    const fetchedProduct = await resolveActionResult(
      getProductById({ id: Number(productId) })
    );
    if (!fetchedProduct) {
      notFound();
    }
    pageTitle = `Edit Product`;
  }

  return <ProductForm />;
}
