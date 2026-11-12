import FormData from "form-data";
import IAIVibeScanner from "../interfaces/ai-scanner.interface.js";
import ISongSearch from "../../song/interfaces/song-search.interface.js";
import AIRepository from "../interfaces/ai-output-repo.interface.js";
import { ClipTelemetry, Vibe } from "../interfaces/ai-scanner.interface.js";
import { RetrievedCandidate } from "../../song/interfaces/song-search.interface.js";
import MusicTasteService from "../../profile/services/music-taste.service.js";
import RecommendationQueryService, { UnifiedRecommendationProfile } from "./recommendation-query.service.js";
import RankingService, { RankedRecommendation } from "./ranking.service.js";
import { mapVisualContext } from "./music-taxonomy.js";

export class MusicTasteSetupRequiredError extends Error {
  constructor() { super("Set up your music taste before requesting personalized recommendations"); }
}

export interface EvaluationTraceStep {
  step: string;
  input: unknown;
  output: unknown;
  durationMs: number;
  memoryMb: { before: number; after: number };
  upstream?: ClipTelemetry;
}

export interface RecommendationEvaluationResult {
  recommendations: RankedRecommendation[];
  steps: EvaluationTraceStep[];
}

export default class VibeScannerService {
  constructor(
    private readonly vibeService: IAIVibeScanner,
    private readonly songSearch: ISongSearch,
    private readonly aiRepo: AIRepository
  ) { }

  async getVibeMatchingSongs(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    country: string = "US",
    requestContext: { platform: string; contentType: string } = { platform: "unspecified", contentType: "unspecified" }
  ) {
    return (await this.runPersonalized(userId, buffer, originalName, mimeType, country, requestContext, false)).recommendations;
  }

  async getVibeMatchingSongsWithEvaluation(
    userId: string,
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    country = "US",
    requestContext = { platform: "unspecified", contentType: "unspecified" }
  ): Promise<RecommendationEvaluationResult> {
    return this.runPersonalized(userId, buffer, originalName, mimeType, country, requestContext, true);
  }

  async getBaselineWithEvaluation(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    country = "US"
  ): Promise<{ songs: Awaited<ReturnType<ISongSearch["searchByKeywords"]>>["songs"]; steps: EvaluationTraceStep[] }> {
    const steps: EvaluationTraceStep[] = [];
    const formData = new FormData();
    formData.append("file", buffer, { filename: originalName, contentType: mimeType });
    const memoryBefore = this.getMemoryMb();
    const startedAt = performance.now();
    const clipResult: { vibes: Vibe[]; telemetry?: ClipTelemetry; roundTripMs: number } = this.vibeService.extractVibesWithTelemetry
      ? await this.vibeService.extractVibesWithTelemetry(formData as any)
      : { vibes: await this.vibeService.extractVibes(formData as any), roundTripMs: performance.now() - startedAt };
    steps.push({
      step: "clip_extraction",
      input: { fileName: originalName, mimeType, bytes: buffer.byteLength },
      output: clipResult.vibes,
      durationMs: clipResult.roundTripMs,
      memoryMb: { before: memoryBefore, after: this.getMemoryMb() },
      ...(clipResult.telemetry ? { upstream: clipResult.telemetry } : {}),
    });
    const keywords = clipResult.vibes.slice(0, 8).map((vibe) => vibe.keyword);
    const searchStartedAt = performance.now();
    const searchMemory = this.getMemoryMb();
    const search = this.songSearch.searchByKeywordsWithCandidates
      ? await this.songSearch.searchByKeywordsWithCandidates(keywords, 10, country, true)
      : { result: await this.songSearch.searchByKeywords(keywords, 10, country), candidates: [] };
    steps.push({
      step: "legacy_keyword_search",
      input: { keywords, country, limit: 10 },
      output: { query: search.result.query, totalResults: search.result.totalResults, candidates: search.candidates, songs: search.result.songs },
      durationMs: performance.now() - searchStartedAt,
      memoryMb: { before: searchMemory, after: this.getMemoryMb() },
    });
    return { songs: search.result.songs, steps };
  }

