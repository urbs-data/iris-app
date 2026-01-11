'use server';

import {
  BlobSASPermissions,
  generateBlobSASQueryParameters
} from '@azure/storage-blob';
import mime from 'mime-types';
import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getBlobContainer, getStorageCredential } from '@/lib/azure-blob';
import { getSasUriSchema } from './get-sas-uri-schema';

function getFileExtension(filePath: string): string {
  const parts = filePath.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export const getSasUri = authOrganizationActionClient
  .metadata({ actionName: 'getSasUri' })
  .inputSchema(getSasUriSchema)
  .action(async ({ parsedInput }) => {
    const container = getBlobContainer();
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME!;
    const credential = getStorageCredential();

    const expiresOn = new Date();
    expiresOn.setHours(expiresOn.getHours() + 1);
    const blobName = decodeURIComponent(
      parsedInput.blobPath.split(`${containerName}/`).pop()!
    );

    const fileExtension = getFileExtension(parsedInput.blobPath);
    const filename = blobName.split('/').pop() || blobName;

    const contentDisposition =
      fileExtension === 'pdf' ? 'inline' : `attachment; filename="${filename}"`;

    const contentType =
      mime.lookup(parsedInput.blobPath) || 'application/octet-stream';

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse('r'),
        expiresOn,
        contentDisposition,
        contentType
      },
      credential
    ).toString();

    const blobClient = container.getBlobClient(blobName);
    const sasUri = `${blobClient.url}?${sasToken}`;

    return { sasUri };
  });
