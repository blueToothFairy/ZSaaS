import IAIVibeScanner, { Vibe } from "../interfaces/ai-scanner.interface.js";
import axios, { AxiosError } from "axios";
import { PermanentVibeScanError, RetryableVibeScanError } from '../vibe-scan.errors.js';

export default class CLIPService implements IAIVibeScanner {
  async extractVibes(data: FormData): Promise<Vibe[]> {
    const CLIP_URL = process.env.CLIP_URL;
    try {
      const response = await axios.post<{ top_keywords: Vibe[] }>(
        `${CLIP_URL}/extract-vibes`,
        data,
        {
          timeout: 30000,
          maxContentLength: 10 * 1024 * 1024,
          maxBodyLength: 10 * 1024 * 1024,
        }
      );

      if (!response.data || !Array.isArray(response.data.top_keywords)) {
        throw new Error("Invalid response format from AI service");
      }

      return response.data.top_keywords;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        if (axiosError.response) {
          const status = axiosError.response.status;
          if (status === 408 || status === 429 || status >= 500) throw new RetryableVibeScanError(`AI service temporarily unavailable (${status})`);
          throw new PermanentVibeScanError('INVALID_IMAGE', 'The image could not be analyzed');
        } else if (axiosError.request) {
          throw new RetryableVibeScanError("AI service did not respond");
        } else {
          throw new PermanentVibeScanError('AI_REQUEST_INVALID', 'AI service request could not be created');
        }
      }

      throw error;
    }
  }
}
