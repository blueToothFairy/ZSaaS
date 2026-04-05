import IWeatherGenreService, { WeatherGenreMatch } from '../interfaces/weather-genre.interface.js';

interface GenreKeywordAnalysis {
  genres: string[];
  keywords: string[];
}

interface WeatherConditionAnalysis extends GenreKeywordAnalysis {
  mood: string;
}

export default class WeatherGenreService implements IWeatherGenreService {
  matchGenreToWeather(
    temperature: number,
    weatherCode: number,
    humidity: number,
    condition: string,
    hour: number
  ): WeatherGenreMatch {
    const genres: string[] = [];
    const keywords: string[] = [];

    const timeAnalysis = this.analyzeTimeOfDay(hour);
    genres.push(...timeAnalysis.genres);
    keywords.push(...timeAnalysis.keywords);

    const tempAnalysis = this.analyzeTemperature(temperature);
    genres.push(...tempAnalysis.genres);
    keywords.push(...tempAnalysis.keywords);

    const conditionAnalysis = this.analyzeWeatherCondition(weatherCode, condition);
    genres.push(...conditionAnalysis.genres);
    keywords.push(...conditionAnalysis.keywords);

    const humidityAnalysis = this.analyzeHumidity(humidity);
    keywords.push(...humidityAnalysis.keywords);

    const combinedDescriptors = this.composeContextKeywords(
      timeAnalysis.keywords,
      tempAnalysis.keywords,
      conditionAnalysis.keywords,
      humidityAnalysis.keywords
    );
    keywords.push(...combinedDescriptors);

    return {
      genres: this.uniqueList(genres),
      keywords: this.uniqueList(keywords),
      mood: conditionAnalysis.mood,
      reasoning: this.generateReasoning(condition, temperature, humidity, hour),
    };
  }

  private analyzeTimeOfDay(hour: number): GenreKeywordAnalysis {
    const genres: string[] = [];
    const keywords: string[] = [];

    if (hour >= 5 && hour < 8) {
      genres.push('acoustic', 'indie folk', 'lo-fi', 'soft pop');
      keywords.push('dawn', 'sunrise', 'gentle morning', 'fresh start', 'quiet commute', 'soft light');
    } else if (hour >= 8 && hour < 12) {
      genres.push('indie pop', 'chillhop', 'neo soul', 'pop');
      keywords.push('morning', 'bright morning', 'coffee run', 'light energy', 'productive', 'feel good');
    } else if (hour >= 12 && hour < 15) {
      genres.push('pop', 'funk', 'electronic', 'dance pop');
      keywords.push('midday', 'afternoon drive', 'sunlit', 'upbeat', 'active', 'confident');
    } else if (hour >= 15 && hour < 18) {
      genres.push('indie pop', 'soul', 'funk', 'house');
      keywords.push('late afternoon', 'golden hour', 'city stroll', 'warm glow', 'uplifting', 'easy groove');
    } else if (hour >= 18 && hour < 21) {
      genres.push('alternative', 'indie', 'r&b', 'chill electronic');
      keywords.push('evening', 'sunset', 'afterglow', 'twilight', 'wind down', 'romantic');
    } else if (hour >= 21 && hour < 24) {
      genres.push('dream pop', 'ambient pop', 'lo-fi', 'soul');
      keywords.push('late evening', 'night drive', 'moody lights', 'slow burn', 'intimate', 'reflective');
    } else {
      genres.push('ambient', 'jazz', 'chillwave', 'post-rock');
      keywords.push('midnight', 'after hours', 'deep night', 'nocturnal', 'atmospheric', 'introspective');
    }

    return { genres, keywords };
  }

