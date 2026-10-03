// The help-request outbox singleton (Spec 02). Wires the pure core
// (outboxCore.ts) to device storage, the API layer, timers and the queue
// registry. Screens use this module; nothing else sends help requests.

import { Platform } from 'react-native';
import { fetchHelpRequestById, insertHelpRequest } from './api';
import {
  createOutbox,
  isOutboxItem,
  OUTBOX_PREFIX,
  type ErrorKind,
  type FlushResult,
  type HelpRequestDraft,
  type OutboxEvent,
  type OutboxItem,
} from './outboxCore';
import { currentEpoch } from './resetEpoch';
import { getStorage, type LocalV1Key } from './storage';
import { isNetworkError, SupabaseConfigError, toUserMessage } from './supabase';
import { registerQueue } from './syncQueues';

export type { FlushResult, HelpRequestDraft, OutboxItem } from './outboxCore';

const keyFor = (id: string): LocalV1Key => `${OUTBOX_PREFIX}${id}`;

let onlineGetter: () => boolean | null = () => null;

/** SyncProvider passes its current connectivity here. */
export function setOutboxOnlineGetter(getter: () => boolean | null): void {
  onlineGetter = getter;
}

function classify(error: unknown): ErrorKind {
  if (error instanceof SupabaseConfigError) return 'permanent';
  if (typeof error === 'object' && error !== null && (error as { name?: unknown }).name === 'AbortError') return 'network';
  if (isNetworkError(error)) return 'network';
  const code = typeof error === 'object' && error !== null ? (error as { code?: unknown }).code : undefined;
  // Postgres data/constraint/permission errors and PostgREST schema errors will not fix themselves.
  if (typeof code === 'string' && (/^(22|23|42)/.test(code) || /^PGRST[12]/.test(code))) return 'permanent';
  return 'transient';
}

const core = createOutbox({
  store: {
    async list() {
      const entries = await (await getStorage()).listItems<unknown>(OUTBOX_PREFIX);
      const items: OutboxItem[] = [];
      for (const { key, value } of entries) {
        if (isOutboxItem(value)) items.push(value);
        else console.warn(`Ignoring an unreadable help request saved at ${key}; it was not deleted.`);
      }
      return items;
    },
    async get(id) {
      const value = await (await getStorage()).getItem<unknown>(keyFor(id));
      return isOutboxItem(value) ? value : null;
    },
    async put(item) {
      await (await getStorage()).setItem(keyFor(item.id), item);
    },
  },
  remote: {
    insert: (row, signal) => insertHelpRequest(row, signal),
    async readBack(id, signal) {
      const row = await fetchHelpRequestById(id, signal);
      return row
        ? {
            id: row.id,
            patient_id: row.patient_id,
            reason: row.reason,
            message: row.message,
            created_on_device_at: row.created_on_device_at,
            received_at: row.received_at,
          }
        : null;
    },
  },
  isOnline: () => onlineGetter(),
  classify,
  describe: (error) => toUserMessage(error, 'The demo clinic inbox could not be reached.'),
  now: () => Date.now(),
  epoch: currentEpoch,
  setTimer: (fn, ms) => setTimeout(fn, ms),
  clearTimer: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
});

const listeners = new Set<(event: OutboxEvent) => void>();
function emit(event: OutboxEvent) {
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      console.error('Outbox listener failed:', error);
    }
  });
}
core.subscribe(emit);

let lastError: string | null = null;

/** Never rejects: storage or unexpected errors are logged and exposed via lastError(). */
async function flush(options?: { force?: string[] | 'all'; restart?: boolean }): Promise<FlushResult | null> {
  try {
    const result = await core.flush(options);
    lastError = null;
    return result;
  } catch (error) {
    console.error('Help-request flush failed:', error);
    lastError = error instanceof Error ? error.message : String(error);
    emit('changed');
    return null;
  }
}

export const outbox = {
  /** Persists and reads back before resolving. Then sends at once unless known offline (K7). */
  async enqueue(draft: HelpRequestDraft): Promise<OutboxItem> {
    const item = await core.enqueue(draft);
    if (onlineGetter() !== false) void flush();
    return item;
  },
  list: (patientId?: string) => core.list(patientId),
  counts: () => core.counts(),
  flush,
  /** Manual Try again for one item (ignores backoff). The UI checks connectivity first (K8). */
  retry: (id: string) => flush({ force: [id] }),
  retryAll: () => flush({ force: 'all' }),
  /** Reset demo data: call after bumpEpoch(), before clearing storage. */
  stopForReset: () => core.stopForReset(),
  isFlushing: () => core.isFlushing(),
  lastError: () => lastError,
  subscribe(listener: (event: OutboxEvent) => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/** Tell listeners the stored items changed outside the outbox (e.g. after Reset cleared them). */
export function notify(): void {
  emit('changed');
}

// Writes from other tabs refresh this tab's lists (no cross-tab flush coordination).
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key.startsWith(OUTBOX_PREFIX)) emit('changed');
  });
}

registerQueue({
  id: 'help_requests',
  getCounts: () => core.counts(),
  flush: async () => {
    await flush();
  },
});
