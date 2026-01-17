export interface IAIService {
  generateText(prompt: string): Promise<string>;
  matchMusicToImage(prompt: string, base64ImageFile: string): Promise<string>;
  analyzeResume(prompt: string, resumeText: string ): Promise<string>;
  // generateImage(prompt: string): Promise<string>;
  // generateAudio(prompt: string): Promise<string>;
}