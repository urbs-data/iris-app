export interface Caption {
  text: string;
  highlights: string;
}

export interface Document {
  id: string;
  content: string;
  sourcepage: number;
  sourcefile: string;
  storageUrl: string;
  captions: Caption[];
  score?: number;
  reranker_score?: number;
  classification?: string;
  subClassification?: string;
  area?: string;
  year?: number;
  extension?: string;
  date?: string;
}

export interface Thought {
  description: string;
  title: string;
  props: { [key: string]: string };
}

export interface Pagination {
  page_number: number;
  page_size: number;
  total_documents: number;
  total_pages: number;
}

export interface SearchResult {
  documents: Document[];
  thoughts: Thought[];
  pagination?: Pagination;
}

export interface SearchFilters {
  page: number;
  limit: number;
  q?: string;
  year?: string;
  classification?: string;
  subClassification?: string;
  fileType?: string;
}
