import {
  BlobServiceClient,
  ContainerClient,
  StorageSharedKeyCredential
} from '@azure/storage-blob';
import { ForbiddenError } from '@/lib/errors';

let blobServiceClient: BlobServiceClient | null = null;
let storageCredential: StorageSharedKeyCredential | null = null;

function getAccountConfig() {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

  if (!accountName || !accountKey) {
    throw new Error(
      'AZURE_STORAGE_ACCOUNT_NAME y AZURE_STORAGE_ACCOUNT_KEY son requeridas'
    );
  }

  return { accountName, accountKey };
}

export function getStorageCredential(): StorageSharedKeyCredential {
  if (!storageCredential) {
    const { accountName, accountKey } = getAccountConfig();
    storageCredential = new StorageSharedKeyCredential(accountName, accountKey);
  }
  return storageCredential;
}

export function getBlobServiceClient(): BlobServiceClient {
  if (!blobServiceClient) {
    const { accountName } = getAccountConfig();
    const credential = getStorageCredential();
    const url = `https://${accountName}.blob.core.windows.net`;
    blobServiceClient = new BlobServiceClient(url, credential);
  }
  return blobServiceClient;
}

export function getBlobContainer(containerName?: string): ContainerClient {
  const container = containerName || process.env.AZURE_STORAGE_CONTAINER_NAME;

  if (!container) {
    throw new Error(
      'AZURE_STORAGE_CONTAINER_NAME no está configurada en las variables de entorno'
    );
  }

  return getBlobServiceClient().getContainerClient(container);
}

export function assertOrgBlobPath(
  blobPath: string,
  organizationId: string
): void {
  if (!blobPath.startsWith(`${organizationId}/`)) {
    throw new ForbiddenError('El archivo no pertenece a la organización');
  }
}
