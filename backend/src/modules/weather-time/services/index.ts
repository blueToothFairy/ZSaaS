import IWeatherService from "../interfaces/weather.interface.js";
import IWeatherGenreService from "../interfaces/weather-genre.interface.js";
import ISongSearch from "../../song/interfaces/song-search.interface.js";
import { WeatherTimeData } from "../interfaces/weather-time.interface.js";

export default class WeatherTimeService {
  constructor(
    private readonly weatherService: IWeatherService,
    private readonly weatherGenreService: IWeatherGenreService
  ) { }

  // options: tz (timezone string from client), ip (client IP from headers)
  async getTodayVibe(songSearch: ISongSearch, clientCountryCode?: string, options?: { tz?: string; ip?: string }): Promise<WeatherTimeData> {
    // Get current weather (may use client tz/ip)
    const weather = await this.weatherService.getCurrentWeather(options);
    console.log("Current weather:", weather);

    // Extract hour from currentTime (format: YYYY-MM-DDTHH:MM)
    const time = weather.currentTime.split('T')[1] || '11:11';
    const hour = parseInt(time.split(':')[0]!, 10);

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
    const topKeywords = weatherGenreMatch.keywords.slice(0, 16);

    // Search for songs using country code from location
    const searchResult = await songSearch.searchByKeywords(
      topKeywords,
      75,
      clientCountryCode || weather.location.countryCode
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
    } else if (hour >= 18 && hour < 21) {
      return 'evening';
    } else {
      return 'night';
    }
  }
}
