import VibeScannerController from "./vibe.controller.js";
import VibeScannerService from "./services/index.js";
import CLIPService from "./services/CLIP.service.js";
import ITunesSearchService from "../song/services/itunes.search.service.js";
import KnexAIOutputsRepository from "./repositories/ai-outputs.knex.js"
import IAIVibeScanner from "./interfaces/ai-scanner.interface.js";
import ISongSearch from "../song/interfaces/song-search.interface.js";
import AIRepository from "./interfaces/ai-output-repo.interface.js";
import db from '../../shared/db/knexClient.js';

// CLIP URL may not be available in all environments (e.g. tests or local dev).
// We don't want the entire backend to crash on import; requests that rely on
// CLIP will simply fail later with a descriptive message.
// const clipUrl = process.env.CLIP_URL || '';
// if (!clipUrl) {
//   console.warn('CLIP_URL is not set; vibe-scanning endpoints will return errors until configured.');
// }

const clipService: IAIVibeScanner = new CLIPService();
const iTunesSearchService: ISongSearch = new ITunesSearchService();
const aiRepo: AIRepository = new KnexAIOutputsRepository(db);

const vibeScannerService = new VibeScannerService(clipService, iTunesSearchService, aiRepo);

const vibeController = new VibeScannerController(vibeScannerService);

export default vibeController;