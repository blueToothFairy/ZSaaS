export interface Vibe {
  keyword: string,
  score: number
}

export default interface IAIVibeScanner {
  extractVibes(data: FormData) : Promise<Vibe[]>;
}