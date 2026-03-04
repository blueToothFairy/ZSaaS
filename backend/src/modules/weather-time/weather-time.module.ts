import WeatherTimeController from "./weather-time.controller.js";
import WeatherTimeService from "./services/index.js";
import WeatherService from "./services/weather.service.js";
import WeatherGenreService from "./services/weather-genre.service.js";
import ITunesSearchService from "../song/services/itunes.search.service.js";
import IWeatherService from "./interfaces/weather.interface.js";
import IWeatherGenreService from "./interfaces/weather-genre.interface.js";
import ISongSearch from "../song/interfaces/song-search.interface.js";

const weatherService: IWeatherService = new WeatherService();
const weatherGenreService: IWeatherGenreService = new WeatherGenreService();
const iTunesSearchService: ISongSearch = new ITunesSearchService();

const weatherTimeService = new WeatherTimeService(weatherService, weatherGenreService);
const weatherTimeController = new WeatherTimeController(weatherTimeService, iTunesSearchService);

export default weatherTimeController;
