-- TULOY Health demo seed (Spec 01). All data is synthetic DEMO DATA.
--
-- The seed lives in one function, apply_demo_seed(), so that the same values are
-- used by a fresh setup and by reset_demo_data() (Reset demo data).
--   * Fixed UUIDs match apps/mobile/src/shared/config/demo.ts.
--   * Every row is upserted with ON CONFLICT (id) DO UPDATE and is_seed = true,
--     so re-running restores edited seed rows and renames old personas in place.
--   * Times are anchored to t0 = the moment of the seed/reset, so every run shows
--     the same relative timeline ("follow-up in 4 days").
--   * Patient coordinates are small fixed offsets (|d| <= 0.01 deg) around the
--     demo map centre and labelled "approximate DEMO location". No real addresses.
--   * Unmeasured values are NULL, never 0.

CREATE OR REPLACE FUNCTION public.apply_demo_seed(
  center_lat DOUBLE PRECISION DEFAULT 14.5995,
  center_lng DOUBLE PRECISION DEFAULT 120.9842
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  t0 TIMESTAMPTZ := date_trunc('minute', now());
  d0 DATE := current_date;
  -- Persona IDs
  admin_carmen UUID := 'a0000000-0000-4000-8000-000000000001';
  admin_ramon  UUID := 'a0000000-0000-4000-8000-000000000002';
  bhw_liza     UUID := 'b0000000-0000-4000-8000-000000000001';
  bhw_joel     UUID := 'b0000000-0000-4000-8000-000000000002';
  bhw_ana      UUID := 'b0000000-0000-4000-8000-000000000003';
  clinic_rhu   UUID := 'e0000000-0000-4000-8000-000000000001';
  clinic_bhs   UUID := 'e0000000-0000-4000-8000-000000000002';
  clinic_fam   UUID := 'e0000000-0000-4000-8000-000000000003';
  p_juana      UUID := 'c0000000-0000-4000-8000-000000000001';
  p_pedro      UUID := 'c0000000-0000-4000-8000-000000000002';
  p_rosa       UUID := 'c0000000-0000-4000-8000-000000000003';
  p_lito       UUID := 'c0000000-0000-4000-8000-000000000004';
  p_marites    UUID := 'c0000000-0000-4000-8000-000000000005';
  p_ernesto    UUID := 'c0000000-0000-4000-8000-000000000006';
  p_lorna      UUID := 'c0000000-0000-4000-8000-000000000007';
  p_nestor     UUID := 'c0000000-0000-4000-8000-000000000008';
BEGIN
  IF center_lat IS NULL OR center_lng IS NULL
     OR center_lat NOT BETWEEN -89 AND 89 OR center_lng NOT BETWEEN -179 AND 179 THEN
    RAISE EXCEPTION 'Invalid demo map centre (%, %)', center_lat, center_lng;
  END IF;

  -- -------------------------------------------------------------------------
  -- Admins: coordinator + clinician (email is NOT NULL UNIQUE)
  -- -------------------------------------------------------------------------
  INSERT INTO public.admins AS t (id, full_name, email, office, admin_role, municipality, is_demo, created_at, is_seed) VALUES
    (admin_carmen, 'Carmen Reyes (DEMO)',     'demo.admin@tuloy.test',     'Demo Rural Health Unit (DEMO)', 'coordinator', 'Demo Municipality (DEMO)', true, t0 - INTERVAL '120 days', true),
    (admin_ramon,  'Dr. Ramon Santos (DEMO)', 'demo.clinician@tuloy.test', 'Demo Rural Health Unit (DEMO)', 'clinician',   'Demo Municipality (DEMO)', true, t0 - INTERVAL '120 days', true)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name, email = EXCLUDED.email, office = EXCLUDED.office,
    admin_role = EXCLUDED.admin_role, municipality = EXCLUDED.municipality, is_demo = EXCLUDED.is_demo,
    created_at = EXCLUDED.created_at, is_seed = true;

  -- -------------------------------------------------------------------------
  -- BHWs: Liza and Joel active, Ana inactive for 5 days
  -- -------------------------------------------------------------------------
  INSERT INTO public.bhws AS t (id, admin_id, full_name, email, phone, barangay, status, last_active_at, created_at, is_seed) VALUES
    (bhw_liza, admin_carmen, 'Liza Mendoza (DEMO)',   'demo.bhw1@tuloy.test', '0900-000-0001', 'Brgy. Demo San Isidro',     'active',   t0 - INTERVAL '2 hours', t0 - INTERVAL '110 days', true),
    (bhw_joel, admin_carmen, 'Joel Bautista (DEMO)',  'demo.bhw2@tuloy.test', '0900-000-0002', 'Brgy. Demo Malinis',        'active',   t0 - INTERVAL '1 day',   t0 - INTERVAL '110 days', true),
    (bhw_ana,  admin_carmen, 'Ana Villanueva (DEMO)', 'demo.bhw3@tuloy.test', '0900-000-0003', 'Brgy. Demo Bagong Pag-asa', 'inactive', t0 - INTERVAL '5 days',  t0 - INTERVAL '110 days', true)
  ON CONFLICT (id) DO UPDATE SET
    admin_id = EXCLUDED.admin_id, full_name = EXCLUDED.full_name, email = EXCLUDED.email, phone = EXCLUDED.phone,
    barangay = EXCLUDED.barangay, status = EXCLUDED.status, last_active_at = EXCLUDED.last_active_at,
    created_at = EXCLUDED.created_at, is_seed = true;

  -- -------------------------------------------------------------------------
  -- Clinics: synthetic. e...03 has unknown accreditation and an old verification.
  -- -------------------------------------------------------------------------
  INSERT INTO public.clinics AS t (id, name, address, contact, services, yakap_accreditation, source, last_verified_at, created_at, is_seed) VALUES
    (clinic_rhu, 'Demo Rural Health Unit Clinic (DEMO)', 'Poblacion, Demo Municipality (DEMO)', '0900-000-2001',
       ARRAY['Consultation', 'Blood pressure check', 'Fasting blood sugar', 'Prenatal care'], 'listed',
       'Synthetic demo entry (DEMO)', d0 - 20, t0 - INTERVAL '120 days', true),
    (clinic_bhs, 'Demo Barangay Health Station (DEMO)', 'Brgy. Demo San Isidro (DEMO)', '0900-000-2002',
       ARRAY['Blood pressure check', 'Immunization'], 'listed',
       'Synthetic demo entry (DEMO)', d0 - 45, t0 - INTERVAL '120 days', true),
    (clinic_fam, 'Demo Family Clinic (DEMO)', 'Brgy. Demo Malinis (DEMO)', '0900-000-2003',
       ARRAY['Consultation'], 'unknown',
       'Synthetic demo entry (DEMO); accreditation not confirmed', DATE '2024-03-01', t0 - INTERVAL '120 days', true)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, address = EXCLUDED.address, contact = EXCLUDED.contact, services = EXCLUDED.services,
    yakap_accreditation = EXCLUDED.yakap_accreditation, source = EXCLUDED.source,
    last_verified_at = EXCLUDED.last_verified_at, created_at = EXCLUDED.created_at, is_seed = true;

  -- -------------------------------------------------------------------------
  -- Patients: Juana + 7 cases (product.md section 7)
  -- -------------------------------------------------------------------------
  INSERT INTO public.patients AS t (
    id, bhw_id, full_name, sex, birth_date, barangay, address, latitude, longitude, local_id,
    phone, has_smartphone, yakap_stage, clinic_id, sharing_consent, created_on_device_at, created_at, updated_at, is_seed
  ) VALUES
    -- Primary patient: confirmed follow-up, released care plan
    (p_juana, bhw_liza, 'Juana Dela Cruz (DEMO)', 'F', DATE '1968-04-12', 'Brgy. Demo San Isidro',
       'Purok 1 (DEMO) · approximate DEMO location', center_lat + 0.0047, center_lng - 0.0020, NULL,
       '0900-000-1001', true, 'plan_available', clinic_rhu, true, NULL, t0 - INTERVAL '100 days', t0 - INTERVAL '10 days', true),
    -- Unknown attendance (past confirmed appointment, no attendance recorded)
    (p_pedro, bhw_liza, 'Pedro Garcia (DEMO)', 'M', DATE '1955-09-30', 'Brgy. Demo San Isidro',
       'Purok 2 (DEMO) · approximate DEMO location', center_lat - 0.0027, center_lng + 0.0048, NULL,
       '0900-000-1002', true, 'first_checkup_planned', clinic_bhs, true, NULL, t0 - INTERVAL '95 days', t0 - INTERVAL '3 days', true),
    -- Confirmed missed follow-up
    (p_rosa, bhw_liza, 'Rosa Aquino (DEMO)', 'F', DATE '1990-01-05', 'Brgy. Demo San Isidro',
       'Purok 3 (DEMO) · approximate DEMO location', center_lat - 0.0064, center_lng - 0.0041, NULL,
       '0900-000-1003', true, 'continued_monitoring', clinic_rhu, true, NULL, t0 - INTERVAL '90 days', t0 - INTERVAL '10 days', true),
    -- Result awaiting clinical review
    (p_lito, bhw_joel, 'Lito Ramos (DEMO)', 'M', DATE '1972-06-18', 'Brgy. Demo Malinis',
       'Purok 1 (DEMO) · approximate DEMO location', center_lat + 0.0085, center_lng + 0.0093, NULL,
       '0900-000-1004', true, 'results_review_pending', clinic_rhu, true, NULL, t0 - INTERVAL '85 days', t0 - INTERVAL '7 days', true),
    -- Unresolved transport barrier
    (p_marites, bhw_joel, 'Marites Flores (DEMO)', 'F', DATE '1983-11-23', 'Brgy. Demo Malinis',
       'Purok 4 (DEMO) · approximate DEMO location', center_lat + 0.0016, center_lng + 0.0099, NULL,
       '0900-000-1005', true, 'clinic_selected_pending', clinic_rhu, true, NULL, t0 - INTERVAL '60 days', t0 - INTERVAL '2 days', true),
    -- Unassigned (no BHW): shows in RHU Needs Attention
    (p_ernesto, NULL, 'Ernesto Villar (DEMO)', 'M', DATE '1961-02-14', 'Brgy. Demo Bagong Pag-asa',
       'Purok 2 (DEMO) · approximate DEMO location', center_lat - 0.0091, center_lng + 0.0022, NULL,
       '0900-000-1006', true, 'need_help_getting_started', NULL, false, NULL, t0 - INTERVAL '4 days', t0 - INTERVAL '1 day', true),
    -- No smartphone: assisted by the BHW
    (p_lorna, bhw_liza, 'Lorna Pascual (DEMO)', 'F', DATE '1949-07-08', 'Brgy. Demo San Isidro',
       'Purok 5 (DEMO) · approximate DEMO location', center_lat + 0.0032, center_lng - 0.0076, NULL,
       NULL, false, 'checkup_and_assessment', clinic_bhs, true, NULL, t0 - INTERVAL '70 days', t0 - INTERVAL '9 days', true),
    -- Newly onboarded, no measurements ("No readings yet", never 0)
    (p_nestor, bhw_joel, 'Nestor Manalo (DEMO)', 'M', DATE '1998-12-01', 'Brgy. Demo Malinis',
       'Purok 2 (DEMO) · approximate DEMO location', center_lat - 0.0045, center_lng + 0.0067, NULL,
       '0900-000-1008', true, 'need_help_getting_started', NULL, true, t0 - INTERVAL '1 day', t0 - INTERVAL '1 day', t0 - INTERVAL '1 day', true)
  ON CONFLICT (id) DO UPDATE SET
    bhw_id = EXCLUDED.bhw_id, full_name = EXCLUDED.full_name, sex = EXCLUDED.sex, birth_date = EXCLUDED.birth_date,
    barangay = EXCLUDED.barangay, address = EXCLUDED.address, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
    local_id = EXCLUDED.local_id, phone = EXCLUDED.phone, has_smartphone = EXCLUDED.has_smartphone,
    yakap_stage = EXCLUDED.yakap_stage, clinic_id = EXCLUDED.clinic_id, sharing_consent = EXCLUDED.sharing_consent,
    created_on_device_at = EXCLUDED.created_on_device_at, created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at, is_seed = true;

  -- -------------------------------------------------------------------------
  -- Records (field records). Juana: 3 BP readings in 3 different months
  -- (-84 / -52 / -12 days are >= 32 days apart pairwise). Nestor: none.
  -- -------------------------------------------------------------------------
  INSERT INTO public.records AS t (
    id, patient_id, bhw_id, record_type, title, notes,
    systolic, diastolic, temperature_c, weight_kg, height_cm,
    glucose_value, glucose_unit, glucose_test_type,
    scheduled_at, status, source, local_id, origin,
    contact_outcome, barrier, next_action, transcription_status, review_status,
    measured_at, created_on_device_at, created_at, is_seed
  ) VALUES
    ('d0000000-0000-4000-8000-000000000001', p_juana, bhw_liza, 'visit', 'Home visit: BP check',
       'Demo note: advised low-salt diet.', 148, 94, 36.7, 61.5, NULL, NULL, NULL, NULL,
       NULL, NULL, 'online', NULL, 'field', 'reached', NULL, 'Recheck BP in 1 month', NULL, NULL,
       t0 - INTERVAL '84 days', t0 - INTERVAL '84 days', t0 - INTERVAL '84 days', true),
    ('d0000000-0000-4000-8000-000000000008', p_juana, bhw_liza, 'vitals', 'BP recheck',
       'Demo note: home reading.', 138, 88, NULL, NULL, NULL, NULL, NULL, NULL,
       NULL, NULL, 'online', NULL, 'field', NULL, NULL, NULL, NULL, NULL,
       t0 - INTERVAL '52 days', t0 - INTERVAL '52 days', t0 - INTERVAL '52 days', true),
    ('d0000000-0000-4000-8000-000000000009', p_juana, bhw_liza, 'vitals', 'BP, weight and height',
       'Demo note: measured at the barangay health station.', 132, 84, NULL, 61.0, 152.0, NULL, NULL, NULL,
       NULL, NULL, 'online', NULL, 'field', NULL, NULL, NULL, NULL, NULL,
       t0 - INTERVAL '12 days', t0 - INTERVAL '12 days', t0 - INTERVAL '12 days', true),
    ('d0000000-0000-4000-8000-000000000002', p_juana, bhw_liza, 'health_update', 'Maintenance meds refilled',
       'Demo note: 30-day supply given.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
       NULL, NULL, 'online', NULL, 'field', NULL, NULL, NULL, NULL, NULL,
       NULL, t0 - INTERVAL '12 days', t0 - INTERVAL '12 days', true),
    -- Legacy appointment record kept so existing Patient screens still show the
    -- follow-up; the same visit is appointments f...01.
    ('d0000000-0000-4000-8000-000000000003', p_juana, bhw_liza, 'appointment', 'Follow-up BP check at RHU',
       'Demo note: bring medication list.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
       t0 + INTERVAL '4 days', 'scheduled', 'online', NULL, 'field', NULL, NULL, NULL, NULL, NULL,
       NULL, t0 - INTERVAL '10 days', t0 - INTERVAL '10 days', true),
    ('d0000000-0000-4000-8000-000000000004', p_pedro, bhw_liza, 'visit', 'Home visit: BP check',
       'Demo note: invited to a preventive checkup.', 128, 82, 36.5, 70.2, NULL, NULL, NULL, NULL,
       NULL, NULL, 'online', NULL, 'field', 'reached', NULL, 'Confirm checkup attendance', NULL, NULL,
       t0 - INTERVAL '20 days', t0 - INTERVAL '20 days', t0 - INTERVAL '20 days', true),
    ('d0000000-0000-4000-8000-000000000005', p_rosa, bhw_liza, 'visit', 'Home visit: BP check',
       'Demo note: follow-up consultation scheduled.', 120, 78, NULL, NULL, NULL, NULL, NULL, NULL,
       NULL, NULL, 'online', NULL, 'field', 'reached', NULL, NULL, NULL, NULL,
       t0 - INTERVAL '40 days', t0 - INTERVAL '40 days', t0 - INTERVAL '40 days', true),
    ('d0000000-0000-4000-8000-000000000006', p_lito, bhw_joel, 'visit', 'Home visit: BP check',
       'Demo note: referred for a fasting blood sugar test.', 118, 76, 37.1, 58.0, NULL, NULL, NULL, NULL,
       NULL, NULL, 'online', NULL, 'field', 'reached', NULL, 'Fasting blood sugar test at RHU', NULL, NULL,
       t0 - INTERVAL '14 days', t0 - INTERVAL '14 days', t0 - INTERVAL '14 days', true),
    ('d0000000-0000-4000-8000-000000000010', p_lito, bhw_joel, 'lab_result', 'Fasting blood sugar result',
       'Demo note: transcribed from the clinic slip.', NULL, NULL, NULL, NULL, NULL, 126.0, 'mg/dL', 'fasting',
       NULL, NULL, 'online', NULL, 'clinic', NULL, NULL, NULL, 'confirmed', 'awaiting_clinical_review',
       t0 - INTERVAL '7 days', t0 - INTERVAL '6 days', t0 - INTERVAL '6 days', true),
    ('d0000000-0000-4000-8000-000000000007', p_marites, bhw_joel, 'health_update', 'Clinic selected',
       'Demo note: chose the RHU clinic; confirmation pending.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
       NULL, NULL, 'online', NULL, 'field', NULL, NULL, NULL, NULL, NULL,
       NULL, t0 - INTERVAL '5 days', t0 - INTERVAL '5 days', true),
    ('d0000000-0000-4000-8000-000000000011', p_marites, bhw_joel, 'visit', 'Home visit: transport barrier',
       'Demo note: no ride to the RHU for the first checkup.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
       NULL, NULL, 'online', NULL, 'field', 'reached', 'transport', 'Arrange transport to RHU', NULL, NULL,
       NULL, t0 - INTERVAL '2 days', t0 - INTERVAL '2 days', true),
    ('d0000000-0000-4000-8000-000000000012', p_lorna, bhw_liza, 'visit', 'Assisted home visit',
       'Assisted visit (no smartphone).', 124, 80, NULL, NULL, NULL, NULL, NULL, NULL,
       NULL, NULL, 'online', NULL, 'field', 'reached', NULL, 'Next home visit in 2 weeks', NULL, NULL,
       t0 - INTERVAL '9 days', t0 - INTERVAL '9 days', t0 - INTERVAL '9 days', true)
  ON CONFLICT (id) DO UPDATE SET
    patient_id = EXCLUDED.patient_id, bhw_id = EXCLUDED.bhw_id, record_type = EXCLUDED.record_type,
    title = EXCLUDED.title, notes = EXCLUDED.notes, systolic = EXCLUDED.systolic, diastolic = EXCLUDED.diastolic,
    temperature_c = EXCLUDED.temperature_c, weight_kg = EXCLUDED.weight_kg, height_cm = EXCLUDED.height_cm,
    glucose_value = EXCLUDED.glucose_value, glucose_unit = EXCLUDED.glucose_unit,
    glucose_test_type = EXCLUDED.glucose_test_type, scheduled_at = EXCLUDED.scheduled_at, status = EXCLUDED.status,
    source = EXCLUDED.source, local_id = EXCLUDED.local_id, origin = EXCLUDED.origin,
    contact_outcome = EXCLUDED.contact_outcome, barrier = EXCLUDED.barrier, next_action = EXCLUDED.next_action,
    transcription_status = EXCLUDED.transcription_status, review_status = EXCLUDED.review_status,
    measured_at = EXCLUDED.measured_at, created_on_device_at = EXCLUDED.created_on_device_at,
    created_at = EXCLUDED.created_at, is_seed = true;

  -- -------------------------------------------------------------------------
  -- Appointments (encounter dictionary values)
  -- -------------------------------------------------------------------------
  INSERT INTO public.appointments AS t (id, patient_id, clinic_id, purpose, scheduled_at, encounter_status, owner_bhw_id, created_at, updated_at, is_seed) VALUES
    ('f0000000-0000-4000-8000-000000000001', p_juana,   clinic_rhu, 'Follow-up BP check (DEMO)',       t0 + INTERVAL '4 days',  'confirmed',                 bhw_liza, t0 - INTERVAL '10 days', t0 - INTERVAL '10 days', true),
    ('f0000000-0000-4000-8000-000000000002', p_pedro,   clinic_bhs, 'Preventive checkup (DEMO)',       t0 - INTERVAL '3 days',  'confirmed',                 bhw_liza, t0 - INTERVAL '20 days', t0 - INTERVAL '20 days', true),
    ('f0000000-0000-4000-8000-000000000003', p_rosa,    clinic_rhu, 'Follow-up consultation (DEMO)',   t0 - INTERVAL '10 days', 'missed',                    bhw_liza, t0 - INTERVAL '40 days', t0 - INTERVAL '9 days',  true),
    ('f0000000-0000-4000-8000-000000000004', p_lito,    clinic_rhu, 'Fasting blood sugar test (DEMO)', t0 - INTERVAL '7 days',  'clinic_confirmed_attended', bhw_joel, t0 - INTERVAL '14 days', t0 - INTERVAL '7 days',  true),
    ('f0000000-0000-4000-8000-000000000005', p_marites, clinic_rhu, 'First YAKAP checkup (DEMO)',      t0 + INTERVAL '6 days',  'requested',                 bhw_joel, t0 - INTERVAL '5 days',  t0 - INTERVAL '5 days',  true)
  ON CONFLICT (id) DO UPDATE SET
    patient_id = EXCLUDED.patient_id, clinic_id = EXCLUDED.clinic_id, purpose = EXCLUDED.purpose,
    scheduled_at = EXCLUDED.scheduled_at, encounter_status = EXCLUDED.encounter_status,
    owner_bhw_id = EXCLUDED.owner_bhw_id, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at,
    is_seed = true;

  -- -------------------------------------------------------------------------
  -- Care plan: released by the clinician for Juana (no diagnosis wording)
  -- -------------------------------------------------------------------------
  INSERT INTO public.care_plans AS t (id, patient_id, clinician_admin_id, summary, next_steps, status, released_at, created_at, updated_at, is_seed) VALUES
    ('90000000-0000-4000-8000-000000000001', p_juana, admin_ramon,
       'Your recent blood pressure readings were reviewed by your clinician (DEMO).',
       'Keep taking your maintenance medicine as prescribed. Attend your follow-up BP check at the RHU. Ask your BHW if you need help getting there.',
       'released', t0 - INTERVAL '10 days', t0 - INTERVAL '11 days', t0 - INTERVAL '10 days', true)
  ON CONFLICT (id) DO UPDATE SET
    patient_id = EXCLUDED.patient_id, clinician_admin_id = EXCLUDED.clinician_admin_id, summary = EXCLUDED.summary,
    next_steps = EXCLUDED.next_steps, status = EXCLUDED.status, released_at = EXCLUDED.released_at,
    created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, is_seed = true;

  -- -------------------------------------------------------------------------
  -- Help requests. None for Juana: her live demo request is the only new item.
  -- -------------------------------------------------------------------------
  INSERT INTO public.help_requests AS t (id, patient_id, reason, message, created_on_device_at, received_at, assigned_bhw_id, coordination_status, acknowledged_at, is_seed) VALUES
    ('80000000-0000-4000-8000-000000000001', p_marites, 'transport', 'I have no ride to the RHU for my checkup. (DEMO)',
       t0 - INTERVAL '2 days 1 hour', t0 - INTERVAL '2 days', bhw_joel, 'blocked', t0 - INTERVAL '2 days' + INTERVAL '3 hours', true),
    ('80000000-0000-4000-8000-000000000002', p_ernesto, 'document_help', 'I need help with my PhilHealth documents. (DEMO)',
       t0 - INTERVAL '1 day 2 hours', t0 - INTERVAL '1 day', NULL, 'unassigned', NULL, true)
  ON CONFLICT (id) DO UPDATE SET
    patient_id = EXCLUDED.patient_id, reason = EXCLUDED.reason, message = EXCLUDED.message,
    created_on_device_at = EXCLUDED.created_on_device_at, received_at = EXCLUDED.received_at,
    assigned_bhw_id = EXCLUDED.assigned_bhw_id, coordination_status = EXCLUDED.coordination_status,
    acknowledged_at = EXCLUDED.acknowledged_at, is_seed = true;
END;
$$;

-- Only reset_demo_data() (security definer) and the SQL Editor may run the seed.
-- Supabase grants EXECUTE on new public functions to anon/authenticated by default.
REVOKE ALL ON FUNCTION public.apply_demo_seed(DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON FUNCTION public.apply_demo_seed(DOUBLE PRECISION, DOUBLE PRECISION) FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON FUNCTION public.apply_demo_seed(DOUBLE PRECISION, DOUBLE PRECISION) FROM authenticated;
  END IF;
END;
$$;

SELECT public.apply_demo_seed();

-- Make the new tables visible to the Data API immediately.
NOTIFY pgrst, 'reload schema';
