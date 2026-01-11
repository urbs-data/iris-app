'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getGeneralMetricsSchema } from './get-general-metrics-schema';
import type { GeneralMetrics } from '../types';

export const getGeneralMetrics = authOrganizationActionClient
  .metadata({ actionName: 'getGeneralMetrics' })
  .inputSchema(getGeneralMetricsSchema)
  .action(async ({ parsedInput }): Promise<GeneralMetrics> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return mock data based on filters
    // TODO: Replace with actual DB query using parsedInput filters
    return {
      samples: 251,
      average: 367.5,
      median: 4.7,
      min: 0.05,
      max: 4082.0,
      stdDev: 888.33,
      guideLevel: 3,
      vsGuidePercent: 6480.25,
      vsMaxPercent: -68.36
    };
  });
