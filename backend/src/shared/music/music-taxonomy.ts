export type CanonicalGenre =
  | "pop"
  | "rock"
  | "indie"
  | "electronic"
  | "hip-hop"
  | "r&b"
  | "jazz"
  | "classical"
  | "metal"
  | "folk"
  | "other";

export interface MusicVibe {
  keyword: string;
  score: number;
}

export interface VisualMusicContext {
  keywords: MusicVibe[];
  moods: string[];
  genres: string[];
  energy?: "low" | "medium" | "high";
  searchTerms: string[];
}

export function normalizeMusicTerm(value: string): string {
  return value.trim().normalize("NFKC").replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

const CANONICAL_GENRES = new Set<CanonicalGenre>([
  "pop", "rock", "indie", "electronic", "hip-hop", "r&b", "jazz", "classical", "metal", "folk", "other",
]);

const GENRE_ALIASES = new Map<string, CanonicalGenre>([
  ["alternative", "rock"], ["alternative rock", "rock"], ["alt rock", "rock"], ["indie rock", "indie"],
  ["indie pop", "indie"], ["indie folk", "indie"], ["independent", "indie"], ["punk", "rock"],
  ["punk rock", "rock"], ["classic rock", "rock"], ["hard rock", "rock"], ["grunge", "rock"],
  ["progressive rock", "rock"], ["post-rock", "rock"], ["garage rock", "rock"],
  ["dance", "electronic"], ["dance music", "electronic"], ["dance/electronic", "electronic"],
  ["drum and bass", "electronic"], ["industrial", "electronic"],
  ["edm", "electronic"], ["techno", "electronic"], ["house", "electronic"], ["ambient", "electronic"],
  ["synthwave", "electronic"], ["electronica", "electronic"], ["trance", "electronic"], ["dubstep", "electronic"],
  ["hip hop", "hip-hop"], ["hip hop/rap", "hip-hop"], ["hip-hop/rap", "hip-hop"], ["rap", "hip-hop"],
  ["trap", "hip-hop"], ["r&b/soul", "r&b"], ["rnb", "r&b"], ["r & b", "r&b"], ["rhythm and blues", "r&b"],
  ["soul", "r&b"], ["funk", "r&b"], ["blues", "r&b"], ["disco", "r&b"],
  ["swing", "jazz"], ["bebop", "jazz"], ["smooth jazz", "jazz"], ["dance pop", "pop"], ["k-pop", "pop"],
  ["latin", "other"], ["reggae", "other"], ["heavy metal", "metal"], ["death metal", "metal"],
  ["black metal", "metal"], ["metalcore", "metal"], ["orchestral", "classical"], ["opera", "classical"],
  ["soundtrack", "classical"], ["instrumental", "classical"], ["acoustic", "folk"], ["country", "folk"],
  ["bluegrass", "folk"], ["singer songwriter", "folk"], ["lofi", "other"], ["lo-fi", "other"],
  ["world", "other"], ["new age", "other"], ["spoken word", "other"],
]);

const GENRE_RULES: Array<{ genre: CanonicalGenre; test: (value: string) => boolean }> = [
  { genre: "indie", test: (value) => /\bindie\b/.test(value) },
  { genre: "metal", test: (value) => /\bmetal\b/.test(value) },
  { genre: "electronic", test: (value) => /\b(electronic|edm|techno|house|ambient|synthwave|trance|dubstep)\b/.test(value) },
  { genre: "hip-hop", test: (value) => /\b(hip[ -]?hop|rap|trap)\b/.test(value) },
  { genre: "r&b", test: (value) => /\b(r&b|rnb|soul|funk)\b/.test(value) },
  { genre: "classical", test: (value) => /\b(classical|orchestral|opera|soundtrack|instrumental)\b/.test(value) },
  { genre: "folk", test: (value) => /\b(folk|acoustic|country|bluegrass)\b/.test(value) },
  { genre: "jazz", test: (value) => /\bjazz\b/.test(value) },
  { genre: "rock", test: (value) => /\b(rock|punk|grunge)\b/.test(value) },
  { genre: "pop", test: (value) => /\bpop\b/.test(value) },
];

export function resolveMusicGenre(value: string): CanonicalGenre | null {
  const normalized = normalizeMusicTerm(value);
  if (CANONICAL_GENRES.has(normalized as CanonicalGenre)) return normalized as CanonicalGenre;
  const aliasMatch = GENRE_ALIASES.get(normalized);
  if (aliasMatch) return aliasMatch;
  for (const rule of GENRE_RULES) if (rule.test(normalized)) return rule.genre;
  return null;
}

/** Compatibility helper for places that need a stable identity for unknown labels too. */
export function normalizeMusicGenre(value: string): string {
  return resolveMusicGenre(value) ?? normalizeMusicTerm(value);
}

type MoodMapping = { moods: string[]; genres: CanonicalGenre[]; energy?: "low" | "medium" | "high"; terms: string[] };

export const MOOD_MAP: Readonly<Record<string, MoodMapping>> = {
  happy: { moods: ["joyful"], genres: ["pop", "r&b"], energy: "high", terms: ["upbeat pop", "feel good soul"] },
  uplifting: { moods: ["joyful"], genres: ["pop", "electronic"], energy: "high", terms: ["uplifting pop", "feel good electronic"] },
  sad: { moods: ["melancholic"], genres: ["indie", "folk"], energy: "low", terms: ["melancholic indie", "sad acoustic"] },
  melancholic: { moods: ["melancholic"], genres: ["indie", "folk"], energy: "low", terms: ["melancholic indie", "melancholic folk"] },
  lonely: { moods: ["melancholic"], genres: ["indie", "folk"], energy: "low", terms: ["lonely indie", "introspective folk"] },
  nostalgic: { moods: ["nostalgic"], genres: ["indie", "folk"], energy: "low", terms: ["nostalgic indie", "nostalgic acoustic"] },
  romantic: { moods: ["romantic"], genres: ["pop", "r&b"], energy: "medium", terms: ["romantic pop", "romantic soul"] },
  peaceful: { moods: ["peaceful"], genres: ["classical", "electronic"], energy: "low", terms: ["peaceful ambient", "calm instrumental"] },
  calm: { moods: ["peaceful"], genres: ["classical", "folk"], energy: "low", terms: ["calm instrumental", "calm acoustic"] },
  chill: { moods: ["relaxed"], genres: ["electronic", "jazz"], energy: "low", terms: ["chill electronic", "chill jazz"] },
  dreamy: { moods: ["dreamy"], genres: ["electronic", "indie"], energy: "low", terms: ["dreamy ambient", "dream pop"] },
  mysterious: { moods: ["mysterious"], genres: ["electronic", "jazz"], energy: "medium", terms: ["mysterious electronic", "dark jazz"] },
  dark: { moods: ["dark"], genres: ["metal", "rock"], energy: "medium", terms: ["dark metal", "dark rock"] },
  angry: { moods: ["intense"], genres: ["metal", "rock"], energy: "high", terms: ["intense metal", "angry rock"] },
  intense: { moods: ["intense"], genres: ["metal", "electronic"], energy: "high", terms: ["intense metal", "intense electronic"] },
  epic: { moods: ["epic"], genres: ["classical", "metal"], energy: "high", terms: ["epic orchestral", "epic metal"] },
  energetic: { moods: ["energetic"], genres: ["pop", "electronic"], energy: "high", terms: ["upbeat pop", "energetic electronic"] },
  hopeful: { moods: ["hopeful"], genres: ["pop", "folk"], energy: "medium", terms: ["hopeful pop", "uplifting folk"] },
  anxious: { moods: ["tense"], genres: ["electronic", "rock"], energy: "high", terms: ["tense electronic", "intense rock"] },
};

const CONTEXT_MAP: Readonly<Record<string, MoodMapping>> = {
  rainy: { moods: ["melancholic"], genres: ["indie", "jazz"], energy: "low", terms: ["rainy day indie", "rainy day jazz"] },
  stormy: { moods: ["intense"], genres: ["rock", "metal"], energy: "high", terms: ["stormy rock", "intense metal"] },
  thunder: { moods: ["intense"], genres: ["rock", "metal"], energy: "high", terms: ["dramatic rock", "epic metal"] },
  lightning: { moods: ["intense"], genres: ["electronic", "rock"], energy: "high", terms: ["intense electronic", "dramatic rock"] },
  drizzle: { moods: ["peaceful"], genres: ["jazz", "folk"], energy: "low", terms: ["soft rainy jazz", "gentle acoustic"] },
  snowy: { moods: ["peaceful"], genres: ["classical", "folk"], energy: "low", terms: ["snowy ambient", "winter instrumental"] },
  cloudy: { moods: ["introspective"], genres: ["indie", "jazz"], energy: "low", terms: ["cloudy day indie", "overcast jazz"] },
  windy: { moods: ["vast"], genres: ["folk", "rock"], energy: "medium", terms: ["windy folk", "open sky rock"] },
  foggy: { moods: ["mysterious"], genres: ["electronic", "jazz"], energy: "low", terms: ["foggy ambient", "mysterious jazz"] },
  misty: { moods: ["dreamy"], genres: ["electronic", "classical"], energy: "low", terms: ["misty ambient", "dreamy instrumental"] },
  humid: { moods: ["dreamy"], genres: ["electronic", "r&b"], energy: "medium", terms: ["humid night electronic", "warm soul"] },
  icy: { moods: ["dark"], genres: ["electronic", "classical"], energy: "low", terms: ["icy ambient", "cold instrumental"] },
  heatwave: { moods: ["energetic"], genres: ["pop", "electronic"], energy: "high", terms: ["summer pop", "heatwave dance"] },
  sunny: { moods: ["joyful"], genres: ["pop", "folk"], energy: "high", terms: ["sunny pop", "sunny acoustic"] },
  breeze: { moods: ["peaceful"], genres: ["folk", "classical"], energy: "low", terms: ["gentle acoustic", "peaceful instrumental"] },
  "sunset beach": { moods: ["nostalgic", "romantic"], genres: ["indie", "pop"], energy: "medium", terms: ["sunset indie", "romantic pop"] },
  "late night city": { moods: ["mysterious", "relaxed"], genres: ["electronic", "jazz"], energy: "low", terms: ["late night electronic", "city night jazz"] },
  "forest morning": { moods: ["peaceful", "hopeful"], genres: ["folk", "classical"], energy: "low", terms: ["forest folk", "peaceful instrumental"] },
  "rainy window": { moods: ["melancholic", "peaceful"], genres: ["indie", "jazz"], energy: "low", terms: ["rainy window indie", "rainy night jazz"] },
  "mountain sunrise": { moods: ["hopeful", "epic"], genres: ["classical", "rock"], energy: "high", terms: ["inspiring orchestral", "epic rock"] },
  "neon city": { moods: ["mysterious"], genres: ["electronic", "rock"], energy: "medium", terms: ["neon electronic", "neon city synthwave"] },
  "cyberpunk alley": { moods: ["dark", "mysterious"], genres: ["electronic", "metal"], energy: "high", terms: ["cyberpunk electronic", "dark synthwave"] },
  "space travel": { moods: ["dreamy", "epic"], genres: ["electronic", "classical"], energy: "medium", terms: ["space ambient", "cosmic orchestral"] },
  "empty road": { moods: ["introspective"], genres: ["folk", "indie"], energy: "low", terms: ["open road folk", "lonely road indie"] },
  "coffee shop": { moods: ["relaxed"], genres: ["jazz", "folk"], energy: "low", terms: ["coffee shop jazz", "cafe acoustic"] },
  "desert horizon": { moods: ["vast", "introspective"], genres: ["folk", "rock"], energy: "medium", terms: ["desert blues", "open horizon rock"] },
  "underwater world": { moods: ["dreamy"], genres: ["electronic", "classical"], energy: "low", terms: ["underwater ambient", "ocean instrumental"] },
  midnight: { moods: ["mysterious", "melancholic"], genres: ["jazz", "electronic"], energy: "low", terms: ["midnight jazz", "midnight ambient"] },
  dawn: { moods: ["hopeful", "peaceful"], genres: ["folk", "classical"], energy: "low", terms: ["dawn acoustic", "morning instrumental"] },
  twilight: { moods: ["dreamy", "nostalgic"], genres: ["indie", "electronic"], energy: "low", terms: ["twilight indie", "twilight ambient"] },
  evening: { moods: ["relaxed"], genres: ["jazz", "indie"], energy: "low", terms: ["evening jazz", "evening indie"] },
  morning: { moods: ["hopeful"], genres: ["folk", "pop"], energy: "medium", terms: ["morning acoustic", "morning pop"] },
  afternoon: { moods: ["relaxed"], genres: ["pop", "jazz"], energy: "medium", terms: ["afternoon pop", "afternoon jazz"] },
  wolf: { moods: ["mysterious", "epic"], genres: ["rock", "metal"], energy: "high", terms: ["wolf rock", "wild epic metal"] },
  lion: { moods: ["epic"], genres: ["classical", "rock"], energy: "high", terms: ["epic orchestral", "powerful rock"] },
  tiger: { moods: ["intense"], genres: ["rock", "electronic"], energy: "high", terms: ["intense rock", "wild electronic"] },
  cat: { moods: ["relaxed"], genres: ["jazz", "electronic"], energy: "low", terms: ["laid back jazz", "soft lofi"] },
  dog: { moods: ["joyful"], genres: ["pop", "folk"], energy: "medium", terms: ["happy pop", "playful acoustic"] },
  eagle: { moods: ["vast", "epic"], genres: ["classical", "rock"], energy: "high", terms: ["soaring orchestral", "open sky rock"] },
  owl: { moods: ["mysterious"], genres: ["jazz", "electronic"], energy: "low", terms: ["night jazz", "mysterious ambient"] },
  fox: { moods: ["playful"], genres: ["indie", "folk"], energy: "medium", terms: ["playful indie", "woodland folk"] },
  whale: { moods: ["dreamy", "vast"], genres: ["electronic", "classical"], energy: "low", terms: ["ocean ambient", "underwater instrumental"] },
  shark: { moods: ["intense"], genres: ["electronic", "rock"], energy: "high", terms: ["deep sea electronic", "intense rock"] },
  butterfly: { moods: ["joyful", "dreamy"], genres: ["indie", "pop"], energy: "medium", terms: ["dreamy indie pop", "bright acoustic"] },
  dragon: { moods: ["epic", "mysterious"], genres: ["metal", "classical"], energy: "high", terms: ["epic metal", "fantasy orchestral"] },
  snake: { moods: ["mysterious"], genres: ["electronic", "rock"], energy: "medium", terms: ["mysterious electronic", "dark rock"] },
  horse: { moods: ["vast", "hopeful"], genres: ["folk", "rock"], energy: "medium", terms: ["open range folk", "riding rock"] },
  crow: { moods: ["dark", "mysterious"], genres: ["rock", "jazz"], energy: "low", terms: ["dark folk rock", "nocturnal jazz"] },
};

function hasTerm(value: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?:$|[^\\p{L}\\p{N}])`, "u").test(value);
}

export function mapVisualContext(keywords: MusicVibe[]): VisualMusicContext {
  const mappings: MoodMapping[] = [];
  const genres: CanonicalGenre[] = [];
  for (const item of keywords) {
    const normalized = normalizeMusicTerm(item.keyword);
    for (const [label, mapping] of Object.entries(MOOD_MAP)) if (hasTerm(normalized, label)) mappings.push(mapping);
    for (const [label, mapping] of Object.entries(CONTEXT_MAP)) if (hasTerm(normalized, label)) mappings.push(mapping);
    const resolved = resolveMusicGenre(normalized);
    if (resolved) genres.push(resolved);
  }
  const energy = mappings.find((item) => item.energy === "high")?.energy
    ?? mappings.find((item) => item.energy === "low")?.energy
    ?? mappings.find((item) => item.energy === "medium")?.energy;
  return {
    keywords,
    moods: [...new Set(mappings.flatMap((item) => item.moods))],
    genres: [...new Set([...genres, ...mappings.flatMap((item) => item.genres)])],
    ...(energy ? { energy } : {}),
    searchTerms: [...new Set(mappings.flatMap((item) => item.terms))],
  };
}
