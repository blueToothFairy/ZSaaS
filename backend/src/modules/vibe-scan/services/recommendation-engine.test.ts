import assert from "node:assert/strict";
import { describe, it } from "node:test";
import MusicTasteService, { MusicTasteValidationError } from "../../profile/services/music-taste.service.js";
import { MusicPreference } from "../../profile/dto/music-taste.dto.js";
import { RetrievedCandidate } from "../../song/interfaces/song-search.interface.js";
import RecommendationQueryService, { UnifiedRecommendationProfile } from "./recommendation-query.service.js";
import RankingService from "./ranking.service.js";
import { mapVisualContext } from "./music-taxonomy.js";
import { resolveMusicGenre } from "../../../shared/music/music-taxonomy.js";
import ITunesSearchService from "../../song/services/itunes.search.service.js";

const preference = (type: MusicPreference["type"], value: string, sentiment: MusicPreference["sentiment"] = "preferred", extra: Partial<MusicPreference> = {}): MusicPreference => ({
  id: `${type}-${value}`, type, sentiment, value, normalizedValue: value.toLowerCase(), displayName: value, metadata: {}, hardExclude: false, ...extra,
});

const profile = (userTaste: MusicPreference[], keywords = ["peaceful sunset"]): UnifiedRecommendationProfile => ({
  visualContext: mapVisualContext(keywords.map((keyword) => ({ keyword, score: 0.8 }))),
  userTaste, preferredLanguages: [], vocalPreference: "any", requestContext: { platform: "instagram", contentType: "story" },
});

const candidate = (id: string, artist: string, genre: string, groups: Array<"context" | "taste" | "hybrid">): RetrievedCandidate => ({
  track: { id, title: `${genre} ${id}`, artist, album: "Fixture album", artwork: "fixture.jpg", primaryGenreName: genre },
  provenance: [{ query: `${genre} fixture`, groups }],
});

describe("Music taste profile", () => {
  it("qualifies with two distinct preferred genres or three favorite tracks", () => {
    const service = new MusicTasteService({} as never);
    assert.equal(service.qualifies([preference("genre", "Indie"), preference("genre", "Jazz")]), true);
    assert.equal(service.qualifies([preference("track", "1", "preferred", { provider: "itunes", externalId: "1", metadata: { artistName: "A" } }), preference("track", "2", "preferred", { provider: "itunes", externalId: "2", metadata: { artistName: "B" } }), preference("track", "3", "preferred", { provider: "itunes", externalId: "3", metadata: { artistName: "C" } })]), true);
    assert.equal(service.qualifies([preference("genre", "Indie", "disliked")]), false);
  });

  it("rejects duplicate/conflicting normalized preferences and invalid hard exclusions", async () => {
    const repository = { getByUserId: async () => [], getSettings: async () => undefined, replaceForUser: async () => [] };
    const service = new MusicTasteService(repository);
    const base = { preferredLanguages: [], vocalPreference: "any" as const };
    await assert.rejects(service.replaceProfile("user-a", { ...base, preferences: [preference("genre", "Indie Rock"), preference("genre", "Indie", "disliked")] }), MusicTasteValidationError);
    await assert.rejects(service.replaceProfile("user-a", { ...base, preferences: [preference("track", "Missing Artist Metadata", "preferred", { provider: "itunes", externalId: "1" })] }), MusicTasteValidationError);
  });
});

describe("Music taxonomy and hybrid query generation", () => {
  it("maps known moods and preserves unknown visual labels without inventing attributes", () => {
    const mapped = mapVisualContext([{ keyword: "peaceful sunset", score: 0.9 }, { keyword: "red umbrella", score: 0.4 }]);
    assert.deepEqual(mapped.moods, ["peaceful"]);
    assert.deepEqual(mapped.genres, ["classical", "electronic"]);
    assert.equal(mapped.keywords[1]?.keyword, "red umbrella");
    assert.equal(mapped.energy, "low");
    assert.equal(mapVisualContext([{ keyword: "red umbrella", score: 0.4 }]).energy, undefined);
  });

  it("resolves canonical genres, explicit aliases, word-boundary rules, and unknown labels", () => {
    assert.equal(resolveMusicGenre("Hip Hop"), "hip-hop");
    assert.equal(resolveMusicGenre("indie rock"), "indie");
    assert.equal(resolveMusicGenre("electronic music with techno"), "electronic");
    assert.equal(resolveMusicGenre("metallic sunset"), null);
  });

  it("creates bounded context, taste, and hybrid queries deterministically", () => {
    const service = new RecommendationQueryService();
    const input = profile([preference("genre", "Indie"), preference("artist", "Example Artist")]);
    const first = service.generate(input);
    assert.ok(first.some((item) => item.groups.includes("context")));
    assert.ok(first.some((item) => item.groups.includes("taste")));
    assert.ok(first.some((item) => item.groups.includes("hybrid")));
    assert.ok(first.length <= 9);
    assert.deepEqual(first, service.generate(input));
    const overlapping = service.generate(profile([preference("genre", "Indie")], ["Indie"])).find((item) => item.query === "indie");
    assert.deepEqual(overlapping?.groups, ["context", "taste"]);
    assert.equal(new RecommendationQueryService(2).generate(input).length, 2);
  });
});

