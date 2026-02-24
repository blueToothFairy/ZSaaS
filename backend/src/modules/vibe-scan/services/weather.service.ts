import axios from 'axios';
import IWeatherService, { WeatherData } from '../interfaces/weather.interface.js';

export default class WeatherService implements IWeatherService {
  private readonly geoLocationUrl = 'http://ip-api.com/json';
  private readonly weatherUrl = 'https://api.open-meteo.com/v1/forecast';

  async getCurrentWeather(): Promise<WeatherData> {
    try {
      // Get location from IP
      const geoData = await this.getLocationFromIP();

      // Get weather data for the location
      const weatherData = await this.getWeatherForLocation(
        geoData.lat,
        geoData.lon,
        geoData.countryCode
      );

      return {
        ...weatherData,
        location: {
          latitude: geoData.lat,
          longitude: geoData.lon,
          country: geoData.country,
          countryCode: geoData.countryCode,
        },
      };
    } catch (error) {
      console.error('Error getting weather:', error);
      throw new Error('Failed to fetch weather data');
    }
  }

  private async getLocationFromIP() {
    try {
      const response = await axios.get(this.geoLocationUrl, {
        timeout: 5000,
      });

      if (response.data.status !== 'success') {
        // Fallback to default location if geolocation fails
        return {
          lat: 40.7128,
          lon: -74.006,
          country: 'United States',
          countryCode: 'US',
        };
      }

      console.log({
        lat: response.data.lat,
        lon: response.data.lon,
        country: response.data.country,
        countryCode: response.data.countryCode,
      });

      return {
        lat: response.data.lat,
        lon: response.data.lon,
        country: response.data.country,
        countryCode: response.data.countryCode,
      };
    } catch (error) {
      console.error('Error getting location from IP:', error);
      // Fallback to default location
      return {
        lat: 40.7128,
        lon: -74.006,
        country: 'United States',
        countryCode: 'US',
      };
    }
  }

  private async getWeatherForLocation(
    latitude: number,
    longitude: number,
    countryCode: string
  ) {
    try {
      const response = await axios.get(this.weatherUrl, {
        params: {
          latitude,
          longitude,
          current: 'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m',
          timezone: 'auto',
        },
        timeout: 10000,
      });

      const current = response.data.current;
      const condition = this.getWeatherCondition(current.weather_code);
      const timezone = response.data.timezone;
      const currentTime = current.time;

      return {
        temperature: Math.round(current.temperature_2m),
        weatherCode: current.weather_code,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        condition,
        timezone,
        currentTime,
      };
    } catch (error) {
      console.log('Error getting weather data:', error);
      throw new Error('Failed to fetch weather data from Open-Meteo');
    }
  }

  private getWeatherCondition(weatherCode: number): string {
    // WMO Weather interpretation codes
    const conditions: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail',
    };

    return conditions[weatherCode] || 'Unknown';
  }
}
