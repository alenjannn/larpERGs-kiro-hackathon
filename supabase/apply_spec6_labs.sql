-- TULOY Health: apply Spec 06 (clearbook creatinine and cholesterol) to an existing database.
-- Paste into Supabase Dashboard -> SQL Editor -> Run. Safe to run twice.
-- Same statements as supabase/migrations/20240101000600_records_creatinine_cholesterol.sql.
--
-- What it does: adds four nullable columns on records so a patient's serum
-- creatinine and total cholesterol entries can be shared with the care team.
-- Without this script those entries stay on the device and "Share now" reports
-- the server error; glucose entries keep working.

DO $$
BEGIN
  IF to_regclass('public.records') IS NULL THEN
    RAISE EXCEPTION 'records is missing. Run supabase/setup.sql first.';
  END IF;
END;
$$;

ALTER TABLE public.records ADD COLUMN IF NOT EXISTS creatinine_value  NUMERIC(7, 2);
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS creatinine_unit   TEXT;
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS cholesterol_value NUMERIC(7, 2);
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS cholesterol_unit  TEXT;

NOTIFY pgrst, 'reload schema';