  private async runPersonalized(
    userId: string,
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    country: string,
    requestContext: { platform: string; contentType: string },
    collectEvaluation: boolean
  ): Promise<RecommendationEvaluationResult> {
    const steps: EvaluationTraceStep[] = [];
    const tasteMemory = this.getMemoryMb();
    const tasteStartedAt = performance.now();
    const taste = await this.musicTasteService.getProfile(userId);
    if (!taste.qualifiesForRecommendations) throw new MusicTasteSetupRequiredError();
    if (collectEvaluation) steps.push({
      step: "music_taste_load",
      input: { authenticatedUser: true },
      output: { preferenceCount: taste.preferences.length, preferredGenreCount: taste.preferences.filter((item) => item.type === "genre" && item.sentiment === "preferred").length, qualifiesForRecommendations: taste.qualifiesForRecommendations },
      durationMs: performance.now() - tasteStartedAt,
      memoryMb: { before: tasteMemory, after: this.getMemoryMb() },
    });

    // Prepare FormData
    const formData = new FormData();
    formData.append('file', buffer, {
      filename: originalName,
      contentType: mimeType,
    });

    // Extract vibes from image
    const clipMemory = this.getMemoryMb();
    const clipStartedAt = performance.now();
    const clipResult: { vibes: Vibe[]; telemetry?: ClipTelemetry; roundTripMs: number } = collectEvaluation && this.vibeService.extractVibesWithTelemetry
      ? await this.vibeService.extractVibesWithTelemetry(formData as any)
      : { vibes: await this.vibeService.extractVibes(formData as any), roundTripMs: performance.now() - clipStartedAt };
    const vibes = clipResult.vibes;
    if (collectEvaluation) steps.push({
      step: "clip_extraction",
      input: { fileName: originalName, mimeType, bytes: buffer.byteLength },
      output: vibes,
      durationMs: clipResult.roundTripMs,
      memoryMb: { before: clipMemory, after: this.getMemoryMb() },
      ...(clipResult.telemetry ? { upstream: clipResult.telemetry } : {}),
    });

    if (!vibes || vibes.length === 0) {
      return { recommendations: [], steps };
    }

    const normalizationStartedAt = performance.now();
    const normalizationMemory = this.getMemoryMb();
    const visualContext = mapVisualContext(vibes.slice(0, 8));
    if (collectEvaluation) steps.push({
      step: "context_normalization",
      input: vibes.slice(0, 8),
      output: visualContext,
      durationMs: performance.now() - normalizationStartedAt,
      memoryMb: { before: normalizationMemory, after: this.getMemoryMb() },
    });
    const profile: UnifiedRecommendationProfile = {
      visualContext,
      userTaste: taste.preferences,
      preferredLanguages: taste.preferredLanguages,
      vocalPreference: taste.vocalPreference,
      requestContext,
    };
    const queryStartedAt = performance.now();
    const queryMemory = this.getMemoryMb();
    const queries = this.queryService.generate(profile);
    if (collectEvaluation) steps.push({
      step: "query_generation",
      input: { moodCount: visualContext.moods.length, contextGenreCount: visualContext.genres.length, tastePreferenceCount: taste.preferences.length, requestContext },
      output: queries,
      durationMs: performance.now() - queryStartedAt,
      memoryMb: { before: queryMemory, after: this.getMemoryMb() },
    });
    const retrievalStartedAt = performance.now();
    const retrievalMemory = this.getMemoryMb();
    const candidates: RetrievedCandidate[] = await this.songSearch.searchCandidates(queries, country, 3);
    if (collectEvaluation) steps.push({
      step: "candidate_retrieval",
      input: { queryCount: queries.length, country, concurrency: 3 },
      output: { candidateCount: candidates.length, candidates },
      durationMs: performance.now() - retrievalStartedAt,
      memoryMb: { before: retrievalMemory, after: this.getMemoryMb() },
    });
    const rankingStartedAt = performance.now();
    const rankingMemory = this.getMemoryMb();
    const recommendations = this.rankingService.rank(candidates, profile, 10);
    if (collectEvaluation) steps.push({
      step: "personalized_ranking",
      input: { candidateCount: candidates.length, weights: { contextFit: 0.5, tasteFit: 0.4, metadataQuality: 0.1 } },
      output: recommendations,
      durationMs: performance.now() - rankingStartedAt,
      memoryMb: { before: rankingMemory, after: this.getMemoryMb() },
    });
    return { recommendations, steps };
  }

  private getMemoryMb(): number {
    return Number((process.memoryUsage().rss / 1024 / 1024).toFixed(3));
  }
}
