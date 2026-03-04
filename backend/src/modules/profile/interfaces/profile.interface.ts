export interface ProfileRepository {
  getProfileByUserId(userId: string): Promise<any>;
  updateProfile(userId: string, data: { name?: string; email?: string }): Promise<any>;
  deleteProfile(userId: string): Promise<boolean>;
  getFavoritesByUserId(userId: string): Promise<any[]>;
  addFavorite(userId: string, item: any): Promise<any>;
  removeFavorite(userId: string, itemId: string): Promise<boolean>;
}