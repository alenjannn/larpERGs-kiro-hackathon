import type { LocalRecord, LocalStorage, NewLocalRecord } from '../storage';

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

function write(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch {
    // Quota exceeded or blocked storage; keep the data for this session at least.
  }
  memoryStore.set(key, value);
}

export default class StorageWeb implements LocalStorage {
  async initDB(): Promise<void> {
    if (read(QUEUE_KEY) === null) write(QUEUE_KEY, '[]');
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
