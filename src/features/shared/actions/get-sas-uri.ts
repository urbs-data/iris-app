'use server';

import {
  BlobSASPermissions,
  generateBlobSASQueryParameters
} from '@azure/storage-blob';
import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getBlobContainer, getStorageCredential } from '@/lib/azure-blob';
import { getSasUriSchema } from './get-sas-uri-schema';

export const getSasUri = authOrganizationActionClient
  .metadata({ actionName: 'getSasUri' })
  .inputSchema(getSasUriSchema)
  .action(async ({ parsedInput }) => {
    const container = getBlobContainer();
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME!;
    const credential = getStorageCredential();

    const expiresOn = new Date();
    expiresOn.setHours(expiresOn.getHours() + 1);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName: parsedInput.blobPath,
        permissions: BlobSASPermissions.parse('r'),
        expiresOn
      },
      credential
    ).toString();

    const blobClient = container.getBlobClient(parsedInput.blobPath);
    const sasUri = `${blobClient.url}?${sasToken}`;

    return { sasUri };
  });
