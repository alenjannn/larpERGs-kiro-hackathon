import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Browser connectivity (navigator.onLine). Returns null on native, where
 * connectivity is unknown until a sync attempt is made.
 */
export function useOnlineStatus(): boolean | null {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined') return;
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return online;
}
