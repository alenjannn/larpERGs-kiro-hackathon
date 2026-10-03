// Patient-workspace remote queries (Spec 03). Kept apart from api.ts so the
// parallel BHW/Admin branches don't conflict. Only patient hooks import this.

import { requireSupabase } from './supabase';
import type { PatientLabInsert } from '../../features/patient/logic/clearbook';
import type { Appointment, Clinic, EncounterStatus, HealthRecord } from '../types/db.types';

function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data as T;
}

const ATTENDABLE: EncounterStatus[] = ['requested', 'confirmed', 'rescheduled'];

/**
 * Sets patient-reported attendance. Only changes a requested/confirmed/rescheduled
 * row of this patient, so it can never overwrite clinic-confirmed or missed.
 * Returns null when no row matched (already updated elsewhere).
 */
export async function reportAttended(appointmentId: string, patientId: string): Promise<Appointment | null> {
  return unwrap(
    await requireSupabase()
      .from('appointments')
      .update({ encounter_status: 'patient_reported_attended', updated_at: new Date().toISOString() })
      .eq('id', appointmentId)
      .eq('patient_id', patientId)
      .in('encounter_status', ATTENDABLE)
      .select('*')
      .maybeSingle()
  ) as Appointment | null;
}

/** Exactly-once insert of a patient clearbook entry: client UUID, ON CONFLICT (id) DO NOTHING. */
export async function insertPatientLabEntry(row: PatientLabInsert, signal?: AbortSignal): Promise<void> {
  let query = requireSupabase().from('records').upsert(row, { onConflict: 'id', ignoreDuplicates: true });
  if (signal) query = query.abortSignal(signal);
  unwrap(await query);
}

/** Read-back by id: only a returned row counts as shared. */
export async function fetchRecordById(id: string, signal?: AbortSignal): Promise<HealthRecord | null> {
  let query = requireSupabase().from('records').select('*').eq('id', id);
  if (signal) query = query.abortSignal(signal);
  return unwrap(await query.maybeSingle()) as HealthRecord | null;
}

/** Every clinic, by name (YAKAP & Clinics finder). */
export async function fetchClinics(): Promise<Clinic[]> {
  return (unwrap(await requireSupabase().from('clinics').select('*').order('name', { ascending: true })) as Clinic[] | null) ?? [];
}
