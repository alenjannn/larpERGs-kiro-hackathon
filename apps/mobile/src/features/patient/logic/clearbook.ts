// Manual clearbook entry (Spec 03, design §3.3, K1–K3; Spec 06 labs). Pure: no React imports.
// Labs: blood glucose (with its test type), serum creatinine, total cholesterol.
// Stored with origin 'patient' (records.source stays the transport column,
// 'online'), transcription 'confirmed', review 'awaiting'. No interpretation.

import type { GlucoseTestType, GlucoseUnit, HealthRecord } from '../../../shared/types/db.types';
import { parseYMD } from '../../../shared/utils/date';
import { parseOptionalNumber } from '../../../shared/utils/format';
import type { CholesterolUnit, CreatinineUnit, LabColumns, PatientRecord } from '../types/patient.types';

export type ShareStatus = 'local' | 'sending' | 'synced' | 'failed';
export type LabKind = 'glucose' | 'creatinine' | 'cholesterol';
export type LabUnit = GlucoseUnit | CreatinineUnit | CholesterolUnit;

interface EntryBase {
  v: 1;
  id: string;
  patient_id: string;
  bhw_id: string | null;
  /** YYYY-MM-DD as entered. */
  test_date: string;
  /** ISO: the test date at 12:00 local time. */
  measured_at: string;
  created_on_device_at: string;
  _share_status: ShareStatus;
  _last_error: string | null;
  _shared_at: string | null;
}

/** Entries saved before Spec 06 have no `lab` field; they are glucose. */
export interface GlucoseEntry extends EntryBase {
  lab?: 'glucose';
  glucose_value: number;
  glucose_unit: GlucoseUnit;
  glucose_test_type: GlucoseTestType;
}

export interface CreatinineEntry extends EntryBase {
  lab: 'creatinine';
  creatinine_value: number;
  creatinine_unit: CreatinineUnit;
}

export interface CholesterolEntry extends EntryBase {
  lab: 'cholesterol';
  cholesterol_value: number;
  cholesterol_unit: CholesterolUnit;
}

export type ClearbookEntry = GlucoseEntry | CreatinineEntry | CholesterolEntry;

/**
 * Exactly the columns sent to `records` for a patient entry. Only the columns
 * of the entry's own lab are sent, so a glucose entry still shares when the
 * Spec 06 columns have not been added to the database yet.
 */
export type PatientLabInsert = Pick<
  HealthRecord,
  | 'id'
  | 'patient_id'
  | 'bhw_id'
  | 'record_type'
  | 'title'
  | 'notes'
  | 'local_id'
  | 'source'
  | 'measured_at'
  | 'glucose_value'
  | 'glucose_unit'
  | 'glucose_test_type'
  | 'origin'
  | 'transcription_status'
  | 'review_status'
  | 'created_on_device_at'
> &
  LabColumns;

export const ENTRY_PREFIX = 'tuloy:v1:patient_entries:' as const;
export const ENTRY_CONFLICT_ERROR = 'A different record with this ID exists. Nothing was overwritten.';

export const LAB_KINDS: LabKind[] = ['glucose', 'creatinine', 'cholesterol'];

export const LAB_LABELS: Record<LabKind, string> = {
  glucose: 'Blood glucose',
  creatinine: 'Serum creatinine',
  cholesterol: 'Total cholesterol',
};

/** Records title per lab (kept for glucose as before Spec 06). */
export const LAB_TITLES: Record<LabKind, string> = {
  glucose: 'Blood glucose (entered by patient)',
  creatinine: 'Serum creatinine (entered by patient)',
  cholesterol: 'Total cholesterol (entered by patient)',
};

export const GLUCOSE_UNITS: GlucoseUnit[] = ['mg/dL', 'mmol/L'];
export const CREATININE_UNITS: CreatinineUnit[] = ['mg/dL', 'umol/L'];
export const CHOLESTEROL_UNITS: CholesterolUnit[] = ['mg/dL', 'mmol/L'];
export const LAB_UNITS: Record<LabKind, readonly LabUnit[]> = {
  glucose: GLUCOSE_UNITS,
  creatinine: CREATININE_UNITS,
  cholesterol: CHOLESTEROL_UNITS,
};
export const GLUCOSE_TEST_TYPES: GlucoseTestType[] = ['fasting', 'random', 'post_meal'];

