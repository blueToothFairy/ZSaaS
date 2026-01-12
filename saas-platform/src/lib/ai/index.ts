import { GeminiService } from "./gemini-service";

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  throw new Error('GOOGLE KEY NOT FOUND');
}

export const singletonGeminiService = new GeminiService(
  apiKey,
);