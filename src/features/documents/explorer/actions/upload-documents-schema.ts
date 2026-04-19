import { z } from 'zod';

export const UPLOAD_MAX_FILES = 50;
export const UPLOAD_MAX_TOTAL_BYTES = 100 * 1024 * 1024;

const MAX_FILES = UPLOAD_MAX_FILES;
const MAX_TOTAL_UPLOAD_SIZE = UPLOAD_MAX_TOTAL_BYTES;

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
    tipo: z.string().nullable().optional(),
    files: z
      .array(z.instanceof(File))
      .min(1, 'uploadDocument.atLeastOneFile')
      .max(MAX_FILES, 'uploadDocument.tooManyFiles')
      .refine(
        (files) =>
          files.reduce((sum, file) => sum + file.size, 0) <=
          MAX_TOTAL_UPLOAD_SIZE,
        'uploadDocument.totalSizeTooLarge'
      )
  })
  .superRefine((data, ctx) => {
    if (data.tipo) {
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
