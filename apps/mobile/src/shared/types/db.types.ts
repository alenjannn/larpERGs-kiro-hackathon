// Row types for the Supabase tables in supabase/migrations.

export type ClientType = 'patient' | 'bhw' | 'admin' | 'system';

export interface ConnectionTestRow {
  id: string;
  message: string;
  client_type: ClientType;
  created_at: string;
}

export interface Admin {
  id: string;
  full_name: string;
  email: string;
  office: string;
  created_at: string;
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
}

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
}

export type RecordType = 'visit' | 'health_update' | 'appointment';
export type AppointmentStatus = 'scheduled' | 'completed' | 'missed';

export interface HealthRecord {
  id: string;
  patient_id: string;
  bhw_id: string | null;
  record_type: RecordType;
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
