BEGIN;

DO $$
BEGIN
  IF to_regclass('public.recommendation_jobs') IS NULL
     AND to_regclass('public.ai_outputs') IS NOT NULL THEN
    ALTER TABLE public.ai_outputs RENAME TO recommendation_jobs;
  END IF;
END $$;

ALTER TABLE public.recommendation_jobs
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS stage text,
  ADD COLUMN IF NOT EXISTS error_code text,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS idempotency_key text;

DO $$
DECLARE status_check record;
BEGIN
  FOR status_check IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.recommendation_jobs'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.recommendation_jobs DROP CONSTRAINT %I', status_check.conname);
  END LOOP;
END $$;

UPDATE public.recommendation_jobs
SET status = 'completed'
WHERE status IS NULL OR status NOT IN ('queued', 'processing', 'completed', 'failed');

ALTER TABLE public.recommendation_jobs
  ALTER COLUMN status SET DEFAULT 'queued',
  ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
  ALTER TABLE public.recommendation_jobs
    ADD CONSTRAINT recommendation_jobs_status_check
    CHECK (status IN ('queued', 'processing', 'completed', 'failed'));
END $$;

CREATE INDEX IF NOT EXISTS recommendation_jobs_user_created_idx
  ON public.recommendation_jobs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS recommendation_jobs_outstanding_idx
  ON public.recommendation_jobs (user_id, status)
  WHERE status IN ('queued', 'processing');
CREATE UNIQUE INDEX IF NOT EXISTS recommendation_jobs_idempotency_idx
  ON public.recommendation_jobs (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.outbox_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type text NOT NULL,
  job_id uuid NOT NULL REFERENCES public.recommendation_jobs(id) ON DELETE CASCADE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  locked_by text,
  attempts integer NOT NULL DEFAULT 0,
  last_error text
);

CREATE INDEX IF NOT EXISTS outbox_events_due_idx
  ON public.outbox_events (available_at, created_at)
  WHERE published_at IS NULL;
CREATE INDEX IF NOT EXISTS outbox_events_job_id_idx ON public.outbox_events (job_id);

COMMIT;
