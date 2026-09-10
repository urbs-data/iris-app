import type { Document, Caption } from '../types';

interface ElasticsearchFilter {
  term?: Record<string, string | number>;
  terms?: Record<string, (string | number)[]>;
}

interface SearchParams {
  query?: string;
  filters: ElasticsearchFilter[];
  isFilename?: boolean;
  page: number;
  pageSize: number;
}

interface ElasticsearchResponse {
  documents: Document[];
  totalDocuments: number;
}

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function buildElasticsearchFilters(params: {
  organizationId?: string;
  classification?: string;
  subClassification?: string;
  extension?: string;
  year?: number;
}): ElasticsearchFilter[] {
  const filters: ElasticsearchFilter[] = [];

  if (params.organizationId) {
    filters.push({
      term: { 'organization_id.keyword': params.organizationId }
    });
  }

  if (params.classification) {
    filters.push({ term: { classification: params.classification } });
  }

  if (params.subClassification) {
    filters.push({ term: { sub_classification: params.subClassification } });
  }

  if (params.extension) {
    filters.push({ term: { extension: params.extension } });
  }

  if (params.year) {
    filters.push({ term: { year: params.year } });
  }

  return filters;
}

export async function searchElasticsearch(
  params: SearchParams
): Promise<ElasticsearchResponse> {
  const esUrl = getEnvVar('ELASTICSEARCH_URL');
  const esApiKey = getEnvVar('ELASTICSEARCH_API_KEY');
  const esIndex = getEnvVar('ELASTICSEARCH_INDEX');

  const searchFields = params.isFilename
    ? ['sourcefile^2']
    : ['content^1', 'sourcefile^1.5'];

  const shouldClauses = params.query
    ? [
        {
          multi_match: {
            query: params.query,
            type: 'best_fields',
            fields: searchFields
          }
        }
      ]
    : [{ match_all: {} }];

  const boolQuery: Record<string, unknown> = {
    should: shouldClauses,
    minimum_should_match: params.query ? 1 : 0
  };

  if (params.filters.length > 0) {
    boolQuery.filter = params.filters;
  }

  const query = {
    function_score: {
      query: { bool: boolQuery },
      functions: [
        {
          gauss: {
            date: {
              origin: 'now',
              scale: '365d',
              offset: '7d',
              decay: 0.5
            }
          }
        }
      ],
      score_mode: 'multiply',
      boost_mode: 'multiply'
    }
  };

  const fromOffset = (params.page - 1) * params.pageSize;

  const requestBody = {
    track_scores: true,
    track_total_hits: true,
    query,
    collapse: {
      field: 'sourcefile.keyword',
      inner_hits: {
        name: 'best_page',
        size: 1,
        sort: [{ _score: 'desc' }],
        highlight: { fields: { content: {} } }
      }
    },
    sort: [
      { _score: 'desc' },
      { date: 'desc' },
      { 'sourcefile.keyword': 'asc' }
    ],
    from: fromOffset,
    size: params.pageSize,
    _source: [
      'organization_id',
      'sourcefile',
      'sourcepage',
      'date',
      'classification',
      'sub_classification',
      'area',
      'extension',
      'year',
      'storage_url_organization'
    ],
    aggs: {
      unique_files: {
        cardinality: {
          field: 'sourcefile.keyword',
          precision_threshold: 40000
        }
      }
    }
  };

  const response = await fetch(`${esUrl}/${esIndex}/_search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `ApiKey ${esApiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Elasticsearch error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const hits = result.hits?.hits || [];
  const uniqueFilesCount = result.aggregations?.unique_files?.value || 0;

  const documents: Document[] = hits.map(
    (hit: {
      _id: string;
      _score: number;
      _source: Record<string, unknown>;
      inner_hits?: {
        best_page?: {
          hits?: {
            hits?: Array<{
              _source?: { content?: string };
              highlight?: { content?: string[] };
            }>;
          };
        };
      };
    }) => {
      const source = hit._source;
      const innerHits = hit.inner_hits?.best_page?.hits?.hits || [];
      const bestInnerHit = innerHits[0];

      const captions: Caption[] = [];
      if (bestInnerHit?.highlight?.content) {
        for (const highlightText of bestInnerHit.highlight.content) {
          captions.push({
            text: highlightText,
            highlights: highlightText
          });
        }
      }

      const content = bestInnerHit?._source?.content || '';

      return {
        id: hit._id,
        content,
        sourcepage: (source.sourcepage as string) || '',
        sourcefile: (source.sourcefile as string) || '',
        storageUrl: (source.storage_url_organization as string) || '',
        captions,
        score: hit._score,
        classification: source.classification as string | undefined,
        subClassification: source.sub_classification as string | undefined,
        area: source.area as string | undefined,
        year: source.year as number | undefined,
        extension: source.extension as string | undefined,
        date: source.date as string | undefined
      };
    }
  );

  return {
    documents,
    totalDocuments: uniqueFilesCount
  };
}

export async function deleteFromElasticsearch(
  filename: string,
  organizationId: string
): Promise<number> {
  const esUrl = getEnvVar('ELASTICSEARCH_URL');
  const esApiKey = getEnvVar('ELASTICSEARCH_API_KEY');
  const esIndex = getEnvVar('ELASTICSEARCH_INDEX');

  const query = {
    query: {
      bool: {
        filter: [
          { term: { 'sourcefile.keyword': filename } },
          { term: { 'organization_id.keyword': organizationId } }
        ]
      }
    }
  };

  try {
    const response = await fetch(`${esUrl}/${esIndex}/_delete_by_query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `ApiKey ${esApiKey}`
      },
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Elasticsearch delete error: ${response.status} - ${errorText}`
      );
    }

    const result = await response.json();
    const deletedCount = result.deleted || 0;

    return deletedCount;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Error eliminando documentos del índice: ${errorMessage}`);
  }
}

export interface IndexableChunk {
  content: string;
  sourcepage: number;
}

export interface IndexDocumentFields {
  filename: string;
  organizationId: string;
  storageUrl: string;
  area: string | null;
  year: string | null;
  classification: string | null;
  subClassification: string | null;
  extension: string | null;
  date: string | null;
}

const BULK_BATCH_SIZE = 1000;

/**
 * Id determinístico por chunk, para que volver a subir el mismo archivo
 * sobrescriba en vez de duplicar. El formato lo hereda el índice existente,
 * así que no se puede cambiar sin reindexar todo.
 */
function chunkId(filename: string, chunkNumber: number): string {
  const ascii = filename.replace(/[^0-9a-zA-Z_-]/g, '_');
  const hash = Buffer.from(filename, 'utf8').toString('hex').toUpperCase();
  return `file-${ascii}-${hash}-page-${chunkNumber}`;
}

export async function bulkIndexDocuments(
  chunks: IndexableChunk[],
  fields: IndexDocumentFields
): Promise<number> {
  if (chunks.length === 0) {
    return 0;
  }

  const esUrl = getEnvVar('ELASTICSEARCH_URL');
  const esApiKey = getEnvVar('ELASTICSEARCH_API_KEY');
  const esIndex = getEnvVar('ELASTICSEARCH_INDEX');

  for (let start = 0; start < chunks.length; start += BULK_BATCH_SIZE) {
    const batch = chunks.slice(start, start + BULK_BATCH_SIZE);

    const operations = batch.flatMap((chunk, offset) => [
      {
        index: {
          _index: esIndex,
          _id: chunkId(fields.filename, start + offset + 1)
        }
      },
      {
        content: chunk.content,
        sourcepage: chunk.sourcepage,
        sourcefile: fields.filename,
        area: fields.area,
        year: fields.year === 'Otros' ? null : fields.year,
        classification: fields.classification,
        sub_classification: fields.subClassification,
        extension: fields.extension,
        date: fields.date,
        storage_url: fields.storageUrl,
        storage_url_organization: fields.storageUrl,
        organization_id: fields.organizationId
      }
    ]);

    const ndjson =
      operations.map((operation) => JSON.stringify(operation)).join('\n') +
      '\n';

    const response = await fetch(`${esUrl}/_bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-ndjson',
        Authorization: `ApiKey ${esApiKey}`
      },
      body: ndjson
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Elasticsearch bulk error: ${response.status} - ${errorText}`
      );
    }

    const result = await response.json();

    if (result.errors) {
      const failed = (result.items ?? [])
        .filter((item: { index?: { error?: unknown } }) => item.index?.error)
        .slice(0, 5);
      throw new Error(
        `Errores indexando en Elasticsearch: ${JSON.stringify(failed)}`
      );
    }
  }

  return chunks.length;
}
