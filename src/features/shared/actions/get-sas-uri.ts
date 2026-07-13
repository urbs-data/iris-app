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

function buildContentDisposition(filename: string): string {
  // Azure rejects non-ASCII characters in the rscd query parameter, so we build
  // an RFC 5987 Content-Disposition: an ASCII-safe `filename` fallback plus a
  // `filename*` with percent-encoded UTF-8 that browsers use for the real name.
  const asciiFilename = filename
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x20-\x7E]/g, '_')
    .replace(/["\\]/g, '_');
  const encodedFilename = encodeURIComponent(filename);
  return `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`;
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
      fileExtension === 'pdf' ? 'inline' : buildContentDisposition(filename);

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
