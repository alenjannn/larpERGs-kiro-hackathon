import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { toUserMessage } from '../services/supabase';

export interface AsyncData<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
}

/**
 * Loads data and reloads whenever the screen regains focus, so switching roles
 * via the Quick-Switch header always shows fresh data from the other roles.
 */
export function useAsyncData<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncData<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);
  const requestId = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(loader, deps);

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const result = await load();
      if (mounted.current && id === requestId.current) {
        setData(result);
        setError(null);
      }
    } catch (e) {
      console.error('Load failed:', e);
      if (mounted.current && id === requestId.current) setError(toUserMessage(e, 'Could not load data.'));
    } finally {
      if (mounted.current && id === requestId.current) setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  return { data, error, loading, reload };
}
