'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getMonthlyMetricsSchema } from './get-monthly-metrics-schema';
import type { MonthlyConcentration } from '../types';
import { randomInt } from 'crypto';

interface MonthlyMetricsResult {
  data: MonthlyConcentration[];
  guideLevel: number;
}

export const getMonthlyMetrics = authOrganizationActionClient
  .metadata({ actionName: 'getMonthlyMetrics' })
  .inputSchema(getMonthlyMetricsSchema)
  .action(async ({ parsedInput }): Promise<MonthlyMetricsResult> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Return mock data matching the mockup image
    // TODO: Replace with actual DB query using parsedInput filters
    const data: MonthlyConcentration[] = [
      { date: '2021-01-01', value: randomInt(100, 1000) },
      { date: '2021-04-01', value: randomInt(100, 1000) },
      { date: '2021-07-01', value: randomInt(100, 1000) },
      { date: '2021-10-01', value: randomInt(100, 1000) },
      { date: '2022-01-01', value: randomInt(100, 1000) },
      { date: '2022-04-01', value: randomInt(100, 1000) },
      { date: '2022-07-01', value: randomInt(100, 1000) },
      { date: '2022-10-01', value: randomInt(100, 1000) },
      { date: '2023-01-01', value: 60 },
      { date: '2023-04-01', value: randomInt(100, 1000) },
      { date: '2023-07-01', value: randomInt(100, 1000) },
      { date: '2024-01-01', value: 180 },
      { date: '2024-04-01', value: 280 },
      { date: '2024-09-01', value: 450 },
      { date: '2025-02-01', value: 520 },
      { date: '2025-07-01', value: 380 },
      { date: '2025-10-01', value: 220 }
    ];

    return {
      data,
      guideLevel: 100 // Nivel guía en µg/l
    };
  });
