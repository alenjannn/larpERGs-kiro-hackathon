// Help-request outbox: pure logic with injected dependencies (Spec 02, OC-11).
// No react-native / expo imports, so this file can be exercised in plain Node.
//
// Exactly-once delivery:
//   - the id is a client UUID, persisted before any confirmation or send;
//   - the server insert is `ON CONFLICT (id) DO NOTHING` (never an update);
//   - an item becomes 'synced' only after a read-back by id returns the same content;
//   - a different row with the same id is a 'conflict': nothing is overwritten.

import type { HelpReason } from '../types/db.types';

export type OutboxStatus = 'pending' | 'sending' | 'synced' | 'failed' | 'conflict';
export type OutboxCounts = Record<OutboxStatus, number>;

export const HELP_REASONS: readonly HelpReason[] = [
  'transport',
  'another_date',
  'lab_access',
  'document_help',
  'medicine_access',
  'other',
];
export const OUTBOX_PREFIX = 'tuloy:v1:help_requests:' as const;
export const MESSAGE_MAX_LENGTH = 500;
/** Retry delays after the 1st, 2nd, 3rd and later failures (OC-6.2). */
export const BACKOFF_MS = [2_000, 5_000, 15_000, 60_000] as const;
export const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

export const NO_ROW_ERROR = 'Not confirmed by the demo clinic inbox yet.';
export const CONFLICT_ERROR = 'Different request with this ID in the demo clinic inbox.';

export interface HelpRequestDraft {
  id: string;
  patient_id: string;
  reason: HelpReason;
  message: string | null;
}

export interface OutboxItem {
  id: string;
  patient_id: string;
  reason: HelpReason;
  message: string | null;
  /** ISO time the request was created on this device. */
  created_on_device_at: string;
  /** Server receipt time; null until synced. */
  received_at: string | null;
  // Local-only sync metadata (never sent to Supabase).
  _sync_status: OutboxStatus;
  _attempts: number;
  _last_error: string | null;
  _local_updated_at: string;
  /** When an automatic retry is due; null = no automatic retry. */
  _next_attempt_at: string | null;
}

export type ServerRow = Pick<OutboxItem, 'id' | 'patient_id' | 'reason' | 'message' | 'created_on_device_at'>;
export type ServerReadBack = ServerRow & { received_at: string };

export type ErrorKind = 'network' | 'permanent' | 'transient';

export interface OutboxDeps {
  store: {
    list(): Promise<OutboxItem[]>;
    get(id: string): Promise<OutboxItem | null>;
    put(item: OutboxItem): Promise<void>;
  };
  remote: {
    /** Upsert onConflict id, ignoreDuplicates. */
    insert(row: ServerRow, signal: AbortSignal): Promise<void>;
    readBack(id: string, signal: AbortSignal): Promise<ServerReadBack | null>;
  };
  /** null = unknown. false = known offline: no network attempt is made. */
  isOnline(): boolean | null;
  classify(error: unknown): ErrorKind;
  describe(error: unknown): string;
  now(): number;
  epoch(): number;
  setTimer(fn: () => void, ms: number): unknown;
  clearTimer(handle: unknown): void;
  requestTimeoutMs?: number;
}

export type OutboxEvent = 'changed' | 'flush-start' | 'flush-end';

export interface FlushResult {
  skipped: 'offline' | 'reset' | null;
  attempted: number;
  synced: number;
  failed: number;
  conflicts: number;
}

export class OutboxValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OutboxValidationError';
  }
}

export class OutboxPersistError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OutboxPersistError';
  }
}

export function emptyOutboxCounts(): OutboxCounts {
  return { pending: 0, sending: 0, synced: 0, failed: 0, conflict: 0 };
}

export function backoffDelay(attempts: number): number {
  const index = Math.min(Math.max(attempts, 1), BACKOFF_MS.length) - 1;
  return BACKOFF_MS[index];
}

export function toServerRow(item: ServerRow): ServerRow {
  return {
    id: item.id,
    patient_id: item.patient_id,
    reason: item.reason,
    message: item.message,
    created_on_device_at: item.created_on_device_at,
  };
}

