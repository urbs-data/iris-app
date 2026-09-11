'use server';

import { z } from 'zod';
import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { assertOrgBlobPath, getBlobContainer } from '@/lib/azure-blob';
import { ValidationError } from '@/lib/errors';
import { indexDocument } from '../lib/indexing/index-document';
import type { FileMetadata } from '../lib/types';

export const reindexDocument = authOrganizationActionClient
  .metadata({ actionName: 'reindexDocument' })
  .inputSchema(z.object({ blobPath: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    const { blobPath } = parsedInput;

    assertOrgBlobPath(blobPath, ctx.organization.id);

    const container = getBlobContainer();

    let metadataBuffer: Buffer;
    try {
      metadataBuffer = await container
        .getBlobClient(`${blobPath}.metadata.json`)
        .downloadToBuffer();
    } catch {
      throw new ValidationError(
        'El archivo no tiene metadata asociada, no se puede reindexar'
      );
    }

    const metadata = JSON.parse(metadataBuffer.toString()) as FileMetadata;
    const fileName = metadata.filename || blobPath.split('/').pop() || '';
    const buffer = await container.getBlobClient(blobPath).downloadToBuffer();

    const chunks = await indexDocument({
      buffer,
      fileName,
      blobPath,
      organizationId: ctx.organization.id,
      metadata
    });

    return { success: true, fileName, chunks };
  });
