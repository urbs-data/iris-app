import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

let blobServiceClient: BlobServiceClient | null = null;

/**
 * Obtiene una instancia singleton del BlobServiceClient
 * Usa la connection string de las variables de entorno
 */
export function getBlobServiceClient(): BlobServiceClient {
  if (!blobServiceClient) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!connectionString) {
      throw new Error(
        'AZURE_STORAGE_CONNECTION_STRING no está configurada en las variables de entorno'
      );
    }

    blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
  }

  return blobServiceClient;
}

/**
 * Obtiene el cliente de un container específico
 * @param containerName Nombre del container (por defecto usa AZURE_STORAGE_CONTAINER_NAME)
 */
export function getBlobContainer(containerName?: string): ContainerClient {
  const container = containerName || process.env.AZURE_STORAGE_CONTAINER_NAME;

  if (!container) {
    throw new Error(
      'AZURE_STORAGE_CONTAINER_NAME no está configurada en las variables de entorno'
    );
  }

  return getBlobServiceClient().getContainerClient(container);
}
