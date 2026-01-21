'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getDocumentsSchema } from './get-documents-schema';
import type { SearchResult } from '../types';
import { generateSearchFilters } from '../lib/generate-search-filters';
import {
  searchElasticsearch,
  buildElasticsearchFilters
} from '../lib/elasticsearch-client';

const FILE_TYPE_TO_EXTENSION: Record<string, string> = {
  excels: 'xlsx',
  documents: 'pdf',
  others: 'txt'
};

export const getDocuments = authOrganizationActionClient
  .metadata({ actionName: 'getDocuments' })
  .inputSchema(getDocumentsSchema)
  .action(async ({ parsedInput, ctx }): Promise<SearchResult> => {
    const page = parsedInput.page || 1;
    const limit = parsedInput.limit || 10;
    const { q, year, classification, subClassification, fileType } =
      parsedInput;

    let searchQuery = q;
    let isFilename = false;
    let llmYear: number | undefined;
    let llmClassification: string | undefined;

    if (q) {
      const llmFilters = await generateSearchFilters(q);
      searchQuery = llmFilters.search_query;
      isFilename = llmFilters.is_filename;
      llmYear = llmFilters.year ?? undefined;
      llmClassification = llmFilters.classification ?? undefined;
    }

    const effectiveYear = year ? parseInt(year, 10) : llmYear;
    const effectiveClassification = classification || llmClassification;
    const effectiveExtension = fileType
      ? FILE_TYPE_TO_EXTENSION[fileType]
      : undefined;

    const esFilters = buildElasticsearchFilters({
      organizationId: ctx.organization.id,
      classification: effectiveClassification,
      subClassification,
      extension: effectiveExtension,
      year: effectiveYear
    });

    const { documents, totalDocuments } = await searchElasticsearch({
      query: searchQuery,
      filters: esFilters,
      isFilename,
      page,
      pageSize: limit
    });

    const totalPages = Math.ceil(totalDocuments / limit);

    return {
      documents,
      thoughts: [],
      pagination: {
        page_number: page,
        page_size: limit,
        total_documents: totalDocuments,
        total_pages: totalPages
      }
    };
  });
