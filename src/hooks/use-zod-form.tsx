import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForm,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn
} from 'react-hook-form';
import type { z } from 'zod';

export function useZodForm<
  TSchema extends z.ZodType<any, any, any>,
  TFieldValues extends FieldValues = z.infer<TSchema>
>(
  props: Omit<UseFormProps<TFieldValues>, 'resolver'> & {
    schema: TSchema;
  }
): UseFormReturn<TFieldValues> {
  return useForm<TFieldValues>({
    ...props,
    resolver: zodResolver(props.schema, undefined, {
      // This makes it so we can use `.transform()`s on the schema without same transform getting applied again when it reaches the server
      raw: true
    })
  });
}
