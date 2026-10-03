// Today queue model (Spec 04, B-1). Pure functions: no React, no Supabase, so
// the rules can be checked with a plain script. `now` is injected.
//
// Language rule (L-1, L-2): never "non-compliant"; a missed visit or no
// response is not evidence of non-adherence or disease.

import { helpReasonLabel } from '../../shared/helpRequests';
import type { IconName } from '../../shared/components/Icon';
import type { StatusKey } from '../../shared/status';
import type { Appointment, HealthRecord, HelpRequestWithPatient } from '../../shared/types/db.types';
import { formatDateDMY } from '../../shared/utils/date';
import { barrierLabel, CONTACT_OUTCOME_LABELS } from './visitOptions';

export type TodayKind = 'attendance_unconfirmed' | 'missed' | 'follow_up' | 'barrier';

export interface TodayItem {
  key: string;
  kind: TodayKind;
  patientId: string;
  patientName: string;
  title: string;
  /** Exactly one next action (B-1.2). */
  nextAction: string;
  dueAt: string | null;
  /** "Due 08 Oct 2026" / "Was due 01 Oct 2026"; null when no date applies. */
  dueLabel: string | null;
  overdue: boolean;
  statuses: StatusKey[];
  note: string | null;
}

interface PatientRef {
  id: string;
  full_name: string;
  bhw_id: string | null;
}

type RecordLike = Pick<HealthRecord, 'patient_id' | 'created_at'> &
  Partial<Pick<HealthRecord, 'measured_at' | 'created_on_device_at' | 'contact_outcome' | 'barrier' | 'next_action'>>;

export interface TodayInput {
  bhwId: string;
  patients: PatientRef[];
  appointments: Appointment[];
  records: RecordLike[];
  now: number;
}

const DAY = 86_400_000;
export const FOLLOW_UP_WINDOW_DAYS = 7;

