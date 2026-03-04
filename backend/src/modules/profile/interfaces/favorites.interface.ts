import { FavoriteResponseDTO, CreateFavoriteDTO } from "../dto/favorite.dto.js";

export default interface IFavoritesRepository {
  addFavorite(userId: string, favorite: CreateFavoriteDTO): Promise<FavoriteResponseDTO>;
  removeFavorite(userId: string, songId: string): Promise<boolean>;
  getFavoritesByUserId(userId: string): Promise<FavoriteResponseDTO[]>;
  isFavorited(userId: string, songId: string): Promise<boolean>;
}
