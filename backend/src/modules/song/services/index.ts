import ISongSearch from "../interfaces/song-search.interface.js";

export default class SongSearchService {
  constructor(
    private readonly songSearch: ISongSearch
  ) { }

  async searchByKeywords(keywords: string[], limit: number = 10, country: string = "US") {
    return this.songSearch.searchByKeywords(keywords, limit, country);
  }

  async searchSongs(query: string, limit: number = 10, country: string = "US") {
    return this.songSearch.searchSongs(query, limit, country);
  }
}
