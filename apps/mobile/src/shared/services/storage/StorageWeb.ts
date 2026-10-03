import type { LocalRecord, LocalStorage, LocalV1Key, NewLocalRecord } from '../storage';
import { isDemoDataKey, LocalStorageUnavailableError } from './errors';

const QUEUE_KEY = 'tuloy_offline_records';
const CACHE_PREFIX = 'tuloy_cache:';

/** In-memory fallback for environments without localStorage (static pre-render, private mode). */
const memoryStore = new Map<string, string>();

function read(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage.getItem(key);
  } catch {
    // Access can throw in sandboxed iframes / blocked storage; fall through to memory.
  }
  return memoryStore.get(key) ?? null;
}

/**
 * Legacy queue/cache write. The memory fallback is only for environments with
 * no localStorage at all (static pre-render). When real storage rejects the
 * write (quota, blocked), the error is surfaced instead of keeping the data in
 * memory only, where a refresh would silently lose it (Spec 02, OC-8.4).
 */
function write(key: string, value: string): void {
  let storage: Storage | null = null;
  try {
    if (typeof window !== 'undefined' && window.localStorage) storage = window.localStorage;
  } catch {
    // Accessing localStorage itself throws when storage is blocked.
    throw new LocalStorageUnavailableError('Browser storage is blocked, so nothing can be saved on this device.');
  }
  if (!storage) {
    memoryStore.set(key, value);
    return;
  }
  try {
    storage.setItem(key, value);
  } catch (error) {
    throw new LocalStorageUnavailableError(
      `Could not save on this device (browser storage is full or blocked): ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/** window.localStorage, or a visible error when the browser blocks it. */
function browserStorage(): Storage {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {
    // Accessing localStorage throws when storage is blocked (sandboxed iframe, privacy settings).
  }
  throw new LocalStorageUnavailableError('Browser storage is not available, so nothing can be saved on this device.');
}

export default class StorageWeb implements LocalStorage {
  async initDB(): Promise<void> {
    if (read(QUEUE_KEY) !== null) return;
    try {
      write(QUEUE_KEY, '[]');
    } catch (error) {
      // Not fatal: an absent queue reads as empty. The failure surfaces on the first real save.
      console.warn('Could not initialise the offline queue:', error);
    }
  }

  async saveRecord(record: NewLocalRecord): Promise<void> {
    const records = this.readQueue();
    if (records.some((r) => r.local_id === record.id)) return;
    records.push({
      local_id: record.id,
      entity: record.entity,
      message: record.message,
      payload: record.payload ?? {},
      sync_status: 'pending',
      created_at: new Date().toISOString(),
      synced_at: null,
      last_error: null,
    });
    this.writeQueue(records);
  }

  async getPendingRecords(): Promise<LocalRecord[]> {
    return this.readQueue()
      .filter((r) => r.sync_status !== 'synced')
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  async getAllRecords(): Promise<LocalRecord[]> {
    return this.readQueue().sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async markSynced(id: string): Promise<void> {
    this.update(id, { sync_status: 'synced', synced_at: new Date().toISOString(), last_error: null });
  }

  async markFailed(id: string, error: string): Promise<void> {
    this.update(id, { sync_status: 'failed', last_error: error });
  }

  async clearSynced(): Promise<void> {
    this.writeQueue(this.readQueue().filter((r) => r.sync_status !== 'synced'));
  }

  async getCache<T>(key: string): Promise<T | null> {
    const raw = read(CACHE_PREFIX + key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setCache<T>(key: string, value: T): Promise<void> {
    write(CACHE_PREFIX + key, JSON.stringify(value));
  }

  // --- tuloy:v1:* (Spec 01). No in-memory fallback: failures are visible. ---

  async getItem<T>(key: LocalV1Key): Promise<T | null> {
    const raw = browserStorage().getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setItem<T>(key: LocalV1Key, value: T): Promise<void> {
    const storage = browserStorage();
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      throw new LocalStorageUnavailableError(
        `Could not save on this device (browser storage is full or blocked): ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async removeItem(key: LocalV1Key): Promise<void> {
    browserStorage().removeItem(key);
  }

  async listItems<T>(prefix: LocalV1Key): Promise<{ key: LocalV1Key; value: T }[]> {
    const storage = browserStorage();
    // Collect first, then read: keeps iteration stable if another tab writes meanwhile.
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key !== null && key.startsWith(prefix)) keys.push(key);
    }
    const items: { key: LocalV1Key; value: T }[] = [];
    for (const key of keys) {
      const raw = storage.getItem(key);
      if (raw === null) continue;
      try {
        items.push({ key: key as LocalV1Key, value: JSON.parse(raw) as T });
      } catch {
        console.warn(`Skipping unreadable saved item ${key}`);
      }
    }
    return items;
  }

  async clearDemoData(): Promise<{ cleared: number }> {
    for (const key of Array.from(memoryStore.keys())) {
      if (isDemoDataKey(key)) memoryStore.delete(key);
    }
    const storage = browserStorage();
    // Collect first: removing while iterating shifts the indexes.
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key !== null && isDemoDataKey(key)) keys.push(key);
    }
    const failed: string[] = [];
    for (const key of keys) {
      try {
        storage.removeItem(key);
      } catch {
        failed.push(key);
      }
    }
    if (failed.length) {
      throw new LocalStorageUnavailableError(`Could not clear ${failed.length} saved item(s) on this device: ${failed.join(', ')}`);
    }
    return { cleared: keys.length };
  }

  private update(id: string, changes: Partial<LocalRecord>): void {
    this.writeQueue(this.readQueue().map((r) => (r.local_id === id ? { ...r, ...changes } : r)));
  }

  private readQueue(): LocalRecord[] {
    try {
      const parsed = JSON.parse(read(QUEUE_KEY) || '[]');
      return Array.isArray(parsed) ? (parsed as LocalRecord[]) : [];
    } catch {
      return [];
    }
  }

  private writeQueue(records: LocalRecord[]): void {
    write(QUEUE_KEY, JSON.stringify(records));
  }
}
