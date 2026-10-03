import { useCallback, useState } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { env } from '../config/env';
import { useConnectivity } from '../context/ConnectivityContext';
import { useDemoRole } from '../context/DemoRoleContext';
import { useSync } from '../context/SyncContext';
import { resetDemoData } from '../services/api';
import { notify as notifyOutbox, outbox } from '../services/outbox';
import { bumpEpoch } from '../services/resetEpoch';
import { getStorage } from '../services/storage';
import { toUserMessage } from '../services/supabase';

export type DemoResetStatus = 'idle' | 'running' | 'done' | 'error';

/**
 * Reset demo data: server first (reset_demo_data RPC), then this device's
 * tuloy:v1:* and legacy keys, then in-memory state. Local data is cleared ONLY
 * after the server reset succeeds, so a failed reset changes nothing.
 */
export function useDemoReset() {
  const router = useRouter();
  const pathname = usePathname();
  const { resetRole } = useDemoRole();
  const { resetHistory } = useConnectivity();
  const { refreshCounts } = useSync();
  const [status, setStatus] = useState<DemoResetStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (): Promise<boolean> => {
    setStatus('running');
    setError(null);
    try {
      await resetDemoData(env.demoMapCenter);
    } catch (e) {
      console.error('reset_demo_data failed:', e);
      setError(`Demo data was not reset. Nothing was changed. ${toUserMessage(e, 'The server reset failed.')}`);
      setStatus('error');
      return false;
    }

    // Anything started before the reset (outbox flush, snapshot load) must not write afterwards.
    bumpEpoch();
    outbox.stopForReset();

    try {
      await (await getStorage()).clearDemoData();
      notifyOutbox();
    } catch (e) {
      console.error('Clearing local demo data failed:', e);
      setError(
        `The server data was reset, but saved data on this device was not cleared: ${e instanceof Error ? e.message : String(e)}`
      );
      setStatus('error');
      return false;
    }

    resetRole();
    resetHistory();
    await refreshCounts().catch((e) => console.warn('Could not refresh queue counts:', e));
    setStatus('done');
    // The launcher hosts the button; only navigate if called from elsewhere.
    if (pathname !== '/') router.replace('/');
    return true;
  }, [pathname, refreshCounts, resetHistory, resetRole, router]);

  const clear = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return { status, error, running: status === 'running', run, clear };
}
