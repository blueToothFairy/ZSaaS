import assert from "node:assert/strict";
import { describe, it } from "node:test";
import MusicTasteService from "../../profile/services/music-taste.service.js";
import { IMusicTasteRepository } from "../../profile/interfaces/music-taste.interface.js";
import ISongSearch, { RecommendationQuery, RetrievedCandidate } from "../../song/interfaces/song-search.interface.js";
import IAIVibeScanner from "../interfaces/ai-scanner.interface.js";
import AIRepository from "../interfaces/ai-output-repo.interface.js";
import VibeScannerService from "./index.js";

describe("ISS-002 recommendation integration", () => {
  it("combines CLIP context, saved taste, candidate search, and ranking", async () => {
    const repository: IMusicTasteRepository = {
      getByUserId: async (userId) => {
        assert.equal(userId, "user-1");
        return [
          { id: "genre-indie", preference_type: "genre", sentiment: "preferred", value: "indie", normalized_value: "indie", display_name: "Indie", metadata: {}, hard_exclude: false },
          { id: "genre-jazz", preference_type: "genre", sentiment: "preferred", value: "jazz", normalized_value: "jazz", display_name: "Jazz", metadata: {}, hard_exclude: false },
        ];
      },
      getSettings: async () => ({ preferred_languages: ["en"], vocal_preference: "instrumental" }),
    };
    const musicTaste = new MusicTasteService(repository);
    let clipCallCount = 0;
    const clip: IAIVibeScanner = {
      extractVibes: async () => {
        clipCallCount += 1;
        return [{ keyword: "peaceful sunset", score: 0.91 }, { keyword: "warm evening", score: 0.76 }];
      },
    };

    let receivedQueries: RecommendationQuery[] = [];
    let receivedCountry: string | undefined;
    let receivedConcurrency: number | undefined;
    const search: ISongSearch = {
      searchSongs: async () => ({ songs: [], query: "", totalResults: 0 }),
      searchByKeywords: async () => ({ songs: [], query: "", totalResults: 0 }),
      searchCandidates: async (queries, country, concurrency) => {
        receivedQueries = queries;
        receivedCountry = country;
        receivedConcurrency = concurrency;
        const provenance = (group: "context" | "taste" | "hybrid"): RetrievedCandidate["provenance"] => {
          const query = queries.find((item) => item.groups.includes(group));
          return query ? [{ query: query.query, groups: query.groups }] : [];
        };
        return [
          {
            track: { id: "indie-track", title: "Indie Evening", artist: "Indie Artist", album: "Album", artwork: "", primaryGenreName: "Indie" },
            provenance: provenance("taste"),
          },
          {
            track: { id: "context-track", title: "Quiet Sunset", artist: "Ambient Artist", album: "Album", artwork: "", primaryGenreName: "Classical" },
            provenance: provenance("context"),
          },
        ];
      },
    };

    const service = new VibeScannerService(clip, search, {} as AIRepository, musicTaste);
    const recommendations = await service.getVibeMatchingSongs(
      "user-1",
      Buffer.from("image fixture"),
      "sunset.jpg",
      "image/jpeg",
      "CA",
      { platform: "instagram", contentType: "reel" },
    );

    assert.equal(clipCallCount, 1);
    assert.ok(receivedQueries.some((query) => query.groups.includes("context")));
    assert.ok(receivedQueries.some((query) => query.groups.includes("taste")));
    assert.equal(receivedCountry, "CA");
    assert.equal(receivedConcurrency, 3);
    assert.ok(recommendations.some((item) => item.track.id === "indie-track"));
    assert.ok(recommendations.some((item) => item.track.id === "context-track"));
    assert.equal(recommendations.find((item) => item.track.id === "indie-track")?.componentScores.tasteFit, 0.65);
  });

  it("stops before CLIP and catalog search when the taste profile is incomplete", async () => {
    const repository: IMusicTasteRepository = {
      getByUserId: async () => [],
      getSettings: async () => undefined,
    };
    let downstreamCalls = 0;
    const clip: IAIVibeScanner = { extractVibes: async () => { downstreamCalls += 1; return []; } };
    const search: ISongSearch = {
      searchSongs: async () => ({ songs: [], query: "", totalResults: 0 }),
      searchByKeywords: async () => ({ songs: [], query: "", totalResults: 0 }),
      searchCandidates: async () => { downstreamCalls += 1; return []; },
    };
    const service = new VibeScannerService(clip, search, {} as AIRepository, new MusicTasteService(repository));

    await assert.rejects(
      service.getVibeMatchingSongs("user-2", Buffer.from("image fixture"), "image.jpg", "image/jpeg"),
      /Set up your music taste/,
    );
    assert.equal(downstreamCalls, 0);
  });
});