  private analyzeTemperature(temp: number): GenreKeywordAnalysis {
    const genres: string[] = [];
    const keywords: string[] = [];

    if (temp < 0) {
      genres.push('ambient', 'classical', 'post-rock');
      keywords.push('freezing', 'winter air', 'icy', 'frozen mood', 'minimal', 'still');
    } else if (temp < 10) {
      genres.push('folk', 'indie', 'alternative');
      keywords.push('cold', 'chilly', 'layered up', 'cozy indoors', 'breath in the air', 'contemplative');
    } else if (temp < 18) {
      genres.push('lo-fi', 'indie', 'acoustic');
      keywords.push('cool breeze', 'crisp', 'calm', 'easygoing', 'cozy', 'peaceful');
    } else if (temp < 24) {
      genres.push('indie pop', 'alternative pop', 'soft rock');
      keywords.push('comfortable', 'mild', 'balanced', 'relaxed', 'pleasant', 'steady');
    } else if (temp < 29) {
      genres.push('pop', 'funk', 'electronic');
      keywords.push('warm', 'bright', 'sun kissed', 'energetic', 'playful', 'lighthearted');
    } else if (temp < 34) {
      genres.push('dance', 'tropical', 'house', 'reggaeton');
      keywords.push('hot', 'summer heat', 'vibrant', 'poolside', 'groovy', 'high energy');
    } else {
      genres.push('electronic', 'dance', 'reggae', 'club');
      keywords.push('heatwave', 'scorching', 'intense heat', 'restless', 'sweaty night', 'party energy');
    }

    return { genres, keywords };
  }

  private analyzeWeatherCondition(weatherCode: number, condition: string): WeatherConditionAnalysis {
    const normalizedCondition = condition.toLowerCase();
    const genres: string[] = [];
    const keywords: string[] = [];
    let mood = '';

    if (weatherCode === 0) {
      genres.push('pop', 'indie pop', 'folk', 'disco');
      keywords.push('clear sky', 'sunny', 'bright day', 'clean air', 'carefree', 'optimistic');
      mood = 'Clear, bright, and optimistic';
    } else if (weatherCode === 1) {
      genres.push('indie', 'acoustic pop', 'soft rock');
      keywords.push('mostly clear', 'light sky', 'easy sunshine', 'open air', 'gentle uplift');
      mood = 'Light, open, and calm';
    } else if (weatherCode === 2) {
      genres.push('indie', 'alternative', 'chillhop');
      keywords.push('partly cloudy', 'dreamy', 'soft shadows', 'calm sky', 'balanced mood');
      mood = 'Dreamy and balanced';
    } else if (weatherCode === 3) {
      genres.push('alternative', 'indie', 'dream pop', 'ambient');
      keywords.push('overcast', 'cloudy', 'muted daylight', 'moody', 'grey sky', 'pensive');
      mood = 'Muted and contemplative';
    } else if (weatherCode >= 45 && weatherCode <= 48) {
      genres.push('ambient', 'indie', 'trip-hop');
      keywords.push('foggy', 'misty', 'hazy', 'ethereal', 'mysterious', 'soft focus');
      mood = 'Misty and mysterious';
    } else if (weatherCode >= 51 && weatherCode <= 57) {
      genres.push('lo-fi', 'jazz', 'indie soul');
      keywords.push('drizzle', 'light rain', 'window rain', 'cozy', 'reflective', 'gentle melancholy');
      mood = 'Cozy and reflective';
    } else if (weatherCode >= 61 && weatherCode <= 67) {
      genres.push('lo-fi', 'indie', 'r&b', 'ambient');
      keywords.push('rainy', 'steady rain', 'rain soaked', 'moody', 'introspective', 'quiet city');
      mood = 'Rainy and introspective';
    } else if (weatherCode >= 71 && weatherCode <= 77) {
      genres.push('classical', 'ambient', 'post-rock', 'indie folk');
      keywords.push('snowy', 'winter hush', 'soft snow', 'serene', 'isolated', 'silent street');
      mood = 'Snowy and serene';
    } else if (weatherCode >= 80 && weatherCode <= 82) {
      genres.push('alternative', 'electronic', 'soul');
      keywords.push('rain showers', 'passing storm', 'restless sky', 'emotional', 'cinematic', 'storm clouds');
      mood = 'Restless and cinematic';
    } else if (weatherCode >= 85 && weatherCode <= 86) {
      genres.push('ambient', 'classical', 'cinematic');
      keywords.push('snow showers', 'cold storm', 'white sky', 'dramatic winter', 'stillness');
      mood = 'Cold and cinematic';
    } else if (weatherCode >= 95) {
      genres.push('electronic', 'industrial', 'alternative', 'post-rock');
      keywords.push('thunderstorm', 'stormy', 'electric sky', 'dramatic', 'intense', 'powerful');
      mood = 'Stormy and intense';
    } else if (normalizedCondition.includes('fog')) {
      genres.push('ambient', 'indie', 'alternative');
      keywords.push('foggy', 'mysterious', 'atmospheric', 'ethereal');
      mood = 'Foggy and atmospheric';
    } else {
      genres.push('indie', 'alternative');
      keywords.push('calm weather', 'neutral mood', 'easy listening');
      mood = 'Calm and neutral';
    }

    return { genres, keywords, mood };
  }

