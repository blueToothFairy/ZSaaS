import { ProfileController } from "./profile.controller.js";
import FavoritesService from "./services/favorites.service.js";
import FavoritesRepository from "./repositories/favorites.knex.js";
import db from "../../shared/db/knexClient.js";

const favoritesRepository = new FavoritesRepository(db);
const favoritesService = new FavoritesService(favoritesRepository);
const profileController = new ProfileController(favoritesService);

export default profileController;
