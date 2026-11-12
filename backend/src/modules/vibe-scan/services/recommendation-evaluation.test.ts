import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { MusicPreference } from "../../profile/dto/music-taste.dto.js";
import { RetrievedCandidate } from "../../song/interfaces/song-search.interface.js";
import RankingService from "./ranking.service.js";
import RecommendationQueryService, { UnifiedRecommendationProfile } from "./recommendation-query.service.js";

interface EvaluationScenario {
  id: string;
  mood: string;
  contextGenres: string[];
  tasteGenres: string[];
  dislikedGenres: string[];
  favoriteArtists: string[];
  platform: string;
  contentType: string;
}
interface CatalogTrack { id: string; title: string; artist: string; genre: string; moods: string[]; }
interface EvaluationDataset { version: string; catalog: CatalogTrack[]; scenarios: EvaluationScenario[]; }
const dataset = JSON.parse(readFileSync(new URL("./iss-002-evaluation.json", import.meta.url), "utf8")) as EvaluationDataset;

const normalize = (value: string) => value.trim().toLowerCase();
const makePreference = (type: MusicPreference["type"], value: string, sentiment: MusicPreference["sentiment"] = "preferred"): MusicPreference => ({ id: `${type}-${value}`, type, sentiment, value, normalizedValue: normalize(value), displayName: value, metadata: {}, hardExclude: false });

function makeProfile(scenario: EvaluationScenario): UnifiedRecommendationProfile {
  const userTaste = [
    ...scenario.tasteGenres.map((genre) => makePreference("genre", genre)),
    ...scenario.dislikedGenres.map((genre) => makePreference("genre", genre, "disliked")),
    ...scenario.favoriteArtists.map((artist) => makePreference("artist", artist)),
  ];
  return {
    visualContext: { keywords: [{ keyword: scenario.mood, score: 1 }], moods: [scenario.mood], genres: scenario.contextGenres, searchTerms: [scenario.mood] },
    userTaste, preferredLanguages: [], vocalPreference: "any", requestContext: { platform: scenario.platform, contentType: scenario.contentType },
  };
}

function makeCandidates(scenario: EvaluationScenario, catalog: CatalogTrack[]): RetrievedCandidate[] {
  return catalog.flatMap((track) => {
    const contextMatch = scenario.contextGenres.some((genre) => normalize(genre) === normalize(track.genre)) || track.moods.includes(scenario.mood);
    const tasteMatch = scenario.tasteGenres.some((genre) => normalize(genre) === normalize(track.genre)) || scenario.favoriteArtists.some((artist) => normalize(artist) === normalize(track.artist));
    if (!contextMatch && !tasteMatch) return [];
    const groups: Array<"context" | "taste" | "hybrid"> = [];
    if (contextMatch) groups.push("context");
    if (tasteMatch) groups.push("taste");
    if (contextMatch && tasteMatch) groups.push("hybrid");
    return [{ track: { id: track.id, title: track.title, artist: track.artist, album: "Evaluation fixture", artwork: "fixture.jpg", primaryGenreName: track.genre }, provenance: [{ query: `${scenario.mood} ${track.genre}`, groups }] }];
  });
}

function relevance(scenario: EvaluationScenario, track: CatalogTrack): number {
  if (scenario.dislikedGenres.some((genre) => normalize(genre) === normalize(track.genre))) return 0;
  if (scenario.favoriteArtists.some((artist) => normalize(artist) === normalize(track.artist))) return 3;
  const taste = scenario.tasteGenres.some((genre) => normalize(genre) === normalize(track.genre));
  const context = scenario.contextGenres.some((genre) => normalize(genre) === normalize(track.genre)) || track.moods.includes(scenario.mood);
  return taste && context ? 3 : taste || context ? 2 : 0;
}

function ndcg(ids: string[], scenario: EvaluationScenario): number {
  const judgment = new Map(dataset.catalog.map((track) => [track.id, relevance(scenario, track)]));
  const dcg = ids.slice(0, 10).reduce((sum, id, index) => sum + ((2 ** (judgment.get(id) ?? 0) - 1) / Math.log2(index + 2)), 0);
  const ideal = [...judgment.values()].sort((a, b) => b - a).slice(0, 10).reduce((sum, grade, index) => sum + ((2 ** grade - 1) / Math.log2(index + 2)), 0);
  return ideal ? dcg / ideal : 0;
}

