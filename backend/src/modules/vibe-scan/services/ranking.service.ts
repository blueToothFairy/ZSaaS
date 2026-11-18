import { MusicPreference } from "../../profile/dto/music-taste.dto.js";
import { RetrievedCandidate } from "../../song/interfaces/song-search.interface.js";
import { UnifiedRecommendationProfile } from "./recommendation-query.service.js";
import { normalizeMusicGenre, normalizeMusicTerm } from "./music-taxonomy.js";

export interface RankedRecommendation extends RetrievedCandidate {
  score: number;
  componentScores: { contextFit: number | null; tasteFit: number | null; metadataQuality: number | null };
  reasons: string[];
}

export type RankingWeights = { contextFit: number; tasteFit: number; metadataQuality: number };
const DEFAULT_WEIGHTS: RankingWeights = { contextFit: 0.5, tasteFit: 0.4, metadataQuality: 0.1 };
const DEFAULT_DISLIKE_PENALTY = 0.75;

export default class RankingService {
  constructor(
    private readonly weights: RankingWeights = DEFAULT_WEIGHTS,
    private readonly dislikePenalty = DEFAULT_DISLIKE_PENALTY
  ) {
    if (Object.values(weights).some((value) => !Number.isFinite(value) || value < 0) || Object.values(weights).every((value) => value === 0)) throw new RangeError("Ranking weights must be finite, non-negative, and not all zero");
    if (!Number.isFinite(dislikePenalty) || dislikePenalty < 0) throw new RangeError("dislikePenalty must be a finite non-negative number");
  }

  rank(candidates: RetrievedCandidate[], profile: UnifiedRecommendationProfile, limit = 10): RankedRecommendation[] {
    const evaluated = candidates.flatMap((candidate) => {
      const track = candidate.track;
      const genre = track.primaryGenreName ? normalizeMusicGenre(track.primaryGenreName) : undefined;
      const artist = normalizeMusicTerm(track.artist);
      const exactTrack = profile.userTaste.some((p) => p.type === "track" && p.sentiment === "preferred" && p.provider === "itunes" && p.externalId === track.id);
      const favoriteArtist = profile.userTaste.find((p) => p.type === "artist" && p.sentiment === "preferred" && (normalizeMusicTerm(p.displayName) === artist || Boolean(p.provider === "itunes" && p.externalId && track.artistId && p.externalId === track.artistId)));
      const matchedPreferredGenre = profile.userTaste.find((p) => p.type === "genre" && p.sentiment === "preferred" && genre && normalizeMusicGenre(p.displayName) === genre);
      const preferredGenreQuery = profile.userTaste.find((p) => p.type === "genre" && p.sentiment === "preferred" && candidate.provenance.some((source) => (source.groups.includes("taste") || source.groups.includes("hybrid")) && normalizeMusicTerm(source.query).includes(normalizeMusicTerm(p.displayName))));
      const dislikedArtist = profile.userTaste.find((p) => p.type === "artist" && p.sentiment === "disliked" && (normalizeMusicTerm(p.displayName) === artist || Boolean(p.provider === "itunes" && p.externalId && track.artistId && p.externalId === track.artistId)));
      const dislikedGenre = profile.userTaste.find((p) => p.type === "genre" && p.sentiment === "disliked" && genre && normalizeMusicGenre(p.displayName) === genre);
      const hardExcluded = profile.userTaste.some((p) => p.hardExclude && p.sentiment === "disliked" && ((p.type === "artist" && (normalizeMusicTerm(p.displayName) === artist || Boolean(p.provider === "itunes" && p.externalId && track.artistId && p.externalId === track.artistId))) || (p.type === "genre" && genre && normalizeMusicGenre(p.displayName) === genre)));
      if (hardExcluded) return [];

      const contextGenreMatch = Boolean(genre && profile.visualContext.genres.some((contextGenre) => normalizeMusicGenre(contextGenre) === genre));
      const contextSource = candidate.provenance.find((source) => source.groups.includes("context") || source.groups.includes("hybrid"));
      const tasteSource = candidate.provenance.find((source) => source.groups.includes("taste") || source.groups.includes("hybrid"));
      const contextFit = contextGenreMatch ? 1 : contextSource ? 0.7 : undefined;
      const tasteFit = exactTrack ? 1 : favoriteArtist ? 0.9 : matchedPreferredGenre ? 0.65 : preferredGenreQuery ? 0.45 : tasteSource ? 0.35 : undefined;
      const metadataQuality = track.id && track.title && track.artist ? (track.primaryGenreName ? 1 : 0.8) : undefined;
      const componentScores = {
        contextFit: contextFit ?? null,
        tasteFit: tasteFit ?? null,
        metadataQuality: metadataQuality ?? null,
      };
      const components = (Object.entries(componentScores) as Array<[keyof RankingWeights, number | null]>).filter((entry): entry is [keyof RankingWeights, number] => entry[1] !== null);
      const totalWeight = components.reduce((sum, [name]) => sum + this.weights[name], 0);
      let score = components.reduce((sum, [name, value]) => sum + value * this.weights[name], 0) / (totalWeight || 1);
      const softDislike = Boolean(dislikedArtist || dislikedGenre);
      if (softDislike) score = Math.max(0, score - this.dislikePenalty);

      const reasons: string[] = [];
      if (exactTrack) reasons.push("Matches a track you selected as a favorite");
      else if (favoriteArtist) reasons.push(`Matches your favorite artist ${favoriteArtist.displayName}`);
      if (matchedPreferredGenre) reasons.push(`Matches your preferred ${matchedPreferredGenre.displayName} genre`);
      else if (preferredGenreQuery) reasons.push(`Found through a query for your preferred ${preferredGenreQuery.displayName} genre`);
      else if (tasteSource && !exactTrack && !favoriteArtist) reasons.push("Found through a search based on your saved music preferences");
      if (contextSource) reasons.push(`Found through a search derived from your ${profile.visualContext.moods[0] ?? "image"} visual context`);
      if (dislikedArtist) reasons.push(`Ranked lower because you marked ${dislikedArtist.displayName} as disliked`);
      else if (dislikedGenre) reasons.push(`Ranked lower because you marked ${dislikedGenre.displayName} as disliked`);
      if (reasons.length === 0) reasons.push("Returned in the results from a search generated for this recommendation");

      return [{ ...candidate, score, componentScores, reasons, _genre: genre ?? "" }];
    });

    evaluated.sort((a, b) => b.score - a.score || a.track.title.localeCompare(b.track.title) || a.track.artist.localeCompare(b.track.artist) || a.track.id.localeCompare(b.track.id));
    return this.diversify(evaluated, limit).map(({ _genre: _g, ...item }) => item);
  }

  private diversify<T extends RankedRecommendation & { _genre: string }>(items: T[], limit: number): T[] {
    const selected: T[] = [];
    const deferred: T[] = [];
    const artists = new Map<string, number>();
    const genres = new Map<string, number>();
    for (const item of items) {
      const artist = normalizeMusicTerm(item.track.artist);
      const artistCount = artists.get(artist) ?? 0;
      const genreCount = item._genre ? genres.get(item._genre) ?? 0 : 0;
      if (artistCount >= 2 || (item._genre && genreCount >= 4)) { deferred.push(item); continue; }
      selected.push(item);
      artists.set(artist, artistCount + 1);
      if (item._genre) genres.set(item._genre, genreCount + 1);
      if (selected.length >= limit) return selected;
    }
    for (const item of deferred) {
      if (selected.length >= limit) break;
      selected.push(item);
    }
    return selected;
  }
}
