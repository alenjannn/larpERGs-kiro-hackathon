import { useCallback, useEffect, useRef, useState } from 'react';
import { useConnectivity } from '../../../shared/context/ConnectivityContext';
import { OFFLINE_RETRY_NOTICE } from '../../../shared/helpRequests';
import { outbox, type OutboxItem } from '../../../shared/services/outbox';
import { toUserMessage } from '../../../shared/services/supabase';

/** Live list of this patient's outbox items, plus Try again (Spec 02, OC-12.6–12.7). */
export function useHelpRequests(patientId: string) {
  const { isOnline } = useConnectivity();
  const [items, setItems] = useState<OutboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      const next = await outbox.list(patientId);
      if (!mounted.current) return;
      setItems(next);
      setError(outbox.lastError());
    } catch (e) {
      console.error('Could not read saved help requests:', e);
      if (mounted.current) setError(toUserMessage(e, 'Could not read the requests saved on this device.'));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    mounted.current = true;
    void load();
    const unsubscribe = outbox.subscribe((event) => {
      if (event === 'changed') void load();
    });
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [load]);

  useEffect(() => {
    if (isOnline) setOfflineNotice(null);
  }, [isOnline]);

  // Known offline: no network attempt; say it will send on reconnect (K8, OC-6.3).
  const retry = useCallback(
    async (id: string) => {
      if (isOnline === false) {
        setOfflineNotice(OFFLINE_RETRY_NOTICE);
        return;
      }
      setOfflineNotice(null);
      await outbox.retry(id);
    },
    [isOnline]
  );

  const retryAll = useCallback(async () => {
    if (isOnline === false) {
      setOfflineNotice(OFFLINE_RETRY_NOTICE);
      return;
    }
    setOfflineNotice(null);
    await outbox.retryAll();
  }, [isOnline]);

  return { items, loading, error, offlineNotice, retry, retryAll, reload: load };
}
