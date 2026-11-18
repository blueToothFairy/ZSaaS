export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  previewUrl?: string;
  externalUrl?: string;
  duration?: number;
  releaseDate?: string;
  artistId?: string;
  primaryGenreName?: string;
}

export interface SearchResult {
  songs: Song[];
  query: string;
  totalResults: number;
}

export interface SearchResultWithCandidates {
  result: SearchResult;
  candidates: Song[];
}

export type RecommendationQueryGroup = "context" | "taste" | "hybrid";

export interface RecommendationQuery {
  query: string;
  groups: RecommendationQueryGroup[];
}

export interface RetrievedCandidate {
  track: Song;
  provenance: Array<{
    query: string;
    groups: RecommendationQueryGroup[];
    sourceCountry?: string;
  }>;
}

export default interface ISongSearch {
  searchSongs(query: string, limit?: number, country?: string): Promise<SearchResult>;
  searchByKeywords(keywords: string[], limit?: number, country?: string): Promise<SearchResult>;
  searchByKeywordsWithCandidates?(keywords: string[], limit?: number, country?: string, deterministic?: boolean): Promise<SearchResultWithCandidates>;
  searchCandidates(queries: RecommendationQuery[], country?: string, concurrency?: number): Promise<RetrievedCandidate[]>;
}
