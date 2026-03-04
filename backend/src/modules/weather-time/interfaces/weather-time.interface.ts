import ISongSearch from "../../song/interfaces/song-search.interface.js";

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  previewUrl?: string;
  externalUrl?: string;
  duration?: number;
  releaseDate?: string;
}

export interface WeatherTimeData {
  weather: any;
  songs: Song[];
  genres: string[];
  mood: string;
  reasoning: string;
  session: string;
}

export default interface IWeatherTimeService {
  getTodayVibe(songSearch: ISongSearch): Promise<WeatherTimeData>;
}
