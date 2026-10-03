-- TULOY Health demo seed: Admin -> BHWs -> Patients -> Records
-- All data is synthetic DEMO DATA. Fixed UUIDs match the demo personas in
-- apps/mobile/src/shared/config/demo.ts. Safe to re-run (ON CONFLICT DO NOTHING).

-- Admin (Demo persona for "Demo as Admin")
INSERT INTO public.admins (id, full_name, email, office) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Demo Admin (RHU Nurse)', 'demo.admin@tuloy.test', 'Demo Rural Health Unit')
ON CONFLICT (id) DO NOTHING;

-- BHWs managed by the admin (bhw ...001 is the "Demo as BHW" persona)
INSERT INTO public.bhws (id, admin_id, full_name, email, phone, barangay, status) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Demo BHW Maria', 'demo.bhw1@tuloy.test', '0900-000-0001', 'Brgy. Demo San Isidro', 'active'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Demo BHW Jose',  'demo.bhw2@tuloy.test', '0900-000-0002', 'Brgy. Demo Malinis',    'active'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Demo BHW Ana',   'demo.bhw3@tuloy.test', '0900-000-0003', 'Brgy. Demo Bagong Pag-asa', 'inactive')
ON CONFLICT (id) DO NOTHING;

-- Patients assigned to BHWs (patient ...001 is the "Demo as Patient" persona)
INSERT INTO public.patients (id, bhw_id, full_name, sex, birth_date, barangay, address, latitude, longitude) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Demo Patient Juana', 'F', '1968-04-12', 'Brgy. Demo San Isidro', 'Purok 1 (demo)', 14.6042, 120.9822),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Demo Patient Pedro', 'M', '1955-09-30', 'Brgy. Demo San Isidro', 'Purok 2 (demo)', 14.5968, 120.9890),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'Demo Patient Rosa',  'F', '1990-01-05', 'Brgy. Demo San Isidro', 'Purok 3 (demo)', 14.5931, 120.9801),
  ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002', 'Demo Patient Lito',  'M', '1972-06-18', 'Brgy. Demo Malinis',    'Purok 1 (demo)', 14.6080, 120.9935),
  ('c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000002', 'Demo Patient Carmen','F', '1983-11-23', 'Brgy. Demo Malinis',    'Purok 4 (demo)', 14.6011, 120.9958)
ON CONFLICT (id) DO NOTHING;

-- Records created by BHWs for their patients
INSERT INTO public.records (id, patient_id, bhw_id, record_type, title, notes, systolic, diastolic, temperature_c, weight_kg, scheduled_at, status, created_at) VALUES
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'visit',         'Home visit: BP check',        'Demo note: patient doing well, advised low-salt diet.', 142, 90, 36.7, 61.5, NULL, NULL, NOW() - INTERVAL '6 days'),
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'health_update', 'Maintenance meds refilled',   'Demo note: 30-day supply given.',                       NULL, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '3 days'),
  ('d0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'appointment',   'Follow-up BP check at RHU',   'Demo note: bring medication list.',                     NULL, NULL, NULL, NULL, NOW() + INTERVAL '4 days', 'scheduled', NOW() - INTERVAL '3 days'),
  ('d0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'visit',         'Home visit: diabetes check',  'Demo note: blood sugar log reviewed.',                  128, 82, 36.5, 70.2, NULL, NULL, NOW() - INTERVAL '2 days'),
  ('d0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'appointment',   'Prenatal check-up',           'Demo note: 2nd trimester visit.',                       NULL, NULL, NULL, NULL, NOW() + INTERVAL '9 days', 'scheduled', NOW() - INTERVAL '1 day'),
  ('d0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002', 'visit',         'Home visit: TB DOTS',         'Demo note: medication adherence confirmed.',            118, 76, 37.1, 58.0, NULL, NULL, NOW() - INTERVAL '1 day'),
  ('d0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000002', 'health_update', 'Vaccination record updated', 'Demo note: flu vaccine given.',                         NULL, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '5 hours')
ON CONFLICT (id) DO NOTHING;

-- Make the new tables visible to the Data API immediately.
NOTIFY pgrst, 'reload schema';
