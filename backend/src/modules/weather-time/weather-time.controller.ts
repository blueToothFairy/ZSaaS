import { Request, Response } from "express";
import axios from 'axios';
import WeatherTimeService from "./services/index.js";
import ISongSearch from "../song/interfaces/song-search.interface.js";
import { resolveCountryCodeFromRequest } from "../../shared/utils/requestCountry.js";

export default class WeatherTimeController {
  constructor(
    private readonly weatherTimeService: WeatherTimeService,
    private readonly songSearch: ISongSearch
  ) {}

  async getTodayVibe(req: Request, res: Response): Promise<void> {
    try {
      const clientCountryCode = resolveCountryCodeFromRequest(req);
      const vibeData = await this.weatherTimeService.getTodayVibe(this.songSearch, clientCountryCode);

      res.status(200).json({
        success: true,
        data: vibeData,
      });
    } catch (error: any) {
      console.error('getTodayVibe error:', error);

      res.status(axios.isAxiosError(error) ? 502 : 500).json({
        error: "Failed to get today's vibe",
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
}
