import { useCallback, useState } from 'react';
import { useConnectivity } from '../../../shared/context/ConnectivityContext';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { getStorage, type LocalRecord, type NewLocalRecord } from '../../../shared/services/storage';
import { syncPendingRecords, type SyncResult } from '../../../shared/services/sync';
import { toUserMessage } from '../../../shared/services/supabase';
import { fieldQueueCounts } from '../fieldQueueStatus';

// Single-flight across every screen using this hook (B-4.5): taps during a run
// join it instead of starting a second one. The upserts are idempotent anyway.
let inFlight: Promise<SyncResult> | null = null;
const listeners = new Set<(running: boolean) => void>();

function runSync(): Promise<SyncResult> {
  if (!inFlight) {
    listeners.forEach((l) => l(true));
    inFlight = syncPendingRecords().finally(() => {
      inFlight = null;
      listeners.forEach((l) => l(false));
    });
  }
  return inFlight;
}

export function syncOfflineNotice(count: number): string {
  return `Sync Now needs a connection. ${count === 1 ? 'Your 1 item is' : `All ${count} items are`} still saved on this device.`;
}

/** Offline queue state + actions (save locally, Sync Now, clear synced). */
export function useOfflineSync() {
  const queue = useAsyncData<LocalRecord[]>(async () => (await getStorage()).getAllRecords(), []);
  const { isOnline } = useConnectivity();
  const [syncing, setSyncing] = useState(inFlight !== null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  const items = queue.data ?? [];
  const pendingCount = items.filter((r) => r.sync_status !== 'synced').length;
  const counts = fieldQueueCounts(items, syncing);
  const reloadQueue = queue.reload;

  const saveOffline = useCallback(
    async (item: NewLocalRecord): Promise<boolean> => {
      setActionError(null);
      try {
        await (await getStorage()).saveRecord(item);
        await reloadQueue();
        return true;
      } catch (error) {
        console.error('Failed to save offline record:', error);
        setActionError(toUserMessage(error, 'Could not save to local storage.'));
        return false;
      }
    },
    [reloadQueue]
  );

  const syncNow = useCallback(async (): Promise<SyncResult | null> => {
    setActionError(null);
    // B-4.3: explain, send nothing, keep every item.
    if (isOnline === false) {
      setOfflineNotice(syncOfflineNotice(pendingCount));
      return null;
    }
    setOfflineNotice(null);
    const onChange = (running: boolean) => setSyncing(running);
    listeners.add(onChange);
    setSyncing(true);
    try {
      const result = await runSync();
      setLastResult(result);
      return result;
    } catch (error) {
      console.error('Sync error:', error);
      setActionError(toUserMessage(error, 'Sync failed. Please check your internet connection and try again.'));
      return null;
    } finally {
      listeners.delete(onChange);
      await reloadQueue();
      setSyncing(false);
    }
  }, [isOnline, pendingCount, reloadQueue]);

  const clearSynced = useCallback(async () => {
    await (await getStorage()).clearSynced();
    await reloadQueue();
  }, [reloadQueue]);

  return {
    items,
    pendingCount,
    counts,
    loading: queue.loading,
    storageError: queue.error,
    actionError,
    offlineNotice,
    syncing,
    lastResult,
    saveOffline,
    syncNow,
    clearSynced,
    reloadQueue,
  };
}
