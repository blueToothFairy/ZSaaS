// Backward-compatible module path. Taxonomy implementation lives in the shared module.
export {
  mapVisualContext,
  MOOD_MAP,
  normalizeMusicGenre,
  normalizeMusicTerm,
  resolveMusicGenre,
} from "../../../shared/music/music-taxonomy.js";
export type {
  CanonicalGenre,
  MusicVibe,
  VisualMusicContext,
} from "../../../shared/music/music-taxonomy.js";
