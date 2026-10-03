import type { Admin, BHW, HealthRecord, HelpRequestWithPatient, Patient } from '../../../shared/types/db.types';

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
  /** Received help requests owned by this BHW (assigned, acknowledged, blocked), newest received first. */
  helpRequests: HelpRequestWithPatient[];
  /** True when Supabase could not be reached and last-known cached data is shown. */
  fromCache: boolean;
  cachedAt: string | null;
  /** Why fresh data could not be loaded (shown as a notice, not a hard failure). */
  fetchError: string | null;
  /** Fresh data loaded, but the offline copy could not be saved on this device. */
  cacheError: string | null;
}