function summarize(ids: string[], catalog: CatalogTrack[], scenario: EvaluationScenario) {
  const byId = new Map(catalog.map((track) => [track.id, track]));
  const tracks = ids.flatMap((id) => byId.has(id) ? [byId.get(id)!] : []);
  const denominator = tracks.length || 1;
  return {
    tasteCompatibility: tracks.filter((track) => scenario.tasteGenres.some((genre) => normalize(genre) === normalize(track.genre)) || scenario.favoriteArtists.some((artist) => normalize(artist) === normalize(track.artist))).length / denominator,
    contextCompatibility: tracks.filter((track) => scenario.contextGenres.some((genre) => normalize(genre) === normalize(track.genre)) || track.moods.includes(scenario.mood)).length / denominator,
    artistDiversity: new Set(tracks.map((track) => track.artist)).size,
    genreDiversity: new Set(tracks.map((track) => track.genre)).size,
    duplicateRate: tracks.length ? (tracks.length - new Set(tracks.map((track) => track.id)).size) / tracks.length : 0,
  };
}

describe("ISS-002 fixed recommendation evaluation", () => {
  it("compares context-only baseline with personalized ranking over all fixed scenarios", () => {
    const ranking = new RankingService();
    const queryService = new RecommendationQueryService();
    const results = dataset.scenarios.map((scenario) => {
      const profile = makeProfile(scenario);
      assert.ok(queryService.generate(profile).length > 0);
      const candidates = makeCandidates(scenario, dataset.catalog);
      const baseline = candidates.filter((candidate) => candidate.provenance.some((source) => source.groups.includes("context"))).sort((a, b) => {
        const leftTrack = dataset.catalog.find((track) => track.id === a.track.id);
        const rightTrack = dataset.catalog.find((track) => track.id === b.track.id);
        const left = scenario.contextGenres.some((genre) => normalize(genre) === normalize(a.track.primaryGenreName ?? "")) || Boolean(leftTrack?.moods.includes(scenario.mood)) ? 1 : 0;
        const right = scenario.contextGenres.some((genre) => normalize(genre) === normalize(b.track.primaryGenreName ?? "")) || Boolean(rightTrack?.moods.includes(scenario.mood)) ? 1 : 0;
        return right - left || a.track.title.localeCompare(b.track.title);
      }).map((candidate) => candidate.track.id);
      const improved = ranking.rank(candidates, profile, 10).map((candidate) => candidate.track.id);
      return {
        scenarioId: scenario.id,
        baselineNdcg: ndcg(baseline, scenario),
        improvedNdcg: ndcg(improved, scenario),
        baseline: summarize(baseline, dataset.catalog, scenario),
        improved: summarize(improved, dataset.catalog, scenario),
        candidateCoverage: candidates.length / dataset.catalog.length,
      };
    });
    const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / (values.length || 1);
    const report = {
      datasetVersion: dataset.version,
      scenarioCount: results.length,
      baselineMeanNdcgAt10: mean(results.map((item) => item.baselineNdcg)),
      improvedMeanNdcgAt10: mean(results.map((item) => item.improvedNdcg)),
      baselineTasteCompatibility: mean(results.map((item) => item.baseline.tasteCompatibility)),
      improvedTasteCompatibility: mean(results.map((item) => item.improved.tasteCompatibility)),
      baselineContextCompatibility: mean(results.map((item) => item.baseline.contextCompatibility)),
      improvedContextCompatibility: mean(results.map((item) => item.improved.contextCompatibility)),
      meanCandidateCoverage: mean(results.map((item) => item.candidateCoverage)),
      meanArtistDiversity: mean(results.map((item) => item.improved.artistDiversity)),
      meanGenreDiversity: mean(results.map((item) => item.improved.genreDiversity)),
      maxDuplicateRate: Math.max(...results.map((item) => item.improved.duplicateRate)),
    };
    console.log("ISS-002 evaluation", JSON.stringify(report));
    assert.equal(results.length, 20);
    assert.ok(results.every((item) => Number.isFinite(item.improvedNdcg)));
  });
});
