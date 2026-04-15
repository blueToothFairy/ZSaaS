import { Request, Response } from 'express';
import db from '../../shared/db/knexClient.js';
import { redisClient } from '../../shared/redis/redisClient.js';
import axios from 'axios';
import cron from 'node-cron';

/**
 * KeepAliveController
 * - GET /wake: lightweight operations to keep Supabase and Upstash active
 * - Starts a cron job (every 14 minutes) to ping the external AI service (process.env.CLIP_URL)
 */
export default class KeepAliveController {
  private cronStarted = false;

  constructor() {
    // Start cron job once on controller creation
    try {
      if (!this.cronStarted) {
        const clipUrl = process.env.CLIP_URL + '/ping';

        if (!clipUrl) {
          console.warn('KeepAlive: CLIP_URL not configured; cron ping disabled');
        } else {
          // schedule every 14 minutes (minutes: 0,14,28,42,56)
          cron.schedule('*/14 * * * *', async () => {
            try {
              await axios.get(clipUrl, { timeout: 15000 });
              console.log('KeepAlive: pinged CLIP_URL successfully');
            } catch (err) {
              console.error('KeepAlive cron ping error:', err instanceof Error ? err.message : err);
            }
          });

          // initial immediate ping (non-blocking)
          (async () => {
            try {
              await axios.get(clipUrl, { timeout: 15000 });
              console.log('KeepAlive: initial CLIP_URL ping successful');
            } catch (err) {
              console.error('KeepAlive initial ping error:', err instanceof Error ? err.message : err);
            }
          })();
        }

        this.cronStarted = true;
      }
    } catch (error) {
      console.error('KeepAliveController init error:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * GET /wake
   * - Runs a tiny Supabase (Knex) query and a tiny Redis set to keep free-tier services active
   */
  async wake(req: Request, res: Response): Promise<void> {
    const result: Record<string, any> = { success: true, operations: {} };

    // Supabase / Postgres lightweight query
    try {
      const row = await db('favorites').select('id').limit(1);
      result.operations.supabase = { ok: true, rowsReturned: Array.isArray(row) ? row.length : 0 };
    } catch (error) {
      console.error('KeepAlive supabase query error:', error instanceof Error ? error.message : error);
      result.operations.supabase = { ok: false, error: error instanceof Error ? error.message : String(error) };
    }

    // Redis lightweight set
    try {
      // Set a small TTL so record doesn't persist
      await redisClient.set('keep-alive', { pong: true, ts: new Date().toISOString() }, 120);
      result.operations.redis = { ok: true };
    } catch (error) {
      console.error('KeepAlive redis error:', error instanceof Error ? error.message : error);
      result.operations.redis = { ok: false, error: error instanceof Error ? error.message : String(error) };
    }

    // Respond with aggregated status
    res.status(200).json(result);
  }
}
