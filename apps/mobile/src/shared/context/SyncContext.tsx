import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { subscribeForeground } from '../services/foreground';
import { outbox, setOutboxOnlineGetter } from '../services/outbox';
import { emptyCounts, flushAll, getTotalCounts, type QueueCounts } from '../services/syncQueues';
import { useConnectivity } from './ConnectivityContext';

export interface SyncValue {
  /** Items per status across every registered queue. */
  counts: QueueCounts;
  isFlushing: boolean;
  /** Flushes every queue that has a flush function (single-flight). The BHW queue is not flushed here. */
  flush(): Promise<void>;
  refreshCounts(): Promise<void>;
}

const SyncContext = createContext<SyncValue | null>(null);

/**
 * Queue counts plus the help-request outbox triggers (Spec 02, OC-4):
 * app start once online, offline → online (restarts an in-flight send),
 * foreground/visibility while online. Submit and Try again are triggered by
 * the outbox and the UI. Nothing is sent while the app is closed (deferred).
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  const { isOnline, onReconnect } = useConnectivity();
  const [counts, setCounts] = useState<QueueCounts>(emptyCounts);
  const [isFlushing, setIsFlushing] = useState(false);
  const mounted = useRef(true);
  const onlineRef = useRef<boolean | null>(isOnline);
  const startedRef = useRef(false);

  onlineRef.current = isOnline;

  const refreshCounts = useCallback(async () => {
    const next = await getTotalCounts();
    if (mounted.current) setCounts(next);
  }, []);

  useEffect(() => {
    mounted.current = true;
    setOutboxOnlineGetter(() => onlineRef.current);
    void refreshCounts();
    return () => {
      mounted.current = false;
    };
  }, [refreshCounts]);

  // Outbox events drive isFlushing and (debounced) counts.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = outbox.subscribe((event) => {
      if (event === 'flush-start') setIsFlushing(true);
      if (event === 'flush-end') setIsFlushing(false);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        void refreshCounts();
      }, 250);
    });
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [refreshCounts]);

  // App start: the first time connectivity is known to be online.
  useEffect(() => {
    if (isOnline === true && !startedRef.current) {
      startedRef.current = true;
      void outbox.flush();
    }
  }, [isOnline]);

  // Offline → online: start at once, aborting and restarting any stuck attempt (OC-4.1).
  // The reconnect event fires before React re-renders with isOnline = true, so
  // onlineRef (read by the outbox) still says offline here. The event itself
  // proves we are online: update the ref first, or the flush is skipped and
  // requests saved offline wait until the app is reopened.
  useEffect(
    () =>
      onReconnect(() => {
        onlineRef.current = true;
        void outbox.flush({ restart: true });
      }),
    [onReconnect]
  );

  // Foreground / visibility while online.
  useEffect(
    () =>
      subscribeForeground(() => {
        if (onlineRef.current === true) void outbox.flush();
      }),
    []
  );

  const flush = useCallback(async () => {
    setIsFlushing(true);
    try {
      await flushAll();
    } finally {
      if (mounted.current) setIsFlushing(outbox.isFlushing());
      await refreshCounts();
    }
  }, [refreshCounts]);

  const value = useMemo(() => ({ counts, isFlushing, flush, refreshCounts }), [counts, isFlushing, flush, refreshCounts]);
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncValue {
  const value = useContext(SyncContext);
  if (!value) throw new Error('useSync must be used inside <SyncProvider>.');
  return value;
}
