'use server';

import mime from 'mime-types';
import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getBlobContainer } from '@/lib/azure-blob';
import { getFilesSchema } from './get-files-schema';
import { FileItem, FileMetadata } from '../lib/types';

async function streamToBuffer(
  readableStream: NodeJS.ReadableStream
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => resolve(Buffer.concat(chunks)));
    readableStream.on('error', reject);
  });
}

function extractFileName(path: string): string {
  return path.split('/').filter(Boolean).pop() || '';
}

export const getFiles = authOrganizationActionClient
  .metadata({ actionName: 'getFiles' })
  .inputSchema(getFilesSchema)
  .action(async ({ parsedInput, ctx }) => {
    const container = getBlobContainer();
    const organizationId = ctx.organization.id;
    const userPath = parsedInput.path === '/' ? '' : parsedInput.path;
    const fullPath = `${organizationId}/${userPath}${userPath && !userPath.endsWith('/') ? '/' : ''}`;

    const folders: FileItem[] = [];
    const fileBlobs: Array<{ name: string; properties: any }> = [];
    const metadataCache = new Map<string, FileMetadata>();

    const iter = container.listBlobsByHierarchy('/', { prefix: fullPath });

    for await (const item of iter) {
      if (item.kind === 'prefix') {
        folders.push({
          id: item.name,
          name: extractFileName(item.name),
          type: 'folder',
          size: null,
          modifiedAt: new Date(),
          uploadedBy: 'Sistema'
        });
      } else if (!item.name.endsWith('.metadata.json')) {
        fileBlobs.push({ name: item.name, properties: item.properties });
      }
    }

    const metadataPromises = fileBlobs.map(async ({ name }) => {
      try {
        const metadataBlob = container.getBlobClient(`${name}.metadata.json`);
        const downloadResponse = await metadataBlob.download();
        const buffer = await streamToBuffer(
          downloadResponse.readableStreamBody!
        );
        metadataCache.set(name, JSON.parse(buffer.toString()));
      } catch {
        // Metadata file doesn't exist
      }
    });

    await Promise.all(metadataPromises);

    const files: FileItem[] = fileBlobs.map(({ name, properties }) => {
      const fileName = extractFileName(name);
      const metadata = metadataCache.get(name);

      return {
        id: name,
        name: fileName,
        type: 'file' as const,
        size: properties?.contentLength || 0,
        mimeType: mime.lookup(fileName) || undefined,
        modifiedAt: properties?.lastModified || new Date(),
        uploadedBy: metadata?.uploaded_by || 'Desconocido',
        metadata
      };
    });

    const allItems = [...folders, ...files];

    allItems.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      if (a.type === 'folder') return b.name.localeCompare(a.name);
      return (
        new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
      );
    });

    return {
      files: allItems,
      currentPath: parsedInput.path
    };
  });