describe("Personalized ranking", () => {
  it("changes ranking with music taste while context and intent stay fixed", () => {
    const engine = new RankingService();
    const candidates = [candidate("a", "Artist A", "Indie", ["context", "taste"]), candidate("b", "Artist B", "Electronic", ["context", "taste"]), candidate("c", "Artist C", "Ambient", ["context"])];
    const indie = engine.rank(candidates, profile([preference("genre", "Indie")], ["red umbrella"]), 3).map((item) => item.track.id);
    const electronic = engine.rank(candidates, profile([preference("genre", "Electronic")], ["red umbrella"]), 3).map((item) => item.track.id);
    assert.notDeepEqual(indie, electronic);
  });

  it("gives exact favorite tracks and known favorite artists stronger signals", () => {
    const engine = new RankingService();
    const favoriteTrack = preference("track", "fav-track", "preferred", { provider: "itunes", externalId: "fav-track", metadata: { artistName: "Artist A" } });
    const favoriteArtist = preference("artist", "artist-id", "preferred", { provider: "itunes", externalId: "artist-id", displayName: "Artist B" });
    const candidates = [
      { ...candidate("fav-track", "Artist A", "Indie", ["taste"]), track: { ...candidate("fav-track", "Artist A", "Indie", ["taste"]).track, id: "fav-track" } },
      { ...candidate("artist-track", "Artist B", "Indie", ["taste"]), track: { ...candidate("artist-track", "Artist B", "Indie", ["taste"]).track, artistId: "artist-id" } },
    ];
    const ranked = engine.rank(candidates, profile([favoriteTrack, favoriteArtist]), 2);
    assert.equal(ranked[0]?.track.id, "fav-track");
    assert.ok(ranked[0]?.reasons.some((reason) => reason.includes("favorite")));
    assert.ok((ranked[0]?.componentScores.tasteFit ?? 0) > (ranked[1]?.componentScores.tasteFit ?? 0));
  });

  it("penalizes soft dislikes, filters confirmed hard exclusions, and keeps unknown genres", () => {
    const engine = new RankingService();
    const candidates = [candidate("liked", "Artist A", "Indie", ["context"]), candidate("disliked", "Artist B", "Metal", ["context"]), { ...candidate("unknown", "Artist C", "Ambient", ["context"]), track: { id: "unknown", title: "Unknown genre", artist: "Artist C", album: "Fixture", artwork: "" } }];
    const soft = engine.rank(candidates, profile([preference("genre", "Metal", "disliked")]), 10);
    assert.ok((soft.find((item) => item.track.id === "disliked")?.score ?? 1) < (soft.find((item) => item.track.id === "liked")?.score ?? 0));
    const hard = engine.rank(candidates, profile([preference("genre", "Metal", "disliked", { hardExclude: true })]), 10);
    assert.equal(hard.some((item) => item.track.id === "disliked"), false);
    assert.equal(hard.some((item) => item.track.id === "unknown"), true);
    assert.equal(hard.find((item) => item.track.id === "unknown")?.componentScores.metadataQuality, 0.8);
    assert.equal(Object.hasOwn(hard.find((item) => item.track.id === "unknown")?.componentScores ?? {}, "intentFit"), false);
  });

  it("returns stable results and limits repeat artists when alternatives exist", () => {
    const engine = new RankingService();
    const candidates = [candidate("1", "Same Artist", "Indie", ["context"]), candidate("2", "Same Artist", "Indie", ["context"]), candidate("3", "Same Artist", "Indie", ["context"]), candidate("4", "Other Artist", "Pop", ["context"])];
    const taste = profile([preference("genre", "Indie")]);
    const first = engine.rank(candidates, taste, 4);
    const second = engine.rank(candidates, taste, 4);
    assert.deepEqual(first, second);
    assert.equal(first.slice(0, 3).filter((item) => item.track.artist === "Same Artist").length, 2);
  });
});

describe("iTunes candidate retrieval", () => {
  it("keeps successful candidates when one provider query fails", async () => {
    const service = new ITunesSearchService();
    (service as unknown as { fetchSongsForQuery: (query: string, limit: number, country: string) => Promise<Array<{ id: string; title: string; artist: string; album: string; artwork: string }>> }).fetchSongsForQuery = async (query) => {
      if (query === "failing query") throw new Error("provider unavailable");
      return [{ id: "survivor", title: "Survivor", artist: "Artist", album: "Album", artwork: "" }];
    };
    const results = await service.searchCandidates([
      { query: "failing query", groups: ["context"] },
      { query: "working query", groups: ["taste"] },
    ], "US", 2);
    assert.equal(results.length, 1);
    assert.equal(results[0]?.track.id, "survivor");
    assert.ok(results[0]?.provenance.some((entry) => entry.query === "working query"));
  });
  it("bounds concurrent provider calls and merges provenance for duplicate tracks", async () => {
    const service = new ITunesSearchService();
    let active = 0;
    let maxActive = 0;
    const fakeSearch = service as unknown as { fetchSongsForQuery: (query: string, limit: number, country: string) => Promise<Array<{ id: string; title: string; artist: string; album: string; artwork: string }>> };
    fakeSearch.fetchSongsForQuery = async (query) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 3));
      active -= 1;
      return [{ id: "track-1", title: "Fixture Track", artist: "Fixture Artist", album: "Fixture Album", artwork: "" }, { id: `track-${query}`, title: query, artist: "Other Artist", album: "Fixture Album", artwork: "" }];
    };
    const candidates = await service.searchCandidates(Array.from({ length: 20 }, (_, index) => ({ query: `query ${index}`, groups: [index % 2 ? "taste" as const : "context" as const] })), "US", 2);
    assert.ok(maxActive <= 2);
    const duplicate = candidates.find((item) => item.track.id === "track-1");
    assert.equal(duplicate?.provenance.length, 14);
  });
});
