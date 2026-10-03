import * as SQLite from 'expo-sqlite';
import type { LocalRecord, LocalStorage, LocalV1Key, NewLocalRecord, SyncEntity, SyncStatus } from '../storage';

interface QueueRow {
  local_id: string;
  entity: SyncEntity;
  message: string;
  payload: string;
  sync_status: SyncStatus;
  created_at: string;
  synced_at: string | null;
  last_error: string | null;
}

function toLocalRecord(row: QueueRow): LocalRecord {
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(row.payload || '{}');
  } catch {
    // Keep an empty payload; sync will report the item as failed.
  }
  return { ...row, payload };
}

/** expo-sqlite implementation of the offline repository (iOS/Android only). */
export default class StorageNative implements LocalStorage {
  private db: SQLite.SQLiteDatabase | null = null;

  async initDB(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('tuloy_offline.db');
    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS local_sync_queue (
        local_id    TEXT PRIMARY KEY NOT NULL,
        entity      TEXT NOT NULL,
        message     TEXT NOT NULL,
        payload     TEXT NOT NULL DEFAULT '{}',
        sync_status TEXT NOT NULL DEFAULT 'pending',
        created_at  TEXT NOT NULL,
        synced_at   TEXT,
        last_error  TEXT
      );
      CREATE TABLE IF NOT EXISTS kv_cache (
        key   TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS kv_v1 (
        key   TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
  }

  // --- tuloy:v1:* (Spec 01) ---

  async getItem<T>(key: LocalV1Key): Promise<T | null> {
    const row = await this.getDb().getFirstAsync<{ value: string }>('SELECT value FROM kv_v1 WHERE key = ?', [key]);
    if (!row) return null;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return null;
    }
  }

  async setItem<T>(key: LocalV1Key, value: T): Promise<void> {
    await this.getDb().runAsync('INSERT OR REPLACE INTO kv_v1 (key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
  }

  async removeItem(key: LocalV1Key): Promise<void> {
    await this.getDb().runAsync('DELETE FROM kv_v1 WHERE key = ?', [key]);
  }

  /** Native kv_cache keys have no prefix (e.g. "bhw:<id>"), so the whole table is legacy cache. */
  async clearDemoData(): Promise<{ cleared: number }> {
    const db = this.getDb();
    let cleared = 0;
    await db.withTransactionAsync(async () => {
      for (const table of ['local_sync_queue', 'kv_cache', 'kv_v1']) {
        const result = await db.runAsync(`DELETE FROM ${table}`);
        cleared += result.changes;
      }
    });
    return { cleared };
  }

  async saveRecord(record: NewLocalRecord): Promise<void> {
    await this.getDb().runAsync(
      'INSERT OR IGNORE INTO local_sync_queue (local_id, entity, message, payload, created_at) VALUES (?, ?, ?, ?, ?)',
      [record.id, record.entity, record.message, JSON.stringify(record.payload ?? {}), new Date().toISOString()]
    );
  }

  async getPendingRecords(): Promise<LocalRecord[]> {
    const rows = await this.getDb().getAllAsync<QueueRow>(
      "SELECT * FROM local_sync_queue WHERE sync_status != 'synced' ORDER BY created_at ASC"
    );
    return rows.map(toLocalRecord);
  }

  async getAllRecords(): Promise<LocalRecord[]> {
    const rows = await this.getDb().getAllAsync<QueueRow>('SELECT * FROM local_sync_queue ORDER BY created_at DESC');
    return rows.map(toLocalRecord);
  }

  async markSynced(id: string): Promise<void> {
    await this.getDb().runAsync(
      "UPDATE local_sync_queue SET sync_status = 'synced', synced_at = ?, last_error = NULL WHERE local_id = ?",
      [new Date().toISOString(), id]
    );
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.getDb().runAsync("UPDATE local_sync_queue SET sync_status = 'failed', last_error = ? WHERE local_id = ?", [
      error,
      id,
    ]);
  }

  async clearSynced(): Promise<void> {
    await this.getDb().runAsync("DELETE FROM local_sync_queue WHERE sync_status = 'synced'");
  }

  async getCache<T>(key: string): Promise<T | null> {
    const row = await this.getDb().getFirstAsync<{ value: string }>('SELECT value FROM kv_cache WHERE key = ?', [key]);
    if (!row) return null;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return null;
    }
  }

  async setCache<T>(key: string, value: T): Promise<void> {
    await this.getDb().runAsync('INSERT OR REPLACE INTO kv_cache (key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
  }

  private getDb(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('Local database not initialized. Call initDB() first.');
    return this.db;
  }
}
