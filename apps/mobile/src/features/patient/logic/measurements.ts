// Measurement rules (Spec 03, design §3.2). Pure: no React imports.
// A missing value is skipped (shown as "No reading"), never turned into 0.

import type { GlucoseTestType, HealthRecord } from '../../../shared/types/db.types';

export type MeasureKey = 'bp' | 'glucose' | 'weight' | 'height';

export const MEASURE_LABELS: Record<MeasureKey, string> = {
  bp: 'Blood pressure',
  glucose: 'Blood glucose',
  weight: 'Weight',
  height: 'Height',
};

export const GLUCOSE_TEST_LABELS: Record<GlucoseTestType, string> = {
  fasting: 'Fasting',
  random: 'Random',
  post_meal: 'After a meal',
};

export interface Reading {
  recordId: string;
  key: MeasureKey;
  /** Preformatted value, e.g. "132/84" or "61". */
  value: string;
  unit: string;
  context?: string;
  date: string | null;
  dateKind: 'measured' | 'recorded';
  sortTime: number;
}

const DAY_MS = 86_400_000;
export const OLDER_READING_DAYS = 90;

function finite(n: number | null | undefined): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

/** measured_at, else created_at labelled "recorded". */
export function measuredDate(r: HealthRecord): { date: string | null; kind: 'measured' | 'recorded' } {
  if (r.measured_at && Number.isFinite(Date.parse(r.measured_at))) return { date: r.measured_at, kind: 'measured' };
  if (r.created_at && Number.isFinite(Date.parse(r.created_at))) return { date: r.created_at, kind: 'recorded' };
  return { date: null, kind: 'recorded' };
}

function trimNumber(n: number): string {
  return String(Number(n.toFixed(1)));
}

function toReading(r: HealthRecord, key: MeasureKey): Reading | null {
  const { date, kind } = measuredDate(r);
  const base = { recordId: r.id, key, date, dateKind: kind, sortTime: date ? Date.parse(date) : -Infinity };
  switch (key) {
    case 'bp':
      if (!finite(r.systolic) || !finite(r.diastolic)) return null;
      return { ...base, value: `${r.systolic}/${r.diastolic}`, unit: 'mmHg' };
    case 'glucose': {
      const value = r.glucose_value === null || r.glucose_value === undefined ? null : Number(r.glucose_value);
      if (!finite(value) || !r.glucose_unit || !r.glucose_test_type) return null;
      return { ...base, value: trimNumber(value), unit: r.glucose_unit, context: GLUCOSE_TEST_LABELS[r.glucose_test_type] };
    }
    case 'weight': {
      const value = r.weight_kg === null || r.weight_kg === undefined ? null : Number(r.weight_kg);
      return finite(value) ? { ...base, value: trimNumber(value), unit: 'kg' } : null;
    }
    case 'height': {
      const value = r.height_cm === null || r.height_cm === undefined ? null : Number(r.height_cm);
      return finite(value) ? { ...base, value: trimNumber(value), unit: 'cm' } : null;
    }
  }
}

/** Readings of one measure, newest first, de-duplicated by record id. */
export function readingsFor(records: HealthRecord[], key: MeasureKey): Reading[] {
  const seen = new Set<string>();
  const out: Reading[] = [];
  for (const r of records) {
    if (seen.has(r.id)) continue;
    const reading = toReading(r, key);
    if (reading) {
      seen.add(r.id);
      out.push(reading);
    }
  }
  return out.sort((a, b) => b.sortTime - a.sortTime);
}

export function latestMeasurements(records: HealthRecord[]): Record<MeasureKey, Reading | null> {
  return {
    bp: readingsFor(records, 'bp')[0] ?? null,
    glucose: readingsFor(records, 'glucose')[0] ?? null,
    weight: readingsFor(records, 'weight')[0] ?? null,
    height: readingsFor(records, 'height')[0] ?? null,
  };
}

/** More than 90 days before now. */
export function isOlderReading(date: string | null | undefined, now = Date.now()): boolean {
  if (!date) return false;
  const t = Date.parse(date);
  return Number.isFinite(t) && now - t > OLDER_READING_DAYS * DAY_MS;
}

export interface TrendPoint {
  recordId: string;
  t: number;
  systolic: number;
  diastolic: number;
  date: string;
}

/** Only readings with a real measured_at and both BP values; oldest first. No interpolation. */
export function bpTrendPoints(records: HealthRecord[]): TrendPoint[] {
  const seen = new Set<string>();
  const points: TrendPoint[] = [];
  for (const r of records) {
    if (seen.has(r.id) || !r.measured_at || !finite(r.systolic) || !finite(r.diastolic)) continue;
    const t = Date.parse(r.measured_at);
    if (!Number.isFinite(t)) continue;
    seen.add(r.id);
    points.push({ recordId: r.id, t, systolic: r.systolic, diastolic: r.diastolic, date: r.measured_at });
  }
  return points.sort((a, b) => a.t - b.t);
}
