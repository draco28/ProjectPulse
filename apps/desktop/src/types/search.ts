export interface SearchSource {
  type: string;
  id: number;
  title: string;
  section: string | null;
  domain_tags: string[];
}

export interface RelatedChunk {
  relation: string;
  source_type: string;
  title: string;
  content: string;
  score: number;
}

export interface SearchResult {
  content: string;
  score: number;
  source: SearchSource;
  related: RelatedChunk[];
}

export interface SearchMetadata {
  strategy: string;
  search_time_ms: number;
}

export interface SearchResponse {
  results: SearchResult[];
  metadata: SearchMetadata;
}
