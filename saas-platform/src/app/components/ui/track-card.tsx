'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'motion/react';
import favoritesService from '@/lib/services/favorites.service';

export interface TrackItemProps {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  duration?: number;
  previewUrl?: string;
  externalUrl?: string;
  onPlay?: () => void;
  initialFavorited?: boolean;
}

export const TrackCard: React.FC<TrackItemProps> = ({
  id,
  title,
  artist,
  album,
  artwork,
  duration,
  previewUrl,
  externalUrl,
  onPlay,
  initialFavorited = false,
}) => {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if track is favorited on mount
    const checkFavoriteStatus = async () => {
      try {
        const status = await favoritesService.isFavorited(id);
        setIsFavorited(status);
      } catch (err) {
        console.error('Failed to check favorite status:', err);
      }
    };

    checkFavoriteStatus();
  }, [id]);

  const handleToggleFavorite = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsLoading(true);
      setError(null);

      try {
        if (isFavorited) {
          // Remove from favorites
          await favoritesService.removeFavorite(id);
          setIsFavorited(false);
        } else {
          // Add to favorites
          await favoritesService.addFavorite({
            song_id: id,
            title,
            artist,
            album,
            artwork,
            preview_url: previewUrl,
            external_url: externalUrl,
          });
          setIsFavorited(true);
        }
      } catch (err: Error | unknown) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error.message || 'Failed to update favorite');
        console.error('Error toggling favorite:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [id, isFavorited, title, artist, album, artwork, previewUrl, externalUrl]
  );

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer group"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onPlay}
    >
      {/* Album Artwork */}
      <div className="relative overflow-hidden bg-gray-200 dark:bg-gray-700 aspect-square">
        <img
          src={artwork}
          alt={album}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Heart Button Overlay */}
        <motion.button
          className="absolute top-2 right-2 p-2 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
          onClick={handleToggleFavorite}
          disabled={isLoading}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            initial={false}
            animate={{
              scale: isFavorited ? 1.2 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <Heart
              size={20}
              className={`transition-colors duration-200 ${
                isFavorited
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            />
          </motion.div>
        </motion.button>

        {/* Play Button Overlay (optional) */}
        {previewUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors duration-200 opacity-0 group-hover:opacity-100">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <div className="w-0 h-0 border-l-6 border-l-transparent border-r-0 border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
          {title}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
          {artist}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">
          {album}
        </p>

        {/* Duration */}
        {duration && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-xs text-red-500 mt-2">{error}</p>
        )}
      </div>
    </motion.div>
  );
};

export default TrackCard;
