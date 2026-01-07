import { generatePhotoUrl } from './products';
import { validateProduct } from './product-validations';
import { NewProduct } from '@/db/schema';

export interface ProductInput {
  name: string;
  category: string;
  price: number;
  description: string;
}

export function createProductData(
  input: ProductInput,
  userId: string
): NewProduct {
  validateProduct(input);

  const now = new Date();
  const photoUrl = generatePhotoUrl(input.name);

  return {
    user_id: userId,
    name: input.name,
    category: input.category,
    price: input.price,
    description: input.description,
    photo_url: photoUrl,
    created_at: now,
    updated_at: now
  };
}

export function createManyProductData(
  inputs: ProductInput[],
  userId: string
): NewProduct[] {
  return inputs.map((input) => createProductData(input, userId));
}
