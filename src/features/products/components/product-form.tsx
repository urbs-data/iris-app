'use client';

import { FormFileUpload } from '@/components/forms/form-file-upload';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { resolveActionResult } from '@/lib/actions/client';
import { useRouter } from 'next/navigation';
import { SubmitHandler } from 'react-hook-form';
import { addProduct } from '../actions/add-product';
import { useMutation } from '@tanstack/react-query';
import {
  addProductSchema,
  AddProductSchema
} from '../actions/add-product-schema';
import { toast } from 'sonner';
import { useZodForm } from '@/hooks/use-zod-form';
import { CATEGORIES } from '@/constants/data';

export default function ProductNewForm() {
  const form = useZodForm({
    schema: addProductSchema,
    mode: 'all',
    defaultValues: {
      image: undefined,
      name: '',
      category: '',
      price: 0,
      description: ''
    }
  });
  const canSubmit = !form.formState.isSubmitting && form.formState.isValid;

  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: AddProductSchema) => {
      return resolveActionResult(addProduct(data));
    },
    onSuccess: (data) => {
      toast.success(data.message);
      router.push('/dashboard/product');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const onSubmit: SubmitHandler<AddProductSchema> = async (data) => {
    if (!canSubmit) {
      return;
    }

    mutate(data);
  };

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          Create New Product
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-8'
        >
          <FormFileUpload
            control={form.control}
            name='image'
            label='Product Image'
            description='Upload a product image'
            config={{
              maxSize: 5 * 1024 * 1024,
              maxFiles: 4
            }}
          />

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <FormInput
              control={form.control}
              name='name'
              label='Product Name'
              placeholder='Enter product name'
              required
            />

            <FormSelect
              control={form.control}
              name='category'
              label='Category'
              placeholder='Select category'
              required
              options={CATEGORIES}
            />

            <FormInput
              control={form.control}
              name='price'
              label='Price'
              placeholder='Enter price'
              required
              type='number'
              min={0}
              step='0.01'
            />
          </div>

          <FormTextarea
            control={form.control}
            name='description'
            label='Description'
            placeholder='Enter product description'
            required
            config={{
              maxLength: 500,
              showCharCount: true,
              rows: 4
            }}
          />

          <Button type='submit' disabled={isPending}>
            {isPending ? 'Adding Product...' : 'Add Product'}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
