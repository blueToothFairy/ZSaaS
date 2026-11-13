import { Request, Response, Router } from 'express';
import songSearchController from './song.module.js';
import { requireAccessToken } from '../../shared/middleware/requireAccessToken.js';
import { createAuthenticatedLimiter } from '../../shared/middleware/rateLimiting.js';

const songRouter = Router();
songRouter.use(requireAccessToken, createAuthenticatedLimiter());

songRouter.post(
  "/search",
  (req: Request, res: Response) => songSearchController.searchSongs(req, res)
);

songRouter.post(
  "/search-by-keywords",
  (req: Request, res: Response) => songSearchController.searchByKeywords(req, res)
);

export default songRouter;
