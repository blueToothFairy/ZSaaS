import FormData from "form-data";
import IAIVibeScanner from "../interfaces/ai-scanner.interface.js";
import ISongSearch from "../interfaces/song-search.interface.js";
import AIRepositoty from "../interfaces/ai-output-repo.interface.js";
import { Song } from "../interfaces/song-search.interface.js";
import IWeatherService from "../interfaces/weather.interface.js";
import IWeatherGenreService from "../interfaces/weather-genre.interface.js";

export default class VibeScannerService {
  constructor(
    private readonly vibeService: IAIVibeScanner,
    private readonly songSearch: ISongSearch,
    private readonly aiRepo: AIRepositoty,
    private readonly weatherService: IWeatherService,
    private readonly weatherGenreService: IWeatherGenreService
  ) { }

  async getVibeMatchingSongs(buffer: Buffer, originalName: string, mimeType: string): Promise<Song[]> {
    // Prepare FormData
    const formData = new FormData();
    formData.append('file', buffer, {
      filename: originalName,
      contentType: mimeType,
    });

    // Extract vibes from image
    const vibes = await this.vibeService.extractVibes(formData);
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

  async getTodayVibe() {
    // Get current weather
    const weather = await this.weatherService.getCurrentWeather();
    console.log("Current weather:", weather);

    // Extract hour from currentTime (format: YYYY-MM-DDTHH:MM)
    const time = weather.currentTime.split('T')[1];
    const hour = parseInt(time.split(':')[0], 10);

    // Determine session based on hour
    const session = this.getSessionFromHour(hour);

    // Match weather to genres (now includes time-based matching)
    const weatherGenreMatch = this.weatherGenreService.matchGenreToWeather(
      weather.temperature,
      weather.weatherCode,
      weather.humidity,
      weather.condition,
      hour
    );

    console.log("Weather genre match:", weatherGenreMatch);

    // Get top 8 keywords for song search
    const topKeywords = weatherGenreMatch.keywords.slice(0, 8);

    // Search for songs using country code from location
    const searchResult = await this.songSearch.searchByKeywords(
      topKeywords,
      20,
      weather.location.countryCode
    );

    return {
      weather,
      songs: searchResult.songs,
      genres: weatherGenreMatch.genres,
      mood: weatherGenreMatch.mood,
      reasoning: weatherGenreMatch.reasoning,
      session,
    };
  }

  private getSessionFromHour(hour: number): string {
    if (hour >= 5 && hour < 12) {
      return 'morning';
    } else if (hour >= 12 && hour < 18) {
      return 'afternoon';
    } else if (hour >= 18 && hour < 24) {
      return 'evening';
    } else {
      return 'night';
    }
  }
}