// Data-access layer for the Admin -> BHW -> Patient -> Record chain.
// Screens/hooks call these functions; they never query Supabase directly.

import { requireSupabase } from './supabase';
import type {
  Admin,
  Appointment,
  BHW,
  BHWStatus,
  CarePlan,
  ClientType,
  Clinic,
  ConnectionTestRow,
  CoordinationStatus,
  HealthRecord,
  HelpRequestInsert,
  HelpRequestRow,
  HelpRequestWithPatient,
  NewBHW,
  NewHealthRecord,
  NewPatient,
  Patient,
} from '../types/db.types';

function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data as T;
}

// --- connection_test --------------------------------------------------------

export async function fetchConnectionTests(clientType?: ClientType, limit = 20): Promise<ConnectionTestRow[]> {
  let query = requireSupabase().from('connection_test').select('id, message, client_type, created_at');
  if (clientType) query = query.eq('client_type', clientType);
  return unwrap(await query.order('created_at', { ascending: false }).limit(limit)) ?? [];
}

export async function insertConnectionTest(message: string, clientType: ClientType): Promise<void> {
  unwrap(await requireSupabase().from('connection_test').insert({ message, client_type: clientType }));
}

/** Idempotent insert used by offline sync (keyed by local_id). */
export async function upsertConnectionTestFromOffline(localId: string, message: string): Promise<void> {
  unwrap(
    await requireSupabase()
      .from('connection_test')
      .upsert({ local_id: localId, message, client_type: 'bhw' }, { onConflict: 'local_id', ignoreDuplicates: true })
  );
}

// --- admins -----------------------------------------------------------------

export async function fetchAdmin(id: string): Promise<Admin | null> {
  return unwrap(await requireSupabase().from('admins').select('*').eq('id', id).maybeSingle());
}

// --- bhws -------------------------------------------------------------------

export async function fetchBHWs(adminId?: string): Promise<BHW[]> {
  let query = requireSupabase().from('bhws').select('*');
  if (adminId) query = query.eq('admin_id', adminId);
  return unwrap(await query.order('created_at', { ascending: true })) ?? [];
}

export async function fetchBHW(id: string): Promise<BHW | null> {
  return unwrap(await requireSupabase().from('bhws').select('*').eq('id', id).maybeSingle());
}

export async function createBHW(input: NewBHW): Promise<BHW> {
  return unwrap(await requireSupabase().from('bhws').insert(input).select('*').single());
}

export async function setBHWStatus(id: string, status: BHWStatus): Promise<void> {
  unwrap(await requireSupabase().from('bhws').update({ status }).eq('id', id));
}

// --- patients ---------------------------------------------------------------

export async function fetchPatients(bhwId?: string): Promise<Patient[]> {
  let query = requireSupabase().from('patients').select('*');
  if (bhwId) query = query.eq('bhw_id', bhwId);
  return unwrap(await query.order('full_name', { ascending: true })) ?? [];
}

export async function fetchPatient(id: string): Promise<Patient | null> {
  return unwrap(await requireSupabase().from('patients').select('*').eq('id', id).maybeSingle());
}

export async function assignPatientToBHW(patientId: string, bhwId: string): Promise<void> {
  unwrap(await requireSupabase().from('patients').update({ bhw_id: bhwId }).eq('id', patientId));
}

/** Idempotent insert used by offline sync (keyed by the client-generated id). */
export async function upsertPatientFromOffline(patient: NewPatient): Promise<void> {
  unwrap(await requireSupabase().from('patients').upsert(patient, { onConflict: 'id', ignoreDuplicates: true }));
}

// --- records ----------------------------------------------------------------

export async function fetchRecords(filter: { patientId?: string; bhwId?: string; limit?: number } = {}): Promise<HealthRecord[]> {
  let query = requireSupabase().from('records').select('*');
  if (filter.patientId) query = query.eq('patient_id', filter.patientId);
  if (filter.bhwId) query = query.eq('bhw_id', filter.bhwId);
  return unwrap(await query.order('created_at', { ascending: false }).limit(filter.limit ?? 200)) ?? [];
}

