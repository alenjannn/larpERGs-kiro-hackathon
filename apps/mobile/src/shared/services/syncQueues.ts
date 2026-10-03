// Queue registry behind SyncContext. Each local queue registers an adapter
// that reports its counts and (optionally) a flush function. Spec 02 registers
// the help-request outbox here.
//
// The existing BHW queue is registered COUNTS-ONLY: BHW records are sent by the
// existing Sync Now button (sync.ts) and never by flushAll() (decision C1).

import { getStorage } from './storage';
import type { QueueStatus } from '../status';

export type { QueueStatus };
export type QueueCounts = Record<QueueStatus, number>;

export interface SyncQueueAdapter {
  id: string;
  getCounts(): Promise<QueueCounts>;
  flush?(): Promise<void>;
}

export function emptyCounts(): QueueCounts {
  return { pending: 0, sending: 0, synced: 0, failed: 0, conflict: 0 };
}

const adapters = new Map<string, SyncQueueAdapter>();

/** Registers (or replaces) a queue. Returns an unregister function. */
export function registerQueue(adapter: SyncQueueAdapter): () => void {
  adapters.set(adapter.id, adapter);
  return () => {
    if (adapters.get(adapter.id) === adapter) adapters.delete(adapter.id);
  };
}

let inFlight: Promise<void> | null = null;

/** Single-flight: while a flush runs, every caller gets the same promise. */
export function flushAll(): Promise<void> {
  if (!inFlight) {
    inFlight = (async () => {
      for (const adapter of adapters.values()) {
        if (!adapter.flush) continue;
        try {
          await adapter.flush();
        } catch (error) {
          console.error(`Flush failed for queue "${adapter.id}":`, error);
        }
      }
    })().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

export function isFlushInProgress(): boolean {
  return inFlight !== null;
}

/** Sum of every queue's counts. A failing adapter counts as 0 and is logged. */
export async function getTotalCounts(): Promise<QueueCounts> {
  const total = emptyCounts();
  for (const adapter of adapters.values()) {
    try {
      const counts = await adapter.getCounts();
      for (const status of Object.keys(total) as QueueStatus[]) total[status] += counts[status] ?? 0;
    } catch (error) {
      console.warn(`Could not read counts for queue "${adapter.id}":`, error);
    }
  }
  return total;
}

/** Existing BHW field-record queue (local_sync_queue / tuloy_offline_records): counts only, no flush. */
export const legacyBhwQueue: SyncQueueAdapter = {
  id: 'bhw_records',
  async getCounts() {
    const counts = emptyCounts();
    for (const item of await (await getStorage()).getAllRecords()) counts[item.sync_status] += 1;
    return counts;
  },
};

registerQueue(legacyBhwQueue);
