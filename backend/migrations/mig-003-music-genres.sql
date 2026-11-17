-- Music taste preferences are explicit user choices. Favorites remain a separate feature.
BEGIN;

CREATE TABLE IF NOT EXISTS public.music_genres (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  parent_id text REFERENCES public.music_genres(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  source_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.music_genres (id, display_name) VALUES
  ('pop', 'Pop'), ('rock', 'Rock'), ('indie', 'Indie'), ('electronic', 'Electronic'),
  ('hip-hop', 'Hip-hop'), ('r&b', 'R&B'), ('jazz', 'Jazz'), ('classical', 'Classical'),
  ('metal', 'Metal'), ('folk', 'Folk'), ('other', 'Other')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.music_genre_aliases (
  id bigserial PRIMARY KEY,
  genre_id text NOT NULL REFERENCES public.music_genres(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'vibetune',
  source_id text,
  source_name text NOT NULL,
  normalized_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, normalized_name)
);

INSERT INTO public.music_genre_aliases (genre_id, source_name, normalized_name) VALUES
  ('pop', 'Pop', 'pop'), ('rock', 'Rock', 'rock'), ('indie', 'Indie', 'indie'),
  ('electronic', 'Electronic', 'electronic'), ('hip-hop', 'Hip-hop', 'hip-hop'),
  ('r&b', 'R&B', 'r&b'), ('jazz', 'Jazz', 'jazz'), ('classical', 'Classical', 'classical'),
  ('metal', 'Metal', 'metal'), ('folk', 'Folk', 'folk'), ('other', 'Other', 'other'),
  ('rock', 'Alternative', 'alternative'), ('rock', 'Alternative Rock', 'alternative rock'),
  ('indie', 'Indie Rock', 'indie rock'), ('indie', 'Indie Pop', 'indie pop'),
  ('indie', 'Indie Folk', 'indie folk'), ('rock', 'Punk', 'punk'), ('rock', 'Grunge', 'grunge'),
  ('electronic', 'EDM', 'edm'), ('electronic', 'Techno', 'techno'), ('electronic', 'House', 'house'),
  ('electronic', 'Ambient', 'ambient'), ('electronic', 'Synthwave', 'synthwave'),
  ('electronic', 'Trance', 'trance'), ('electronic', 'Dubstep', 'dubstep'),
  ('electronic', 'Dance', 'dance'), ('electronic', 'Electronica', 'electronica'),
  ('electronic', 'Drum and Bass', 'drum and bass'), ('electronic', 'Industrial', 'industrial'),
  ('hip-hop', 'Hip Hop', 'hip hop'), ('hip-hop', 'Rap', 'rap'), ('hip-hop', 'Trap', 'trap'),
  ('r&b', 'Soul', 'soul'), ('r&b', 'Funk', 'funk'), ('r&b', 'Blues', 'blues'), ('r&b', 'Rhythm and Blues', 'rhythm and blues'),
  ('r&b', 'Disco', 'disco'),
  ('jazz', 'Swing', 'swing'), ('jazz', 'Bebop', 'bebop'), ('jazz', 'Smooth Jazz', 'smooth jazz'),
  ('classical', 'Orchestral', 'orchestral'), ('classical', 'Opera', 'opera'),
  ('classical', 'Soundtrack', 'soundtrack'), ('classical', 'Instrumental', 'instrumental'),
  ('folk', 'Acoustic', 'acoustic'), ('folk', 'Country', 'country'), ('folk', 'Bluegrass', 'bluegrass'),
  ('folk', 'Singer Songwriter', 'singer songwriter'), ('rock', 'Progressive Rock', 'progressive rock'),
  ('rock', 'Post-rock', 'post-rock'), ('rock', 'Garage Rock', 'garage rock'),
  ('pop', 'Dance Pop', 'dance pop'), ('pop', 'K-pop', 'k-pop'), ('other', 'Latin', 'latin'),
  ('other', 'Reggae', 'reggae'), ('other', 'World', 'world'), ('other', 'New Age', 'new age'),
  ('other', 'Lo-fi', 'lo-fi'), ('other', 'Lofi', 'lofi')
ON CONFLICT (source, normalized_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.music_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  preference_type text NOT NULL CHECK (preference_type IN ('genre', 'artist', 'track')),
  sentiment text NOT NULL CHECK (sentiment IN ('preferred', 'disliked')),
  canonical_genre_id text REFERENCES public.music_genres(id) ON DELETE SET NULL,
  value text NOT NULL,
  normalized_value text NOT NULL,
  provider text,
  external_id text,
  display_name text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  hard_exclude boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT music_preferences_hard_exclude_check
    CHECK (NOT hard_exclude OR (sentiment = 'disliked' AND preference_type IN ('genre', 'artist'))),
  CONSTRAINT music_preferences_provider_identity_check
    CHECK (preference_type != 'track' OR provider IS NOT NULL)
);

ALTER TABLE public.music_preferences
  ADD COLUMN IF NOT EXISTS canonical_genre_id text REFERENCES public.music_genres(id) ON DELETE SET NULL;

DROP INDEX IF EXISTS public.music_preferences_identity_unique;

CREATE INDEX IF NOT EXISTS music_preferences_user_idx
  ON public.music_preferences (user_id, preference_type, sentiment);

CREATE UNIQUE INDEX IF NOT EXISTS music_preferences_no_conflict_unique
  ON public.music_preferences (user_id, preference_type, normalized_value);

UPDATE public.music_preferences AS preference
SET canonical_genre_id = alias.genre_id
FROM public.music_genre_aliases AS alias
WHERE preference.preference_type = 'genre'
  AND preference.canonical_genre_id IS NULL
  AND preference.normalized_value = alias.normalized_name;

CREATE TABLE IF NOT EXISTS public.music_taste_settings (
  user_id text PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  preferred_languages jsonb NOT NULL DEFAULT '[]'::jsonb,
  vocal_preference text NOT NULL DEFAULT 'any' CHECK (vocal_preference IN ('instrumental', 'vocals', 'any')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
