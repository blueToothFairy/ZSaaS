import { Response } from "express";
import AuthenticatedRequest from "../../shared/types/AuthenticatedRequest.js";
import FavoritesService from "./services/favorites.service.js";
import { CreateFavoriteDTO } from "./dto/favorite.dto.js";

export class ProfileController {
  constructor(
    private readonly favoritesService: FavoritesService
  ) {}

  async getFavorites(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized - No userId" });
      }

      const result = await this.favoritesService.getFavorites(userId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("getFavorites error:", err.message, error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch favorites",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }

  async addFavorite(req: AuthenticatedRequest, res: Response) {
    const userId = req.userId;
    try {
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const favoriteData: CreateFavoriteDTO = req.body;

      // Validate required fields
      if (!favoriteData.song_id || !favoriteData.title || !favoriteData.artist || !favoriteData.album || !favoriteData.artwork) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: song_id, title, artist, album, artwork",
        });
      }

      const result = await this.favoritesService.addFavorite(userId, favoriteData);
      res.status(201).json({
        success: true,
        message: "Track added to favorites",
        data: result,
      });
    } catch (error: any) {
      console.error("addFavorite error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add favorite",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  async removeFavorite(req: AuthenticatedRequest, res: Response) {
    const userId = req.userId;
    const songId = this.extractSongId(req.params.songId);

    try {
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!songId) {
        return res.status(400).json({
          success: false,
          message: "songId is required",
        });
      }

      const result = await this.favoritesService.removeFavorite(userId, songId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Favorite not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Track removed from favorites",
      });
    } catch (error: any) {
      console.error("removeFavorite error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove favorite",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  async isFavorited(req: AuthenticatedRequest, res: Response) {
    const userId = req.userId;
    const songId = this.extractSongId(req.params.songId);

    try {
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!songId) {
        return res.status(400).json({
          success: false,
          message: "songId is required",
        });
      }

      const isFavorited = await this.favoritesService.isFavorited(userId, songId);
      res.status(200).json({
        success: true,
        data: { isFavorited },
      });
    } catch (error: any) {
      console.error("isFavorited error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check favorite status",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  private extractSongId(songIdParam: string | string[] | undefined): string | undefined {
    if (Array.isArray(songIdParam)) {
      return songIdParam[0];
    }

    return songIdParam;
  }
}
