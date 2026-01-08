import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE
} from 'next-safe-action';
import { z } from 'zod';

import { getAuthContext, getAuthOrganizationContext } from '@/lib/context';
import { logger } from '@/lib/logger';
import {
  ForbiddenError,
  GatewayError,
  NotFoundError,
  PreConditionError,
  ValidationError
} from '@/lib/errors';
import { getDb } from '@/db';

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (
      e instanceof ValidationError ||
      e instanceof ForbiddenError ||
      e instanceof NotFoundError ||
      e instanceof PreConditionError ||
      e instanceof GatewayError
    ) {
      return e.message;
    } else if (process.env.NODE_ENV == 'development') {
      console.log(e); // eslint-disable-line no-console
      return e.name + ' -- ' + e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
  defineMetadataSchema() {
    return z.object({
      actionName: z.string()
    });
  }
});

export const actionClientWithLogger = actionClient.use(
  async ({ next, clientInput, metadata }) => {
    const result = await next({ ctx: undefined });

    if (process.env.NODE_ENV === 'development') {
      logger('Metadata ->', metadata);
      logger('Input ->', clientInput);
      logger('Result ->', result.data);

      if (result.serverError) {
        logger('Error ->', result.serverError);
      }
      if (result.validationErrors) {
        logger('Validation Errors ->', result.validationErrors);
      }

      return result;
    }

    return result;
  }
);

export const authActionClient = actionClientWithLogger.use(async ({ next }) => {
  const ctx = await getAuthContext();
  const db = await getDb();
  return next({ ctx: { ...ctx, db } });
});

export const authOrganizationActionClient = actionClientWithLogger.use(
  async ({ next }) => {
    const ctx = await getAuthOrganizationContext();
    const db = await getDb();
    return next({ ctx: { ...ctx, db } });
  }
);
