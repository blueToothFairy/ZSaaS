import IAIVibeScanner, { ClipTelemetry, Vibe } from "../interfaces/ai-scanner.interface.js";
import axios, { AxiosError } from "axios";

export default class CLIPService implements IAIVibeScanner {
  async extractVibes(data: FormData): Promise<Vibe[]> {
    return (await this.extractVibesWithTelemetry(data)).vibes;
  }

  async extractVibesWithTelemetry(data: FormData): Promise<{ vibes: Vibe[]; telemetry?: ClipTelemetry; roundTripMs: number }> {
    const CLIP_URL = process.env.CLIP_URL;
    const startedAt = performance.now();
    try {
      const response = await axios.post<{ top_keywords: Vibe[]; telemetry?: { model_state?: string; input_bytes?: number; timing_ms?: Record<string, number>; memory_mb?: { before?: number; after?: number; peak?: number } } }>(
        `${CLIP_URL}/extract-vibes`, 
        data,
        {
          timeout: 30000,
          maxContentLength: 10 * 1024 * 1024,
          maxBodyLength: 10 * 1024 * 1024,
        }
      );

      if (!response.data || !Array.isArray(response.data.top_keywords)) {
        throw new Error('Invalid response format from AI service');
      }

      const telemetry = response.data.telemetry;
      return {
        vibes: response.data.top_keywords,
        roundTripMs: performance.now() - startedAt,
        ...(telemetry ? {
          telemetry: {
            ...(telemetry.model_state ? { modelState: telemetry.model_state } : {}),
            ...(typeof telemetry.input_bytes === "number" ? { inputBytes: telemetry.input_bytes } : {}),
            ...(telemetry.timing_ms ? { timingMs: telemetry.timing_ms } : {}),
            ...(telemetry.memory_mb ? { memoryMb: telemetry.memory_mb } : {}),
          },
        } : {}),
      };

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
          throw new Error('AI service did not respond. Please try again.');
        } else {
          throw new Error(`Request failed: ${axiosError.message}`);
        }
      }

      throw error;
    }
  }
}
