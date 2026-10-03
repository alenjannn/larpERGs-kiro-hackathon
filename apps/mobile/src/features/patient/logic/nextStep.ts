// Next-step and review-state rules (Spec 03, design §3.1). Pure: no React imports.

import type { OutboxItem } from '../../../shared/services/outboxCore';
import type { Appointment, CarePlan, EncounterStatus, HealthRecord, YakapStage } from '../../../shared/types/db.types';

/** Statuses that keep an appointment as the patient's next step. */
export const NEXT_STEP_STATUSES: EncounterStatus[] = ['requested', 'confirmed', 'rescheduled', 'patient_reported_attended'];
/** Statuses the patient may change to "patient-reported attended". */
export const ATTENDABLE_STATUSES: EncounterStatus[] = ['requested', 'confirmed', 'rescheduled'];

function startOfDay(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function upcoming(appts: Appointment[], statuses: EncounterStatus[], now: number): Appointment[] {
  const from = startOfDay(now);
  return appts
    .filter((a) => {
      if (!a.scheduled_at) return false;
      const t = Date.parse(a.scheduled_at);
      return Number.isFinite(t) && t >= from && statuses.includes(a.encounter_status);
    })
    .sort((a, b) => Date.parse(a.scheduled_at ?? '') - Date.parse(b.scheduled_at ?? ''));
}

/** Earliest appointment from the start of today that still needs the patient. */
export function nextAppointment(appts: Appointment[], now = Date.now()): Appointment | null {
  return upcoming(appts, NEXT_STEP_STATUSES, now)[0] ?? null;
}

/** Other upcoming appointments, excluding the next step. */
export function upcomingFollowUps(appts: Appointment[], exclude: string | null, now = Date.now()): Appointment[] {
  return upcoming(appts, ATTENDABLE_STATUSES, now).filter((a) => a.id !== exclude);
}

export function canReportAttended(a: Appointment): boolean {
  return ATTENDABLE_STATUSES.includes(a.encounter_status);
}

/** An existing "another date" request made after the appointment last changed (K5). */
export function findAnotherDateRequest(items: OutboxItem[], appt: Appointment): OutboxItem | null {
  const since = Date.parse(appt.updated_at);
  const matches = items.filter((i) => {
    if (i.reason !== 'another_date' || i._sync_status === 'conflict') return false;
    const created = Date.parse(i.created_on_device_at);
    return Number.isFinite(created) && (!Number.isFinite(since) || created >= since);
  });
  matches.sort((a, b) => Date.parse(b.created_on_device_at) - Date.parse(a.created_on_device_at));
  return matches[0] ?? null;
}

export type ReviewState = 'pending' | 'released' | 'none';

/** K7: pending if a result awaits review after the latest released plan. */
export function reviewState(records: HealthRecord[], plan: CarePlan | null, stage: YakapStage | null | undefined): ReviewState {
  const releasedAt = plan?.released_at ? Date.parse(plan.released_at) : null;
  const pendingRecord = records.some((r) => {
    if (r.review_status !== 'awaiting_clinical_review') return false;
    if (!plan || releasedAt === null || !Number.isFinite(releasedAt)) return true;
    return Date.parse(r.created_at) > releasedAt;
  });
  if (pendingRecord) return 'pending';
  if (!plan && stage === 'results_review_pending') return 'pending';
  return plan ? 'released' : 'none';
}
