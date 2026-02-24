export interface WeatherGenreMatch {
  genres: string[];
  keywords: string[];
  mood: string;
  reasoning: string;
}

export default interface IWeatherGenreService {
  matchGenreToWeather(
    temperature: number,
    weatherCode: number,
    humidity: number,
    condition: string,
    hour: number
  ): WeatherGenreMatch;
}