/** Same request? Timestamps compare by instant (Postgres returns +00:00 with microseconds). */
export function sameContent(local: ServerRow, server: ServerRow): boolean {
  return (
    local.id === server.id &&
    local.patient_id === server.patient_id &&
    local.reason === server.reason &&
    (local.message ?? null) === (server.message ?? null) &&
    Date.parse(local.created_on_device_at) === Date.parse(server.created_on_device_at)
  );
}

const STATUSES: readonly OutboxStatus[] = ['pending', 'sending', 'synced', 'failed', 'conflict'];

export function isOutboxItem(value: unknown): value is OutboxItem {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  const nullableString = (x: unknown) => x === null || typeof x === 'string';
  return (
    typeof v.id === 'string' &&
    typeof v.patient_id === 'string' &&
    typeof v.reason === 'string' &&
    (HELP_REASONS as readonly string[]).includes(v.reason) &&
    nullableString(v.message) &&
    typeof v.created_on_device_at === 'string' &&
    nullableString(v.received_at) &&
    typeof v._sync_status === 'string' &&
    (STATUSES as readonly string[]).includes(v._sync_status) &&
    typeof v._attempts === 'number' &&
    nullableString(v._last_error) &&
    typeof v._local_updated_at === 'string' &&
    nullableString(v._next_attempt_at)
  );
}

/** Trims; empty → null; longer than 500 characters is rejected. */
export function normaliseMessage(message: string | null | undefined): string | null {
  if (message == null) return null;
  const trimmed = message.trim();
  if (!trimmed) return null;
  if (trimmed.length > MESSAGE_MAX_LENGTH) {
    throw new OutboxValidationError(`The message is too long (${trimmed.length} of ${MESSAGE_MAX_LENGTH} characters).`);
  }
  return trimmed;
}

export interface Outbox {
  init(): Promise<void>;
  enqueue(draft: HelpRequestDraft): Promise<OutboxItem>;
  list(patientId?: string): Promise<OutboxItem[]>;
  counts(): Promise<OutboxCounts>;
  flush(options?: { force?: string[] | 'all'; restart?: boolean }): Promise<FlushResult>;
  stopForReset(): void;
  subscribe(listener: (event: OutboxEvent) => void): () => void;
  isFlushing(): boolean;
}

type AttemptOutcome =
  | { kind: 'synced'; server: ServerReadBack }
  | { kind: 'conflict' }
  | { kind: 'no-row' }
  | { kind: 'error'; error: unknown };

function zeroResult(skipped: FlushResult['skipped'] = null): FlushResult {
  return { skipped, attempted: 0, synced: 0, failed: 0, conflicts: 0 };
}

