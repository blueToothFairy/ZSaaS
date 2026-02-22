import ISongSearch, { Song, SearchResult } from "../interfaces/song-search.interface.js";
import axios from "axios";

interface ITunesResult {
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  previewUrl?: string;
  trackViewUrl?: string;
  trackTimeMillis?: number;
  releaseDate?: string;
  trackId: number;
}

interface ITunesResponse {
  results: ITunesResult[];
  resultCount: number;
}

export default class ITunesSearchService implements ISongSearch {
  private readonly baseUrl = "https://itunes.apple.com/search";
  private readonly maxRetries = 3;

  async searchSongs(query: string, limit: number = 10): Promise<any> {
    console.log('searchSongs');
    try {
      const response = await axios.get<ITunesResponse>(this.baseUrl, {
        params: {
          term: query,
          media: "music",
          entity: "song",
          limit: Math.min(limit, 50),
          country: "US",
        },
        timeout: 10000,
      });

      console.log('res: ', response.data);

      const songs = this.transformResults(response.data.results, query);
      const dedupedSongs = this.deduplicateSongs(songs);

      return {
        songs: dedupedSongs.slice(0, limit),
        query,
        totalResults: dedupedSongs.length,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`iTunes search failed: ${error.message}`);
      }
      throw error;
    }
  }

  async searchByKeywords(keywords: string[], limit: number = 10): Promise<SearchResult> {
    const finalSongs: Song[] = [];
    const seen = new Set<string>();

    for (const keyword of keywords) {
      if (finalSongs.length >= limit) {
        break;
      }

      try {
        const response = await axios.get<ITunesResponse>(this.baseUrl, {
          params: {
            term: keyword,
            media: "music",
            entity: "song",
            limit: limit,
            country: "US",
          },
          timeout: 10000,
        });

        const transformedSongs = this.transformResults(response.data.results, keyword);

        for (const song of transformedSongs) {
          if (finalSongs.length >= limit) break;

          const key = `${song.artist.toLowerCase()}|${song.title.toLowerCase()}`;

          if (!seen.has(key)) {
            seen.add(key);
            finalSongs.push(song);
          }
        }

      } catch (error) {
        console.error(`⚠️ Bỏ qua keyword "${keyword}" do lỗi:`, axios.isAxiosError(error) ? error.message : error);
        continue;
      }
    }

    return {
      songs: finalSongs,
      query: keywords.join(", "),
      totalResults: finalSongs.length,
    };
  }

  private transformResults(results: ITunesResult[], query: string): Song[] {
    return results
      .filter((result): result is ITunesResult => {
        // Sửa resultName thành trackName ở đây
        return (
          result.trackName !== undefined && result.trackName !== null &&
          result.artistName !== undefined && result.artistName !== null &&
          result.collectionName !== undefined && result.collectionName !== null
        );
      })
      .map((result) => ({
        id: result.trackId.toString(),
        title: result.trackName,  // Đưa trackName vào title
        artist: result.artistName,
        album: result.collectionName,
        artwork: result.artworkUrl100?.replace(/100x100/, "200x200") || "",
        previewUrl: result.previewUrl,
        externalUrl: result.trackViewUrl,
        duration: result.trackTimeMillis ? Math.floor(result.trackTimeMillis / 1000) : undefined,
        releaseDate: result.releaseDate,
      }));
  }

  /**
   * Deduplicate songs with the same artist and title
   * Keep the highest quality/newest version
   */
  private deduplicateSongs(songs: Song[]): Song[] {
    const seen = new Map<string, Song>();

    for (const song of songs) {
      const key = `${song.artist.toLowerCase()}|${song.title.toLowerCase()}`;

      if (!seen.has(key)) {
        seen.set(key, song);
      }
    }

    return Array.from(seen.values());
  }
}
