import { Request, Response, Router } from 'express';
import weatherTimeController from './weather-time.module.js';

const weatherTimeRouter = Router();

weatherTimeRouter.get(
  "/today-vibe",
  (req: Request, res: Response) => weatherTimeController.getTodayVibe(req, res)
);

export default weatherTimeRouter;
