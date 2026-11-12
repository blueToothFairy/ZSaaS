import { Request, Response } from "express";
import axios from 'axios';
import VibeScannerService from "./services/index.js";
import AuthenticatedRequest from "../../shared/types/AuthenticatedRequest.js";
import { resolveCountryCodeFromRequest } from "../../shared/utils/requestCountry.js";

export default class VibeScannerController {
  constructor(
    private readonly vibeService: VibeScannerService
  ) {}

  async getSongs(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestStartedAt = performance.now();
    const userId = req.userId;
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

      const clientCountryCode = resolveCountryCodeFromRequest(req);
      const platform = typeof req.body?.platform === "string" ? req.body.platform.trim() : "unspecified";
      const contentType = typeof req.body?.contentType === "string" ? req.body.contentType.trim() : "unspecified";
      if (platform.length > 80 || contentType.length > 80) {
        res.status(400).json({ success: false, error: "Intent values must be 80 characters or fewer" });
        return;
      }
      const evaluationMode = process.env.ENABLE_ISS002_EVALUATION === "true"
        && process.env.ISS002_EVALUATION_SECRET
        && req.header("x-iss002-evaluation-key") === process.env.ISS002_EVALUATION_SECRET
        ? req.header("x-iss002-evaluation-mode")
        : undefined;
      const requestContext = { platform: platform || "unspecified", contentType: contentType || "unspecified" };
      if (evaluationMode === "baseline") {
        const baseline = await this.vibeService.getBaselineWithEvaluation(req.file.buffer, req.file.originalname, req.file.mimetype, clientCountryCode);
        res.status(200).json({
          success: true,
          songs: baseline.songs,
          ...(evaluationMode ? { evaluation: { mode: evaluationMode, totalDurationMs: performance.now() - requestStartedAt, steps: baseline.steps } } : {}),
        });
        return;
      }

      const evaluation = evaluationMode === "personalized"
        ? await this.vibeService.getVibeMatchingSongsWithEvaluation(
          userId,
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          clientCountryCode,
          requestContext
        )
        : undefined;
      const recommendations = evaluation?.recommendations ?? await this.vibeService.getVibeMatchingSongs(
        userId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        clientCountryCode,
        requestContext
      );

      // Return response
      res.status(200).json({
        success: true,
        songs: recommendations.map((item) => ({ ...item.track, score: item.score, componentScores: item.componentScores, reasons: item.reasons })),
        recommendations,
        ...(evaluation ? { evaluation: { mode: evaluationMode, totalDurationMs: performance.now() - requestStartedAt, steps: evaluation.steps } } : {}),
      });

    } catch (error: any) {
      console.error('getVibes error:', error);

      res.status(axios.isAxiosError(error) ? 502 : 500).json({
        error: "Failed to extract vibes",
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
}
