import VibeScannerController from "./vibe.controller.js";
import VibeScannerService from "./services/index.js";
import CLIPService from "./services/CLIP.service.js";
import ITunesSearchService from "./services/itunes.search.service.js";
import WeatherService from "./services/weather.service.js";
import WeatherGenreService from "./services/weather-genre.service.js";
import KnexAIOutputsRepository from "./repositories/ai-outputs.knex.js"
import IWeatherService from "./interfaces/weather.interface.js";
import IWeatherGenreService from "./interfaces/weather-genre.interface.js";
import db from '../../shared/db/knexClient.js';

// CLIP URL may not be available in all environments (e.g. tests or local dev).
// We don't want the entire backend to crash on import; requests that rely on
// CLIP will simply fail later with a descriptive message.
// const clipUrl = process.env.CLIP_URL || '';
// if (!clipUrl) {
//   console.warn('CLIP_URL is not set; vibe-scanning endpoints will return errors until configured.');
// }

const clipService = new CLIPService();
const iTunesSearchService = new ITunesSearchService();
const weatherService: IWeatherService = new WeatherService();
const weatherGenreService: IWeatherGenreService = new WeatherGenreService();
const aiRepo = new KnexAIOutputsRepository(db);

const vibeScannerService = new VibeScannerService(clipService, iTunesSearchService, aiRepo, weatherService, weatherGenreService);

const vibeController = new VibeScannerController(vibeScannerService);

export default vibeController;