export function createOutbox(deps: OutboxDeps): Outbox {
  const timeoutMs = deps.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const listeners = new Set<(event: OutboxEvent) => void>();
  let initPromise: Promise<void> | null = null;
  let running: Promise<FlushResult> | null = null;
  let rerun = false;
  let forceAll = false;
  const forceIds = new Set<string>();
  let controller: AbortController | null = null;
  let abortReason: 'restart' | 'reset' | null = null;
  let retryTimer: unknown = null;

  const iso = (ms: number) => new Date(ms).toISOString();

  function emit(event: OutboxEvent) {
    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Outbox listener failed:', error);
      }
    });
  }

  /** Writes only if no Reset happened since epoch `e`. */
  async function write(item: OutboxItem, e: number): Promise<boolean> {
    if (e !== deps.epoch()) return false;
    await deps.store.put(item);
    emit('changed');
    return true;
  }

  /** Once per load: a 'sending' item was interrupted (reload mid-send) → back to 'pending' (OC-5.4). */
  function init(): Promise<void> {
    if (!initPromise) {
      initPromise = (async () => {
        let changed = false;
        for (const item of await deps.store.list()) {
          if (item._sync_status !== 'sending') continue;
          await deps.store.put({ ...item, _sync_status: 'pending', _local_updated_at: iso(deps.now()) });
          changed = true;
        }
        if (changed) emit('changed');
      })().catch((error: unknown) => {
        initPromise = null;
        throw error;
      });
    }
    return initPromise;
  }

  async function enqueue(draft: HelpRequestDraft): Promise<OutboxItem> {
    if (!draft.id) throw new OutboxValidationError('The request has no ID.');
    if (!draft.patient_id) throw new OutboxValidationError('No patient is selected.');
    if (!(HELP_REASONS as readonly string[]).includes(draft.reason)) throw new OutboxValidationError('Choose a reason.');
    const message = normaliseMessage(draft.message);

    // Same form submitted twice → the stored item, unchanged (OC-2.4).
    const existing = await deps.store.get(draft.id);
    if (existing) return existing;

    const at = iso(deps.now());
    const item: OutboxItem = {
      id: draft.id,
      patient_id: draft.patient_id,
      reason: draft.reason,
      message,
      created_on_device_at: at,
      received_at: null,
      _sync_status: 'pending',
      _attempts: 0,
      _last_error: null,
      _local_updated_at: at,
      _next_attempt_at: null,
    };
    await deps.store.put(item);
    // Persisted means readable: confirm before the UI says "Saved on this device" (OC-2.1).
    const back = await deps.store.get(item.id);
    if (!back || back.id !== item.id) throw new OutboxPersistError('The request could not be read back from this device.');
    emit('changed');
    return back;
  }

  async function list(patientId?: string): Promise<OutboxItem[]> {
    await init();
    return (await deps.store.list())
      .filter((item) => !patientId || item.patient_id === patientId)
      .sort((a, b) => b.created_on_device_at.localeCompare(a.created_on_device_at));
  }

  async function counts(): Promise<OutboxCounts> {
    const result = emptyOutboxCounts();
    for (const item of await list()) result[item._sync_status] += 1;
    return result;
  }

  async function attempt(item: OutboxItem): Promise<{ outcome: AttemptOutcome; timedOut: boolean; aborted: 'restart' | 'reset' | null }> {
    const ctrl = new AbortController();
    controller = ctrl;
    abortReason = null;
    let timedOut = false;
    const timer = deps.setTimer(() => {
      timedOut = true;
      ctrl.abort();
    }, timeoutMs);
    let outcome: AttemptOutcome;
    try {
      await deps.remote.insert(toServerRow(item), ctrl.signal);
      const server = await deps.remote.readBack(item.id, ctrl.signal);
      if (!server) outcome = { kind: 'no-row' };
      else outcome = sameContent(item, server) ? { kind: 'synced', server } : { kind: 'conflict' };
    } catch (error) {
      outcome = { kind: 'error', error };
    } finally {
      deps.clearTimer(timer);
      if (controller === ctrl) controller = null;
    }
    const aborted = abortReason;
    abortReason = null;
    return { outcome, timedOut, aborted };
  }

  async function pass(e: number): Promise<FlushResult> {
    const result = zeroResult();
    const now = deps.now();
    const all = forceAll;
    const ids = new Set(forceIds);
    forceAll = false;
    forceIds.clear();

    const eligible = (await deps.store.list())
      .filter(
        (item) =>
          item._sync_status === 'pending' ||
          (item._sync_status === 'failed' &&
            (all || ids.has(item.id) || (item._next_attempt_at !== null && Date.parse(item._next_attempt_at) <= now)))
      )
      .sort((a, b) => a.created_on_device_at.localeCompare(b.created_on_device_at));

    for (const item of eligible) {
      if (e !== deps.epoch() || deps.isOnline() === false) break;
      const sending: OutboxItem = { ...item, _sync_status: 'sending', _local_updated_at: iso(deps.now()) };
      if (!(await write(sending, e))) break;
      result.attempted += 1;

      const { outcome, timedOut, aborted } = await attempt(sending);
      if (e !== deps.epoch()) break; // Reset happened: write nothing (OC-17.1)
      const at = iso(deps.now());

      if (outcome.kind === 'synced') {
        await write(
          {
            ...sending,
            _sync_status: 'synced',
            received_at: outcome.server.received_at,
            _last_error: null,
            _next_attempt_at: null,
            _local_updated_at: at,
          },
          e
        );
        result.synced += 1;
        continue;
      }
      if (outcome.kind === 'conflict') {
        // Local copy unchanged; nothing sent to the server; no automatic retry (OC-6.4).
        await write({ ...sending, _sync_status: 'conflict', _last_error: CONFLICT_ERROR, _next_attempt_at: null, _local_updated_at: at }, e);
        result.conflicts += 1;
        continue;
      }
      if (outcome.kind === 'error' && aborted && !timedOut) {
        // Aborted to restart (reconnect): not a failed attempt.
        await write({ ...sending, _sync_status: 'pending', _local_updated_at: at }, e);
        break;
      }

      const kind: ErrorKind = outcome.kind === 'no-row' ? 'transient' : timedOut ? 'network' : deps.classify(outcome.error);
      const message =
        outcome.kind === 'no-row'
          ? NO_ROW_ERROR
          : timedOut
            ? `No response from the demo clinic inbox after ${Math.round(timeoutMs / 1000)} seconds.`
            : deps.describe(outcome.error);
      const attempts = sending._attempts + 1;
      await write(
        {
          ...sending,
          _sync_status: 'failed',
          _attempts: attempts,
          _last_error: message,
          _next_attempt_at: kind === 'permanent' ? null : iso(deps.now() + backoffDelay(attempts)),
          _local_updated_at: at,
        },
        e
      );
      result.failed += 1;
      if (kind === 'network') break; // the connection is down: leave the rest untouched (OC-11.4)
    }
    return result;
  }

  async function scheduleRetry(e: number): Promise<void> {
    if (retryTimer !== null) {
      deps.clearTimer(retryTimer);
      retryTimer = null;
    }
    if (e !== deps.epoch() || deps.isOnline() === false) return;
    let earliest = Infinity;
    for (const item of await deps.store.list()) {
      if (item._sync_status !== 'failed' || item._next_attempt_at === null) continue;
      earliest = Math.min(earliest, Date.parse(item._next_attempt_at));
    }
    if (!Number.isFinite(earliest)) return;
    const delay = Math.max(100, earliest - deps.now());
    retryTimer = deps.setTimer(() => {
      retryTimer = null;
      flush().catch((error: unknown) => console.error('Scheduled outbox retry failed:', error));
    }, delay);
  }

  function flush(options: { force?: string[] | 'all'; restart?: boolean } = {}): Promise<FlushResult> {
    // Known offline: no network attempt at all (K8, OC-6.3).
    if (deps.isOnline() === false) return Promise.resolve(zeroResult('offline'));
    if (options.force === 'all') forceAll = true;
    else options.force?.forEach((id) => forceIds.add(id));

    if (running) {
      // Single-flight: join the running flush and ask for one more pass (OC-5.3).
      rerun = true;
      if (options.restart && controller) {
        abortReason = 'restart';
        controller.abort();
      }
      return running;
    }

    emit('flush-start');
    running = (async () => {
      const total = zeroResult();
      await init();
      const e = deps.epoch();
      do {
        rerun = false;
        const r = await pass(e);
        total.attempted += r.attempted;
        total.synced += r.synced;
        total.failed += r.failed;
        total.conflicts += r.conflicts;
      } while (rerun && e === deps.epoch() && deps.isOnline() !== false);
      if (e !== deps.epoch()) total.skipped = 'reset';
      else await scheduleRetry(e);
      return total;
    })().finally(() => {
      running = null;
      emit('flush-end');
    });
    return running;
  }

  function stopForReset(): void {
    if (retryTimer !== null) {
      deps.clearTimer(retryTimer);
      retryTimer = null;
    }
    rerun = false;
    forceAll = false;
    forceIds.clear();
    if (controller) {
      abortReason = 'reset';
      controller.abort();
    }
  }

  function subscribe(listener: (event: OutboxEvent) => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  return { init, enqueue, list, counts, flush, stopForReset, subscribe, isFlushing: () => running !== null };
}
