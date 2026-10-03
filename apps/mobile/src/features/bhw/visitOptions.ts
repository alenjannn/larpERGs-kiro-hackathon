// Patient Visit vocabulary (Spec 04, B-3.2 / B-3.3). Stored values are the keys;
// labels are EN/FIL. Language rule: never "non-compliant"; "could not reach" is
// not evidence of non-adherence.
// FIL labels: needs native-speaker review.

export type ContactOutcome =
  | 'contacted'
  | 'could_not_reach'
  | 'patient_reported_attended'
  | 'clinic_confirmed_attended'
  | 'rescheduled'
  | 'help_needed';

export type Barrier = 'transport' | 'unavailable_appointment' | 'lab_access' | 'document_help' | 'medicine_access';

export interface Label {
  en: string;
  /** needs native-speaker review */
  fil: string;
}

export const CONTACT_OUTCOME_LABELS: Record<ContactOutcome, Label> = {
  contacted: { en: 'Contacted', fil: 'Nakausap' }, // FIL: needs native-speaker review
  could_not_reach: { en: 'Could not reach', fil: 'Hindi makontak' }, // FIL: needs native-speaker review
  patient_reported_attended: { en: 'Patient-reported attendance', fil: 'Dumalo ayon sa pasyente' }, // FIL: needs native-speaker review
  clinic_confirmed_attended: { en: 'Clinic-confirmed attendance', fil: 'Dumalo, kumpirmado ng klinika' }, // FIL: needs native-speaker review
  rescheduled: { en: 'Rescheduled', fil: 'Inilipat ang petsa' }, // FIL: needs native-speaker review
  help_needed: { en: 'Help needed', fil: 'Kailangan ng tulong' }, // FIL: needs native-speaker review
};

export const CONTACT_OUTCOME_ORDER: ContactOutcome[] = [
  'contacted',
  'could_not_reach',
  'patient_reported_attended',
  'clinic_confirmed_attended',
  'rescheduled',
  'help_needed',
];

export const BARRIER_LABELS: Record<Barrier, Label> = {
  transport: { en: 'Transport', fil: 'Transportasyon' }, // FIL: needs native-speaker review
  unavailable_appointment: { en: 'Unavailable appointment', fil: 'Walang bakanteng iskedyul' }, // FIL: needs native-speaker review
  lab_access: { en: 'Laboratory access', fil: 'Pagpapa-laboratoryo' }, // FIL: needs native-speaker review
  document_help: { en: 'Document help', fil: 'Tulong sa dokumento' }, // FIL: needs native-speaker review
  medicine_access: { en: 'Medicine access', fil: 'Pagkuha ng gamot' }, // FIL: needs native-speaker review
};

export const BARRIER_ORDER: Barrier[] = ['transport', 'unavailable_appointment', 'lab_access', 'document_help', 'medicine_access'];

/** Seed rows (Spec 01) used 'reached' before this vocabulary existed (design D5). */
const LEGACY_OUTCOMES: Record<string, Label> = {
  reached: CONTACT_OUTCOME_LABELS.contacted,
};

/** Label for any stored outcome; unknown values are shown as stored. */
export function contactOutcomeLabel(value: string | null | undefined, lang: 'en' | 'fil' = 'en'): string | null {
  if (!value) return null;
  return (CONTACT_OUTCOME_LABELS[value as ContactOutcome] ?? LEGACY_OUTCOMES[value])?.[lang] ?? value;
}

/** Label for any stored barrier. Help-request reasons that match are covered too. */
export function barrierLabel(value: string | null | undefined, lang: 'en' | 'fil' = 'en'): string | null {
  if (!value) return null;
  return BARRIER_LABELS[value as Barrier]?.[lang] ?? value;
}

export function bilingual(label: Label): string {
  return `${label.en} · ${label.fil}`;
}

// --- measurements -------------------------------------------------------------

export type GlucoseUnitOption = 'mg/dL' | 'mmol/L';
export type GlucoseTestOption = 'fasting' | 'random' | 'post_meal';

export const GLUCOSE_TEST_LABELS: Record<GlucoseTestOption, string> = {
  fasting: 'Fasting',
  random: 'Random',
  post_meal: 'After a meal',
};

/** Plausible entry ranges (data-entry checks only, not clinical thresholds). */
export const RANGES = {
  systolic: [50, 260],
  diastolic: [30, 180],
  temperature_c: [30, 45],
  weight_kg: [1, 400],
  height_cm: [30, 250],
  glucose: { 'mg/dL': [20, 600], 'mmol/L': [1.1, 33.3] },
} as const;
