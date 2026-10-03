// Web connectivity: navigator.onLine + online/offline events, confirmed by a
// reachability probe. navigator.onLine only means "a network interface is up";
// it stays true on Wi-Fi without internet, when the backend is unreachable, or
// with DevTools Application → Service Workers → "Offline". In those cases the
// app could not load fresh data yet showed no offline banner, so we also probe.
// Native resolves connectivity.native.ts (NetInfo) instead, so NetInfo never
// enters the web bundle.
import { env } from '../config/env';

export type ConnectivityListener = (online: boolean | null) => void;

const PROBE_TIMEOUT_MS = 8000;
/** Re-check interval while the page is visible (also how fast we notice recovery). */
const RECHECK_MS = 15000;

/** Supabase health endpoint, or null when Supabase is not configured (then navigator.onLine alone decides). */
function probeUrl(): string | null {
  if (env.supabaseConfigError) return null;
  return `${env.supabaseUrl.replace(/\/+$/, '')}/auth/v1/health`;
}

/** True if any HTTP response comes back. Only a network-level failure or timeout counts as unreachable. */
async function canReach(url: string): Promise<boolean> {
  const controller = typeof AbortController === 'undefined' ? null : new AbortController();
  const timer = setTimeout(() => controller?.abort(), PROBE_TIMEOUT_MS);
  try {
    // no-cors: an opaque response still proves the server answered; no key is sent.
    await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store', signal: controller?.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function subscribeConnectivity(listener: ConnectivityListener): () => void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    listener(null);
    return () => {};
  }

  const url = probeUrl();
  let disposed = false;
  let probeSeq = 0;
  let last: boolean | null | undefined;

  const emit = (online: boolean) => {
    if (disposed || online === last) return;
    last = online;
    listener(online);
  };

  const check = () => {
    if (!navigator.onLine) {
      probeSeq += 1; // drop any in-flight probe result
      emit(false);
      return;
    }
    // Until the first probe answers, state stays unknown (null): no banner, no "last online" stamp.
    if (!url) {
      emit(true);
      return;
    }
    const seq = ++probeSeq;
    void canReach(url).then((reachable) => {
      if (seq === probeSeq) emit(reachable && navigator.onLine);
    });
  };

  const onVisibility = () => {
    if (document.visibilityState === 'visible') check();
  };
  const interval = setInterval(() => {
    if (typeof document === 'undefined' || document.visibilityState === 'visible') check();
  }, RECHECK_MS);

  check();
  window.addEventListener('online', check);
  window.addEventListener('offline', check);
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility);

  return () => {
    disposed = true;
    clearInterval(interval);
    window.removeEventListener('online', check);
    window.removeEventListener('offline', check);
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility);
  };
}
