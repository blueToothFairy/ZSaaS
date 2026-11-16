export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  previewUrl?: string;
  duration?: number;
  externalUrl?: string;
  artistId?: string;
  primaryGenreName?: string;
  score?: number;
  reasons?: string[];
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  humidity: number;
  windSpeed: number;
  condition: string;
}

export type DashboardTab = 'home' | 'ai-scan' | 'favorites' | 'profile';
