-- Additive fields for the admin sponsor-MP workflow.
-- The campaign tables are maintained by the main-branch schema; guard this
-- migration so older local databases remain safe to initialize.
DO $$
BEGIN
  IF to_regclass('public.campaigns') IS NOT NULL THEN
    ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS sponsor_mp jsonb;
    ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS sponsor_requested_at timestamptz;
  END IF;
END $$;