  private analyzeHumidity(humidity: number): { keywords: string[] } {
    if (humidity < 30) {
      return { keywords: ['dry air', 'clear texture', 'crisp feeling'] };
    }

    if (humidity < 55) {
      return { keywords: ['comfortable air', 'clean feeling', 'open atmosphere'] };
    }

    if (humidity < 75) {
      return { keywords: ['humid', 'soft air', 'thick atmosphere'] };
    }

    return { keywords: ['very humid', 'sticky air', 'heavy atmosphere'] };
  }

  private composeContextKeywords(
    timeKeywords: string[],
    temperatureKeywords: string[],
    conditionKeywords: string[],
    humidityKeywords: string[]
  ): string[] {
    const [primaryTime = 'day'] = timeKeywords;
    const [secondaryTime = primaryTime] = timeKeywords.slice(1);
    const [primaryTemp = 'comfortable'] = temperatureKeywords;
    const [secondaryTemp = primaryTemp] = temperatureKeywords.slice(1);
    const [primaryCondition = 'calm weather'] = conditionKeywords;
    const [secondaryCondition = primaryCondition] = conditionKeywords.slice(1);
    const [primaryHumidity = 'comfortable air'] = humidityKeywords;

    return [
      `${primaryCondition} ${primaryTime}`,
      `${primaryTemp} ${primaryCondition}`,
      `${secondaryTime} ${secondaryCondition}`,
      `${primaryHumidity} ${primaryCondition}`,
      `${primaryTemp} ${secondaryTime}`,
      `${primaryCondition} playlist`,
      `${primaryTime} vibe`,
      `${primaryTemp} mood`,
    ];
  }

  private generateReasoning(condition: string, temperature: number, humidity: number, hour: number): string {
    const dayPart =
      hour >= 5 && hour < 12
        ? 'morning'
        : hour >= 12 && hour < 18
          ? 'afternoon'
          : hour >= 18 && hour < 24
            ? 'evening'
            : 'late-night';

    const comfortDescriptor =
      temperature < 10
        ? 'cool and inward-looking'
        : temperature < 24
          ? 'balanced and easygoing'
          : temperature < 32
            ? 'warm and energetic'
            : 'heated and restless';

    const humidityDescriptor =
      humidity < 35
        ? 'dry and crisp'
        : humidity < 70
          ? 'comfortable'
          : 'heavy and humid';

    return `We blended ${dayPart} cues with ${condition.toLowerCase()} weather, a ${comfortDescriptor} temperature profile, and ${humidityDescriptor} air to create richer keywords that search for songs matching both the atmosphere and momentum of the moment.`;
  }

  private uniqueList(values: string[]): string[] {
    return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  }
}
