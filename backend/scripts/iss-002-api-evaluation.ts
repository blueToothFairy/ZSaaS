import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { resolveMusicGenre } from "../src/shared/music/music-taxonomy.js";

interface EvaluationScenario {
  id: string;
  mood: string;
  contextGenres: string[];
  tasteGenres: string[];
  dislikedGenres: string[];
  favoriteArtists: string[];
  platform: string;
  contentType: string;
  image?: { path: string; description: string; sourceUrl: string; photographer?: string };
}
interface Dataset { version: string; scenarios: EvaluationScenario[]; }
interface ApiSong { id?: string; title?: string; artist?: string; primaryGenreName?: string; score?: number; }
interface SavedPreference { type: string; sentiment: string; value: string; displayName: string; provider?: string; externalId?: string; metadata?: Record<string, unknown>; hardExclude?: boolean; }
interface ApiResponse { success?: boolean; songs?: ApiSong[]; data?: { preferences: SavedPreference[]; preferredLanguages: string[]; vocalPreference: "instrumental" | "vocals" | "any" }; evaluation?: { steps: unknown[]; totalDurationMs: number }; code?: string; error?: string; }

const apiBase = (process.env.ISS002_API_BASE_URL ?? "http://localhost:5000").replace(/\/$/, "");
const token = process.env.ISS002_BEARER_TOKEN;
const evaluationKey = process.env.ISS002_EVALUATION_KEY;
const imagePath = process.env.ISS002_IMAGE_PATH;
const allowProfileMutation = process.env.ISS002_ALLOW_TEST_PROFILE_MUTATION === "true";
const datasetPath = resolve(process.env.ISS002_DATASET_PATH ?? "src/modules/vibe-scan/services/iss-002-evaluation.json");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputPath = resolve(process.env.ISS002_EVALUATION_OUTPUT ?? `artifacts/iss-002-api-evaluation-${timestamp}.json`);

if (!token || !evaluationKey || !allowProfileMutation) {
  throw new Error("Set ISS002_BEARER_TOKEN, ISS002_EVALUATION_KEY, and ISS002_ALLOW_TEST_PROFILE_MUTATION=true for a dedicated test account before running the API evaluation.");
}

const datasetText = await readFile(datasetPath, "utf8");
const dataset = JSON.parse(datasetText) as Dataset;
const images = new Map<string, { bytes: Buffer; sha256: string }>();
for (const scenario of dataset.scenarios) {
  const scenarioImagePath = scenario.image?.path ?? imagePath;
  if (!scenarioImagePath) throw new Error(`Scenario ${scenario.id} needs image.path or ISS002_IMAGE_PATH.`);
  const bytes = await readFile(resolve(scenarioImagePath));
  images.set(scenario.id, { bytes, sha256: createHash("sha256").update(bytes).digest("hex") });
}

async function requestJson(url: string, init: RequestInit): Promise<{ status: number; body: ApiResponse }> {
  const response = await fetch(url, init);
  const body = await response.json() as ApiResponse;
  if (!response.ok) throw new Error(`${init.method ?? "GET"} ${url} returned ${response.status}: ${body.error ?? body.code ?? "unknown error"}`);
  return { status: response.status, body };
}

async function runFlow(mode: "baseline" | "personalized", scenario: EvaluationScenario, image: Buffer): Promise<{ response: ApiResponse; durationMs: number }> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(image)], { type: "image/jpeg" }), "iss-002-evaluation.jpg");
  form.append("platform", scenario.platform);
  form.append("contentType", scenario.contentType);
  const startedAt = performance.now();
  const result = await requestJson(`${apiBase}/api/vibe-scan`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "x-iss002-evaluation-key": evaluationKey!, "x-iss002-evaluation-mode": mode },
    body: form,
  });
  return { response: result.body, durationMs: performance.now() - startedAt };
}

