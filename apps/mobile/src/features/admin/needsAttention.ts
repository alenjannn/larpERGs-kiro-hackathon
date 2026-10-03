// Needs Attention: exceptions only (brief §6). Pure functions, no React.

import type { BHW, HealthRecord, HelpRequestWithPatient, Patient } from '../../shared/types/db.types';

export const DAY_MS = 86_400_000;
export const INACTIVE_DAYS = 3;
export const REVIEW_OVERDUE_DAYS = 3;
export const BLOCKED_OVERDUE_DAYS = 7;

function ms(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Inactive = marked inactive, or no field activity for more than 3 days. */
export function isBHWInactive(bhw: BHW, now = Date.now()): boolean {
  if (bhw.status === 'inactive') return true;
  const last = ms(bhw.last_active_at);
  return last !== null && now - last > INACTIVE_DAYS * DAY_MS;
}

/** BHWs that can own new work. */
export function availableBHWs(bhws: BHW[], now = Date.now()): BHW[] {
  return bhws.filter((b) => !isBHWInactive(b, now));
}

export function isActiveOwner(bhwId: string | null | undefined, bhws: BHW[], now = Date.now()): boolean {
  if (!bhwId) return false;
  const bhw = bhws.find((b) => b.id === bhwId);
  return !!bhw && !isBHWInactive(bhw, now);
}

/** "6 days", "3 hrs", "12 min", "just now". */
export function formatAge(ageMs: number | null): string {
  if (ageMs === null || !Number.isFinite(ageMs)) return 'no activity recorded';
  const mins = Math.max(0, Math.floor(ageMs / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'}`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}

export interface AgedRequest {
  request: HelpRequestWithPatient;
  ageMs: number;
}
export interface AgedPatient {
  patient: Patient;
  ageMs: number;
}
export interface AgedReview {
  record: HealthRecord;
  patientName: string;
  ageMs: number;
}
export interface InactiveBHW {
  bhw: BHW;
  /** null when no activity was ever recorded. */
  ageMs: number | null;
  patientCount: number;
  openRequestCount: number;
}

export interface NeedsAttention {
  unassignedRequests: AgedRequest[];
  unassignedPatients: AgedPatient[];
  overdueReviews: AgedReview[];
  blockedRequests: AgedRequest[];
  /** Blocked requests younger than the 7-day threshold (shown as a count only). */
  newerBlockedCount: number;
  inactiveBHWs: InactiveBHW[];
}

export interface NeedsAttentionInput {
  bhws: BHW[];
  patients: Patient[];
  records: HealthRecord[];
  helpRequests: HelpRequestWithPatient[];
}

const oldestFirst = <T extends { ageMs: number | null }>(a: T, b: T) => (b.ageMs ?? Infinity) - (a.ageMs ?? Infinity);

export function buildNeedsAttention({ bhws, patients, records, helpRequests }: NeedsAttentionInput, now = Date.now()): NeedsAttention {
  const bhwIds = new Set(bhws.map((b) => b.id));
  const patientName = new Map(patients.map((p) => [p.id, p.full_name]));
  const age = (iso: string | null | undefined) => {
    const t = ms(iso);
    return t === null ? 0 : Math.max(0, now - t);
  };

  const unassignedRequests = helpRequests
    .filter((r) => r.coordination_status === 'unassigned' || (r.coordination_status !== 'completed' && !r.assigned_bhw_id))
    .map((request) => ({ request, ageMs: age(request.received_at) }))
    .sort(oldestFirst);

  const unassignedPatients = patients
    .filter((p) => !p.bhw_id || !bhwIds.has(p.bhw_id))
    .map((patient) => ({ patient, ageMs: age(patient.created_at) }))
    .sort(oldestFirst);

  const overdueReviews = records
    .filter((r) => r.review_status === 'awaiting_clinical_review' && r.transcription_status !== 'pending')
    .map((record) => ({ record, patientName: patientName.get(record.patient_id) ?? 'Patient', ageMs: age(record.created_at) }))
    .filter((r) => r.ageMs > REVIEW_OVERDUE_DAYS * DAY_MS)
    .sort(oldestFirst);

  const blocked = helpRequests
    .filter((r) => r.coordination_status === 'blocked')
    .map((request) => ({ request, ageMs: age(request.received_at) }));
  const blockedRequests = blocked.filter((b) => b.ageMs > BLOCKED_OVERDUE_DAYS * DAY_MS).sort(oldestFirst);

  const inactiveBHWs = bhws
    .filter((b) => isBHWInactive(b, now))
    .map((bhw) => {
      const last = ms(bhw.last_active_at);
      return {
        bhw,
        ageMs: last === null ? null : Math.max(0, now - last),
        patientCount: patients.filter((p) => p.bhw_id === bhw.id).length,
        openRequestCount: helpRequests.filter((r) => r.assigned_bhw_id === bhw.id && r.coordination_status !== 'completed').length,
      };
    })
    .sort(oldestFirst);

  return {
    unassignedRequests,
    unassignedPatients,
    overdueReviews,
    blockedRequests,
    newerBlockedCount: blocked.length - blockedRequests.length,
    inactiveBHWs,
  };
}
