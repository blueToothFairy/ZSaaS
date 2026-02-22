import IWeatherGenreService, { WeatherGenreMatch } from '../interfaces/weather-genre.interface.js';

export default class WeatherGenreService implements IWeatherGenreService {
  /**
   * Maps weather conditions to music genres and keywords
   * Considers temperature, weather condition, and humidity
   */
  matchGenreToWeather(
    temperature: number,
    weatherCode: number,
    humidity: number,
    condition: string
  ): WeatherGenreMatch {
    const genres: string[] = [];
    const keywords: string[] = [];
    let mood = '';
    let reasoning = '';

    // Analyze temperature
    const tempAnalysis = this.analyzeTemperature(temperature);
    genres.push(...tempAnalysis.genres);
    keywords.push(...tempAnalysis.keywords);

    // Analyze weather condition
    const conditionAnalysis = this.analyzeWeatherCondition(weatherCode, condition);
    genres.push(...conditionAnalysis.genres);
    keywords.push(...conditionAnalysis.keywords);
    mood = conditionAnalysis.mood;

    // Analyze humidity
    const humidityAnalysis = this.analyzeHumidity(humidity);
    keywords.push(...humidityAnalysis.keywords);

    // Combine and deduplicate
    const finalGenres = [...new Set(genres)];
    const finalKeywords = [...new Set(keywords)];

    // Generate reasoning
    reasoning = this.generateReasoning(condition, temperature, humidity);

    return {
      genres: finalGenres,
      keywords: finalKeywords,
      mood,
      reasoning,
    };
  }

  private analyzeTemperature(temp: number): { genres: string[]; keywords: string[] } {
    const genres: string[] = [];
    const keywords: string[] = [];

    if (temp < 0) {
      genres.push('ambient', 'classical', 'post-rock');
      keywords.push('winter', 'cold', 'frozen', 'atmospheric', 'minimal');
    } else if (temp < 10) {
      genres.push('indie', 'folk', 'alternative');
      keywords.push('chilly', 'contemplative', 'acoustic', 'mellow');
    } else if (temp < 15) {
      genres.push('lo-fi', 'chillhop', 'indie');
      keywords.push('cool', 'relaxed', 'peaceful', 'cozy');
    } else if (temp < 20) {
      genres.push('indie', 'alternative', 'pop');
      keywords.push('pleasant', 'comfortable', 'calm');
    } else if (temp < 25) {
      genres.push('pop', 'indie pop', 'electronic');
      keywords.push('warm', 'uplifting', 'energetic', 'bright');
    } else if (temp < 30) {
      genres.push('funk', 'soul', 'electronic', 'dance');
      keywords.push('hot', 'summer', 'vibrant', 'groove');
    } else {
      genres.push('tropical', 'reggae', 'electronic', 'dance');
      keywords.push('heatwave', 'intense', 'party', 'energetic');
    }

    return { genres, keywords };
  }

  private analyzeWeatherCondition(
    weatherCode: number,
    condition: string
  ): { genres: string[]; keywords: string[]; mood: string } {
    const genres: string[] = [];
    const keywords: string[] = [];
    let mood = '';

    // Clear/sunny weather (codes 0, 1)
    if (weatherCode <= 1) {
      genres.push('pop', 'indie', 'folk', 'acoustic');
      keywords.push('sunny', 'clear', 'cheerful', 'uplifting', 'bright');
      mood = 'Sunny and bright';
    }
    // Partly cloudy (code 2)
    else if (weatherCode === 2) {
      genres.push('indie', 'alternative', 'chillhop');
      keywords.push('dreamy', 'calm', 'peaceful');
      mood = 'Partly cloudy and calm';
    }
    // Overcast (code 3)
    else if (weatherCode === 3) {
      genres.push('alternative', 'indie', 'post-rock', 'ambient');
      keywords.push('moody', 'contemplative', 'introspective');
      mood = 'Overcast and contemplative';
    }
    // Rainy weather (codes 51-82)
    else if ((weatherCode >= 45 && weatherCode <= 48) || (weatherCode >= 51 && weatherCode <= 82)) {
      genres.push('lo-fi', 'ambient', 'indie', 'jazz', 'soul');
      keywords.push('rainy', 'atmospheric', 'moody', 'introspective', 'cozy', 'relaxing');
      mood = 'Rainy and reflective';
    }
    // Snowy weather (codes 71-86)
    else if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86)) {
      genres.push('classical', 'ambient', 'post-rock', 'indie');
      keywords.push('snow', 'winter', 'silent', 'peaceful', 'isolated', 'serene');
      mood = 'Snowy and peaceful';
    }
    // Thunderstorm (codes 95-99)
    else if (weatherCode >= 95) {
      genres.push('electronic', 'industrial', 'alternative', 'post-rock');
      keywords.push('stormy', 'intense', 'dramatic', 'powerful', 'electric');
      mood = 'Stormy and dramatic';
    }
    // Foggy weather
    else if (condition.toLowerCase().includes('fog')) {
      genres.push('ambient', 'alternative', 'indie');
      keywords.push('foggy', 'mysterious', 'atmospheric', 'ethereal');
      mood = 'Foggy and mysterious';
    } else {
      genres.push('indie', 'alternative');
      keywords.push('neutral', 'calm');
      mood = 'Neutral weather';
    }

    return { genres, keywords, mood };
  }

  private analyzeHumidity(humidity: number): { keywords: string[] } {
    const keywords: string[] = [];

    if (humidity < 30) {
      keywords.push('dry', 'crisp', 'clear');
    } else if (humidity < 60) {
      keywords.push('comfortable', 'pleasant');
    } else if (humidity < 80) {
      keywords.push('moist', 'humid', 'thick');
    } else {
      keywords.push('very humid', 'sticky', 'heavy');
    }

    return { keywords };
  }

  private generateReasoning(condition: string, temperature: number, humidity: number): string {
    const tempDesc =
      temperature < 10
        ? 'chilly'
        : temperature < 20
          ? 'cool'
          : temperature < 25
            ? 'pleasant'
            : 'warm';

    return `Based on ${condition} conditions (${temperature}°, ${humidity}% humidity), we selected songs that match this ${tempDesc} weather vibe.`;
  }
}
