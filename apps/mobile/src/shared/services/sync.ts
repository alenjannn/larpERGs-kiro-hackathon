// Manual "Sync Now" service: pushes the offline queue up to Supabase.
//
// - Patients sync before records, so records that reference a patient
//   registered offline never hit a foreign-key error.
// - Every upsert is keyed by a client-generated id/local_id, so retrying after a
//   partial failure never creates duplicates.
// - Network / missing-schema failures stop the run and leave items 'pending'; data errors mark
//   just that item 'failed' (it is retried on the next sync).

import { getStorage, type LocalRecord, type SyncEntity } from './storage';
import { upsertConnectionTestFromOffline, upsertPatientFromOffline, upsertRecordFromOffline } from './api';
// Spec 04 (B-4.4): read back after each upsert; "synced" only once the server row is confirmed.
import { confirmPatientOnServer, confirmRecordOnServer, SyncReadBackError } from './apiBhw';
import { isNetworkError, isSchemaMissingError, isSupabaseConfigured, toUserMessage } from './supabase';
import { env } from '../config/env';
import type { NewHealthRecord, NewPatient } from '../types/db.types';

export interface SyncResult {
  total: number;
  synced: number;
  failed: number;
  /** Items still waiting after this run (pending + failed). */
  remaining: number;
  /** Set when the run stopped early (offline / not configured). */
  error: string | null;
}

const ENTITY_ORDER: Record<SyncEntity, number> = { patient: 0, record: 1, connection_test: 2 };

async function pushItem(item: LocalRecord): Promise<void> {
  switch (item.entity) {
    case 'patient': {
      const patient = item.payload as unknown as NewPatient;
      if (!patient.id || !patient.full_name) throw new Error('Invalid offline patient payload');
      await upsertPatientFromOffline({ ...patient, local_id: item.local_id });
      await confirmPatientOnServer(patient);
      return;
    }
    case 'record': {
      const record = item.payload as unknown as NewHealthRecord;
      if (!record.patient_id || !record.record_type || !record.title) throw new Error('Invalid offline record payload');
      await upsertRecordFromOffline({ ...record, local_id: item.local_id });
      await confirmRecordOnServer({ ...record, local_id: item.local_id });
      return;
    }
    case 'connection_test':
      await upsertConnectionTestFromOffline(item.local_id, item.message);
      return;
    default:
      throw new Error(`Unknown offline entity: ${String((item as LocalRecord).entity)}`);
  }
}

export async function syncPendingRecords(): Promise<SyncResult> {
  const storage = await getStorage();
  const pending = (await storage.getPendingRecords()).sort(
    (a, b) => ENTITY_ORDER[a.entity] - ENTITY_ORDER[b.entity] || a.created_at.localeCompare(b.created_at)
  );
  const result: SyncResult = { total: pending.length, synced: 0, failed: 0, remaining: pending.length, error: null };

  if (!isSupabaseConfigured) {
    result.error = env.supabaseConfigError;
    return result;
  }

  for (const item of pending) {
    try {
      await pushItem(item);
      await storage.markSynced(item.local_id);
      result.synced++;
    } catch (error) {
      console.error('Sync failed for offline item', item.local_id, error);
      if (isNetworkError(error) || isSchemaMissingError(error)) {
        // Offline or backend not set up: keep this and the remaining items pending for the next attempt.
        result.error = toUserMessage(error);
        break;
      }
      await storage.markFailed(
        item.local_id,
        error instanceof SyncReadBackError ? error.message : toUserMessage(error, 'Server rejected this item')
      );
      result.failed++;
    }
  }

  result.remaining = result.total - result.synced;
  return result;
}
