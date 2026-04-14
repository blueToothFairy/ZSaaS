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

      const ipFromHeader = xfwd?.split(',')[0]?.trim();
      
      const rawRemote = req.socket && (req.socket.remoteAddress as string | undefined);
      const remoteIpRaw = ipFromHeader || rawRemote || undefined;

      let remoteIp: string | undefined = remoteIpRaw;
      if (remoteIp) {
        remoteIp = remoteIp.trim();

        if (remoteIp.includes(':') && remoteIp.split(':').length === 2) {
          remoteIp = remoteIp.split(':')[0];
        }

        if (remoteIp!.startsWith('::ffff:')) {
          remoteIp = remoteIp!.replace('::ffff:', '');
        }

        // if (remoteIp === '::1' || remoteIp === '127.0.0.1' || remoteIp === '') {
        //   remoteIp = '116.109.28.0'; // IP fallback của VN
        // }
      }

      const tzQuery = req.query?.tz;
      const tz = typeof tzQuery === 'string' ? tzQuery : undefined;

      const serviceOptions: { tz?: string; ip?: string } = {};
      if (tz !== undefined) serviceOptions.tz = tz;
      if (remoteIp !== undefined) serviceOptions.ip = remoteIp;
      console.log('getTodayVibe request - clientCountryCode:', clientCountryCode, 'serviceOptions:', serviceOptions);

      const vibeData = await this.weatherTimeService.getTodayVibe(
        this.songSearch, 
        clientCountryCode, 
        serviceOptions
      );

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