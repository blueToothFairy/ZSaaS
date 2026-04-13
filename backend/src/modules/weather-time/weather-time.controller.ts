import { Request, Response } from "express";
import axios from 'axios';
import WeatherTimeService from "./services/index.js";
import ISongSearch from "../song/interfaces/song-search.interface.js";
import { resolveCountryCodeFromRequest } from "../../shared/utils/requestCountry.js";

export default class WeatherTimeController {
  constructor(
    private readonly weatherTimeService: WeatherTimeService,
    private readonly songSearch: ISongSearch
  ) { }

  async getTodayVibe(req: Request, res: Response): Promise<void> {
    try {
      const clientCountryCode = resolveCountryCodeFromRequest(req);

      // Prefer common proxy headers (Vercel, Cloudflare, nginx)
      const xfwdHeader =
        req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] ||
        req.headers['cf-connecting-ip'];

      const xfwd =
        typeof xfwdHeader === 'string'
          ? xfwdHeader
          : Array.isArray(xfwdHeader)
            ? xfwdHeader[0]
            : undefined;

      const ipFromHeader = xfwd?.split(',')[0].trim();
      // remoteAddress can be in forms like ::ffff:127.0.0.1 or ::1
      const rawRemote = req.socket && (req.socket.remoteAddress as string | undefined);
      const remoteIpRaw = ipFromHeader || rawRemote || undefined;

      // Normalize IPv6-mapped IPv4 and strip port if present
      let remoteIp: string | undefined = remoteIpRaw;
      if (remoteIp) {
        // remove port if like '1.2.3.4:5678' or '[::1]:1234'
        remoteIp = remoteIp.replace(/^\[(.*)\](?::\d+)?$/, '$1');
        remoteIp = remoteIp.split(':').slice(-4).join(':');
        // Handle ::ffff:IPv4
        const v4match = remoteIp.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
        if (v4match) remoteIp = v4match[1];
        remoteIp = remoteIp.split(':')[0];
      }

      // Accept timezone override from frontend (preferred)
      const tz = typeof req.query?.tz === 'string' ? req.query.tz : undefined;

      const vibeData = await this.weatherTimeService.getTodayVibe(this.songSearch, clientCountryCode, { tz, ip: remoteIp });

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
