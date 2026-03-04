import { Request, Response, Router } from 'express';
import songSearchController from './song.module.js';

const songRouter = Router();

songRouter.post(
  "/search",
  (req: Request, res: Response) => songSearchController.searchSongs(req, res)
);

songRouter.post(
  "/search-by-keywords",
  (req: Request, res: Response) => songSearchController.searchByKeywords(req, res)
);

export default songRouter;
