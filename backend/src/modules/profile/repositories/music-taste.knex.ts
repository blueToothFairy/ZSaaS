import { Knex } from "knex";
import { IMusicTasteRepository } from "../interfaces/music-taste.interface.js";
import { UpdateMusicTasteDTO } from "../dto/music-taste.dto.js";
import { normalizeMusicGenre, normalizeMusicTerm, resolveMusicGenre } from "../../../shared/music/music-taxonomy.js";

const normalize = (value: string): string => normalizeMusicTerm(value);

export default class MusicTasteRepository implements IMusicTasteRepository {
  constructor(private readonly db: Knex) {}

  async getByUserId(userId: string): Promise<Record<string, unknown>[]> {
    return this.db("music_preferences").where({ user_id: userId }).orderBy("preference_type").orderBy("display_name");
  }

  async getSettings(userId: string): Promise<Record<string, unknown> | undefined> {
    return this.db("music_taste_settings").where({ user_id: userId }).first();
  }

  async getGenreOptions(): Promise<Array<{ id: string; displayName: string; aliases: string[] }>> {
    const [genres, aliases] = await Promise.all([
      this.db("music_genres").select("id", "display_name").where({ is_active: true }).orderBy("display_name"),
      this.db("music_genre_aliases").select("genre_id", "source_name").where({ source: "vibetune" }).orderBy("source_name"),
    ]);
    const aliasMap = new Map<string, string[]>();
    for (const row of aliases) {
      const genreId = String(row.genre_id);
      aliasMap.set(genreId, [...(aliasMap.get(genreId) ?? []), String(row.source_name)]);
    }
    return genres.map((row) => ({ id: String(row.id), displayName: String(row.display_name), aliases: aliasMap.get(String(row.id)) ?? [] }));
  }

  async resolveGenreId(value: string): Promise<string | undefined> {
    const normalized = normalizeMusicTerm(value);
    const alias = await this.db("music_genre_aliases").where({ source: "vibetune", normalized_name: normalized }).first("genre_id");
    if (alias?.genre_id) return String(alias.genre_id);
    const resolved = resolveMusicGenre(normalized);
    if (!resolved) return undefined;
    const exists = await this.db("music_genres").where({ id: resolved, is_active: true }).first("id");
    return exists?.id ? String(exists.id) : undefined;
  }

  async replaceForUser(userId: string, profile: UpdateMusicTasteDTO): Promise<Record<string, unknown>[]> {
    return this.db.transaction(async (trx) => {
      await trx("music_preferences").where({ user_id: userId }).delete();
      await trx("music_taste_settings").insert({
        user_id: userId,
        preferred_languages: JSON.stringify(profile.preferredLanguages),
        vocal_preference: profile.vocalPreference,
        updated_at: trx.fn.now(),
      }).onConflict("user_id").merge(["preferred_languages", "vocal_preference", "updated_at"]);
      if (profile.preferences.length === 0) return [];
      const rows = await Promise.all(profile.preferences.map(async (item) => {
        const canonicalGenreId = item.type === "genre" ? await this.resolveGenreIdInTransaction(trx, item.displayName) : undefined;
        const normalizedValue = item.type === "track"
          ? (item.externalId ? `${item.provider}:${item.externalId}` : normalize(`${item.displayName} ${String(item.metadata?.artistName ?? "")}`))
          : item.type === "genre" ? canonicalGenreId ?? normalizeMusicGenre(item.displayName) : normalize(item.displayName);
        return {
          user_id: userId,
          preference_type: item.type,
          sentiment: item.sentiment,
          value: item.value.trim(),
          normalized_value: normalizedValue,
          canonical_genre_id: canonicalGenreId ?? null,
          provider: item.provider ?? null,
          external_id: item.externalId ?? null,
          display_name: item.displayName.trim(),
          metadata: JSON.stringify(item.metadata ?? {}),
          hard_exclude: item.hardExclude === true,
          updated_at: trx.fn.now(),
        };
      }));
      return trx("music_preferences").insert(rows).returning("*");
    });
  }

  private async resolveGenreIdInTransaction(trx: Knex.Transaction, value: string): Promise<string | undefined> {
    const normalized = normalizeMusicTerm(value);
    const alias = await trx("music_genre_aliases").where({ source: "vibetune", normalized_name: normalized }).first("genre_id");
    if (alias?.genre_id) return String(alias.genre_id);
    const resolved = resolveMusicGenre(normalized);
    if (!resolved) return undefined;
    const exists = await trx("music_genres").where({ id: resolved, is_active: true }).first("id");
    return exists?.id ? String(exists.id) : undefined;
  }
}
