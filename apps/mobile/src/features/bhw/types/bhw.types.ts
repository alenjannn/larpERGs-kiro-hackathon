import type { SyncStatus } from '../../../shared/services/storage';
import type {
  Admin,
  Appointment,
  BHW,
  GlucoseTestType,
  GlucoseUnit,
  HealthRecord,
  HelpRequestWithPatient,
  NewHealthRecord,
  NewPatient,
  Patient,
} from '../../../shared/types/db.types';

/** Patient as shown to the BHW; `pendingSync` = registered offline, not yet uploaded. */
export interface BHWPatient extends Patient {
  pendingSync: boolean;
  /** Local queue status when this patient was registered on this device; null for server-only rows. */
  syncStatus: SyncStatus | null;
  syncError: string | null;
}

export interface BHWRecord extends HealthRecord {
  pendingSync: boolean;
  /** Local queue status when this record was saved on this device; null for server-only rows. */
  syncStatus: SyncStatus | null;
  syncError: string | null;
}

export interface BHWData {
  bhw: BHW | null;
  admin: Admin | null;
  patients: BHWPatient[];
  records: BHWRecord[];
  /** Received help requests owned by this BHW (assigned, acknowledged, blocked), newest received first. */
  helpRequests: HelpRequestWithPatient[];
  /** Appointments this BHW owns (Spec 04, Today). Empty for caches written before Spec 04. */
  appointments: Appointment[];
  /** True when Supabase could not be reached and last-known cached data is shown. */
  fromCache: boolean;
  cachedAt: string | null;
  /** Why fresh data could not be loaded (shown as a notice, not a hard failure). */
  fetchError: string | null;
  /** Fresh data loaded, but the offline copy could not be saved on this device. */
  cacheError: string | null;
}

/** Patient registered in the field. Every key is a real `patients` column. */
export type NewFieldPatient = NewPatient & {
  phone: string | null;
  has_smartphone: boolean | null;
  created_on_device_at: string;
};

/**
 * One Patient Visit (B-3.5). Every key is a real `records` column; blanks are
 * null, never 0. `source` is set by the existing upsert ('offline_sync').
 */
export type VisitPayload = NewHealthRecord & {
  id: string;
  record_type: 'visit';
  notes: string | null;
  systolic: number | null;
  diastolic: number | null;
  temperature_c: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  glucose_value: number | null;
  glucose_unit: GlucoseUnit | null;
  glucose_test_type: GlucoseTestType | null;
  contact_outcome: string | null;
  barrier: string | null;
  next_action: string | null;
  measured_at: string | null;
  created_on_device_at: string;
  origin: 'field';
};
