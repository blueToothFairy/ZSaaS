CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  token_hash CHAR(64) PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx
  ON public.password_reset_tokens(user_id);
