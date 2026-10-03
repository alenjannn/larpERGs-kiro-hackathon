import type { Admin, BHW, HealthRecord, HelpRequestWithPatient, Patient } from '../../../shared/types/db.types';

/** Field activity for one BHW, derived from their patients and records. */
export interface BHWActivity {
  bhw: BHW;
  patientCount: number;
  recordsLast7Days: number;
  offlineSyncedRecords: number;
  lastActivityAt: string | null;
}

export interface HealthMetrics {
  activeBHWs: number;
  totalBHWs: number;
  totalPatients: number;
  unassignedPatients: number;
  visitsLast7Days: number;
  upcomingAppointments: number;
  /** Patients whose most recent BP reading is >= 140/90. */
  elevatedBPPatients: number;
}

export interface AdminData {
  admin: Admin | null;
  bhws: BHW[];
  patients: Patient[];
  records: HealthRecord[];
  activity: BHWActivity[];
  metrics: HealthMetrics;
  /** Demo clinic inbox (latest 50, newest received first). */
  helpRequests: HelpRequestWithPatient[];
  /** True when the server could not be reached and the offline copy is shown. */
  fromCache: boolean;
  cachedAt: string | null;
  fetchError: string | null;
}
