import { useCallback, useState } from 'react';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { getStorage, type LocalRecord, type NewLocalRecord } from '../../../shared/services/storage';
import { syncPendingRecords, type SyncResult } from '../../../shared/services/sync';
import { toUserMessage } from '../../../shared/services/supabase';

/** Offline queue state + actions (save locally, Sync Now, clear synced). */
export function useOfflineSync() {
  const queue = useAsyncData<LocalRecord[]>(async () => (await getStorage()).getAllRecords(), []);
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const items = queue.data ?? [];
  const pendingCount = items.filter((r) => r.sync_status !== 'synced').length;
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
    setSyncing(true);
    setActionError(null);
    try {
      const result = await syncPendingRecords();
      setLastResult(result);
      return result;
    } catch (error) {
      console.error('Sync error:', error);
      setActionError(toUserMessage(error, 'Sync failed. Please check your internet connection and try again.'));
      return null;
    } finally {
      await reloadQueue();
      setSyncing(false);
    }
  }, [reloadQueue]);

  const clearSynced = useCallback(async () => {
    await (await getStorage()).clearSynced();
    await reloadQueue();
  }, [reloadQueue]);

  return {
    items,
    pendingCount,
    loading: queue.loading,
    storageError: queue.error,
    actionError,
    syncing,
    lastResult,
    saveOffline,
    syncNow,
    clearSynced,
    reloadQueue,
  };
}
