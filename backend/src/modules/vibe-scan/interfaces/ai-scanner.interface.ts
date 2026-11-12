export interface Vibe {
  keyword: string,
  score: number
}

export interface ClipTelemetry {
  modelState?: string;
  inputBytes?: number;
  timingMs?: Record<string, number>;
  memoryMb?: { before?: number; after?: number; peak?: number };
}

export default interface IAIVibeScanner {
  extractVibes(data: FormData) : Promise<Vibe[]>;
  extractVibesWithTelemetry?(data: FormData): Promise<{ vibes: Vibe[]; telemetry?: ClipTelemetry; roundTripMs: number }>;
}
