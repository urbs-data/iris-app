'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getMapMetricsSchema } from './get-map-metrics-schema';
import type { WellMetrics } from '../types';

export const getMapMetrics = authOrganizationActionClient
  .metadata({ actionName: 'getMapMetrics' })
  .inputSchema(getMapMetricsSchema)
  .action(async ({ parsedInput }): Promise<WellMetrics[]> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Return mock data for wells with coordinates around Berazategui
    // TODO: Replace with actual DB query using parsedInput filters
    const data: WellMetrics[] = [
      {
        wellId: 'well-001',
        wellName: 'Pozo PM-01',
        lat: -34.7532,
        lng: -58.2196,
        min: 50,
        q1: 100,
        median: 250,
        q3: 400,
        max: 600,
        mean: 280
      },
      {
        wellId: 'well-002',
        wellName: 'Pozo PM-02',
        lat: -34.758,
        lng: -58.215,
        min: 30,
        q1: 80,
        median: 150,
        q3: 300,
        max: 450,
        mean: 190
      },
      {
        wellId: 'well-003',
        wellName: 'Pozo PM-03',
        lat: -34.762,
        lng: -58.225,
        min: 20,
        q1: 60,
        median: 120,
        q3: 200,
        max: 350,
        mean: 145
      },
      {
        wellId: 'well-004',
        wellName: 'Pozo PM-04',
        lat: -34.749,
        lng: -58.21,
        min: 100,
        q1: 200,
        median: 400,
        q3: 600,
        max: 800,
        mean: 420
      },
      {
        wellId: 'well-005',
        wellName: 'Pozo PM-05',
        lat: -34.765,
        lng: -58.205,
        min: 40,
        q1: 90,
        median: 180,
        q3: 280,
        max: 400,
        mean: 195
      }
    ];

    return data;
  });
