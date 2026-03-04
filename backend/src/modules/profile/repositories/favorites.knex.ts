import { Knex } from "knex";
import IFavoritesRepository from "../interfaces/favorites.interface.js";
import { FavoriteResponseDTO, CreateFavoriteDTO } from "../dto/favorite.dto.js";

export default class FavoritesRepository implements IFavoritesRepository {
  constructor(private readonly db: Knex) {}

  async addFavorite(userId: string, favorite: CreateFavoriteDTO): Promise<FavoriteResponseDTO> {
    // Check if favorite already exists but is soft-deleted
    const existing = await this.db("favorites")
      .where({ user_id: userId, song_id: favorite.song_id })
      .first();

    if (existing) {
      // If it exists and is deleted, restore it
      if (existing.is_deleted) {
        await this.db("favorites")
          .where({ id: existing.id })
          .update({ is_deleted: false });
        return existing as FavoriteResponseDTO;
      }
      // If it exists and is not deleted, return it (already favorited)
      return existing as FavoriteResponseDTO;
    }

    // Create new favorite
    const [record] = await this.db("favorites")
      .insert({
        user_id: userId,
        song_id: favorite.song_id,
        title: favorite.title,
        artist: favorite.artist,
        album: favorite.album,
        artwork: favorite.artwork,
        preview_url: favorite.preview_url,
        external_url: favorite.external_url,
        is_deleted: false,
      })
      .returning("*");

    return record as FavoriteResponseDTO;
  }

  async removeFavorite(userId: string, songId: string): Promise<boolean> {
    const result = await this.db("favorites")
      .where({ user_id: userId, song_id: songId })
      .update({ is_deleted: true });

    return result > 0;
  }

  async getFavoritesByUserId(userId: string): Promise<FavoriteResponseDTO[]> {
    const favorites = await this.db("favorites")
      .where({ user_id: userId, is_deleted: false })
      .select("*");

    return favorites as FavoriteResponseDTO[];
  }

  async isFavorited(userId: string, songId: string): Promise<boolean> {
    const favorite = await this.db("favorites")
      .where({ user_id: userId, song_id: songId, is_deleted: false })
      .first();

    return !!favorite;
  }
}