function scoreSongs(songs: ApiSong[], scenario: EvaluationScenario, candidatePool: ApiSong[] = songs) {
  const tasteGenres = new Set(scenario.tasteGenres.map(resolveMusicGenre).filter((genre): genre is NonNullable<ReturnType<typeof resolveMusicGenre>> => genre !== null));
  const dislikedGenres = new Set(scenario.dislikedGenres.map(resolveMusicGenre).filter((genre): genre is NonNullable<ReturnType<typeof resolveMusicGenre>> => genre !== null));
  const contextGenres = new Set(scenario.contextGenres.map(resolveMusicGenre).filter((genre): genre is NonNullable<ReturnType<typeof resolveMusicGenre>> => genre !== null));
  const grade = (song: ApiSong): number => {
    const genre = song.primaryGenreName ? resolveMusicGenre(song.primaryGenreName) : null;
    if (genre && dislikedGenres.has(genre)) return 0;
    if (scenario.favoriteArtists.some((artist) => artist.trim().toLocaleLowerCase("en-US") === song.artist?.trim().toLocaleLowerCase("en-US"))) return 3;
    const taste = Boolean(genre && tasteGenres.has(genre));
    const context = Boolean(genre && contextGenres.has(genre));
    return taste && context ? 3 : taste || context ? 2 : 0;
  };
  const grades = songs.slice(0, 10).map(grade);
  const ideal = candidatePool.map(grade).sort((a, b) => b - a).slice(0, 10);
  const dcg = (values: number[]) => values.reduce((sum, value, index) => sum + ((2 ** value - 1) / Math.log2(index + 2)), 0);
  const idcg = dcg(ideal);
  const uniqueArtists = new Set(songs.map((song) => song.artist?.trim().toLocaleLowerCase("en-US")).filter(Boolean));
  const uniqueGenres = new Set(songs.map((song) => song.primaryGenreName ? resolveMusicGenre(song.primaryGenreName) : null).filter(Boolean));
  const ids = songs.map((song) => song.id).filter(Boolean);
  const recommendationScores = songs.flatMap((song) => typeof song.score === "number" ? [song.score] : []);
  return {
    ndcgAt10: idcg ? dcg(grades) / idcg : 0,
    tasteCompatibility: songs.length ? songs.filter((song) => { const genre = song.primaryGenreName ? resolveMusicGenre(song.primaryGenreName) : null; return Boolean(genre && tasteGenres.has(genre)) || scenario.favoriteArtists.some((artist) => artist.trim().toLocaleLowerCase("en-US") === song.artist?.trim().toLocaleLowerCase("en-US")); }).length / songs.length : 0,
    contextCompatibility: songs.length ? songs.filter((song) => { const genre = song.primaryGenreName ? resolveMusicGenre(song.primaryGenreName) : null; return Boolean(genre && contextGenres.has(genre)); }).length / songs.length : 0,
    artistDiversity: uniqueArtists.size,
    genreDiversity: uniqueGenres.size,
    duplicateRate: songs.length ? (songs.length - new Set(ids).size) / songs.length : 0,
    candidateCount: songs.length,
    retrievedCandidateCount: candidatePool.length,
    candidateCoverage: candidatePool.length ? songs.length / candidatePool.length : 0,
    meanRecommendationScore: recommendationScores.length ? recommendationScores.reduce((sum, score) => sum + score, 0) / recommendationScores.length : 0,
  };
}

function getCandidatePool(response: ApiResponse): ApiSong[] {
  const steps = response.evaluation?.steps as Array<{ step?: string; output?: { candidates?: Array<{ track: ApiSong } | ApiSong> } }> | undefined;
  const personalizedCandidates = steps?.find((step) => step.step === "candidate_retrieval")?.output?.candidates;
  if (personalizedCandidates) return personalizedCandidates.map((candidate) => "track" in candidate ? candidate.track : candidate);
  const baselineCandidates = steps?.find((step) => step.step === "legacy_keyword_search")?.output?.candidates;
  return baselineCandidates?.filter((candidate): candidate is ApiSong => !("track" in candidate)) ?? response.songs ?? [];
}

function summarizeStages(mode: "baseline" | "personalized") {
  const stages = new Map<string, Array<{ duration: number; before: number; after: number; upstream?: { timingMs?: Record<string, number>; memoryMb?: { before?: number; after?: number; peak?: number } } }>>();
  for (const run of runs) {
    const trace = run[mode].evaluation?.steps as Array<{ step: string; durationMs: number; memoryMb: { before: number; after: number }; upstream?: { timingMs?: Record<string, number>; memoryMb?: { before?: number; after?: number; peak?: number } } }> | undefined;
    for (const step of trace ?? []) stages.set(step.step, [...(stages.get(step.step) ?? []), { duration: step.durationMs, before: step.memoryMb.before, after: step.memoryMb.after, ...(step.upstream ? { upstream: step.upstream } : {}) }]);
  }
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / (values.length || 1);
  return Object.fromEntries([...stages].map(([step, samples]) => [step, {
    samples: samples.length,
    meanDurationMs: mean(samples.map((sample) => sample.duration)),
    meanBackendMemoryBeforeMb: mean(samples.map((sample) => sample.before)),
    meanBackendMemoryAfterMb: mean(samples.map((sample) => sample.after)),
    meanClipTimingMs: Object.fromEntries(["decode", "preprocess", "inference", "keyword_ranking", "total"].map((key) => [key, mean(samples.flatMap((sample) => typeof sample.upstream?.timingMs?.[key] === "number" ? [sample.upstream.timingMs[key]!] : []))])),
    clipPeakMemoryMb: Math.max(0, ...samples.flatMap((sample) => typeof sample.upstream?.memoryMb?.peak === "number" ? [sample.upstream.memoryMb.peak] : [])),
  }]));
}

