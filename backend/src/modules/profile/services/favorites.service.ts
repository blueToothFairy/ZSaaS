import IFavoritesRepository from "../interfaces/favorites.interface.js";
import { FavoriteResponseDTO, CreateFavoriteDTO, FavoritesListResponseDTO } from "../dto/favorite.dto.js";

export default class FavoritesService {
  constructor(private readonly favoritesRepository: IFavoritesRepository) {}

  async addFavorite(userId: string, favorite: CreateFavoriteDTO): Promise<FavoriteResponseDTO> {
    return this.favoritesRepository.addFavorite(userId, favorite);
  }

  async removeFavorite(userId: string, songId: string): Promise<boolean> {
    return this.favoritesRepository.removeFavorite(userId, songId);
  }

  async getFavorites(userId: string): Promise<FavoritesListResponseDTO> {
    const favorites = await this.favoritesRepository.getFavoritesByUserId(userId);
    return {
      favorites,
      total: favorites.length,
    };
  }

  async isFavorited(userId: string, songId: string): Promise<boolean> {
    return this.favoritesRepository.isFavorited(userId, songId);
  }
}
