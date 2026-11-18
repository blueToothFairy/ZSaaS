import { MusicPreference } from "../../profile/dto/music-taste.dto.js";
import { RecommendationQuery } from "../../song/interfaces/song-search.interface.js";
import { normalizeMusicTerm, VisualMusicContext } from "./music-taxonomy.js";

export interface UnifiedRecommendationProfile {
  visualContext: VisualMusicContext;
  userTaste: MusicPreference[];
  preferredLanguages: string[];
  vocalPreference: "instrumental" | "vocals" | "any";
  requestContext: { platform: string; contentType: string };
}

const MAX_QUERIES = 9;

export default class RecommendationQueryService {
  constructor(private readonly maxQueries = MAX_QUERIES) {
    if (!Number.isInteger(maxQueries) || maxQueries < 1) throw new RangeError("maxQueries must be a positive integer");
  }

  generate(profile: UnifiedRecommendationProfile): RecommendationQuery[] {
    const contextTerms = [...profile.visualContext.searchTerms, ...profile.visualContext.genres, ...profile.visualContext.keywords.map((item) => item.keyword)].slice(0, 3);
    const tasteGenres = profile.userTaste.filter((p) => p.type === "genre" && p.sentiment === "preferred").map((p) => p.displayName).slice(0, 3);
    const artists = profile.userTaste.filter((p) => p.type === "artist" && p.sentiment === "preferred").map((p) => p.displayName).slice(0, 2);
    const favoriteTrack = profile.userTaste.find((p) => p.type === "track" && p.sentiment === "preferred");
    const vocalTerm = profile.vocalPreference === "any" ? "" : profile.vocalPreference;
    const favoriteTrackTerm = favoriteTrack ? `${favoriteTrack.displayName} ${favoriteTrack.metadata?.artistName ?? ""}`.trim() : undefined;
    const tasteTerms = [favoriteTrackTerm, artists[0], tasteGenres[0] ? `${tasteGenres[0]} ${vocalTerm}`.trim() : undefined, profile.preferredLanguages[0] ? `${profile.preferredLanguages[0]} music` : undefined, artists[1], tasteGenres[1] ? `${tasteGenres[1]} ${vocalTerm}`.trim() : undefined].filter((term): term is string => Boolean(term)).slice(0, 3);
    const contextQueries: RecommendationQuery[] = [];
    const tasteQueries: RecommendationQuery[] = [];
    const hybridQueries: RecommendationQuery[] = [];
    const add = (target: RecommendationQuery[], query: string, group: RecommendationQuery["groups"][number]) => {
      const normalized = normalizeMusicTerm(query);
      if (normalized) target.push({ query: normalized, groups: [group] });
    };
    contextTerms.forEach((term) => add(contextQueries, term, "context"));
    tasteTerms.forEach((term) => add(tasteQueries, term, "taste"));
    const hybridTaste = tasteTerms[0] ?? artists[0] ?? tasteGenres[0];
    for (const context of contextTerms.slice(0, 2)) {
      const requestTerms = [profile.requestContext.contentType, profile.requestContext.platform].filter((value) => value && value !== "unspecified");
      if (hybridTaste) add(hybridQueries, [context, hybridTaste, ...requestTerms].filter(Boolean).join(" "), "hybrid");
    }

    const merged = new Map<string, RecommendationQuery>();
    for (const item of [...contextQueries, ...tasteQueries, ...hybridQueries]) {
      const key = normalizeMusicTerm(item.query);
      const existing = merged.get(key);
      if (existing) existing.groups = [...new Set([...existing.groups, ...item.groups])];
      else merged.set(key, item);
    }
    return [...merged.values()].slice(0, this.maxQueries);
  }
}
