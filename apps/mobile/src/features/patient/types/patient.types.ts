import type { Admin, BHW, HealthRecord, Patient } from '../../../shared/types/db.types';

/** The patient plus their chain of care: assigned BHW and that BHW's Admin. */
export interface PatientProfile {
  patient: Patient | null;
  bhw: BHW | null;
  admin: Admin | null;
}

// Spec 06: more clearbook labs. Kept here (not in shared db.types) because only
// the patient workspace reads or writes these columns. All nullable: null ≠ 0.
export type CreatinineUnit = 'mg/dL' | 'umol/L';
export type CholesterolUnit = 'mg/dL' | 'mmol/L';

export interface LabColumns {
  creatinine_value?: number | null;
  creatinine_unit?: CreatinineUnit | null;
  cholesterol_value?: number | null;
  cholesterol_unit?: CholesterolUnit | null;
}

/** A records row as the patient workspace reads it (select('*') returns these columns too). */
export type PatientRecord = HealthRecord & LabColumns;

export interface PatientHealth {
  visits: HealthRecord[];
  updates: HealthRecord[];
  upcomingAppointments: HealthRecord[];
  pastAppointments: HealthRecord[];
  all: HealthRecord[];
}
