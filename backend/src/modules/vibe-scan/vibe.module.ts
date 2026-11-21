import VibeScannerController from "./vibe.controller.js";
import KnexAIOutputsRepository from "./repositories/ai-outputs.knex.js"
import AIRepository from "./interfaces/ai-output-repo.interface.js";
import db from '../../shared/db/knexClient.js';
import MusicTasteRepository from '../profile/repositories/music-taste.knex.js';
import MusicTasteService from '../profile/services/music-taste.service.js';
import { createObjectStorage } from '../../shared/storage/object-storage.js';
import OutboxRepository from '../../shared/outbox/outbox.repository.js';
import VibeScanSubmissionService from './services/vibe-scan-submission.service.js';
import VibeScanApplicationService from './services/vibe-scan-application.service.js';

const aiRepo: AIRepository = new KnexAIOutputsRepository(db);
const musicTasteService = new MusicTasteService(new MusicTasteRepository(db));
const submissionService = new VibeScanSubmissionService(db, aiRepo, new OutboxRepository(db), createObjectStorage());
const vibeScanService = new VibeScanApplicationService(aiRepo, musicTasteService, submissionService);
const vibeController = new VibeScannerController(vibeScanService);

export default vibeController;
