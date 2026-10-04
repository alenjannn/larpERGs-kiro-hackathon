// Hardcoded demo personas (no login flow in the hackathon scope).
// These IDs match the rows created by supabase/seed.sql (apply_demo_seed).

import type { IconName } from '../components/Icon';

export const DEMO_ADMIN_ID = 'a0000000-0000-4000-8000-000000000001';
export const DEMO_CLINICIAN_ID = 'a0000000-0000-4000-8000-000000000002';
export const DEMO_BHW_ID = 'b0000000-0000-4000-8000-000000000001';
export const DEMO_PATIENT_ID = 'c0000000-0000-4000-8000-000000000001';

export type DemoRole = 'admin' | 'bhw' | 'patient';

/** Persona chosen on the launcher. The clinician is the admin role with clinician mode on. */
export type DemoPersonaKey = 'admin' | 'clinician' | 'bhw' | 'patient';

export const DEMO_PERSONAS: Record<DemoPersonaKey, { id: string; name: string; role: DemoRole; clinicianMode: boolean }> = {
  admin: { id: DEMO_ADMIN_ID, name: 'Carmen Reyes (DEMO)', role: 'admin', clinicianMode: false },
  clinician: { id: DEMO_CLINICIAN_ID, name: 'Dr. Ramon Santos (DEMO)', role: 'admin', clinicianMode: true },
  bhw: { id: DEMO_BHW_ID, name: 'Liza Mendoza (DEMO)', role: 'bhw', clinicianMode: false },
  patient: { id: DEMO_PATIENT_ID, name: 'Juana Dela Cruz (DEMO)', role: 'patient', clinicianMode: false },
};

export const ROLE_META: Record<
  DemoRole,
  { label: string; workspace: string; icon: IconName; href: '/admin' | '/bhw' | '/patient'; color: string; tint: string }
> = {
  admin: { label: 'Admin', workspace: 'RHU workspace', icon: 'tools', href: '/admin', color: '#5B3FB8', tint: '#F3F0FC' },
  bhw: { label: 'BHW', workspace: 'Field workspace', icon: 'clinic', href: '/bhw', color: '#0E7C66', tint: '#ECF8F4' },
  patient: { label: 'Patient', workspace: 'My care', icon: 'person', href: '/patient', color: '#1F6FD1', tint: '#EDF4FD' },
};
