import { Request, Response } from "express";
import axios from 'axios';
import SongSearchService from "./services/index.js";
import { resolveCountryCodeFromRequest } from "../../shared/utils/requestCountry.js";

export default class SongSearchController {
  constructor(
    private readonly songSearchService: SongSearchService
  ) {}

  async searchByKeywords(req: Request, res: Response): Promise<void> {
    console.log('search by keywords');
    
    try {
      const { keywords, limit = 10, country } = req.body;

      if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        res.status(400).json({ error: "Keywords array is required" });
        return;
      }

      const resolvedCountry = country || resolveCountryCodeFromRequest(req) || "US";
      const result = await this.songSearchService.searchByKeywords(keywords, limit, resolvedCountry);

      res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error: any) {
      console.error('searchByKeywords error:', error);

      res.status(axios.isAxiosError(error) ? 502 : 500).json({
        error: "Failed to search songs",
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }

  async searchSongs(req: Request, res: Response): Promise<void> {
    console.log('search songs');
    
    try {
      const { query, limit = 10, country } = req.body;

      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: "Query string is required" });
        return;
      }

      const resolvedCountry = country || resolveCountryCodeFromRequest(req) || "US";
      const result = await this.songSearchService.searchSongs(query, limit, resolvedCountry);

      res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error: any) {
      console.error('searchSongs error:', error);

      res.status(axios.isAxiosError(error) ? 502 : 500).json({
        error: "Failed to search songs",
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
}
