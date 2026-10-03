// Manual clearbook entry (Spec 03, design §3.3, K1–K3). Pure: no React imports.
// Glucose only (K2). Stored with origin 'patient' (records.source stays the
// transport column, 'online'), transcription 'confirmed', review 'awaiting'.

import type { GlucoseTestType, GlucoseUnit, HealthRecord } from '../../../shared/types/db.types';
import { parseYMD } from '../../../shared/utils/date';
import { parseOptionalNumber } from '../../../shared/utils/format';

export type ShareStatus = 'local' | 'sending' | 'synced' | 'failed';

export interface ClearbookEntry {
  v: 1;
  id: string;
  patient_id: string;
  bhw_id: string | null;
  glucose_value: number;
  glucose_unit: GlucoseUnit;
  glucose_test_type: GlucoseTestType;
  /** YYYY-MM-DD as entered. */
  test_date: string;
  /** ISO: the test date at 12:00 local time. */
  measured_at: string;
  created_on_device_at: string;
  _share_status: ShareStatus;
  _last_error: string | null;
  _shared_at: string | null;
}

/** Exactly the columns sent to `records` for a patient entry. */
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
>;

export const ENTRY_PREFIX = 'tuloy:v1:patient_entries:' as const;
export const ENTRY_TITLE = 'Blood glucose (entered by patient)';
export const GLUCOSE_MAX = 99999.9;
export const ENTRY_CONFLICT_ERROR = 'A different record with this ID exists. Nothing was overwritten.';

export const GLUCOSE_UNITS: GlucoseUnit[] = ['mg/dL', 'mmol/L'];
export const GLUCOSE_TEST_TYPES: GlucoseTestType[] = ['fasting', 'random', 'post_meal'];

export interface EntryDraft {
  testType: GlucoseTestType | null;
  value: string;
  unit: GlucoseUnit | null;
  testDate: string;
}

export type EntryErrors = Partial<Record<keyof EntryDraft, string>>;

export type EntryValidation = { ok: true; value: number; date: Date } | { ok: false; errors: EntryErrors };

export function validateEntry(d: EntryDraft, now = Date.now()): EntryValidation {
  const errors: EntryErrors = {};
  if (!d.testType || !GLUCOSE_TEST_TYPES.includes(d.testType)) errors.testType = 'Choose the test type on your paper.';
  if (!d.unit || !GLUCOSE_UNITS.includes(d.unit)) errors.unit = 'Choose the unit on your paper.';

  const value = parseOptionalNumber(d.value);
  if (value === null) errors.value = 'Enter the value from your paper.';
  else if (!Number.isFinite(value)) errors.value = 'Enter a number, for example 110 or 6.1.';
  else if (value <= 0 || value > GLUCOSE_MAX) errors.value = 'Enter a value greater than 0 and up to 99999.9.';
  else if (Math.abs(value * 10 - Math.round(value * 10)) > 1e-6) errors.value = 'Use at most one decimal place.';

  const date = d.testDate.trim() ? parseYMD(d.testDate) : null;
  if (!d.testDate.trim()) errors.testDate = 'Enter the test date (YYYY-MM-DD).';
  else if (!date) errors.testDate = 'Use the format YYYY-MM-DD, for example 2026-09-27.';
  else {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    if (date.getTime() > today.getTime()) errors.testDate = 'The test date cannot be in the future.';
  }

  if (Object.keys(errors).length > 0 || value === null || !date) return { ok: false, errors };
  return { ok: true, value, date };
}

export function buildEntry(
  d: EntryDraft,
  ids: { id: string; patientId: string; bhwId: string | null },
  now = Date.now()
): ClearbookEntry {
  const check = validateEntry(d, now);
  if (!check.ok || !d.testType || !d.unit) throw new Error('The entry is not complete.');
  const measured = new Date(check.date);
  measured.setHours(12, 0, 0, 0);
  return {
    v: 1,
    id: ids.id,
    patient_id: ids.patientId,
    bhw_id: ids.bhwId,
    glucose_value: check.value,
    glucose_unit: d.unit,
    glucose_test_type: d.testType,
    test_date: d.testDate.trim(),
    measured_at: measured.toISOString(),
    created_on_device_at: new Date(now).toISOString(),
    _share_status: 'local',
    _last_error: null,
    _shared_at: null,
  };
}

export function isClearbookEntry(v: unknown): v is ClearbookEntry {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Record<string, unknown>;
  return (
    e.v === 1 &&
    typeof e.id === 'string' &&
    typeof e.patient_id === 'string' &&
    typeof e.glucose_value === 'number' &&
    typeof e.glucose_unit === 'string' &&
    GLUCOSE_UNITS.includes(e.glucose_unit as GlucoseUnit) &&
    typeof e.glucose_test_type === 'string' &&
    GLUCOSE_TEST_TYPES.includes(e.glucose_test_type as GlucoseTestType) &&
    typeof e.measured_at === 'string' &&
    typeof e.created_on_device_at === 'string' &&
    (e._share_status === 'local' || e._share_status === 'sending' || e._share_status === 'synced' || e._share_status === 'failed')
  );
}

export function toInsertRow(e: ClearbookEntry): PatientLabInsert {
  return {
    id: e.id,
    local_id: e.id,
    patient_id: e.patient_id,
    bhw_id: e.bhw_id,
    record_type: 'lab_result',
    title: ENTRY_TITLE,
    notes: null,
    source: 'online',
    origin: 'patient',
    transcription_status: 'confirmed',
    review_status: 'awaiting_clinical_review',
    measured_at: e.measured_at,
    glucose_value: e.glucose_value,
    glucose_unit: e.glucose_unit,
    glucose_test_type: e.glucose_test_type,
    created_on_device_at: e.created_on_device_at,
  };
}

/** A local entry as a record, so measurement logic and lists can use it. */
export function entryToRecord(e: ClearbookEntry): HealthRecord {
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

export function sameEntryContent(e: ClearbookEntry, r: HealthRecord): boolean {
  return (
    r.id === e.id &&
    r.patient_id === e.patient_id &&
    Number(r.glucose_value) === e.glucose_value &&
    r.glucose_unit === e.glucose_unit &&
    r.glucose_test_type === e.glucose_test_type &&
    !!r.measured_at &&
    Date.parse(r.measured_at) === Date.parse(e.measured_at)
  );
}

/** Server records win by id; local-only entries are appended. */
export function mergeRecords(server: HealthRecord[], entries: ClearbookEntry[]): HealthRecord[] {
  const ids = new Set(server.map((r) => r.id));
  return [...server, ...entries.filter((e) => !ids.has(e.id)).map(entryToRecord)];
}