/** Bounds match the database columns: glucose NUMERIC(6,1), the others NUMERIC(7,2). */
const LAB_LIMITS: Record<LabKind, { max: number; decimals: number; example: string; placeholder: string }> = {
  glucose: { max: 99999.9, decimals: 1, example: '110 or 6.1', placeholder: 'For example 110' },
  creatinine: { max: 99999.99, decimals: 2, example: '0.85 or 75', placeholder: 'For example 0.85' },
  cholesterol: { max: 99999.99, decimals: 2, example: '190 or 4.92', placeholder: 'For example 190' },
};

export function labPlaceholder(lab: LabKind | null): string {
  return LAB_LIMITS[lab ?? 'glucose'].placeholder;
}

export interface EntryDraft {
  /** Which lab test is on the paper. Required. */
  lab: LabKind | null;
  /** Glucose test type (fasting, random, after a meal). Required for glucose only. */
  testType: GlucoseTestType | null;
  value: string;
  unit: LabUnit | null;
  testDate: string;
}

export const EMPTY_DRAFT: EntryDraft = { lab: null, testType: null, value: '', unit: null, testDate: '' };

export type EntryErrors = Partial<Record<keyof EntryDraft, string>>;

export type EntryValidation = { ok: true; value: number; date: Date; lab: LabKind } | { ok: false; errors: EntryErrors };

function hasAtMostDecimals(value: number, decimals: number): boolean {
  const f = 10 ** decimals;
  return Math.abs(value * f - Math.round(value * f)) <= 1e-6;
}

export function validateEntry(d: EntryDraft, now = Date.now()): EntryValidation {
  const errors: EntryErrors = {};
  const lab = d.lab && LAB_KINDS.includes(d.lab) ? d.lab : null;
  if (!lab) errors.lab = 'Choose the test on your paper.';
  if (lab === 'glucose' && (!d.testType || !GLUCOSE_TEST_TYPES.includes(d.testType))) {
    errors.testType = 'Choose the glucose test type on your paper.';
  }
  if (!d.unit || (lab && !LAB_UNITS[lab].includes(d.unit))) errors.unit = 'Choose the unit on your paper.';

  const limits = LAB_LIMITS[lab ?? 'glucose'];
  const value = parseOptionalNumber(d.value);
  if (value === null) errors.value = 'Enter the value from your paper.';
  else if (!Number.isFinite(value)) errors.value = `Enter a number, for example ${limits.example}.`;
  else if (value <= 0 || value > limits.max) errors.value = `Enter a value greater than 0 and up to ${limits.max}.`;
  else if (!hasAtMostDecimals(value, limits.decimals)) {
    errors.value = limits.decimals === 1 ? 'Use at most one decimal place.' : 'Use at most two decimal places.';
  }

  const date = d.testDate.trim() ? parseYMD(d.testDate) : null;
  if (!d.testDate.trim()) errors.testDate = 'Enter the test date (YYYY-MM-DD).';
  else if (!date) errors.testDate = 'Use the format YYYY-MM-DD, for example 2026-09-27.';
  else {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    if (date.getTime() > today.getTime()) errors.testDate = 'The test date cannot be in the future.';
  }

  if (Object.keys(errors).length > 0 || value === null || !date || !lab) return { ok: false, errors };
  return { ok: true, value, date, lab };
}

export function buildEntry(
  d: EntryDraft,
  ids: { id: string; patientId: string; bhwId: string | null },
  now = Date.now()
): ClearbookEntry {
  const check = validateEntry(d, now);
  if (!check.ok || !d.unit) throw new Error('The entry is not complete.');
  const measured = new Date(check.date);
  measured.setHours(12, 0, 0, 0);
  const base: EntryBase = {
    v: 1,
    id: ids.id,
    patient_id: ids.patientId,
    bhw_id: ids.bhwId,
    test_date: d.testDate.trim(),
    measured_at: measured.toISOString(),
    created_on_device_at: new Date(now).toISOString(),
    _share_status: 'local',
    _last_error: null,
    _shared_at: null,
  };
  switch (check.lab) {
    case 'creatinine':
      return { ...base, lab: 'creatinine', creatinine_value: check.value, creatinine_unit: d.unit as CreatinineUnit };
    case 'cholesterol':
      return { ...base, lab: 'cholesterol', cholesterol_value: check.value, cholesterol_unit: d.unit as CholesterolUnit };
    case 'glucose':
      if (!d.testType) throw new Error('The entry is not complete.');
      return { ...base, lab: 'glucose', glucose_value: check.value, glucose_unit: d.unit as GlucoseUnit, glucose_test_type: d.testType };
  }
}

