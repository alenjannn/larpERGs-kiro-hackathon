// Summary metrics (brief §6): operational counts for tracked people only.
// Never prevalence, population screening coverage or NCD control.
// Pure functions, no React.

import type { StatusKey } from '../../shared/status';
import type { Appointment, BHW, HealthRecord, HelpRequestWithPatient, Patient, YakapStage } from '../../shared/types/db.types';
import { DAY_MS, isActiveOwner } from './needsAttention';

export type PeriodDays = 30 | 90 | 180;
export const PERIODS: PeriodDays[] = [30, 90, 180];
export const DEFAULT_PERIOD: PeriodDays = 180;

export type MetricKey = 'first_checkup' | 'follow_up' | 'clinical_review' | 'ownership';

export interface MetricCase {
  id: string;
  title: string;
  detail: string;
  /** Bucket name used for grouping, e.g. "Unknown". */
  bucket: string;
  status: StatusKey | null;
}

export interface Metric {
  key: MetricKey;
  label: string;
  numerator: number;
  denominator: number;
  unknown: number;
  /** Whether the unknown cases are inside the denominator. */
  unknownInDenominator: boolean;
  period: string;
  cohort: string;
  action: string;
  cases: MetricCase[];
}

export interface FollowUpBreakdown {
  completed: number;
  missed: number;
  rescheduled: number;
  unknown: number;
}

export interface SummaryMetrics {
  metrics: Record<MetricKey, Metric>;
  followUpBreakdown: FollowUpBreakdown;
  /** False if the breakdown does not reconcile to the denominator (shown as a warning). */
  breakdownReconciles: boolean;
}

export interface SummaryInput {
  patients: Patient[];
  appointments: Appointment[];
  records: HealthRecord[];
  helpRequests: HelpRequestWithPatient[];
  bhws: BHW[];
}

export const COHORT_RULE = 'No patients are marked transferred out or excluded in this demo, so every tracked patient counts.';
export const OPERATIONAL_NOTE =
  'Operational follow-through for patients tracked in Tuloy only. These are not disease rates or coverage of all residents.';

/** YAKAP stages that only follow a completed first checkup. */
const AFTER_CHECKUP: YakapStage[] = ['tests_requested', 'results_review_pending', 'plan_available', 'continued_monitoring'];

function t(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const v = new Date(iso).getTime();
  return Number.isNaN(v) ? null : v;
}

function uniqueById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => !seen.has(r.id) && !!seen.add(r.id));
}

export function periodLabel(period: PeriodDays): string {
  return `Last ${period} days`;
}

