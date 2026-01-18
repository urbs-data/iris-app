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
  classification?: string;
  subClassification?: string;
  extension?: string;
  year?: number;
}): ElasticsearchFilter[] {
  const filters: ElasticsearchFilter[] = [];

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
      'sourcefile',
      'sourcepage',
      'date',
      'classification',
      'sub_classification',
      'area',
      'extension',
      'year',
      'storage_url'
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
        storageUrl: (source.storage_url as string) || '',
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
