// Hardcoded demo personas (no login flow in the hackathon scope).
// These IDs match the rows created by supabase/seed.sql.

export const DEMO_ADMIN_ID = 'a0000000-0000-4000-8000-000000000001';
export const DEMO_BHW_ID = 'b0000000-0000-4000-8000-000000000001';
export const DEMO_PATIENT_ID = 'c0000000-0000-4000-8000-000000000001';

export type DemoRole = 'admin' | 'bhw' | 'patient';

export const ROLE_META: Record<DemoRole, { label: string; emoji: string; href: '/admin' | '/bhw' | '/patient'; color: string }> = {
  admin: { label: 'Admin', emoji: '⚙️', href: '/admin', color: '#5B3FB8' },
  bhw: { label: 'BHW', emoji: '🏥', href: '/bhw', color: '#0E7C66' },
  patient: { label: 'Patient', emoji: '👤', href: '/patient', color: '#1F6FD1' },
};
