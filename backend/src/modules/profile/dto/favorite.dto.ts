export interface CreateFavoriteDTO {
  song_id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  preview_url?: string;
  external_url?: string;
}

export interface FavoriteResponseDTO {
  id: string;
  user_id: string;
  song_id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  preview_url?: string;
  external_url?: string;
  is_deleted: boolean;
  created_at?: string;
}

export interface RemoveFavoriteDTO {
  song_id: string;
}

export interface FavoritesListResponseDTO {
  favorites: FavoriteResponseDTO[];
  total: number;
}