export function computeSummary(input: SummaryInput, period: PeriodDays, now = Date.now()): SummaryMetrics {
  const patients = uniqueById(input.patients);
  const appointments = uniqueById(input.appointments);
  const records = uniqueById(input.records);
  const helpRequests = uniqueById(input.helpRequests);
  const start = now - period * DAY_MS;
  const inPeriod = (iso: string | null | undefined) => {
    const v = t(iso);
    return v !== null && v >= start && v <= now;
  };
  const name = new Map(patients.map((p) => [p.id, p.full_name]));
  const bhwName = new Map(input.bhws.map((b) => [b.id, b.full_name]));
  const apptsByPatient = new Map<string, Appointment[]>();
  for (const a of appointments) apptsByPatient.set(a.patient_id, [...(apptsByPatient.get(a.patient_id) ?? []), a]);

  // 1. First-checkup completion ------------------------------------------------
  const cohort = patients.filter((p) => inPeriod(p.created_at));
  const firstCases: MetricCase[] = cohort.map((p) => {
    const appts = apptsByPatient.get(p.id) ?? [];
    const confirmed =
      appts.some((a) => a.encounter_status === 'clinic_confirmed_attended') || (!!p.yakap_stage && AFTER_CHECKUP.includes(p.yakap_stage));
    if (confirmed) return { id: p.id, title: p.full_name, detail: 'First checkup confirmed', bucket: 'Confirmed', status: 'encounter.clinic_confirmed_attended' };
    const reported = appts.find((a) => a.encounter_status === 'patient_reported_attended');
    const pastDue = appts.find((a) => (a.encounter_status === 'requested' || a.encounter_status === 'confirmed') && (t(a.scheduled_at) ?? Infinity) <= now);
    if (reported || pastDue) {
      const a = (reported ?? pastDue) as Appointment;
      return {
        id: p.id,
        title: p.full_name,
        detail: `Attendance not confirmed · ${a.purpose}`,
        bucket: 'Unknown',
        status: `encounter.${a.encounter_status}` as StatusKey,
      };
    }
    const upcoming = appts.find((a) => a.encounter_status === 'requested' || a.encounter_status === 'confirmed');
    return {
      id: p.id,
      title: p.full_name,
      detail: upcoming ? `Checkup planned · ${upcoming.purpose}` : 'Needs scheduling',
      bucket: 'Not yet',
      status: upcoming ? (`encounter.${upcoming.encounter_status}` as StatusKey) : null,
    };
  });

  // 2. Confirmed follow-up attendance ------------------------------------------
  const due = appointments.filter((a) => inPeriod(a.scheduled_at));
  const breakdown: FollowUpBreakdown = { completed: 0, missed: 0, rescheduled: 0, unknown: 0 };
  const followCases: MetricCase[] = due.map((a) => {
    const bucket =
      a.encounter_status === 'clinic_confirmed_attended'
        ? 'completed'
        : a.encounter_status === 'missed'
          ? 'missed'
          : a.encounter_status === 'rescheduled'
            ? 'rescheduled'
            : 'unknown';
    breakdown[bucket] += 1;
    const label = { completed: 'Completed', missed: 'Confirmed missed', rescheduled: 'Rescheduled', unknown: 'Unknown' }[bucket];
    return {
      id: a.id,
      title: name.get(a.patient_id) ?? 'Patient',
      detail: a.purpose,
      bucket: label,
      status: `encounter.${a.encounter_status}` as StatusKey,
    };
  });
  const breakdownSum = breakdown.completed + breakdown.missed + breakdown.rescheduled + breakdown.unknown;

  // 3. Clinical review completion ------------------------------------------------
  const resultSets = records.filter((r) => r.review_status && inPeriod(r.created_at));
  const unknownResults = records.filter((r) => r.record_type === 'lab_result' && !r.review_status && inPeriod(r.created_at));
  const reviewCases: MetricCase[] = [
    ...resultSets.map((r) => ({
      id: r.id,
      title: name.get(r.patient_id) ?? 'Patient',
      detail: r.title,
      bucket: r.review_status === 'plan_released' ? 'Review completed' : 'Awaiting review',
      status: `clinical.${r.review_status}` as StatusKey,
    })),
    ...unknownResults.map((r) => ({
      id: r.id,
      title: name.get(r.patient_id) ?? 'Patient',
      detail: r.title,
      bucket: 'Unknown (not counted)',
      status: r.transcription_status === 'pending' ? ('clinical.transcription_pending' as StatusKey) : null,
    })),
  ];

  // 4. Task ownership coverage (open now) ---------------------------------------
  const knownBHW = new Set(input.bhws.map((b) => b.id));
  const openRequests = helpRequests.filter((r) => r.coordination_status !== 'completed');
  const openAppts = appointments.filter((a) => a.encounter_status === 'requested' || a.encounter_status === 'confirmed');
  const ownerCase = (id: string, title: string, detail: string, owner: string | null, status: StatusKey): MetricCase => {
    const bucket = !owner
      ? 'No owner'
      : !knownBHW.has(owner)
        ? 'Unknown owner'
        : isActiveOwner(owner, input.bhws, now)
          ? 'Active owner'
          : 'Owner inactive';
    const ownerText = owner ? bhwName.get(owner) ?? 'unknown BHW' : 'no owner';
    return { id, title, detail: `${detail} · ${ownerText}`, bucket, status };
  };
  const ownershipCases = [
    ...openRequests.map((r) =>
      ownerCase(r.id, r.patient?.full_name ?? name.get(r.patient_id) ?? 'Patient', 'Help request', r.assigned_bhw_id, `coordination.${r.coordination_status}` as StatusKey)
    ),
    ...openAppts.map((a) =>
      ownerCase(a.id, name.get(a.patient_id) ?? 'Patient', `Appointment · ${a.purpose}`, a.owner_bhw_id, `encounter.${a.encounter_status}` as StatusKey)
    ),
  ];

  const metrics: Record<MetricKey, Metric> = {
    first_checkup: {
      key: 'first_checkup',
      label: 'First-checkup completion',
      numerator: firstCases.filter((c) => c.bucket === 'Confirmed').length,
      denominator: cohort.length,
      unknown: firstCases.filter((c) => c.bucket === 'Unknown').length,
      unknownInDenominator: true,
      period: periodLabel(period),
      cohort: 'Tracked patients onboarded in the period',
      action: 'Find who needs scheduling or attendance confirmation.',
      cases: firstCases,
    },
    follow_up: {
      key: 'follow_up',
      label: 'Confirmed follow-up attendance',
      numerator: breakdown.completed,
      denominator: due.length,
      unknown: breakdown.unknown,
      unknownInDenominator: true,
      period: periodLabel(period),
      cohort: 'Tracked appointments due in the period',
      action: 'Separate unknown, confirmed missed, rescheduled and completed cases.',
      cases: followCases,
    },
    clinical_review: {
      key: 'clinical_review',
      label: 'Clinical review completion',
      numerator: resultSets.filter((r) => r.review_status === 'plan_released').length,
      denominator: resultSets.length,
      unknown: unknownResults.length,
      unknownInDenominator: false,
      period: periodLabel(period),
      cohort: 'Result sets received in the period that require review',
      action: 'Route pending reviews to the clinician.',
      cases: reviewCases,
    },
    ownership: {
      key: 'ownership',
      label: 'Task ownership coverage',
      numerator: ownershipCases.filter((c) => c.bucket === 'Active owner').length,
      denominator: ownershipCases.length,
      unknown: ownershipCases.filter((c) => c.bucket === 'Unknown owner').length,
      unknownInDenominator: true,
      period: 'Open now',
      cohort: 'Open help requests and open appointments',
      action: 'Assign or reassign remaining tasks.',
      cases: ownershipCases,
    },
  };

  return { metrics, followUpBreakdown: breakdown, breakdownReconciles: breakdownSum === due.length };
}
