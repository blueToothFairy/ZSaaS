import SongSearchController from "./song.controller.js";
import SongSearchService from "./services/index.js";
import ITunesSearchService from "./services/itunes.search.service.js";
import ISongSearch from "./interfaces/song-search.interface.js";

const iTunesSearchService: ISongSearch = new ITunesSearchService();
const songSearchService = new SongSearchService(iTunesSearchService);
const songSearchController = new SongSearchController(songSearchService);

export default songSearchController;
