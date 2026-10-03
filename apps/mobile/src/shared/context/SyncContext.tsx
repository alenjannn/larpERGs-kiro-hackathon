import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { emptyCounts, flushAll, getTotalCounts, type QueueCounts } from '../services/syncQueues';

export interface SyncValue {
  /** Items per status across every registered queue. */
  counts: QueueCounts;
  isFlushing: boolean;
  /** Flushes every queue that has a flush function (single-flight). The BHW queue is not flushed here. */
  flush(): Promise<void>;
  refreshCounts(): Promise<void>;
}

const SyncContext = createContext<SyncValue | null>(null);

// No automatic triggers in Spec 01; Spec 02 wires reconnect/foreground flushes.
export function SyncProvider({ children }: { children: ReactNode }) {
  const [counts, setCounts] = useState<QueueCounts>(emptyCounts);
  const [isFlushing, setIsFlushing] = useState(false);
  const mounted = useRef(true);

  const refreshCounts = useCallback(async () => {
    const next = await getTotalCounts();
    if (mounted.current) setCounts(next);
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refreshCounts();
    return () => {
      mounted.current = false;
    };
  }, [refreshCounts]);

  const flush = useCallback(async () => {
    setIsFlushing(true);
    try {
      await flushAll();
    } finally {
      if (mounted.current) setIsFlushing(false);
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
