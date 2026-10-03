import type { Admin, BHW, HealthRecord, Patient } from '../../../shared/types/db.types';

/** The patient plus their chain of care: assigned BHW and that BHW's Admin. */
export interface PatientProfile {
  patient: Patient | null;
  bhw: BHW | null;
  admin: Admin | null;
}

export interface PatientHealth {
  visits: HealthRecord[];
  updates: HealthRecord[];
  upcomingAppointments: HealthRecord[];
  pastAppointments: HealthRecord[];
  all: HealthRecord[];
}