/** When the record describes (measurement time, else device time, else server time). */
export function recordTime(r: RecordLike): number {
  const t = new Date(r.measured_at ?? r.created_on_device_at ?? r.created_at).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function time(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

const OPEN_STATUSES = new Set(['requested', 'confirmed', 'rescheduled']);
const RESOLVING_OUTCOMES = new Set(['clinic_confirmed_attended', 'rescheduled']);

export const MISSED_NOTE = 'A missed visit is not a sign the patient doesn’t care. Ask what got in the way.';

export function buildTodayItems({ bhwId, patients, appointments, records, now }: TodayInput): TodayItem[] {
  const names = new Map(patients.map((p) => [p.id, p.full_name]));
  const nameOf = (id: string) => names.get(id) ?? 'Patient';
  const byPatient = new Map<string, RecordLike[]>();
  for (const r of records) {
    const list = byPatient.get(r.patient_id) ?? [];
    list.push(r);
    byPatient.set(r.patient_id, list);
  }
  const recordsAfter = (patientId: string, after: number) =>
    (byPatient.get(patientId) ?? []).filter((r) => recordTime(r) > after).sort((a, b) => recordTime(b) - recordTime(a));

  const items: TodayItem[] = [];

  for (const a of appointments) {
    if (a.owner_bhw_id !== bhwId) continue;
    const scheduled = time(a.scheduled_at);
    const statusKey = `encounter.${a.encounter_status}` as StatusKey;
    const base = { patientId: a.patient_id, patientName: nameOf(a.patient_id), title: a.purpose };

    if (a.encounter_status === 'missed') {
      // Resolved by a later visit that rescheduled or confirmed attendance.
      const since = time(a.updated_at) ?? scheduled ?? 0;
      if (recordsAfter(a.patient_id, since).some((r) => RESOLVING_OUTCOMES.has(r.contact_outcome ?? ''))) continue;
      items.push({
        ...base,
        key: `missed:${a.id}`,
        kind: 'missed',
        nextAction: 'Contact the patient to arrange a new date',
        dueAt: a.scheduled_at,
        dueLabel: a.scheduled_at ? `Was scheduled ${formatDateDMY(a.scheduled_at)}` : null,
        overdue: false,
        statuses: [statusKey],
        note: MISSED_NOTE,
      });
      continue;
    }

    if (!OPEN_STATUSES.has(a.encounter_status)) continue; // attended: nothing to do

    if (scheduled !== null && scheduled < now) {
      const later = recordsAfter(a.patient_id, scheduled);
      if (later.some((r) => RESOLVING_OUTCOMES.has(r.contact_outcome ?? ''))) continue;
      const reported = later.find((r) => r.contact_outcome === 'patient_reported_attended');
      items.push({
        ...base,
        key: `attendance:${a.id}`,
        kind: 'attendance_unconfirmed',
        nextAction: reported ? 'Confirm attendance with the clinic' : 'Confirm attendance',
        dueAt: a.scheduled_at,
        dueLabel: `Was due ${formatDateDMY(a.scheduled_at)}`,
        overdue: true,
        statuses: reported ? [statusKey, 'encounter.patient_reported_attended'] : [statusKey],
        note: reported
          ? `${CONTACT_OUTCOME_LABELS.patient_reported_attended.en} recorded ${formatDateDMY(new Date(recordTime(reported)).toISOString())}. Not yet confirmed by the clinic.`
          : null,
      });
      continue;
    }

    if (scheduled !== null && scheduled <= now + FOLLOW_UP_WINDOW_DAYS * DAY) {
      items.push({
        ...base,
        key: `follow_up:${a.id}`,
        kind: 'follow_up',
        nextAction: a.encounter_status === 'requested' ? 'Help confirm the appointment' : 'Remind the patient',
        dueAt: a.scheduled_at,
        dueLabel: `Due ${formatDateDMY(a.scheduled_at)}`,
        overdue: false,
        statuses: [statusKey],
        note: null,
      });
      continue;
    }

    if (scheduled === null && a.encounter_status === 'requested') {
      items.push({
        ...base,
        key: `follow_up:${a.id}`,
        kind: 'follow_up',
        nextAction: 'Help set an appointment date',
        dueAt: null,
        dueLabel: null,
        overdue: false,
        statuses: [statusKey],
        note: null,
      });
    }
  }

  // Open barriers: the latest record of each of this BHW's patients (B-1.5).
  for (const p of patients) {
    if (p.bhw_id !== bhwId) continue;
    const latest = [...(byPatient.get(p.id) ?? [])].sort((a, b) => recordTime(b) - recordTime(a))[0];
    if (!latest) continue;
    const helpNeeded = latest.contact_outcome === 'help_needed';
    if (!latest.barrier && !helpNeeded) continue;
    const label = barrierLabel(latest.barrier);
    items.push({
      key: `barrier:${p.id}`,
      kind: 'barrier',
      patientId: p.id,
      patientName: p.full_name,
      title: label ? `Barrier: ${label}` : 'Help needed',
      nextAction: latest.next_action?.trim() || (label ? `Help with ${label.toLowerCase()}` : 'Find out what help is needed'),
      dueAt: null,
      dueLabel: null,
      overdue: false,
      statuses: [],
      note: `Recorded ${formatDateDMY(new Date(recordTime(latest)).toISOString())}`,
    });
  }

  return items.sort((a, b) => {
    const da = time(a.dueAt);
    const db = time(b.dueAt);
    if (da !== null && db !== null && da !== db) return da - db;
    if (da === null && db !== null) return 1;
    if (da !== null && db === null) return -1;
    return a.patientName.localeCompare(b.patientName);
  });
}

// --- help requests -----------------------------------------------------------

/** One next action per coordination status (B-1.2). */
export function helpRequestNextAction(r: Pick<HelpRequestWithPatient, 'coordination_status' | 'reason'>): string {
  switch (r.coordination_status) {
    case 'assigned':
      return 'Acknowledge this request';
    case 'acknowledged':
      return `Contact the patient about: ${helpReasonLabel(r.reason)}`;
    case 'blocked':
      return 'Raise it with the RHU coordinator';
    default:
      return 'Check this request';
  }
}

// --- map status (B-5.2) --------------------------------------------------------

export interface PatientMapStatus {
  icon: IconName;
  label: string;
}

export function patientMapStatus(
  patient: { id: string; pendingSync?: boolean },
  items: TodayItem[],
  helpRequests: Pick<HelpRequestWithPatient, 'patient_id' | 'coordination_status'>[]
): PatientMapStatus {
  if (patient.pendingSync) return { icon: 'device', label: 'Saved on this device · Waiting to send' };
  if (helpRequests.some((h) => h.patient_id === patient.id && h.coordination_status !== 'completed')) {
    return { icon: 'help', label: 'Help request' };
  }
  const mine = items.filter((i) => i.patientId === patient.id);
  if (mine.some((i) => i.kind === 'missed')) return { icon: 'alert', label: 'Missed appointment' };
  if (mine.some((i) => i.kind === 'attendance_unconfirmed')) return { icon: 'clock', label: 'Attendance not yet confirmed' };
  if (mine.some((i) => i.kind === 'barrier')) return { icon: 'blocked', label: 'Open barrier' };
  if (mine.some((i) => i.kind === 'follow_up')) return { icon: 'calendar', label: 'Follow-up due' };
  return { icon: 'check', label: 'No open items' };
}
