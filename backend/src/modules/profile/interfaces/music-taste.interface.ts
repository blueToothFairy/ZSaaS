import { MusicPreferenceInput, UpdateMusicTasteDTO } from "../dto/music-taste.dto.js";

export interface IMusicTasteRepository {
  getByUserId(userId: string): Promise<Record<string, unknown>[]>;
  getSettings(userId: string): Promise<Record<string, unknown> | undefined>;
  getGenreOptions?(): Promise<Array<{ id: string; displayName: string; aliases: string[] }>>;
  replaceForUser(userId: string, profile: UpdateMusicTasteDTO): Promise<Record<string, unknown>[]>;
}
