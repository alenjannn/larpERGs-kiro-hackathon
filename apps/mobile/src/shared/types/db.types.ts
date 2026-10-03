// Row types for the Supabase tables in supabase/migrations.
// Columns added by 20240101000200_shared_foundation.sql are optional on the
// existing interfaces so code that builds these objects keeps compiling.

export type ClientType = 'patient' | 'bhw' | 'admin' | 'system';

export interface ConnectionTestRow {
  id: string;
  message: string;
  client_type: ClientType;
  created_at: string;
}

export type AdminRole = 'coordinator' | 'clinician';

export interface Admin {
  id: string;
  full_name: string;
  email: string;
  office: string;
  created_at: string;
  admin_role?: AdminRole;
  municipality?: string | null;
  is_demo?: boolean;
  is_seed?: boolean;
}

export type BHWStatus = 'active' | 'inactive';

export interface BHW {
  id: string;
  admin_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  barangay: string;
  status: BHWStatus;
  created_at: string;
  last_active_at?: string | null;
  is_seed?: boolean;
}

export type YakapStage =
  | 'need_help_getting_started'
  | 'clinic_selected_pending'
  | 'first_checkup_planned'
  | 'checkup_and_assessment'
  | 'tests_requested'
  | 'results_review_pending'
  | 'plan_available'
  | 'continued_monitoring';

export interface Patient {
  id: string;
  bhw_id: string | null;
  full_name: string;
  sex: 'F' | 'M' | null;
  birth_date: string | null;
  barangay: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  local_id: string | null;
  created_at: string;
  phone?: string | null;
  has_smartphone?: boolean | null;
  yakap_stage?: YakapStage | null;
  clinic_id?: string | null;
  sharing_consent?: boolean;
  created_on_device_at?: string | null;
  updated_at?: string;
  is_seed?: boolean;
}

/** record_type values the existing BHW record form offers. */
export type RecordType = 'visit' | 'health_update' | 'appointment';
/** Every record_type the database accepts (Spec 01 widened the CHECK). */
export type AnyRecordType = RecordType | 'vitals' | 'lab_result' | 'note';
export type AppointmentStatus = 'scheduled' | 'completed' | 'missed';
export type RecordOrigin = 'field' | 'patient' | 'clinic';
export type GlucoseUnit = 'mg/dL' | 'mmol/L';
export type GlucoseTestType = 'fasting' | 'random' | 'post_meal';

export interface HealthRecord {
  id: string;
  patient_id: string;
  bhw_id: string | null;
  record_type: AnyRecordType;
  title: string;
  notes: string | null;
  systolic: number | null;
  diastolic: number | null;
  temperature_c: number | null;
  weight_kg: number | null;
  scheduled_at: string | null;
  status: AppointmentStatus | null;
  source: 'online' | 'offline_sync';
  local_id: string | null;
  created_at: string;
  measured_at?: string | null;
  glucose_value?: number | null;
  glucose_unit?: GlucoseUnit | null;
  glucose_test_type?: GlucoseTestType | null;
  height_cm?: number | null;
  contact_outcome?: string | null;
  barrier?: string | null;
  next_action?: string | null;
  origin?: RecordOrigin;
  transcription_status?: 'pending' | 'confirmed' | null;
  review_status?: 'awaiting_clinical_review' | 'plan_released' | null;
  created_on_device_at?: string | null;
  is_seed?: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  address: string | null;
  contact: string | null;
  services: string[];
  yakap_accreditation: 'listed' | 'unknown';
  source: string | null;
  last_verified_at: string | null;
  created_at: string;
  is_seed: boolean;
}

export type EncounterStatus =
  | 'requested'
  | 'confirmed'
  | 'patient_reported_attended'
  | 'clinic_confirmed_attended'
  | 'missed'
  | 'rescheduled';

export interface Appointment {
  id: string;
  patient_id: string;
  clinic_id: string | null;
  purpose: string;
  scheduled_at: string | null;
  encounter_status: EncounterStatus;
  owner_bhw_id: string | null;
  created_at: string;
  updated_at: string;
  is_seed: boolean;
}

export interface CarePlan {
  id: string;
  patient_id: string;
  clinician_admin_id: string | null;
  summary: string;
  next_steps: string | null;
  status: 'draft' | 'released';
  released_at: string | null;
  created_at: string;
  updated_at: string;
  is_seed: boolean;
}

export type HelpReason = 'transport' | 'another_date' | 'lab_access' | 'document_help' | 'medicine_access' | 'other';
export type CoordinationStatus = 'unassigned' | 'assigned' | 'acknowledged' | 'blocked' | 'completed';

export interface HelpRequest {
  /** Client-generated UUID: the idempotency key. */
  id: string;
  patient_id: string;
  reason: HelpReason;
  message: string | null;
  created_on_device_at: string;
  received_at: string;
  assigned_bhw_id: string | null;
  coordination_status: CoordinationStatus;
  acknowledged_at: string | null;
  is_seed: boolean;
}

export type NewBHW = Pick<BHW, 'admin_id' | 'full_name' | 'barangay'> & Partial<Pick<BHW, 'email' | 'phone'>>;

export type NewPatient = Pick<Patient, 'id' | 'bhw_id' | 'full_name'> &
  Partial<Pick<Patient, 'sex' | 'birth_date' | 'barangay' | 'address' | 'latitude' | 'longitude' | 'local_id'>>;

export type NewHealthRecord = Pick<HealthRecord, 'patient_id' | 'bhw_id' | 'record_type' | 'title'> &
  Partial<
    Pick<
      HealthRecord,
      'id' | 'notes' | 'systolic' | 'diastolic' | 'temperature_c' | 'weight_kg' | 'scheduled_at' | 'status' | 'source' | 'local_id'
    >
  >;
