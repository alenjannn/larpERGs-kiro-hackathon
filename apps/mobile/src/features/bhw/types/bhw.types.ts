import type { Admin, BHW, HealthRecord, Patient } from '../../../shared/types/db.types';

/** Patient as shown to the BHW; `pendingSync` = registered offline, not yet uploaded. */
export interface BHWPatient extends Patient {
  pendingSync: boolean;
}

export interface BHWRecord extends HealthRecord {
  pendingSync: boolean;
}

export interface BHWData {
  bhw: BHW | null;
  admin: Admin | null;
  patients: BHWPatient[];
  records: BHWRecord[];
  /** True when Supabase could not be reached and last-known cached data is shown. */
  fromCache: boolean;
  cachedAt: string | null;
  /** Why fresh data could not be loaded (shown as a notice, not a hard failure). */
  fetchError: string | null;
}
