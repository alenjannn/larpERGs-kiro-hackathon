-- TULOY Health: patient clearbook labs beyond glucose (Spec 06)
--
-- Adds nullable columns on records for two more lab values a patient can copy
-- from a paper report: serum creatinine and total cholesterol. Each value keeps
-- the unit it was reported in. A missing value is NULL, never 0.
--
--   creatinine_unit: 'mg/dL' | 'umol/L'   (validated in the app)
--   cholesterol_unit: 'mg/dL' | 'mmol/L'  (validated in the app)
--
-- Additive and re-runnable: ADD COLUMN IF NOT EXISTS only. Nothing is renamed,
-- dropped or constrained; existing rows and the seed are unchanged.

ALTER TABLE public.records ADD COLUMN IF NOT EXISTS creatinine_value  NUMERIC(7, 2);
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS creatinine_unit   TEXT;
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS cholesterol_value NUMERIC(7, 2);
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS cholesterol_unit  TEXT;

NOTIFY pgrst, 'reload schema';
