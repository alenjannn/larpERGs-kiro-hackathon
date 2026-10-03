// Patient Visit → one local record (Spec 04, B-3.5 – B-3.8). Pure and testable.
// Blank fields become null, never 0. Ranges are data-entry checks only.

import { parseOptionalNumber } from '../../shared/utils/format';
import type { VisitPayload } from './types/bhw.types';
import { RANGES, type Barrier, type ContactOutcome, type GlucoseTestOption, type GlucoseUnitOption } from './visitOptions';

export interface VisitInput {
  systolic: string;
  diastolic: string;
  glucose: string;
  glucoseUnit: GlucoseUnitOption | null;
  glucoseTest: GlucoseTestOption | null;
  weight: string;
  height: string;
  temperature: string;
  outcome: ContactOutcome | null;
  /** 'none' = the BHW chose "No barrier" (stored as null). */
  barrier: Barrier | 'none' | null;
  nextAction: string;
  notes: string;
}

export const EMPTY_VISIT: VisitInput = {
  systolic: '',
  diastolic: '',
  glucose: '',
  glucoseUnit: null,
  glucoseTest: null,
  weight: '',
  height: '',
  temperature: '',
  outcome: null,
  barrier: null,
  nextAction: '',
  notes: '',
};

export type VisitResult = { ok: true; payload: VisitPayload } | { ok: false; error: string };

function inRange(value: number | null, [min, max]: readonly [number, number]): boolean {
  return value === null || (!Number.isNaN(value) && value >= min && value <= max);
}

function text(value: string): string | null {
  const t = value.trim();
  return t ? t : null;
}

export function buildVisitPayload(
  input: VisitInput,
  ids: { id: string; patientId: string; bhwId: string },
  nowIso: string
): VisitResult {
  const systolic = parseOptionalNumber(input.systolic);
  const diastolic = parseOptionalNumber(input.diastolic);
  const glucose = parseOptionalNumber(input.glucose);
  const weight = parseOptionalNumber(input.weight);
  const height = parseOptionalNumber(input.height);
  const temperature = parseOptionalNumber(input.temperature);

  if ((systolic === null) !== (diastolic === null)) return { ok: false, error: 'Enter both systolic and diastolic blood pressure, or neither.' };
  if (!inRange(systolic, RANGES.systolic) || !inRange(diastolic, RANGES.diastolic)) {
    return { ok: false, error: 'Blood pressure looks out of range. Check the numbers (for example 120 / 80).' };
  }
  if (glucose !== null) {
    if (!input.glucoseUnit) return { ok: false, error: 'Choose the glucose unit (mg/dL or mmol/L).' };
    if (!input.glucoseTest) return { ok: false, error: 'Choose the glucose test type (fasting, random or after a meal).' };
    if (!inRange(glucose, RANGES.glucose[input.glucoseUnit])) {
      const [min, max] = RANGES.glucose[input.glucoseUnit];
      return { ok: false, error: `Glucose must be between ${min} and ${max} ${input.glucoseUnit}.` };
    }
  }
  if (!inRange(weight, RANGES.weight_kg)) return { ok: false, error: 'Weight must be between 1 and 400 kg.' };
  if (!inRange(height, RANGES.height_cm)) return { ok: false, error: 'Height must be between 30 and 250 cm.' };
  if (!inRange(temperature, RANGES.temperature_c)) return { ok: false, error: 'Temperature must be between 30 and 45 °C.' };

  const nextAction = text(input.nextAction);
  const notes = text(input.notes);
  const hasMeasurement = [systolic, glucose, weight, height, temperature].some((v) => v !== null);
  if (!hasMeasurement && !input.outcome && !input.barrier && !nextAction && !notes) {
    return { ok: false, error: 'Nothing to save yet. Enter a measurement, a contact outcome, a barrier, a next action or a note.' };
  }

  return {
    ok: true,
    payload: {
      id: ids.id,
      patient_id: ids.patientId,
      bhw_id: ids.bhwId,
      record_type: 'visit',
      title: 'Patient visit',
      notes,
      systolic,
      diastolic,
      temperature_c: temperature,
      weight_kg: weight,
      height_cm: height,
      glucose_value: glucose,
      glucose_unit: glucose !== null ? input.glucoseUnit : null,
      glucose_test_type: glucose !== null ? input.glucoseTest : null,
      contact_outcome: input.outcome,
      barrier: input.barrier && input.barrier !== 'none' ? input.barrier : null,
      next_action: nextAction,
      measured_at: hasMeasurement ? nowIso : null,
      created_on_device_at: nowIso,
      origin: 'field',
    },
  };
}
