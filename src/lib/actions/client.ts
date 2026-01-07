import { SafeActionResult } from 'next-safe-action';
import { z } from 'zod';

export const isActionSuccessful = <T extends z.ZodType>(
  action?: SafeActionResult<string, T, any, any, any>
): action is {
  data: z.infer<T>;
  serverError: undefined;
  validationError: undefined;
} => {
  if (!action) {
    return false;
  }

  if (action.serverError) {
    return false;
  }

  if (action.validationErrors) {
    return false;
  }

  return true;
};

export const resolveActionResult = async <T extends z.ZodType, Data>(
  action: Promise<SafeActionResult<string, T, any, Data>>
): Promise<Data> => {
  return new Promise((resolve, reject) => {
    action
      .then((result) => {
        if (isActionSuccessful(result)) {
          resolve(result.data as Data);
        } else {
          const errorMessage = result?.serverError ?? 'Something went wrong';
          reject(new Error(errorMessage));
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};
