import IAIVibeScanner, { Vibe } from "../interfaces/ai-scanner.interface.js";
import axios, { AxiosError } from "axios";

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
          throw new Error(
            `AI service error: ${axiosError.response.status} - ${
              axiosError.response.data || axiosError.message
            }`
          );
        } else if (axiosError.request) {
          throw new Error("AI service did not respond. Please try again.");
        } else {
          throw new Error(`Request failed: ${axiosError.message}`);
        }
      }

      throw error;
    }
  }
}
