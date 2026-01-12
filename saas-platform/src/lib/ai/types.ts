export interface IAIService {
  generateText(prompt: string): Promise<string>;
  // generateImage(prompt: string): Promise<string>;
  // generateAudio(prompt: string): Promise<string>;
}