import { Router, Request, Response } from "express";
import profileController from "./profile.module.js";

const profileRouter = Router();

// Get all favorites
profileRouter.get(
  "/favorites",
  (req: Request, res: Response) => profileController.getFavorites(req as any, res)
);

// Add a favorite track
profileRouter.post(
  "/favorites",
  (req: Request, res: Response) => profileController.addFavorite(req as any, res)
);

// Remove a favorite track
profileRouter.delete(
  "/favorites/:songId",
  (req: Request, res: Response) => profileController.removeFavorite(req as any, res)
);

// Check if a track is favorited
profileRouter.get(
  "/favorites/:songId/status",
  (req: Request, res: Response) => profileController.isFavorited(req as any, res)
);

export default profileRouter;
