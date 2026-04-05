import ISongSearch, { Song, SearchResult } from "../interfaces/song-search.interface.js";
import axios from "axios";
import { cacheService } from "../../../shared/cache/cacheService.js";

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

interface SearchCandidate {
  song: Song;
  score: number;
  query: string;
  sourceCountry: string;
}

export default class ITunesSearchService implements ISongSearch {
  private readonly baseUrl = "https://itunes.apple.com/search";
  private readonly fallbackCountry = "US";
  private readonly maxSongsPerQuery = 25;
  private readonly maxQueries = 14;

  async searchSongs(query: string, limit: number = 10, country: string = "US"): Promise<SearchResult> {
    console.log("searchSongs:", query);

    const trimmedQuery = query.trim();
    const normalizedCountry = this.normalizeCountry(country);
    const queryVariants = this.buildQueryVariants([trimmedQuery]);

    const candidates = await this.collectCandidates(
      [trimmedQuery],
      queryVariants.slice(0, 4),
      limit,
      normalizedCountry
    );

    const songs = this.rankCandidates(candidates, [trimmedQuery], normalizedCountry, limit);

    return {
      songs,
      query: trimmedQuery,
      totalResults: songs.length,
    };
  }

  async searchByKeywords(keywords: string[], limit: number = 10, country: string = "US"): Promise<SearchResult> {
    const normalizedKeywords = this.normalizeKeywords(keywords);
    if (normalizedKeywords.length === 0) {
      return {
        songs: [],
        query: "",
        totalResults: 0,
      };
    }

    const normalizedCountry = this.normalizeCountry(country);
    const queryVariants = this.buildQueryVariants(normalizedKeywords);
    const candidates = await this.collectCandidates(normalizedKeywords, queryVariants, limit, normalizedCountry);
    const songs = this.rankCandidates(candidates, normalizedKeywords, normalizedCountry, limit);

    return {
      songs,
      query: normalizedKeywords.join(", "),
      totalResults: songs.length,
    };
  }

  private async collectCandidates(
    keywords: string[],
    queryVariants: string[],
    limit: number,
    preferredCountry: string
  ): Promise<SearchCandidate[]> {
    const candidates: SearchCandidate[] = [];
    const searchCountries = this.buildCountrySearchOrder(preferredCountry);
    const maxQueriesPerCountry = Math.max(4, Math.ceil(this.maxQueries / searchCountries.length));

    for (const country of searchCountries) {
      let countryQueryCount = 0;

      for (const query of queryVariants) {
        if (countryQueryCount >= maxQueriesPerCountry) {
          break;
        }

        try {
          const songs = await this.fetchSongsForQuery(query, Math.max(limit, this.maxSongsPerQuery), country);
          countryQueryCount += 1;

          for (const song of songs) {
            candidates.push({
              song,
              score: this.calculateSongScore(song, keywords, query, country, preferredCountry),
              query,
              sourceCountry: country,
            });
          }
        } catch (error) {
          console.error(
            `Skipping query "${query}" for country "${country}" due to error:`,
            axios.isAxiosError(error) ? error.message : error
          );
        }
      }
    }

    return candidates;
  }

  private async fetchSongsForQuery(query: string, limit: number, country: string): Promise<Song[]> {
    const cacheKey = `${query.toLowerCase()}:${Math.min(limit, 50)}:${country.toUpperCase()}`;
    const cachedResult = await cacheService.getCachedSongSearch(cacheKey);

    if (cachedResult?.songs) {
      return cachedResult.songs as Song[];
    }

    const response = await axios.get<ITunesResponse>(this.baseUrl, {
      params: {
        term: query,
        media: "music",
        entity: "song",
        limit: Math.min(limit, 50),
        country,
      },
      timeout: 10000,
    });

    const songs = this.transformResults(response.data.results);
    await cacheService.cacheSongSearch(cacheKey, { songs });
    return songs;
  }

