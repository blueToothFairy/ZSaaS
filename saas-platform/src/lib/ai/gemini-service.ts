import { GoogleGenAI } from "@google/genai";
import { IAIService } from "./types";

export class GeminiService implements IAIService {
  private client: GoogleGenAI;
  private modelName: string;

  constructor(apiKey: string, modelName: string = "gemini-1.5-flash") {
    this.client = new GoogleGenAI({ apiKey });
    this.modelName = modelName;
  }

  async generateText(prompt: string): Promise<string> {
    const maxRetries = 5;
    const retryDelay = 1000; // 1 second
    let attempt = 0;
    try {
      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingBudget: 0, // Disables thinking
          },
        },
      });
      if (!response || !response.text) {
        throw new Error(`Empty response when generate text using ${this.modelName}`);
      }
      return response.text;
    } catch (error) {
      attempt++;
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (errorMsg.includes("503") || errorMsg.includes("overloaded")) {
        console.warn(`Model overloaded. Retrying... (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      } else {
        throw new Error(`Error occurs when generate text using ${this.modelName}: `, error!);
      }
    }
  }

  async matchMusicToImage(prompt: string, base64ImageFile: string): Promise<string> {
    const mimeType = "image/jpeg";
    const maxRetries = 5;
    const retryDelay = 1000; // 1 second
    let attempt = 0;
    try {
      const contents = [
        {
          inlineData: {
            mimeType,
            data: base64ImageFile,
          }
        },
        {
          text: prompt
        }
      ];
      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
      });
      if (!response || !response.text) {
        throw new Error(`Empty response when matching music to image using ${this.modelName}`);
      }
      return response.text;
    } catch (error) {
      attempt++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes("503") || errorMsg.includes("overloaded")) {
        console.warn(`Model overloaded. Retrying... (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      } else {
        throw new Error(`Error occurs when matching music to image using ${this.modelName}: `, error!);
      }
    }
  }

  async analyzeResume(prompt: string, resumeText: string): Promise<string> {
    const maxRetries = 5;
    const retryDelay = 1000;
    let attempt = 0;
    try {
      const contents = prompt + "\n\n" + resumeText;
      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          thinkingConfig: {
            thinkingBudget: 0, // Disables thinking
          },
        },
      });
      if (!response || !response.text) {
        throw new Error(`Empty response when generate text using ${this.modelName}`);
      }
      return response.text;
    } catch (error) {
      attempt++;
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (errorMsg.includes("503") || errorMsg.includes("overloaded")) {
        console.warn(`Model overloaded. Retrying... (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      } else {
        throw new Error(`Error occurs when generate text using ${this.modelName}: `, error!);
      }
    }
  }
}