// --- appointments / care plans / clinics (patient snapshot) -------------------

export async function fetchAppointments(patientId: string): Promise<Appointment[]> {
  return (
    unwrap(
      await requireSupabase()
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('scheduled_at', { ascending: true, nullsFirst: false })
    ) ?? []
  );
}

/** Latest care plan with status 'released' only; patients never see drafts. */
export async function fetchReleasedCarePlan(patientId: string): Promise<CarePlan | null> {
  const rows = unwrap(
    await requireSupabase()
      .from('care_plans')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'released')
      .order('released_at', { ascending: false })
      .limit(1)
  ) as CarePlan[] | null;
  return rows?.[0] ?? null;
}

export async function fetchClinic(id: string): Promise<Clinic | null> {
  return unwrap(await requireSupabase().from('clinics').select('*').eq('id', id).maybeSingle());
}

// --- help_requests: the demo clinic inbox ---------------------------------------

const HELP_COLUMNS =
  'id, patient_id, reason, message, created_on_device_at, received_at, assigned_bhw_id, coordination_status, acknowledged_at';

/**
 * Exactly-once insert: the client UUID is the key and a repeat is ignored
 * (ON CONFLICT (id) DO NOTHING). Never updates an existing row.
 */
export async function insertHelpRequest(row: HelpRequestInsert, signal?: AbortSignal): Promise<void> {
  const payload: HelpRequestInsert = {
    id: row.id,
    patient_id: row.patient_id,
    reason: row.reason,
    message: row.message,
    created_on_device_at: row.created_on_device_at,
  };
  let query = requireSupabase().from('help_requests').upsert(payload, { onConflict: 'id', ignoreDuplicates: true });
  if (signal) query = query.abortSignal(signal);
  unwrap(await query);
}

/** Read-back by id: only a returned row counts as received. */
export async function fetchHelpRequestById(id: string, signal?: AbortSignal): Promise<HelpRequestRow | null> {
  let query = requireSupabase().from('help_requests').select(HELP_COLUMNS).eq('id', id);
  if (signal) query = query.abortSignal(signal);
  return unwrap(await query.maybeSingle()) as HelpRequestRow | null;
}

export async function fetchHelpRequests(
  filter: { assignedBhwId?: string; statuses?: CoordinationStatus[]; limit?: number } = {}
): Promise<HelpRequestWithPatient[]> {
  let query = requireSupabase().from('help_requests').select(`${HELP_COLUMNS}, patient:patients(full_name)`);
  if (filter.assignedBhwId) query = query.eq('assigned_bhw_id', filter.assignedBhwId);
  if (filter.statuses?.length) query = query.in('coordination_status', filter.statuses);
  const rows = unwrap(await query.order('received_at', { ascending: false }).limit(filter.limit ?? 50));
  return (rows ?? []) as unknown as HelpRequestWithPatient[];
}

// --- demo reset ---------------------------------------------------------------

export interface ResetDemoDataResult {
  deleted: Record<string, number>;
  reset_at: string;
}

/**
 * Calls the security-definer reset_demo_data() RPC: deletes every non-seed row
 * and restores the DEMO seed, placing seeded patients around `center`.
 */
export async function resetDemoData(center: { latitude: number; longitude: number }): Promise<ResetDemoDataResult> {
  return unwrap(
    await requireSupabase().rpc('reset_demo_data', { center_lat: center.latitude, center_lng: center.longitude })
  ) as ResetDemoDataResult;
}

/** Idempotent insert used by offline sync (keyed by local_id). */
export async function upsertRecordFromOffline(record: NewHealthRecord): Promise<void> {
  unwrap(
    await requireSupabase()
      .from('records')
      .upsert({ ...record, source: 'offline_sync' }, { onConflict: 'local_id', ignoreDuplicates: true })
  );
}