  private rankCandidates(
    candidates: SearchCandidate[],
    keywords: string[],
    preferredCountry: string,
    limit: number
  ): Song[] {
    const deduped = new Map<string, SearchCandidate>();

    for (const candidate of candidates) {
      const key = `${candidate.song.artist.toLowerCase()}|${candidate.song.title.toLowerCase()}`;
      const existing = deduped.get(key);

      if (!existing || candidate.score > existing.score) {
        deduped.set(key, candidate);
      }
    }

    return Array.from(deduped.values())
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        const releaseDelta = this.getReleaseTimestamp(right.song.releaseDate) - this.getReleaseTimestamp(left.song.releaseDate);
        if (releaseDelta !== 0) {
          return releaseDelta;
        }

        if (left.sourceCountry !== right.sourceCountry) {
          if (left.sourceCountry === preferredCountry) {
            return -1;
          }

          if (right.sourceCountry === preferredCountry) {
            return 1;
          }
        }

        return left.song.title.localeCompare(right.song.title);
      })
      .slice(0, limit)
      .map((candidate) => candidate.song);
  }

  private calculateSongScore(
    song: Song,
    keywords: string[],
    query: string,
    sourceCountry: string,
    preferredCountry: string
  ): number {
    const haystack = `${song.title} ${song.artist} ${song.album}`.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    let score = 0;

    for (const keyword of keywords) {
      const normalizedKeyword = keyword.toLowerCase();
      const words = normalizedKeyword.split(/\s+/).filter(Boolean);

      if (haystack.includes(normalizedKeyword)) {
        score += normalizedKeyword.includes(" ") ? 12 : 8;
      }

      for (const word of words) {
        if (word.length < 3) {
          continue;
        }

        if (haystack.includes(word)) {
          score += 4;
        }
      }
    }

    if (haystack.includes(normalizedQuery)) {
      score += normalizedQuery.includes(" ") ? 16 : 10;
    }

    score += this.calculateRecencyScore(song.releaseDate);

    if (sourceCountry === preferredCountry) {
      score += 15;
    }

    if (song.previewUrl) {
      score += 4;
    }

    if (song.artwork) {
      score += 2;
    }

    return score + this.randomTieBreaker();
  }

  private calculateRecencyScore(releaseDate?: string): number {
    const releaseTimestamp = this.getReleaseTimestamp(releaseDate);
    if (releaseTimestamp === 0) {
      return 0;
    }

    const now = Date.now();
    const ageInDays = Math.max(0, Math.floor((now - releaseTimestamp) / (24 * 60 * 60 * 1000)));

    if (ageInDays <= 30) {
      return 60;
    }

    if (ageInDays <= 90) {
      return 48;
    }

    if (ageInDays <= 180) {
      return 36;
    }

    if (ageInDays <= 365) {
      return 24;
    }

    if (ageInDays <= 730) {
      return 14;
    }

    return 6;
  }

  private buildQueryVariants(keywords: string[]): string[] {
    const normalizedKeywords = this.normalizeKeywords(keywords);
    const queries: string[] = [];

    const phraseKeywords = normalizedKeywords.filter((keyword) => keyword.includes(" "));
    const singleKeywords = normalizedKeywords.filter((keyword) => !keyword.includes(" "));
    const shuffledPhrases = this.shuffle(phraseKeywords);
    const shuffledSingles = this.shuffle(singleKeywords);
    const topSingles = shuffledSingles.slice(0, 8);
    const topPhrases = shuffledPhrases.slice(0, 6);

    queries.push(...topPhrases);
    queries.push(...topSingles);

    const leadKeywords = [...topPhrases.slice(0, 3), ...topSingles.slice(0, 4)];
    for (let index = 0; index < leadKeywords.length - 1; index += 1) {
      queries.push(`${leadKeywords[index]} ${leadKeywords[index + 1]}`);
    }

    if (topSingles.length >= 3) {
      queries.push(`${topSingles[0]} ${topSingles[1]} ${topSingles[2]}`);
    }

    if (topPhrases.length > 0 && topSingles.length > 0) {
      queries.push(`${topPhrases[0]} ${topSingles[0]}`);
    }

    return this.normalizeKeywords(queries).slice(0, this.maxQueries);
  }

  private buildCountrySearchOrder(preferredCountry: string): string[] {
    const countries = [preferredCountry];

    if (preferredCountry !== this.fallbackCountry) {
      countries.push(this.fallbackCountry);
    }

    return countries;
  }

  private transformResults(results: ITunesResult[]): Song[] {
    return results
      .filter((result): result is ITunesResult => {
        return Boolean(result.trackName && result.artistName && result.collectionName);
      })
      .map((result) => {
        const song: Song = {
          id: result.trackId.toString(),
          title: result.trackName,
          artist: result.artistName,
          album: result.collectionName,
          artwork: result.artworkUrl100?.replace(/100x100/, "200x200") || "",
        };

        if (result.previewUrl) {
          song.previewUrl = result.previewUrl;
        }

        if (result.trackViewUrl) {
          song.externalUrl = result.trackViewUrl;
        }

        if (result.trackTimeMillis) {
          song.duration = Math.floor(result.trackTimeMillis / 1000);
        }

        if (result.releaseDate) {
          song.releaseDate = result.releaseDate;
        }

        return song;
      });
  }

  private normalizeKeywords(keywords: string[]): string[] {
    return [...new Set(
      keywords
        .map((keyword) => keyword.trim().replace(/\s+/g, " "))
        .filter((keyword) => keyword.length > 0)
    )];
  }

  private normalizeCountry(country: string): string {
    return /^[A-Za-z]{2}$/.test(country) ? country.toUpperCase() : this.fallbackCountry;
  }

  private getReleaseTimestamp(releaseDate?: string): number {
    if (!releaseDate) {
      return 0;
    }

    const parsed = Date.parse(releaseDate);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private randomTieBreaker(): number {
    return Math.random() * 0.35;
  }

  private shuffle<T>(values: T[]): T[] {
    const cloned = [...values];

    for (let index = cloned.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [cloned[index], cloned[swapIndex]] = [cloned[swapIndex]!, cloned[index]!];
    }

    return cloned;
  }
}
