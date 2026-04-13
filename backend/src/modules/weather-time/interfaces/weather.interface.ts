export interface WeatherData {
  temperature: number;
  weatherCode: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  timezone: string;
  currentTime: string;
  location: {
    latitude: number;
    longitude: number;
    country: string;
    countryCode: string;
  };
}

export default interface IWeatherService {
  // options: tz (timezone string), ip (client IP)
  getCurrentWeather(options?: { tz?: string; ip?: string }): Promise<WeatherData>;
}
