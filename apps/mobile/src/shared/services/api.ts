// Data-access layer for the Admin -> BHW -> Patient -> Record chain.
// Screens/hooks call these functions; they never query Supabase directly.

import { requireSupabase } from './supabase';
import type {
  Admin,
  BHW,
  BHWStatus,
  ClientType,
  ConnectionTestRow,
  HealthRecord,
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

/** Idempotent insert used by offline sync (keyed by local_id). */
export async function upsertRecordFromOffline(record: NewHealthRecord): Promise<void> {
  unwrap(
    await requireSupabase()
      .from('records')
      .upsert({ ...record, source: 'offline_sync' }, { onConflict: 'local_id', ignoreDuplicates: true })
  );
}
