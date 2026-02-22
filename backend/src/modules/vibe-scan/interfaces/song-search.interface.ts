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
}

export interface SearchResult {
  songs: Song[];
  query: string;
  totalResults: number;
}

export default interface ISongSearch {
  searchSongs(query: string, limit?: number): Promise<SearchResult>;
  searchByKeywords(keywords: string[], limit?: number): Promise<SearchResult>;
}
