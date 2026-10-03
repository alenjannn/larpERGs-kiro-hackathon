// Platform-aware offline repository.
//   Native (iOS/Android): expo-sqlite  -> storage/StorageNative.native.ts
//   Web (PWA / static export): localStorage -> storage/StorageWeb.ts
//
// The native SQLite driver lives in a `.native.ts` file, so Metro never puts
// expo-sqlite (and its wasm worker) into the web bundle. On web, the plain
// `StorageNative.ts` stub is resolved instead and is never constructed.

import { Platform } from 'react-native';
import StorageNative from './storage/StorageNative';
import StorageWeb from './storage/StorageWeb';

/** What an offline queue item will become in Supabase once synced. */
export type SyncEntity = 'connection_test' | 'patient' | 'record';

export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface LocalRecord {
  local_id: string;
  entity: SyncEntity;
  /** Human-readable summary shown in the sync queue. */
  message: string;
  /** JSON payload sent to Supabase on sync. */
  payload: Record<string, unknown>;
  sync_status: SyncStatus;
  created_at: string;
  synced_at: string | null;
  last_error: string | null;
}

export interface NewLocalRecord {
  id: string;
  entity: SyncEntity;
  message: string;
  payload?: Record<string, unknown>;
}

export interface LocalStorage {
  initDB(): Promise<void>;
  saveRecord(record: NewLocalRecord): Promise<void>;
  /** Items not yet synced (pending or failed), oldest first. */
  getPendingRecords(): Promise<LocalRecord[]>;
  /** Every queue item, newest first. */
  getAllRecords(): Promise<LocalRecord[]>;
  markSynced(id: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
  clearSynced(): Promise<void>;
  /** Small key/value cache so screens can render last-known data while offline. */
  getCache<T>(key: string): Promise<T | null>;
  setCache<T>(key: string, value: T): Promise<void>;
  /** Namespaced `tuloy:v1:*` value. Unparsable data reads as null; callers validate the shape. */
  getItem<T>(key: LocalV1Key): Promise<T | null>;
  /** Persists a `tuloy:v1:*` value. Throws on quota/access errors (never a silent in-memory fallback). */
  setItem<T>(key: LocalV1Key, value: T): Promise<void>;
  removeItem(key: LocalV1Key): Promise<void>;
  /**
   * Reset demo data: clears `tuloy:v1:*` plus the legacy queue/cache
   * (web: `tuloy_offline_records`, `tuloy_cache:*`; native: local_sync_queue, kv_cache, kv_v1).
   * Other keys are untouched. Throws with what failed.
   */
  clearDemoData(): Promise<{ cleared: number }>;
}

export const LOCAL_V1_PREFIX = 'tuloy:v1:';
export type LocalV1Key = `tuloy:v1:${string}`;

export { LocalStorageUnavailableError } from './storage/errors';

export function createStorage(): LocalStorage {
  if (Platform.OS === 'web') {
    return new StorageWeb();
  }
  return new StorageNative();
}

let storagePromise: Promise<LocalStorage> | null = null;

/** Shared, initialized storage instance. Init failures surface to the caller and are retried next call. */
export function getStorage(): Promise<LocalStorage> {
  if (!storagePromise) {
    const storage = createStorage();
    storagePromise = storage.initDB().then(
      () => storage,
      (error) => {
        storagePromise = null;
        throw error;
      }
    );
  }
  return storagePromise;
}
