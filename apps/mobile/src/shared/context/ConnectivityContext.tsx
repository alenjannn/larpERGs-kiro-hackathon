import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { subscribeConnectivity } from '../services/connectivity';
import { getStorage } from '../services/storage';

const LAST_ONLINE_KEY = 'tuloy:v1:last_online_at';

export interface ConnectivityValue {
  /** null while unknown (no offline banner). */
  isOnline: boolean | null;
  /** Last time the app observed being online (ISO), persisted across reloads. */
  lastOnlineAt: string | null;
  /** Called on every offline → online transition. Returns an unsubscribe function. */
  onReconnect(callback: () => void): () => void;
  /** Clears lastOnlineAt (used by Reset demo data). */
  resetHistory(): void;
}

const ConnectivityContext = createContext<ConnectivityValue | null>(null);

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [lastOnlineAt, setLastOnlineAt] = useState<string | null>(null);
  const previous = useRef<boolean | null>(null);
  const reconnectListeners = useRef(new Set<() => void>());

  const recordOnline = useCallback((at: string) => {
    setLastOnlineAt(at);
    getStorage()
      .then((s) => s.setItem(LAST_ONLINE_KEY, at))
      .catch((error) => console.warn('Could not persist last online time:', error));
  }, []);

  // Restore the persisted value first, so an offline reopen still knows it.
  useEffect(() => {
    let cancelled = false;
    getStorage()
      .then((s) => s.getItem<string>(LAST_ONLINE_KEY))
      .then((value) => {
        if (!cancelled && typeof value === 'string') setLastOnlineAt((current) => current ?? value);
      })
      .catch((error) => console.warn('Could not read last online time:', error));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () =>
      subscribeConnectivity((online) => {
        const was = previous.current;
        previous.current = online;
        setIsOnline(online);
        // Online now, or the moment we went offline: both are "last seen online".
        if (online === true || (online === false && was === true)) recordOnline(new Date().toISOString());
        if (online === true && was === false) {
          reconnectListeners.current.forEach((listener) => {
            try {
              listener();
            } catch (error) {
              console.error('Reconnect listener failed:', error);
            }
          });
        }
      }),
    [recordOnline]
  );

  const onReconnect = useCallback((callback: () => void) => {
    reconnectListeners.current.add(callback);
    return () => {
      reconnectListeners.current.delete(callback);
    };
  }, []);

  const resetHistory = useCallback(() => {
    setLastOnlineAt(isOnline ? new Date().toISOString() : null);
  }, [isOnline]);

  const value = useMemo(
    () => ({ isOnline, lastOnlineAt, onReconnect, resetHistory }),
    [isOnline, lastOnlineAt, onReconnect, resetHistory]
  );
  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
}

export function useConnectivity(): ConnectivityValue {
  const value = useContext(ConnectivityContext);
  if (!value) throw new Error('useConnectivity must be used inside <ConnectivityProvider>.');
  return value;
}
