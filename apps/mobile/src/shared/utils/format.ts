import type { AnyRecordType, HealthRecord, RecordType } from '../types/db.types';
import { parseYMD } from './date';

export function ageFromBirthDate(birthDate: string | null | undefined, now = new Date()): number | null {
  if (!birthDate) return null;
  const b = parseYMD(birthDate);
  if (!b) return null;
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

export function formatBP(r: Pick<HealthRecord, 'systolic' | 'diastolic'>): string | null {
  return r.systolic && r.diastolic ? `${r.systolic}/${r.diastolic} mmHg` : null;
}

/** Stage 2 hypertension threshold used for the demo "elevated BP" metric. */
export function isElevatedBP(r: Pick<HealthRecord, 'systolic' | 'diastolic'>): boolean {
  return (r.systolic ?? 0) >= 140 || (r.diastolic ?? 0) >= 90;
}

export const RECORD_TYPE_LABEL: Record<RecordType, string> = {
  visit: 'Home visit',
  health_update: 'Health update',
  appointment: 'Appointment',
};

/** Parses a numeric form field; empty -> null, invalid -> NaN. */
export function parseOptionalNumber(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : NaN;
}

const EXTRA_RECORD_TYPE_LABEL: Record<Exclude<AnyRecordType, RecordType>, string> = {
  vitals: 'Vitals',
  lab_result: 'Lab result',
  note: 'Note',
};

/** Label for any record_type, including the Spec 01 values. Unknown values fall back to the raw text. */
export function recordTypeLabel(type: AnyRecordType | string): string {
  if (type in RECORD_TYPE_LABEL) return RECORD_TYPE_LABEL[type as RecordType];
  if (type in EXTRA_RECORD_TYPE_LABEL) return EXTRA_RECORD_TYPE_LABEL[type as Exclude<AnyRecordType, RecordType>];
  return type;
}

export const NO_READING = 'No reading';

function isMissing(value: number | string | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'number') return !Number.isFinite(value);
  return value.trim() === '';
}

/** A measurement with its unit. A missing value is "No reading", never 0. */
export function formatMeasurement(value: number | string | null | undefined, unit?: string): string {
  if (isMissing(value)) return NO_READING;
  return unit ? `${value} ${unit}` : String(value);
}

/** "132/84", or null when either side is missing (shown as "No reading"). */
export function formatBPValue(systolic: number | null | undefined, diastolic: number | null | undefined): string | null {
  if (isMissing(systolic) || isMissing(diastolic)) return null;
  return `${systolic}/${diastolic}`;
}

/**
 * Metric text: "18 of 30 (60%)". A zero denominator is "No cases"; invalid
 * input (negative, non-integer, numerator > denominator) is "Not available".
 */
export function formatCountOfTotal(numerator: number, denominator: number): string {
  const valid =
    Number.isInteger(numerator) && Number.isInteger(denominator) && numerator >= 0 && denominator >= 0 && numerator <= denominator;
  if (!valid) return 'Not available';
  if (denominator === 0) return 'No cases';
  return `${numerator} of ${denominator} (${Math.round((100 * numerator) / denominator)}%)`;
}
