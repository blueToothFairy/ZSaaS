import FormData from "form-data";
import IAIVibeScanner from "../interfaces/ai-scanner.interface.js";
import ISongSearch from "../../song/interfaces/song-search.interface.js";
import AIRepository from "../interfaces/ai-output-repo.interface.js";
import { RetrievedCandidate } from "../../song/interfaces/song-search.interface.js";
import MusicTasteService from "../../profile/services/music-taste.service.js";
import RecommendationQueryService, { UnifiedRecommendationProfile } from "./recommendation-query.service.js";
import RankingService, { RankedRecommendation } from "./ranking.service.js";
import { mapVisualContext } from "./music-taxonomy.js";
import { PermanentVibeScanError } from "../vibe-scan.errors.js";

export class MusicTasteSetupRequiredError extends PermanentVibeScanError {
  constructor() { super('MUSIC_TASTE_REQUIRED', "Set up your music taste before requesting personalized recommendations"); }
}

export default class VibeScannerService {
  constructor(
    private readonly vibeService: IAIVibeScanner,
    private readonly songSearch: ISongSearch,
    private readonly aiRepo: AIRepository,
    private readonly musicTasteService: MusicTasteService,
    private readonly queryService: RecommendationQueryService = new RecommendationQueryService(),
    private readonly rankingService: RankingService = new RankingService()
  ) { }

  async getVibeMatchingSongs(
    userId: string,
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    country: string = "US",
    requestContext: { platform: string; contentType: string } = { platform: "unspecified", contentType: "unspecified" },
    onStage?: (stage: string) => Promise<void>,
    checkpoint?: { vibes?: Array<{ keyword: string; score: number }>; saveVibes?: (vibes: Array<{ keyword: string; score: number }>) => Promise<void> }
  ): Promise<RankedRecommendation[]> {
    const taste = await this.musicTasteService.getProfile(userId);
    if (!taste.qualifiesForRecommendations) throw new MusicTasteSetupRequiredError();

    let vibes = checkpoint?.vibes;
    if (!vibes) {
      await onStage?.('analyzing_image');
      const formData = new FormData();
      formData.append("file", buffer, { filename: originalName, contentType: mimeType });
      vibes = await this.vibeService.extractVibes(formData as any);
      await checkpoint?.saveVibes?.(vibes);
    }
    if (!vibes?.length) return [];

    const visualContext = mapVisualContext(vibes.slice(0, 8));
    const profile: UnifiedRecommendationProfile = {
      visualContext,
      userTaste: taste.preferences,
      preferredLanguages: taste.preferredLanguages,
      vocalPreference: taste.vocalPreference,
      requestContext,
    };
    const queries = this.queryService.generate(profile);
    await onStage?.('searching_tracks');
    const candidates: RetrievedCandidate[] = await this.songSearch.searchCandidates(queries, country, 3);
    await onStage?.('ranking');
    return this.rankingService.rank(candidates, profile, 10);
  }
}
