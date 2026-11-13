-- First-party auth extends the profile table created by mig-001.
-- Existing test profiles remain auth-disabled and are not imported as accounts.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS auth_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_auth_email_uq
  ON public.user_profiles (LOWER(email))
  WHERE auth_enabled = TRUE;

CREATE TABLE IF NOT EXISTS public.password_credentials (
  user_id TEXT PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.oauth_identities (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  provider VARCHAR(30) NOT NULL,
  provider_subject VARCHAR(255) NOT NULL,
  provider_email VARCHAR(320) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT oauth_identities_provider_subject_uq UNIQUE (provider, provider_subject)
);
CREATE INDEX IF NOT EXISTS oauth_identities_user_id_idx
  ON public.oauth_identities(user_id);

CREATE TABLE IF NOT EXISTS public.refresh_sessions (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  replaced_by CHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS refresh_sessions_user_id_idx
  ON public.refresh_sessions(user_id);
CREATE INDEX IF NOT EXISTS refresh_sessions_active_expiry_idx
  ON public.refresh_sessions(expires_at)
  WHERE revoked_at IS NULL;
