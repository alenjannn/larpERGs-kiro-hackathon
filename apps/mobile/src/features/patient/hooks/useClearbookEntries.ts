import { useCallback, useEffect, useRef, useState } from 'react';
import { useConnectivity } from '../../../shared/context/ConnectivityContext';
import { fetchRecordById, insertPatientLabEntry } from '../../../shared/services/apiPatient';
import { currentEpoch } from '../../../shared/services/resetEpoch';
import { getStorage, type LocalV1Key } from '../../../shared/services/storage';
import { toUserMessage } from '../../../shared/services/supabase';
import {
  buildEntry,
  ENTRY_CONFLICT_ERROR,
  ENTRY_PREFIX,
  isClearbookEntry,
  sameEntryContent,
  toInsertRow,
  type ClearbookEntry,
  type EntryDraft,
} from '../logic/clearbook';

// Clearbook entries live on this device, one key per entry (design §4.6).
// One share attempt per save or per "Share now"; no queue, no automatic retry (K3).

const keyFor = (id: string): LocalV1Key => `${ENTRY_PREFIX}${id}`;
const SHARE_TIMEOUT_MS = 10_000;
const INTERRUPTED = 'Sending was interrupted.';
const NOT_CONFIRMED = 'Not confirmed yet.';

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const sharing = new Set<string>();
let interruptedReset: Promise<void> | null = null;

async function readAll(): Promise<ClearbookEntry[]> {
  const entries = await (await getStorage()).listItems<unknown>(ENTRY_PREFIX);
  const out: ClearbookEntry[] = [];
  for (const { key, value } of entries) {
    if (isClearbookEntry(value)) out.push(value);
    else console.warn(`Ignoring an unreadable lab entry saved at ${key}; it was not deleted.`);
  }
  return out;
}

async function put(entry: ClearbookEntry, epoch: number): Promise<void> {
  if (epoch !== currentEpoch()) return; // Reset happened: discard.
  await (await getStorage()).setItem(keyFor(entry.id), entry);
  emit();
}

/** Once per app load: an entry left 'sending' (reload mid-send) becomes 'failed' so Share now is offered. */
function resetInterrupted(): Promise<void> {
  if (!interruptedReset) {
    interruptedReset = (async () => {
      const epoch = currentEpoch();
      for (const e of await readAll()) {
        if (e._share_status === 'sending' && !sharing.has(e.id)) {
          await put({ ...e, _share_status: 'failed', _last_error: INTERRUPTED }, epoch);
        }
      }
    })().catch((error) => {
      interruptedReset = null;
      throw error;
    });
  }
  return interruptedReset;
}

async function shareEntry(id: string): Promise<void> {
  if (sharing.has(id)) return;
  sharing.add(id);
  const epoch = currentEpoch();
  try {
    const value = await (await getStorage()).getItem<unknown>(keyFor(id));
    if (!isClearbookEntry(value) || value._share_status === 'synced') return;
    const entry: ClearbookEntry = { ...value, _share_status: 'sending', _last_error: null };
    await put(entry, epoch);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SHARE_TIMEOUT_MS);
    try {
      await insertPatientLabEntry(toInsertRow(entry), controller.signal);
      const server = await fetchRecordById(id, controller.signal);
      if (!server) await put({ ...entry, _share_status: 'failed', _last_error: NOT_CONFIRMED }, epoch);
      else if (!sameEntryContent(entry, server)) await put({ ...entry, _share_status: 'failed', _last_error: ENTRY_CONFLICT_ERROR }, epoch);
      else await put({ ...entry, _share_status: 'synced', _last_error: null, _shared_at: new Date().toISOString() }, epoch);
    } catch (error) {
      const message = controller.signal.aborted ? 'The care team server did not answer in time.' : toUserMessage(error, 'Could not reach your care team.');
      await put({ ...entry, _share_status: 'failed', _last_error: message }, epoch);
    } finally {
      clearTimeout(timer);
    }
  } finally {
    sharing.delete(id);
  }
}

export interface ClearbookState {
  entries: ClearbookEntry[];
  loading: boolean;
  error: string | null;
}

/**
 * The patient's clearbook entries on this device, newest first.
 * `onShared` runs after a share attempt so the snapshot can pick up the server row.
 */
export function useClearbookEntries(patientId: string, bhwId: string | null, onShared?: () => void) {
  const { isOnline } = useConnectivity();
  const [state, setState] = useState<ClearbookState>({ entries: [], loading: true, error: null });
  const mounted = useRef(true);
  const onSharedRef = useRef(onShared);
  onSharedRef.current = onShared;

  const load = useCallback(async () => {
    try {
      await resetInterrupted();
      const all = (await readAll())
        .filter((e) => e.patient_id === patientId)
        .sort((a, b) => Date.parse(b.created_on_device_at) - Date.parse(a.created_on_device_at));
      if (mounted.current) setState({ entries: all, loading: false, error: null });
    } catch (error) {
      console.error('Could not read lab entries saved on this device:', error);
      if (mounted.current) setState((s) => ({ ...s, loading: false, error: toUserMessage(error, 'Could not read the lab results saved on this device.') }));
    }
  }, [patientId]);

  useEffect(() => {
    mounted.current = true;
    void load();
    listeners.add(load);
    return () => {
      mounted.current = false;
      listeners.delete(load);
    };
  }, [load]);

  const share = useCallback(
    async (id: string) => {
      if (isOnline === false) return;
      await shareEntry(id);
      onSharedRef.current?.();
    },
    [isOnline]
  );

  /** Persists and reads back before resolving; then one share attempt unless known offline. */
  const save = useCallback(
    async (draft: EntryDraft, id: string): Promise<ClearbookEntry> => {
      const storage = await getStorage();
      const existing = await storage.getItem<unknown>(keyFor(id));
      if (isClearbookEntry(existing)) return existing; // double tap: one entry
      const entry = buildEntry(draft, { id, patientId, bhwId });
      try {
        await storage.setItem(keyFor(id), entry);
        const back = await storage.getItem<unknown>(keyFor(id));
        if (!isClearbookEntry(back) || back.id !== id) throw new Error('Saved data could not be read back.');
      } catch (error) {
        throw new Error(`Could not save on this device: ${error instanceof Error ? error.message : String(error)}`);
      }
      emit();
      if (isOnline !== false) void share(id);
      return entry;
    },
    [bhwId, isOnline, patientId, share]
  );

  return { ...state, save, share, reload: load };
}
