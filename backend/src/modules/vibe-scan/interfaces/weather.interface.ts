export interface WeatherData {
  temperature: number;
  weatherCode: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  location: {
    latitude: number;
    longitude: number;
    country: string;
    countryCode: string;
  };
}

export default interface IWeatherService {
  getCurrentWeather(): Promise<WeatherData>;
}
