import { MusicPreference, MusicPreferenceInput, MusicTasteProfile, UpdateMusicTasteDTO } from "../dto/music-taste.dto.js";
import { IMusicTasteRepository } from "../interfaces/music-taste.interface.js";
import { normalizeMusicGenre, normalizeMusicTerm } from "../../../shared/music/music-taxonomy.js";

export const MIN_PREFERRED_GENRES = 2;
export const MIN_FAVORITE_TRACKS = 3;
const normalize = (value: string): string => normalizeMusicTerm(value);

export class MusicTasteValidationError extends Error {}

export default class MusicTasteService {
  constructor(private readonly repository: IMusicTasteRepository) {}

  async getProfile(userId: string): Promise<MusicTasteProfile> {
    const [rows, settings] = await Promise.all([this.repository.getByUserId(userId), this.repository.getSettings(userId)]);
    const preferences = rows.map((row) => this.fromRow(row));
    const configuredVocalPreference = settings?.vocal_preference;
    const availableGenres = this.repository.getGenreOptions ? await this.repository.getGenreOptions() : [];
    return {
      preferences,
      availableGenres,
      preferredLanguages: [...new Map(this.toStringArray(settings?.preferred_languages).map((language) => [normalize(language), language])).values()],
      vocalPreference: configuredVocalPreference === "instrumental" || configuredVocalPreference === "vocals" ? configuredVocalPreference : "any",
      qualifiesForRecommendations: this.qualifies(preferences),
    };
  }

  async replaceProfile(userId: string, input: UpdateMusicTasteDTO): Promise<MusicTasteProfile> {
    const validated = this.validate(input);
    await this.repository.replaceForUser(userId, validated);
    return this.getProfile(userId);
  }

  qualifies(preferences: MusicPreference[]): boolean {
    const genres = new Set(preferences.filter((p) => p.type === "genre" && p.sentiment === "preferred").map((p) => normalizeMusicGenre(p.value)));
    const tracks = new Set(preferences.filter((p) => p.type === "track" && p.sentiment === "preferred" && p.provider && (p.externalId || (typeof p.metadata?.artistName === "string" && p.metadata.artistName.trim()))).map((p) => `${p.provider}:${p.externalId ?? p.normalizedValue}`));
    return genres.size >= MIN_PREFERRED_GENRES || tracks.size >= MIN_FAVORITE_TRACKS;
  }

  private validate(input: UpdateMusicTasteDTO): UpdateMusicTasteDTO {
    if (!input || !Array.isArray(input.preferences) || input.preferences.length > 100) throw new MusicTasteValidationError("Provide no more than 100 preferences");
    if (!Array.isArray(input.preferredLanguages) || input.preferredLanguages.length > 20 || input.preferredLanguages.some((v) => typeof v !== "string" || !v.trim() || v.length > 80)) throw new MusicTasteValidationError("Invalid preferred languages");
    if (!["instrumental", "vocals", "any"].includes(input.vocalPreference)) throw new MusicTasteValidationError("Invalid vocal preference");
    const seen = new Set<string>();
    const preferences: MusicPreferenceInput[] = input.preferences.map((item) => {
      if (!item || !["genre", "artist", "track"].includes(item.type) || !["preferred", "disliked"].includes(item.sentiment) || typeof item.value !== "string" || !item.value.trim() || item.value.length > 200 || typeof item.displayName !== "string" || !item.displayName.trim() || item.displayName.length > 200) throw new MusicTasteValidationError("Invalid music preference");
      if ((item.provider !== undefined && (typeof item.provider !== "string" || !item.provider.trim() || item.provider.length > 80)) || (item.externalId !== undefined && (typeof item.externalId !== "string" || !item.externalId.trim() || item.externalId.length > 200)) || (item.hardExclude !== undefined && typeof item.hardExclude !== "boolean")) throw new MusicTasteValidationError("Invalid provider identity or exclusion setting");
      if (item.metadata !== undefined && (!item.metadata || typeof item.metadata !== "object" || Array.isArray(item.metadata) || (JSON.stringify(item.metadata) ?? "").length > 1024)) throw new MusicTasteValidationError("Preference metadata must be an object no larger than 1 KB");
      if (item.type === "track" && (item.sentiment !== "preferred" || !item.provider || typeof item.metadata?.artistName !== "string" || !item.metadata.artistName.trim())) throw new MusicTasteValidationError("Favorite tracks require a provider and artist metadata");
      if (item.hardExclude && (item.sentiment !== "disliked" || !["genre", "artist"].includes(item.type))) throw new MusicTasteValidationError("Hard exclusions are supported only for disliked genres or artists");
      const keyValue = item.type === "artist"
        ? normalize(item.displayName)
        : item.type === "track" && !item.externalId
          ? normalize(`${item.displayName} ${String(item.metadata?.artistName ?? "")}`)
          : item.type === "track"
            ? `${item.provider}:${item.externalId}`
        : item.type === "genre" ? normalizeMusicGenre(item.displayName) : normalize(item.displayName);
      const key = `${item.type}:${keyValue}`;
      if (seen.has(key)) throw new MusicTasteValidationError("Duplicate or conflicting music preference");
      seen.add(key);
      return { ...item, value: item.value.trim(), displayName: item.displayName.trim() };
    });
    return { preferences, preferredLanguages: [...new Set(input.preferredLanguages.map((v) => v.trim()))], vocalPreference: input.vocalPreference };
  }

  private fromRow(row: Record<string, unknown>): MusicPreference {
    const metadata = this.parseMetadata(row.metadata);
    return {
      id: String(row.id), type: row.preference_type as MusicPreference["type"], sentiment: row.sentiment as MusicPreference["sentiment"],
      value: String(row.value), normalizedValue: String(row.normalized_value), displayName: String(row.display_name),
      ...(row.canonical_genre_id ? { canonicalGenreId: String(row.canonical_genre_id) } : {}),
      ...(row.provider ? { provider: String(row.provider) } : {}), ...(row.external_id ? { externalId: String(row.external_id) } : {}),
      metadata, hardExclude: row.hard_exclude === true,
    };
  }

  private parseMetadata(value: unknown): Record<string, unknown> {
    if (typeof value === "string") { try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; } }
    return value && typeof value === "object" ? value as Record<string, unknown> : {};
  }

  private toStringArray(value: unknown): string[] {
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
    if (typeof value === "string") { try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []; } catch { return []; } }
    return [];
  }
}
