'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getBlobContainer, getQueueClient } from '@/lib/azure-blob';
import { uploadDocumentsSchema } from './upload-documents-schema';
import { resolveETLProcessor } from '../lib/etl/registry';
import type { FileMetadata } from '../lib/types';
import { logger } from '@/lib/logger';

const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

function formatMonth(date: Date): string {
  const monthNumber = date.getMonth() + 1;
  const monthName = MONTH_NAMES_ES[date.getMonth()];
  return `${monthNumber.toString().padStart(2, '0')} - ${monthName}`;
}

function generateBlobPath(
  organizationId: string,
  date: Date,
  classification: string,
  subClassification: string | undefined,
  area: string | undefined,
  fileName: string
): string {
  const year = date.getFullYear().toString();
  const month = formatMonth(date);

  const parts = [organizationId, year, month, classification];

  if (subClassification) {
    parts.push(subClassification);
  }

  if (area) {
    parts.push(area);
  }

  parts.push(fileName);

  return parts.join('/');
}

export const uploadDocuments = authOrganizationActionClient
  .metadata({ actionName: 'uploadDocuments' })
  .inputSchema(uploadDocumentsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const container = getBlobContainer();
    const results: Array<{
      fileName: string;
      uploaded: boolean;
      etlProcessed: boolean;
      etlResult?: {
        success: boolean;
        errors: string[];
        stats: {
          rowsParsed: number;
          deleted: number;
          inserted: number;
        };
      };
      error?: string;
    }> = [];

    logger('uploadDocuments', {
      organizationId: ctx.organization.id,
      date: parsedInput.date,
      classification: parsedInput.classification,
      subClassification: parsedInput.subClassification,
      area: parsedInput.area,
      files: parsedInput.files.map((file) => file.name)
    });

    for (const file of parsedInput.files) {
      const fileName = file.name;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const processor = resolveETLProcessor({
        db: ctx.db,
        buffer,
        fileName,
        classification: parsedInput.classification,
        subClassification: parsedInput.subClassification,
        organizationId: ctx.organization.id
      });

      if (processor) {
        const etlResult = await processor.process({
          db: ctx.db,
          buffer,
          fileName,
          classification: parsedInput.classification,
          subClassification: parsedInput.subClassification,
          organizationId: ctx.organization.id
        });

        if (!etlResult.success) {
          throw new Error(
            `ETL falló, archivo no subido: ${etlResult.errors.join(', ')}`
          );
        }
      }

      const blobPath = generateBlobPath(
        ctx.organization.id,
        parsedInput.date,
        parsedInput.classification,
        parsedInput.subClassification,
        parsedInput.area,
        fileName
      );

      const blockBlobClient = container.getBlockBlobClient(blobPath);
      await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: {
          blobContentType: file.type
        }
      });

      const user = ctx.session.user;
      const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(' ');

      const metadata: FileMetadata = {
        year: parsedInput.date.getFullYear().toString(),
        month: formatMonth(parsedInput.date),
        classification: parsedInput.classification,
        sub_classification: parsedInput.subClassification || null,
        date: parsedInput.date.toISOString(),
        area: parsedInput.area || null,
        filename: fileName,
        uploaded_by: fullName || user.email || 'Usuario',
        upload_date: new Date().toISOString(),
        extension: fileName.split('.').pop() || ''
      };

      const metadataBlobClient = container.getBlockBlobClient(
        `${blobPath}.metadata.json`
      );
      await metadataBlobClient.upload(
        JSON.stringify(metadata, null, 2),
        JSON.stringify(metadata, null, 2).length,
        {
          blobHTTPHeaders: {
            blobContentType: 'application/json'
          }
        }
      );

      const queueClient = getQueueClient('uploaded-documents-local');
      const messageBody = {
        metadata,
        file_path: blobPath,
        organization_id: ctx.organization.id
      };
      await queueClient.sendMessage(
        Buffer.from(JSON.stringify(messageBody)).toString('base64')
      );

      const currentResult = results.find((r) => r.fileName === fileName);
      if (currentResult) {
        currentResult.uploaded = true;
      } else {
        results.push({
          fileName,
          uploaded: true,
          etlProcessed: false
        });
      }
    }

    const hasErrors = results.some(
      (r) => !r.uploaded || r.etlResult?.success === false
    );

    const etlErrors = results
      .filter((r) => r.etlResult && !r.etlResult.success)
      .flatMap((r) => r.etlResult!.errors);

    return {
      success: !hasErrors,
      message: hasErrors
        ? 'uploadDocument.uploadPartialSuccess'
        : 'uploadDocument.uploadSuccess',
      results,
      etlErrors
    };
  });
