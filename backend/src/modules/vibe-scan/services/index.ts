import FormData from "form-data";
import IAIVibeScanner from "../interfaces/ai-scanner.interface.js";
import ISongSearch from "../../song/interfaces/song-search.interface.js";
import AIRepository from "../interfaces/ai-output-repo.interface.js";
import { Song } from "../../song/interfaces/song-search.interface.js";

export default class VibeScannerService {
  constructor(
    private readonly vibeService: IAIVibeScanner,
    private readonly songSearch: ISongSearch,
    private readonly aiRepo: AIRepository
  ) { }

  async getVibeMatchingSongs(buffer: Buffer, originalName: string, mimeType: string): Promise<Song[]> {
    // Prepare FormData
    const formData = new FormData();
    formData.append('file', buffer, {
      filename: originalName,
      contentType: mimeType,
    });

    // Extract vibes from image
    const vibes = await this.vibeService.extractVibes(formData as any);
    console.log("Extracted vibes:", vibes);

    if (!vibes || vibes.length === 0) {
      return [];
    }

    // Get top 5 keywords for song search
    const topKeywords = vibes
      .slice(0, 5)
      .map(v => v.keyword);

    console.log("Top keywords for search:", topKeywords);

    // Search for songs using keywords
    const searchResult = await this.songSearch.searchByKeywords(topKeywords, 20);
  
    return searchResult.songs;
  }
}