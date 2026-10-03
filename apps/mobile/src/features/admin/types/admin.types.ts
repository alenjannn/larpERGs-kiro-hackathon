import type { Admin, Appointment, BHW, HealthRecord, HelpRequestWithPatient, Patient } from '../../../shared/types/db.types';

/** Field activity for one BHW, derived from their patients and records. */
export interface BHWActivity {
  bhw: BHW;
  patientCount: number;
  recordsLast7Days: number;
  offlineSyncedRecords: number;
  lastActivityAt: string | null;
}

export interface AdminData {
  admin: Admin | null;
  bhws: BHW[];
  patients: Patient[];
  records: HealthRecord[];
  appointments: Appointment[];
  activity: BHWActivity[];
  /** Demo clinic inbox (latest 200, newest received first, one row per id). */
  helpRequests: HelpRequestWithPatient[];
  /** True when the server could not be reached and the offline copy is shown. */
  fromCache: boolean;
  cachedAt: string | null;
  fetchError: string | null;
}