const originalProfile = (await requestJson(`${apiBase}/api/profile/music-taste`, {
  method: "GET",
  headers: { Authorization: `Bearer ${token}` },
})).body.data;
if (!originalProfile) throw new Error("Could not read the authenticated test account's existing music taste before evaluation.");

const runs: Array<Record<string, any>> = [];
try {
  for (const scenario of dataset.scenarios) {
    const preferences = [
      ...scenario.tasteGenres.map((genre) => ({ type: "genre", sentiment: "preferred", value: genre, displayName: genre })),
      ...scenario.dislikedGenres.map((genre) => ({ type: "genre", sentiment: "disliked", value: genre, displayName: genre })),
      ...scenario.favoriteArtists.map((artist) => ({ type: "artist", sentiment: "preferred", value: artist, displayName: artist })),
    ];
    await requestJson(`${apiBase}/api/profile/music-taste`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ preferences, preferredLanguages: [], vocalPreference: "any" }),
    });
    const scenarioImage = images.get(scenario.id);
    if (!scenarioImage) throw new Error(`Image bytes missing for scenario ${scenario.id}.`);
    const baseline = await runFlow("baseline", scenario, scenarioImage.bytes);
    const personalized = await runFlow("personalized", scenario, scenarioImage.bytes);
    runs.push({
      scenarioId: scenario.id,
      inputs: { mood: scenario.mood, contextGenres: scenario.contextGenres, tasteGenres: scenario.tasteGenres, dislikedGenres: scenario.dislikedGenres, favoriteArtists: scenario.favoriteArtists, platform: scenario.platform, contentType: scenario.contentType, image: { description: scenario.image?.description ?? "Image path supplied outside the scenario dataset.", sourceUrl: scenario.image?.sourceUrl ?? null, photographer: scenario.image?.photographer ?? null, sha256: scenarioImage.sha256 } },
      baseline: { durationMs: baseline.durationMs, metrics: scoreSongs(baseline.response.songs ?? [], scenario, getCandidatePool(baseline.response)), evaluation: baseline.response.evaluation },
      personalized: { durationMs: personalized.durationMs, metrics: scoreSongs(personalized.response.songs ?? [], scenario, getCandidatePool(personalized.response)), evaluation: personalized.response.evaluation },
    });
  }
} finally {
  await requestJson(`${apiBase}/api/profile/music-taste`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ preferences: originalProfile.preferences, preferredLanguages: originalProfile.preferredLanguages, vocalPreference: originalProfile.vocalPreference }),
  });
}

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / (values.length || 1);
const output = {
  evaluation: "iss-002-backend-clip-api-v1",
  datasetVersion: dataset.version,
  createdAt: new Date().toISOString(),
  apiBase,
  images: runs.map((run) => ({ scenarioId: run.scenarioId, ...run.inputs.image })),
  scenarioCount: runs.length,
  summaries: Object.fromEntries(["baseline", "personalized"].map((mode) => {
    const metrics = runs.map((run) => run[mode].metrics);
    return [mode, {
      meanNdcgAt10: mean(metrics.map((item) => item.ndcgAt10)),
      meanTasteCompatibility: mean(metrics.map((item) => item.tasteCompatibility)),
      meanContextCompatibility: mean(metrics.map((item) => item.contextCompatibility)),
      meanCandidateCount: mean(metrics.map((item) => item.candidateCount)),
      meanRetrievedCandidateCount: mean(metrics.map((item) => item.retrievedCandidateCount)),
      meanCandidateCoverage: mean(metrics.map((item) => item.candidateCoverage)),
      meanRecommendationScore: mean(metrics.map((item) => item.meanRecommendationScore)),
      meanArtistDiversity: mean(metrics.map((item) => item.artistDiversity)),
      meanGenreDiversity: mean(metrics.map((item) => item.genreDiversity)),
      maxDuplicateRate: Math.max(...metrics.map((item) => item.duplicateRate)),
      meanApiDurationMs: mean(runs.map((run) => run[mode].durationMs)),
      stages: summarizeStages(mode as "baseline" | "personalized"),
    }];
  })),
  rankingWeights: { contextFit: 0.5, tasteFit: 0.4, metadataQuality: 0.1 },
  runs,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(output, null, 2), "utf8");
console.log(JSON.stringify({ outputPath, scenarioCount: output.scenarioCount, summaries: output.summaries }, null, 2));
