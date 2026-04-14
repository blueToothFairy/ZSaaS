
import axios from 'axios';
import IWeatherService, { WeatherData } from '../interfaces/weather.interface.js';

export default class WeatherService implements IWeatherService {
  // use ipinfo.io for IP geolocation
  private readonly geoLocationUrl = 'https://ipinfo.io';
  private readonly restCountriesUrl = 'https://restcountries.com/v3.1/alpha';
  private readonly weatherUrl = 'https://api.open-meteo.com/v1/forecast';

  // Accept optional options: tz (client timezone) and ip (client IP).
  // clientCountryCode is used as a fallback when IP lookup fails.
  async getCurrentWeather(
    options?: { tz?: string; ip?: string },
    clientCountryCode?: string
  ): Promise<WeatherData> {
    try {
      // Get location from IP (prefer provided ip); fall back to clientCountryCode or tz-based centroid
      const geoData = await this.getLocationFromIP(options?.ip, options?.tz, clientCountryCode);

      // Get weather data for the location, pass timezone if provided
      const weatherData = await this.getWeatherForLocation(
        geoData.lat,
        geoData.lon,
        geoData.countryCode,
        options?.tz
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

  private async getLocationFromIP(ip?: string, tz?: string, clientCountryCode?: string) {
    try {
      const cleanedIp = ip ? ip.trim() : undefined;
      // ipinfo.io: /json or /{ip}/json, token via env.IPINFO_TOKEN
      const token = process.env.IPINFO_TOKEN;
      const base = cleanedIp ? `${this.geoLocationUrl}/${encodeURIComponent(cleanedIp)}/json` : `${this.geoLocationUrl}/json`;
      const url = token ? `${base}?token=${encodeURIComponent(token)}` : base;
      console.log('Resolving geo for IP, calling:', url);
      const response = await axios.get(url, { timeout: 5000 });

      if (!response || !response.data) {
        console.warn('ipinfo returned empty response for', cleanedIp);
      }

      // ipinfo returns `loc` as "lat,lon" string
      const data = response.data || {};
      if (data && data.loc && typeof data.loc === 'string') {
        const parts = data.loc.split(',').map((p: string) => p.trim());
        if (parts.length === 2) {
          const lat = Number(parts[0]);
          const lon = Number(parts[1]);
          const countryCode = (data.country || '').toUpperCase() || 'ZZ';
          const country = data.city || data.region || countryCode;

          console.log('ipinfo result:', { lat, lon, country, countryCode, query: data.ip });

          return { lat, lon, country, countryCode };
        }
      }

      console.warn('ipinfo lookup did not return coords, falling back to country/tz', data);

      // Fallback: if clientCountryCode provided, query restcountries to get centroid
      if (clientCountryCode) {
        try {
          const code = clientCountryCode.trim().toUpperCase();
          const rcRes = await axios.get(`${this.restCountriesUrl}/${encodeURIComponent(code)}`);
          const rcData = Array.isArray(rcRes.data) ? rcRes.data[0] : rcRes.data;
          if (rcData && rcData.latlng && rcData.latlng.length >= 2) {
            const [lat, lon] = rcData.latlng;
            const country = rcData.name?.common || rcData.name || code;
            console.log('restcountries centroid for', code, { lat, lon, country });
            return { lat, lon, country, countryCode: code };
          }
        } catch (err) {
          console.warn('restcountries lookup failed for', clientCountryCode, err);
        }
      }

      // Fallback: if tz provided, use coarse region centroid (continent-level) based on tz prefix
      if (tz) {
        const region = tz.split('/')[0] || tz;
        const regionCentroids: { [key: string]: { lat: number; lon: number } } = {
          Asia: { lat: 31.0, lon: 101.0 },
          Europe: { lat: 54.0, lon: 15.0 },
          Africa: { lat: 1.5, lon: 17.0 },
          America: { lat: 10.0, lon: -85.0 },
          Pacific: { lat: -15.0, lon: -140.0 },
          Atlantic: { lat: 0.0, lon: -30.0 },
          Indian: { lat: -20.0, lon: 80.0 },
          Antarctic: { lat: -75.0, lon: 0.0 },
        };

        const centroid = regionCentroids[region] || { lat: 20.0, lon: 0.0 };
        console.log('Using tz-based centroid for region', region, centroid);
        return {
          lat: centroid.lat,
          lon: centroid.lon,
          country: region,
          countryCode: region.toUpperCase().slice(0, 2),
        };
      }

      // Last resort: do not hardcode US; return neutral global centroid
      console.warn('Geo lookup failed entirely, returning neutral centroid');
      return {
        lat: 0,
        lon: 0,
        country: 'Unknown',
        countryCode: 'ZZ',
      };
    } catch (error) {
      console.error('Error getting location from IP using ipapi:', error);
      // Avoid hardcoding US. Use neutral centroid as last resort
      return {
        lat: 0,
        lon: 0,
        country: 'Unknown',
        countryCode: 'ZZ',
      };
    }
  }

  private async getWeatherForLocation(
    latitude: number,
    longitude: number,
    countryCode: string,
    tz?: string
  ) {
    try {
      const response = await axios.get(this.weatherUrl, {
        params: {
          latitude,
          longitude,
          current: 'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m',
          timezone: tz || 'auto',
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
