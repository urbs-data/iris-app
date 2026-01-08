import { z } from 'zod';
import {
  Classification,
  SubClassification
} from '../constants/classifications';

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
];

function isExcelFile(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return (
    EXCEL_MIME_TYPES.includes(file.type) ||
    extension === 'xlsx' ||
    extension === 'xls' ||
    extension === 'xlsm'
  );
}

export const uploadDocumentsSchema = z
  .object({
    date: z.date('uploadDocument.dateRequired'),
    classification: z.string().min(1, 'uploadDocument.classificationError'),
    subClassification: z.string().optional(),
    area: z.string().optional(),
    files: z
      .array(z.instanceof(File))
      .min(1, 'uploadDocument.atLeastOneFile')
      .refine(
        (files) => files.every((file) => file.size <= MAX_FILE_SIZE),
        'uploadDocument.fileTooLarge'
      )
  })
  .superRefine((data, ctx) => {
    const requiresExcel =
      data.subClassification === SubClassification.MuestrasSuelo ||
      data.subClassification === SubClassification.MuestrasAgua ||
      data.classification === Classification.Pozos ||
      data.classification === Classification.Sustancias;

    if (requiresExcel) {
      const hasNonExcelFiles = data.files.some((file) => !isExcelFile(file));

      if (hasNonExcelFiles) {
        ctx.addIssue({
          code: 'custom',
          message: 'uploadDocument.invalidFileTypeForSamplesWellsSubstances',
          path: ['files']
        });
      }
    }
  });

export type UploadDocumentsSchema = z.infer<typeof uploadDocumentsSchema>;
