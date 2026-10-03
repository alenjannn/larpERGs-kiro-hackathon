// Admin (RHU) remote queries for Spec 05: assignments and clinical review.
// Kept separate from api.ts so parallel specs don't collide. Screens and hooks
// call these functions; they never query Supabase directly.
//
// Every write here is idempotent, so retrying after a partial failure is safe.

import { requireSupabase } from './supabase';
import type { Appointment, CarePlan, CoordinationStatus, EncounterStatus, HelpRequestRow } from '../types/db.types';

function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data as T;
}

const HELP_COLUMNS =
  'id, patient_id, reason, message, created_on_device_at, received_at, assigned_bhw_id, coordination_status, acknowledged_at';

/** Help requests that still need an owner's work. */
export const OPEN_COORDINATION: CoordinationStatus[] = ['unassigned', 'assigned', 'acknowledged', 'blocked'];
/** Appointments that still need follow-through. */
export const OPEN_ENCOUNTER: EncounterStatus[] = ['requested', 'confirmed'];

// --- appointments -------------------------------------------------------------

export async function fetchAllAppointments(limit = 500): Promise<Appointment[]> {
  return (
    unwrap(
      await requireSupabase()
        .from('appointments')
        .select('*')
        .order('scheduled_at', { ascending: true, nullsFirst: false })
        .limit(limit)
    ) ?? []
  );
}

// --- assignments ----------------------------------------------------------------

/**
 * Assigns or reassigns one help request. The new owner acknowledges it
 * (Spec 04), so acknowledged_at is cleared. Completed requests are not touched.
 */
export async function assignHelpRequest(id: string, bhwId: string): Promise<HelpRequestRow> {
  const row = unwrap(
    await requireSupabase()
      .from('help_requests')
      .update({ assigned_bhw_id: bhwId, coordination_status: 'assigned', acknowledged_at: null })
      .eq('id', id)
      .neq('coordination_status', 'completed')
      .select(HELP_COLUMNS)
      .maybeSingle()
  ) as HelpRequestRow | null;
  if (!row) throw new Error('This request was completed or no longer exists.');
  return row;
}

/**
 * Assigns or reassigns a patient, then moves their open help requests and open
 * appointments to the same BHW so every open task keeps an owner.
 */
export async function reassignPatient(
  patientId: string,
  bhwId: string
): Promise<{ movedRequests: number; movedAppointments: number }> {
  const db = requireSupabase();
  const now = new Date().toISOString();

  const patient = unwrap(
    await db.from('patients').update({ bhw_id: bhwId, updated_at: now }).eq('id', patientId).select('id').maybeSingle()
  );
  if (!patient) throw new Error('This patient no longer exists.');

  const requests =
    unwrap(
      await db
        .from('help_requests')
        .update({ assigned_bhw_id: bhwId, coordination_status: 'assigned', acknowledged_at: null })
        .eq('patient_id', patientId)
        .in('coordination_status', OPEN_COORDINATION)
        .select('id')
    ) ?? [];

  const appointments =
    unwrap(
      await db
        .from('appointments')
        .update({ owner_bhw_id: bhwId, updated_at: now })
        .eq('patient_id', patientId)
        .in('encounter_status', OPEN_ENCOUNTER)
        .select('id')
    ) ?? [];

  return { movedRequests: requests.length, movedAppointments: appointments.length };
}

// --- care plans (clinician mode) ------------------------------------------------

export async function fetchCarePlans(patientId?: string): Promise<CarePlan[]> {
  let query = requireSupabase().from('care_plans').select('*');
  if (patientId) query = query.eq('patient_id', patientId);
  return unwrap(await query.order('created_at', { ascending: false }).limit(200)) ?? [];
}

export interface CarePlanInput {
  /** Client-generated, so a retried save or release never creates a second plan. */
  id: string;
  patient_id: string;
  clinician_admin_id: string;
  summary: string;
  next_steps: string | null;
}

async function fetchCarePlanById(id: string): Promise<CarePlan | null> {
  return unwrap(await requireSupabase().from('care_plans').select('*').eq('id', id).maybeSingle()) as CarePlan | null;
}

/** Saves a draft. Never touches a plan that has already been released. */
export async function saveCarePlanDraft(input: CarePlanInput): Promise<CarePlan> {
  const db = requireSupabase();
  const fields = { summary: input.summary, next_steps: input.next_steps, updated_at: new Date().toISOString() };
  const updated = unwrap(
    await db.from('care_plans').update(fields).eq('id', input.id).eq('status', 'draft').select('*').maybeSingle()
  ) as CarePlan | null;
  if (updated) return updated;

  unwrap(
    await db
      .from('care_plans')
      .upsert({ ...input, ...fields, status: 'draft', released_at: null }, { onConflict: 'id', ignoreDuplicates: true })
  );
  const row = await fetchCarePlanById(input.id);
  if (!row) throw new Error('The draft was not saved.');
  if (row.status === 'released') throw new Error('This plan has already been released and can no longer be edited.');
  return row;
}

/**
 * Releases a plan: status 'released' + released_at, then marks the patient's
 * results awaiting review as 'plan_released' and moves the YAKAP stage from
 * results_review_pending to plan_available. Each step is idempotent.
 */
export async function releaseCarePlan(input: CarePlanInput): Promise<CarePlan> {
  const db = requireSupabase();
  const now = new Date().toISOString();
  const released = {
    summary: input.summary,
    next_steps: input.next_steps,
    status: 'released' as const,
    released_at: now,
    updated_at: now,
  };

  let plan = unwrap(
    await db.from('care_plans').update(released).eq('id', input.id).eq('status', 'draft').select('*').maybeSingle()
  ) as CarePlan | null;

  if (!plan) {
    unwrap(await db.from('care_plans').upsert({ ...input, ...released }, { onConflict: 'id', ignoreDuplicates: true }));
    plan = await fetchCarePlanById(input.id);
  }
  if (!plan || plan.status !== 'released') throw new Error('The plan was not released. Try again.');

  unwrap(
    await db
      .from('records')
      .update({ review_status: 'plan_released' })
      .eq('patient_id', input.patient_id)
      .eq('review_status', 'awaiting_clinical_review')
  );
  unwrap(
    await db
      .from('patients')
      .update({ yakap_stage: 'plan_available', updated_at: now })
      .eq('id', input.patient_id)
      .eq('yakap_stage', 'results_review_pending')
  );
  return plan;
}
