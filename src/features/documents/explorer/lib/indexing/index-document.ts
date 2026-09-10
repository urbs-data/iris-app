import {
  bulkIndexDocuments,
  deleteFromElasticsearch
} from '@/features/documents/search/lib/elasticsearch-client';
import { fileExtension, parseFile } from './parse';
import { splitPages, splitPagesSimple } from './split';
import type { FileMetadata } from '../types';

interface IndexDocumentParams {
  buffer: Buffer;
  fileName: string;
  blobPath: string;
  organizationId: string;
  metadata: FileMetadata;
}

export async function indexDocument({
  buffer,
  fileName,
  blobPath,
  organizationId,
  metadata
}: IndexDocumentParams): Promise<number> {
  const pages = await parseFile(buffer, fileName);

  if (pages.length === 0) {
    return 0;
  }

  const chunks =
    fileExtension(fileName) === '.json'
      ? splitPagesSimple(pages)
      : splitPages(pages);

  // Los ids de chunk son determinísticos, pero si la versión nueva del archivo
  // tiene menos chunks que la anterior quedarían huérfanos con contenido viejo.
  await deleteFromElasticsearch(fileName, organizationId);

  return bulkIndexDocuments(
    chunks.map((chunk) => ({
      content: chunk.text,
      sourcepage: chunk.pageNumber
    })),
    {
      filename: fileName,
      organizationId,
      storageUrl: blobPath,
      area: metadata.area,
      year: metadata.year,
      classification: metadata.classification,
      subClassification: metadata.sub_classification,
      extension: metadata.extension,
      date: metadata.date
    }
  );
}