export function entryLab(e: ClearbookEntry): LabKind {
  return e.lab ?? 'glucose';
}

/** Value and unit as entered, e.g. { value: 0.85, unit: 'mg/dL' }. */
export function entryValue(e: ClearbookEntry): { value: number; unit: LabUnit } {
  if (e.lab === 'creatinine') return { value: e.creatinine_value, unit: e.creatinine_unit };
  if (e.lab === 'cholesterol') return { value: e.cholesterol_value, unit: e.cholesterol_unit };
  return { value: e.glucose_value, unit: e.glucose_unit };
}

function includes<T extends string>(list: readonly T[], v: unknown): v is T {
  return typeof v === 'string' && (list as readonly string[]).includes(v);
}

export function isClearbookEntry(v: unknown): v is ClearbookEntry {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Record<string, unknown>;
  const baseOk =
    e.v === 1 &&
    typeof e.id === 'string' &&
    typeof e.patient_id === 'string' &&
    typeof e.measured_at === 'string' &&
    typeof e.created_on_device_at === 'string' &&
    (e._share_status === 'local' || e._share_status === 'sending' || e._share_status === 'synced' || e._share_status === 'failed');
  if (!baseOk) return false;
  switch (e.lab) {
    case 'creatinine':
      return typeof e.creatinine_value === 'number' && includes(CREATININE_UNITS, e.creatinine_unit);
    case 'cholesterol':
      return typeof e.cholesterol_value === 'number' && includes(CHOLESTEROL_UNITS, e.cholesterol_unit);
    case undefined:
    case 'glucose':
      return (
        typeof e.glucose_value === 'number' &&
        includes(GLUCOSE_UNITS, e.glucose_unit) &&
        includes(GLUCOSE_TEST_TYPES, e.glucose_test_type)
      );
    default:
      return false;
  }
}

export function toInsertRow(e: ClearbookEntry): PatientLabInsert {
  const base = {
    id: e.id,
    local_id: e.id,
    patient_id: e.patient_id,
    bhw_id: e.bhw_id,
    record_type: 'lab_result' as const,
    title: LAB_TITLES[entryLab(e)],
    notes: null,
    source: 'online' as const,
    origin: 'patient' as const,
    transcription_status: 'confirmed' as const,
    review_status: 'awaiting_clinical_review' as const,
    measured_at: e.measured_at,
    created_on_device_at: e.created_on_device_at,
  };
  if (e.lab === 'creatinine') return { ...base, creatinine_value: e.creatinine_value, creatinine_unit: e.creatinine_unit };
  if (e.lab === 'cholesterol') return { ...base, cholesterol_value: e.cholesterol_value, cholesterol_unit: e.cholesterol_unit };
  return { ...base, glucose_value: e.glucose_value, glucose_unit: e.glucose_unit, glucose_test_type: e.glucose_test_type };
}

/** A local entry as a record, so measurement logic and lists can use it. */
export function entryToRecord(e: ClearbookEntry): PatientRecord {
  return {
    ...toInsertRow(e),
    systolic: null,
    diastolic: null,
    temperature_c: null,
    weight_kg: null,
    height_cm: null,
    scheduled_at: null,
    status: null,
    created_at: e.created_on_device_at,
  };
}

export function sameEntryContent(e: ClearbookEntry, r: PatientRecord): boolean {
  const common =
    r.id === e.id &&
    r.patient_id === e.patient_id &&
    !!r.measured_at &&
    Date.parse(r.measured_at) === Date.parse(e.measured_at);
  if (!common) return false;
  if (e.lab === 'creatinine') return Number(r.creatinine_value) === e.creatinine_value && r.creatinine_unit === e.creatinine_unit;
  if (e.lab === 'cholesterol') return Number(r.cholesterol_value) === e.cholesterol_value && r.cholesterol_unit === e.cholesterol_unit;
  return Number(r.glucose_value) === e.glucose_value && r.glucose_unit === e.glucose_unit && r.glucose_test_type === e.glucose_test_type;
}

/** Server records win by id; local-only entries are appended. */
export function mergeRecords(server: PatientRecord[], entries: ClearbookEntry[]): PatientRecord[] {
  const ids = new Set(server.map((r) => r.id));
  return [...server, ...entries.filter((e) => !ids.has(e.id)).map(entryToRecord)];
}
