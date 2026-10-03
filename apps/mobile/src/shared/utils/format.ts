import type { HealthRecord, RecordType } from '../types/db.types';
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
  visit: '🏠 Home visit',
  health_update: '📋 Health update',
  appointment: '📅 Appointment',
};

/** Parses a numeric form field; empty -> null, invalid -> NaN. */
export function parseOptionalNumber(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : NaN;
}
