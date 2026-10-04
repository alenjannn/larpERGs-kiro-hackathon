// YAKAP pathway stages, brief §3 order (Spec 03, design §3.4). Pure: no React imports.
// FIL: needs native-speaker review.

import type { Appointment, YakapStage } from '../../../shared/types/db.types';

export interface YakapStageInfo {
  stage: YakapStage;
  label: string;
  /** FIL: needs native-speaker review */
  fil: string;
  patientAction: string;
}

export const YAKAP_STAGES: YakapStageInfo[] = [
  {
    stage: 'need_help_getting_started',
    label: 'Need help getting started',
    fil: 'Kailangan ng tulong para magsimula',
    patientAction: 'View official enrollment guidance, find a clinic, or ask your health worker for help.',
  },
  {
    stage: 'clinic_selected_pending',
    label: 'Clinic selected · confirmation pending',
    fil: 'Napiling klinika · hinihintay ang kumpirmasyon',
    patientAction: 'Save your chosen clinic and its contact details.',
  },
  {
    stage: 'first_checkup_planned',
    label: 'First checkup planned',
    fil: 'Nakaplano ang unang checkup',
    patientAction: 'See the date, place and any preparation the clinic gives you.',
  },
  {
    stage: 'checkup_and_assessment',
    label: 'Checkup and risk assessment',
    fil: 'Checkup at pagtatasa',
    patientAction: 'Attend your consultation and have your measurements recorded.',
  },
  {
    stage: 'tests_requested',
    label: 'Tests requested, if needed',
    fil: 'Mga hiniling na test, kung kailangan',
    patientAction: 'See the tests your clinician asked for and where to get them.',
  },
  {
    stage: 'results_review_pending',
    label: 'Results available · review pending',
    fil: 'May resulta na · hinihintay ang pagsusuri',
    patientAction: 'Add your paper report, or ask for help entering it.',
  },
  {
    stage: 'plan_available',
    label: 'Plan available',
    fil: 'May plano na',
    patientAction: 'Read the plan your clinician released.',
  },
  {
    stage: 'continued_monitoring',
    label: 'Continued monitoring',
    fil: 'Patuloy na pagsubaybay',
    patientAction: 'See your next follow-up and record requested measurements.',
  },
];

export const CLINIC_CONFIRMED_LABEL = 'Clinic confirmed';
/** FIL: needs native-speaker review */
export const CLINIC_CONFIRMED_LABEL_FIL = 'Kumpirmado ng klinika';

/** Index in YAKAP_STAGES, or -1 when not started / unknown. */
export function stageIndex(stage: YakapStage | null | undefined): number {
  if (!stage) return -1;
  return YAKAP_STAGES.findIndex((s) => s.stage === stage);
}

/** Clinic selection counts as confirmed only after a clinic-confirmed visit at that clinic. */
export function isClinicConfirmed(appts: Appointment[], clinicId: string | null | undefined): boolean {
  if (!clinicId) return false;
  return appts.some((a) => a.clinic_id === clinicId && a.encounter_status === 'clinic_confirmed_attended');
}

/** Label for a stage, with the clinic-selection label computed (P-4.3). */
export function stageLabel(info: YakapStageInfo, clinicConfirmed: boolean, lang: 'en' | 'fil' = 'en'): string {
  if (info.stage === 'clinic_selected_pending' && clinicConfirmed) {
    return lang === 'fil' ? CLINIC_CONFIRMED_LABEL_FIL : CLINIC_CONFIRMED_LABEL;
  }
  return lang === 'fil' ? info.fil : info.label;
}
