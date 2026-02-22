import { Request, Response } from "express";
import axios from 'axios';
import VibeScannerService from "./services/index.js";
import ClerkRequest from "../../shared/types/ClerkRequest.js";

export default class VibeScannerController {
  constructor(
    private readonly vibeService: VibeScannerService
  ) {}

  async getSongs(req: ClerkRequest, res: Response): Promise<void> {
    console.log('get songs');
    const userId = req.auth().userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      // Validate file
      if (!req.file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        res.status(400).json({ error: "Invalid file type" });
        return;
      }

      if (req.file.size > 10 * 1024 * 1024) {
        res.status(400).json({ error: "File too large (max 1MB)" });
        return;
      }

      const songs = await this.vibeService.getVibeMatchingSongs(req.file.buffer, req.file.originalname, req.file.mimetype);

      // Save to DB (async, non-blocking)
      // this.aiRepo.create({
      //   user_id: userId,
      //   feature_type: "match_music",
      //   input_params: {
      //     imageFile: req.file.buffers
      //   },
      //   output_data: {
      //     songs
      //   }
      // });

      // Return response
      res.status(200).json({
        success: true,
        songs,
      });

    } catch (error: any) {
      console.error('getVibes error:', error);

      res.status(axios.isAxiosError(error) ? 502 : 500).json({
        error: "Failed to extract vibes",
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }

  async getTodayVibe(req: Request, res: Response): Promise<void> {
    try {
      const vibeData = await this.vibeService.getTodayVibe();

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

  async getUserHistory(req: ClerkRequest, res: Response): Promise<void> {
    const userId = req.auth.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { limit, offset } = req.body;
    // try catch
  }
}