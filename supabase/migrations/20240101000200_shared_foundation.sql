-- TULOY Health: shared foundation (Spec 01)
--
-- Additive only: new tables, new columns, constraints, triggers and the
-- reset_demo_data() RPC. Nothing existing is renamed or dropped (the only
-- replaced object is records_record_type_check, widened to a superset).
--
-- Every statement is re-runnable, so this file can be applied to a database
-- that already has it (see supabase/apply_foundation.sql).
--   * ADD COLUMN IF NOT EXISTS without inline constraints
--   * named constraints via DROP CONSTRAINT IF EXISTS + ADD CONSTRAINT
--   * CREATE OR REPLACE FUNCTION, DROP TRIGGER/POLICY IF EXISTS + CREATE

-- ---------------------------------------------------------------------------
-- clinics (created first: patients.clinic_id references it)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinics (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  address             TEXT,
  contact             TEXT,
  services            TEXT[] NOT NULL DEFAULT '{}',
  yakap_accreditation TEXT NOT NULL DEFAULT 'unknown',
  source              TEXT,
  last_verified_at    DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- New columns on existing tables (existing names kept: latitude/longitude,
-- address, bhws.status, created_at)
-- ---------------------------------------------------------------------------
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS admin_role   TEXT NOT NULL DEFAULT 'coordinator';
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS municipality TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS is_demo      BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.bhws ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS phone                TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS has_smartphone       BOOLEAN;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS yakap_stage          TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS clinic_id            UUID;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS sharing_consent      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS created_on_device_at TIMESTAMPTZ;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- All measurement columns are nullable: a missing reading is NULL, never 0.
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS measured_at          TIMESTAMPTZ;
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS glucose_value        NUMERIC(6, 1);
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS glucose_unit         TEXT;
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS glucose_test_type    TEXT;
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS height_cm            NUMERIC(5, 1);
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS contact_outcome      TEXT;
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS barrier              TEXT;
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS next_action          TEXT;
-- origin = who produced the record. records.source keeps its existing meaning
-- (transport: 'online' | 'offline_sync') and is not changed.
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS origin               TEXT NOT NULL DEFAULT 'field';
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS transcription_status TEXT;
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS review_status        TEXT;
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS created_on_device_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- New tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       UUID NOT NULL,
  clinic_id        UUID,
  purpose          TEXT NOT NULL,
  scheduled_at     TIMESTAMPTZ,
  encounter_status TEXT NOT NULL DEFAULT 'requested',
  owner_bhw_id     UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.care_plans (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id         UUID NOT NULL,
  clinician_admin_id UUID,
  summary            TEXT NOT NULL,
  next_steps         TEXT,
  status             TEXT NOT NULL DEFAULT 'draft',
  released_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The demo clinic inbox. id has NO default: the client generates it, and it is
-- the idempotency key for exactly-once delivery.
CREATE TABLE IF NOT EXISTS public.help_requests (
  id                   UUID PRIMARY KEY,
  patient_id           UUID NOT NULL,
  reason               TEXT NOT NULL,
  message              TEXT,
  created_on_device_at TIMESTAMPTZ NOT NULL,
  received_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_bhw_id      UUID,
  coordination_status  TEXT NOT NULL DEFAULT 'unassigned',
  acknowledged_at      TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- Seed flag on every table (reset_demo_data keeps is_seed rows only)
-- ---------------------------------------------------------------------------
ALTER TABLE public.connection_test ADD COLUMN IF NOT EXISTS is_seed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.admins          ADD COLUMN IF NOT EXISTS is_seed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.bhws            ADD COLUMN IF NOT EXISTS is_seed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.patients        ADD COLUMN IF NOT EXISTS is_seed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.records         ADD COLUMN IF NOT EXISTS is_seed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.clinics         ADD COLUMN IF NOT EXISTS is_seed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.appointments    ADD COLUMN IF NOT EXISTS is_seed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.care_plans      ADD COLUMN IF NOT EXISTS is_seed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.help_requests   ADD COLUMN IF NOT EXISTS is_seed BOOLEAN NOT NULL DEFAULT false;

-- The two system rows from the original connection_test migration survive resets.
UPDATE public.connection_test SET is_seed = true WHERE client_type = 'system' AND NOT is_seed;

-- ---------------------------------------------------------------------------
-- Constraints (named, re-runnable)
-- ---------------------------------------------------------------------------
-- Widened to the union of the old and new values; existing rows stay valid.
ALTER TABLE public.records DROP CONSTRAINT IF EXISTS records_record_type_check;
ALTER TABLE public.records ADD CONSTRAINT records_record_type_check
  CHECK (record_type IN ('visit', 'health_update', 'appointment', 'vitals', 'lab_result', 'note'));

ALTER TABLE public.clinics DROP CONSTRAINT IF EXISTS clinics_yakap_accreditation_check;
ALTER TABLE public.clinics ADD CONSTRAINT clinics_yakap_accreditation_check
  CHECK (yakap_accreditation IN ('listed', 'unknown'));

ALTER TABLE public.admins DROP CONSTRAINT IF EXISTS admins_admin_role_check;
ALTER TABLE public.admins ADD CONSTRAINT admins_admin_role_check
  CHECK (admin_role IN ('coordinator', 'clinician'));

ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_yakap_stage_check;
ALTER TABLE public.patients ADD CONSTRAINT patients_yakap_stage_check
  CHECK (yakap_stage IN (
    'need_help_getting_started', 'clinic_selected_pending', 'first_checkup_planned',
    'checkup_and_assessment', 'tests_requested', 'results_review_pending',
    'plan_available', 'continued_monitoring'
  ));

ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_clinic_id_fkey;
ALTER TABLE public.patients ADD CONSTRAINT patients_clinic_id_fkey
  FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE SET NULL;

ALTER TABLE public.records DROP CONSTRAINT IF EXISTS records_glucose_value_check;
ALTER TABLE public.records ADD CONSTRAINT records_glucose_value_check CHECK (glucose_value > 0);
ALTER TABLE public.records DROP CONSTRAINT IF EXISTS records_glucose_unit_check;
ALTER TABLE public.records ADD CONSTRAINT records_glucose_unit_check CHECK (glucose_unit IN ('mg/dL', 'mmol/L'));
ALTER TABLE public.records DROP CONSTRAINT IF EXISTS records_glucose_test_type_check;
ALTER TABLE public.records ADD CONSTRAINT records_glucose_test_type_check
  CHECK (glucose_test_type IN ('fasting', 'random', 'post_meal'));
-- A glucose value is meaningless without its unit and test type.
ALTER TABLE public.records DROP CONSTRAINT IF EXISTS records_glucose_complete_check;
ALTER TABLE public.records ADD CONSTRAINT records_glucose_complete_check
  CHECK (glucose_value IS NULL OR (glucose_unit IS NOT NULL AND glucose_test_type IS NOT NULL));
ALTER TABLE public.records DROP CONSTRAINT IF EXISTS records_height_cm_check;
ALTER TABLE public.records ADD CONSTRAINT records_height_cm_check CHECK (height_cm BETWEEN 30 AND 250);
ALTER TABLE public.records DROP CONSTRAINT IF EXISTS records_origin_check;
ALTER TABLE public.records ADD CONSTRAINT records_origin_check CHECK (origin IN ('field', 'patient', 'clinic'));
ALTER TABLE public.records DROP CONSTRAINT IF EXISTS records_transcription_status_check;
ALTER TABLE public.records ADD CONSTRAINT records_transcription_status_check
  CHECK (transcription_status IN ('pending', 'confirmed'));
ALTER TABLE public.records DROP CONSTRAINT IF EXISTS records_review_status_check;
ALTER TABLE public.records ADD CONSTRAINT records_review_status_check
  CHECK (review_status IN ('awaiting_clinical_review', 'plan_released'));

ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_clinic_id_fkey;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_clinic_id_fkey
  FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE SET NULL;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_owner_bhw_id_fkey;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_owner_bhw_id_fkey
  FOREIGN KEY (owner_bhw_id) REFERENCES public.bhws(id) ON DELETE SET NULL;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_encounter_status_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_encounter_status_check
  CHECK (encounter_status IN (
    'requested', 'confirmed', 'patient_reported_attended', 'clinic_confirmed_attended', 'missed', 'rescheduled'
  ));

ALTER TABLE public.care_plans DROP CONSTRAINT IF EXISTS care_plans_patient_id_fkey;
ALTER TABLE public.care_plans ADD CONSTRAINT care_plans_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
ALTER TABLE public.care_plans DROP CONSTRAINT IF EXISTS care_plans_clinician_admin_id_fkey;
ALTER TABLE public.care_plans ADD CONSTRAINT care_plans_clinician_admin_id_fkey
  FOREIGN KEY (clinician_admin_id) REFERENCES public.admins(id) ON DELETE SET NULL;
ALTER TABLE public.care_plans DROP CONSTRAINT IF EXISTS care_plans_status_check;
ALTER TABLE public.care_plans ADD CONSTRAINT care_plans_status_check CHECK (status IN ('draft', 'released'));
ALTER TABLE public.care_plans DROP CONSTRAINT IF EXISTS care_plans_released_at_check;
ALTER TABLE public.care_plans ADD CONSTRAINT care_plans_released_at_check
  CHECK (status <> 'released' OR released_at IS NOT NULL);

ALTER TABLE public.help_requests DROP CONSTRAINT IF EXISTS help_requests_patient_id_fkey;
ALTER TABLE public.help_requests ADD CONSTRAINT help_requests_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
ALTER TABLE public.help_requests DROP CONSTRAINT IF EXISTS help_requests_assigned_bhw_id_fkey;
ALTER TABLE public.help_requests ADD CONSTRAINT help_requests_assigned_bhw_id_fkey
  FOREIGN KEY (assigned_bhw_id) REFERENCES public.bhws(id) ON DELETE SET NULL;
ALTER TABLE public.help_requests DROP CONSTRAINT IF EXISTS help_requests_reason_check;
ALTER TABLE public.help_requests ADD CONSTRAINT help_requests_reason_check
  CHECK (reason IN ('transport', 'another_date', 'lab_access', 'document_help', 'medicine_access', 'other'));
ALTER TABLE public.help_requests DROP CONSTRAINT IF EXISTS help_requests_message_check;
ALTER TABLE public.help_requests ADD CONSTRAINT help_requests_message_check CHECK (char_length(message) <= 500);
ALTER TABLE public.help_requests DROP CONSTRAINT IF EXISTS help_requests_coordination_status_check;
ALTER TABLE public.help_requests ADD CONSTRAINT help_requests_coordination_status_check
  CHECK (coordination_status IN ('unassigned', 'assigned', 'acknowledged', 'blocked', 'completed'));

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS patients_clinic_id_idx                ON public.patients(clinic_id);
CREATE INDEX IF NOT EXISTS appointments_patient_id_idx           ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS care_plans_patient_id_idx             ON public.care_plans(patient_id);
CREATE INDEX IF NOT EXISTS help_requests_patient_id_idx          ON public.help_requests(patient_id);
CREATE INDEX IF NOT EXISTS help_requests_assigned_bhw_id_idx     ON public.help_requests(assigned_bhw_id);
CREATE INDEX IF NOT EXISTS help_requests_coordination_status_idx ON public.help_requests(coordination_status);

-- ---------------------------------------------------------------------------
-- Row Level Security: ENABLED, permissive for the hackathon demo (same style
-- as 20240101000100_care_hierarchy.sql). No DELETE grant to clients.
-- ---------------------------------------------------------------------------
ALTER TABLE public.clinics       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_plans    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hackathon demo access" ON public.clinics;
CREATE POLICY "Hackathon demo access" ON public.clinics
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Hackathon demo access" ON public.appointments;
CREATE POLICY "Hackathon demo access" ON public.appointments
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Hackathon demo access" ON public.care_plans;
CREATE POLICY "Hackathon demo access" ON public.care_plans
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Hackathon demo access" ON public.help_requests;
CREATE POLICY "Hackathon demo access" ON public.help_requests
  FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT                 ON public.clinics       TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.appointments  TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.care_plans    TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.help_requests TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Seed guard: clients (anon/authenticated) can never create or edit is_seed,
-- so Reset demo data stays deterministic. The SQL Editor and the
-- security-definer reset run as the table owner and are unaffected.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_is_seed()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_seed := false;
    ELSE
      NEW.is_seed := OLD.is_seed;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'connection_test', 'admins', 'bhws', 'patients', 'records',
    'clinics', 'appointments', 'care_plans', 'help_requests'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS tg_10_guard_is_seed ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER tg_10_guard_is_seed BEFORE INSERT OR UPDATE ON public.%I '
      'FOR EACH ROW EXECUTE FUNCTION public.guard_is_seed()', t);
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Help-request auto-assignment: the patient's BHW owns the request.
-- No BHW -> stays 'unassigned' and shows in RHU Needs Attention.
-- Runs after tg_10_guard_is_seed (triggers fire in name order).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.help_request_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Received time is always the server's, never the client's.
  IF NOT NEW.is_seed THEN
    NEW.received_at := now();
  END IF;

  IF NEW.assigned_bhw_id IS NULL THEN
    SELECT p.bhw_id INTO NEW.assigned_bhw_id FROM public.patients p WHERE p.id = NEW.patient_id;
    IF NEW.assigned_bhw_id IS NOT NULL AND NEW.coordination_status = 'unassigned' THEN
      NEW.coordination_status := 'assigned';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_20_help_request_assign ON public.help_requests;
CREATE TRIGGER tg_20_help_request_assign
  BEFORE INSERT ON public.help_requests
  FOR EACH ROW EXECUTE FUNCTION public.help_request_before_insert();

-- ---------------------------------------------------------------------------
-- reset_demo_data(): deletes every non-seed row and restores the seed rows.
-- SECURITY DEFINER because clients have no DELETE grant.
-- WARNING: anyone holding the anon key can call this. Acceptable for the
-- hackathon demo database only; production must remove the grant below.
-- apply_demo_seed() is defined in supabase/seed.sql.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reset_demo_data(
  center_lat DOUBLE PRECISION DEFAULT 14.5995,
  center_lng DOUBLE PRECISION DEFAULT 120.9842
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted jsonb := '{}'::jsonb;
  n INTEGER;
BEGIN
  IF center_lat IS NULL OR center_lng IS NULL
     OR center_lat NOT BETWEEN -89 AND 89 OR center_lng NOT BETWEEN -179 AND 179 THEN
    RAISE EXCEPTION 'Invalid demo map centre (%, %)', center_lat, center_lng;
  END IF;

  IF to_regprocedure('public.apply_demo_seed(double precision,double precision)') IS NULL THEN
    RAISE EXCEPTION 'Seed not loaded. Run supabase/seed.sql.';
  END IF;

  -- 1. Non-seed rows, children before parents.
  DELETE FROM public.help_requests   WHERE NOT is_seed; GET DIAGNOSTICS n = ROW_COUNT; deleted := deleted || jsonb_build_object('help_requests', n);
  DELETE FROM public.care_plans      WHERE NOT is_seed; GET DIAGNOSTICS n = ROW_COUNT; deleted := deleted || jsonb_build_object('care_plans', n);
  DELETE FROM public.appointments    WHERE NOT is_seed; GET DIAGNOSTICS n = ROW_COUNT; deleted := deleted || jsonb_build_object('appointments', n);
  DELETE FROM public.records         WHERE NOT is_seed; GET DIAGNOSTICS n = ROW_COUNT; deleted := deleted || jsonb_build_object('records', n);
  DELETE FROM public.connection_test WHERE NOT is_seed; GET DIAGNOSTICS n = ROW_COUNT; deleted := deleted || jsonb_build_object('connection_test', n);
  DELETE FROM public.patients        WHERE NOT is_seed; GET DIAGNOSTICS n = ROW_COUNT; deleted := deleted || jsonb_build_object('patients', n);
  DELETE FROM public.bhws            WHERE NOT is_seed; GET DIAGNOSTICS n = ROW_COUNT; deleted := deleted || jsonb_build_object('bhws', n);

  -- 2. Restore every seed row to its original values (also re-points any seed
  --    row that referenced a non-seed admin or clinic).
  PERFORM public.apply_demo_seed(center_lat, center_lng);

  -- 3. Parents that seed rows no longer reference.
  DELETE FROM public.admins  WHERE NOT is_seed; GET DIAGNOSTICS n = ROW_COUNT; deleted := deleted || jsonb_build_object('admins', n);
  DELETE FROM public.clinics WHERE NOT is_seed; GET DIAGNOSTICS n = ROW_COUNT; deleted := deleted || jsonb_build_object('clinics', n);

  RETURN jsonb_build_object('deleted', deleted, 'reset_at', now());
END;
$$;

REVOKE ALL ON FUNCTION public.reset_demo_data(DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_demo_data(DOUBLE PRECISION, DOUBLE PRECISION) TO anon, authenticated;

-- Make the new tables and RPC visible to the Data API immediately.
NOTIFY pgrst, 'reload schema';
