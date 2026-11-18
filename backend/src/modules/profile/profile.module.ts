import { ProfileController } from "./profile.controller.js";
import FavoritesService from "./services/favorites.service.js";
import FavoritesRepository from "./repositories/favorites.knex.js";
import db from "../../shared/db/knexClient.js";
import MusicTasteRepository from "./repositories/music-taste.knex.js";
import MusicTasteService from "./services/music-taste.service.js";

const favoritesRepository = new FavoritesRepository(db);
const favoritesService = new FavoritesService(favoritesRepository);
const musicTasteRepository = new MusicTasteRepository(db);
const musicTasteService = new MusicTasteService(musicTasteRepository);
const profileController = new ProfileController(favoritesService, musicTasteService);

export default profileController;
