'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { validateDocumentsSchema } from './validate-documents-schema';
import { ValidationResultData } from '../lib/models';

export const validateDocuments = authOrganizationActionClient
  .metadata({ actionName: 'validateDocuments' })
  .inputSchema(validateDocumentsSchema)
  .action(async ({ parsedInput, ctx }) => {
    console.log(parsedInput);

    // Mock data - TODO: Replace with actual validation logic
    return [
      {
        codigo: 'VAL-01',
        descripcion: 'rules.requiredColumns.success',
        formateo: {
          'Sample ID': 'text',
          Parameter: 'text',
          Result: 'number'
        },
        archivos: {
          EDD: 'EDD_2024_Q1.xlsx',
          PRELIMINAR: 'Preliminar_2024_Q1.xlsx'
        },
        estado: 'SUCCESS',
        datos: [
          {
            'Sample ID': 'GW0001-01',
            Parameter: 'pH',
            Result: 7.2,
            Status: 'OK'
          },
          {
            'Sample ID': 'GW0002-01',
            Parameter: 'pH',
            Result: 6.8,
            Status: 'OK'
          }
        ]
      },
      {
        codigo: 'VAL-02',
        descripcion: 'rules.rangeValues.warning',
        formateo: {
          column: 'Conductivity',
          min_value: 0,
          max_value: 1000
        },
        archivos: {
          EDD: 'EDD_2024_Q1.xlsx'
        },
        estado: 'WARNING',
        datos: [
          {
            'Sample ID': 'GW0003-01',
            Parameter: 'Conductivity',
            Result: 1500,
            Min: 0,
            Max: 1000,
            Status: 'Out of range'
          }
        ]
      },
      {
        codigo: 'VAL-03',
        descripcion: 'rules.guidelineLevel.warning',
        formateo: {
          'Sample ID': 'text',
          Parameter: 'text',
          Result: 'number',
          Guideline: 'number'
        },
        archivos: {
          EDD: 'EDD_2024_Q1.xlsx',
          PARAMETROS: 'Parametros_FQ.xlsx'
        },
        estado: 'WARNING',
        datos: [
          {
            'Sample ID': 'GW0004-01',
            Parameter: 'Arsenic',
            Result: 0.015,
            Guideline: 0.01,
            Status: 'Exceeds guideline'
          },
          {
            'Sample ID': 'GW0005-01',
            Parameter: 'Lead',
            Result: 0.02,
            Guideline: 0.015,
            Status: 'Exceeds guideline'
          }
        ]
      },
      {
        codigo: 'VAL-04',
        descripcion: 'rules.sampleId.error',
        formateo: {
          'Sample ID': 'text',
          Format: 'text'
        },
        archivos: {
          EDD: 'EDD_2024_Q1.xlsx',
          PRELIMINAR: 'Preliminar_2024_Q1.xlsx'
        },
        estado: 'SUCCESS',
        datos: [
          { 'Sample ID': 'GW0001-01', Format: 'Valid', Status: 'OK' },
          {
            'Sample ID': 'TB-240115-1',
            Format: 'Valid (Trip Blank)',
            Status: 'OK'
          }
        ]
      },
      {
        codigo: 'VAL-06',
        descripcion: 'rules.holdingTime.error',
        formateo: {
          'Sample ID': 'text',
          'Collection Date': 'date',
          'Analysis Date': 'date',
          Days: 'number'
        },
        archivos: {
          EDD: 'EDD_2024_Q1.xlsx'
        },
        estado: 'ERROR',
        datos: [
          {
            'Sample ID': 'GW0006-01',
            'Collection Date': '2024-01-15',
            'Analysis Date': '2024-01-25',
            Days: 10,
            Status: 'Holding time exceeded'
          }
        ]
      },
      {
        codigo: 'VAL-09',
        descripcion: 'rules.matrixSpike.success',
        formateo: {
          'Sample ID': 'text',
          Parameter: 'text',
          Recovery: 'number',
          'Min Recovery': 'number',
          'Max Recovery': 'number'
        },
        archivos: {
          MATRIX_SPIKE: 'Matrix_Spike_2024_Q1.xlsx'
        },
        estado: 'SUCCESS',
        datos: [
          {
            'Sample ID': 'GW0001-01-MS',
            Parameter: 'Arsenic',
            Recovery: 95,
            'Min Recovery': 85,
            'Max Recovery': 115,
            Status: 'OK'
          },
          {
            'Sample ID': 'GW0002-01-MS',
            Parameter: 'Lead',
            Recovery: 102,
            'Min Recovery': 85,
            'Max Recovery': 115,
            Status: 'OK'
          }
        ]
      }
    ] as ValidationResultData[];
  });
