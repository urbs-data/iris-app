'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getQuarterlyMetricsSchema } from './get-quarterly-metrics-schema';
import type { QuarterlyStats } from '../types';

interface QuarterlyMetricsResult {
  data: QuarterlyStats[];
  guideLevel: number;
}

export const getQuarterlyMetrics = authOrganizationActionClient
  .metadata({ actionName: 'getQuarterlyMetrics' })
  .inputSchema(getQuarterlyMetricsSchema)
  .action(async ({ parsedInput }): Promise<QuarterlyMetricsResult> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 700));

    // Return mock data matching the mockup image (boxplot by year)
    // TODO: Replace with actual DB query using parsedInput filters
    const data: QuarterlyStats[] = [
      {
        period: '2021',
        min: 50,
        q1: 80,
        median: 350,
        q3: 120,
        max: 520,
        mean: 375
      },
      {
        period: '2022',
        min: 20,
        q1: 40,
        median: 45,
        q3: 90,
        max: 250,
        mean: 85
      },
      {
        period: '2023',
        min: 10,
        q1: 30,
        median: 40,
        q3: 55,
        max: 80,
        mean: 53
      },
      {
        period: '2024',
        min: 150,
        q1: 250,
        median: 480,
        q3: 620,
        max: 750,
        mean: 480
      },
      {
        period: '2025',
        min: 100,
        q1: 180,
        median: 350,
        q3: 450,
        max: 550,
        mean: 373
      }
    ];

    return {
      data,
      guideLevel: 100 // Nivel guía en µg/l
    };
  });
