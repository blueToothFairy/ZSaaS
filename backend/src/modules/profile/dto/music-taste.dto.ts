export type MusicPreferenceType = "genre" | "artist" | "track";
export type PreferenceSentiment = "preferred" | "disliked";

export interface MusicPreferenceInput {
  type: MusicPreferenceType;
  sentiment: PreferenceSentiment;
  value: string;
  provider?: string;
  externalId?: string;
  displayName: string;
  metadata?: Record<string, unknown>;
  hardExclude?: boolean;
}

export interface MusicPreference extends MusicPreferenceInput {
  id: string;
  normalizedValue: string;
  canonicalGenreId?: string;
}

export interface MusicGenreOption {
  id: string;
  displayName: string;
  aliases: string[];
}

export interface MusicTasteProfile {
  preferences: MusicPreference[];
  availableGenres: MusicGenreOption[];
  preferredLanguages: string[];
  vocalPreference: "instrumental" | "vocals" | "any";
  qualifiesForRecommendations: boolean;
}

export interface UpdateMusicTasteDTO {
  preferences: MusicPreferenceInput[];
  preferredLanguages: string[];
  vocalPreference: "instrumental" | "vocals" | "any";
}
