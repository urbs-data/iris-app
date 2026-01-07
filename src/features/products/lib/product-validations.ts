import { ValidationError } from '@/lib/errors';

function validateProductName(name: string): boolean {
  if (name.toLowerCase() === 'validacion') {
    return false;
  }
  return true;
}

function validateProductPrice(price: number): boolean {
  return price >= 0;
}

export function validateProduct(product: {
  name: string;
  price: number;
  category: string;
  description: string;
}): void {
  if (!validateProductName(product.name)) {
    throw new ValidationError(
      "No se puede tener un producto con el nombre 'validacion'"
    );
  }

  if (!validateProductPrice(product.price)) {
    throw new ValidationError('El precio no puede ser negativo');
  }
}
