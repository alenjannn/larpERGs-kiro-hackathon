-- TULOY Health: relational chain of command
--   admins  ->  bhws  ->  patients  ->  records
--
-- Admin creates/manages BHWs, BHWs register patients and log field records
-- (often offline, synced later), patients read the records their BHW created.
--
-- local_id columns let offline-created rows be upserted idempotently: if a sync
-- is retried after a partial failure, the same row is never inserted twice.

-- ---------------------------------------------------------------------------
-- admins
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admins (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  office     TEXT NOT NULL DEFAULT 'Rural Health Unit',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- bhws (Barangay Health Workers), managed by an admin
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bhws (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   UUID NOT NULL REFERENCES public.admins(id) ON DELETE RESTRICT,
  full_name  TEXT NOT NULL,
  email      TEXT UNIQUE,
  phone      TEXT,
  barangay   TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bhws_admin_id_idx ON public.bhws(admin_id);

-- ---------------------------------------------------------------------------
-- patients, assigned to a BHW
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.patients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bhw_id     UUID REFERENCES public.bhws(id) ON DELETE SET NULL,
  full_name  TEXT NOT NULL,
  sex        TEXT CHECK (sex IN ('F', 'M')),
  birth_date DATE,
  barangay   TEXT,
  address    TEXT,
  latitude   DOUBLE PRECISION,
  longitude  DOUBLE PRECISION,
  local_id   TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS patients_bhw_id_idx ON public.patients(bhw_id);

-- ---------------------------------------------------------------------------
-- records: visits, health updates and appointments a BHW logs for a patient
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  bhw_id        UUID REFERENCES public.bhws(id) ON DELETE SET NULL,
  record_type   TEXT NOT NULL CHECK (record_type IN ('visit', 'health_update', 'appointment')),
  title         TEXT NOT NULL,
  notes         TEXT,
  systolic      INTEGER CHECK (systolic BETWEEN 50 AND 260),
  diastolic     INTEGER CHECK (diastolic BETWEEN 30 AND 180),
  temperature_c NUMERIC(4, 1) CHECK (temperature_c BETWEEN 30 AND 45),
  weight_kg     NUMERIC(5, 1) CHECK (weight_kg BETWEEN 1 AND 400),
  scheduled_at  TIMESTAMPTZ,
  status        TEXT CHECK (status IN ('scheduled', 'completed', 'missed')),
  source        TEXT NOT NULL DEFAULT 'online' CHECK (source IN ('online', 'offline_sync')),
  local_id      TEXT UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS records_patient_id_idx ON public.records(patient_id);
CREATE INDEX IF NOT EXISTS records_bhw_id_idx ON public.records(bhw_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- RLS is ENABLED on every table. Policies are permissive for the hackathon demo
-- (no login flow; roles are hardcoded demo personas). Production must replace
-- these with auth.uid()-based policies, e.g. BHWs only see assigned patients.
-- No DELETE grant: the demo never deletes data from the client.
-- ---------------------------------------------------------------------------
ALTER TABLE public.admins   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bhws     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hackathon demo access" ON public.admins;
CREATE POLICY "Hackathon demo access" ON public.admins
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Hackathon demo access" ON public.bhws;
CREATE POLICY "Hackathon demo access" ON public.bhws
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Hackathon demo access" ON public.patients;
CREATE POLICY "Hackathon demo access" ON public.patients
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Hackathon demo access" ON public.records;
CREATE POLICY "Hackathon demo access" ON public.records
  FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT                 ON public.admins   TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bhws     TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.patients TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.records  TO anon, authenticated;
