// Web connectivity: navigator.onLine + online/offline events, confirmed by a
// reachability probe. navigator.onLine only means "a network interface is up";
// it stays true on Wi-Fi without internet, when the backend is unreachable, or
// with DevTools Application → Service Workers → "Offline". In those cases the
// app could not load fresh data yet showed no offline banner, so we also probe.
// Native resolves connectivity.native.ts (NetInfo) instead, so NetInfo never
// enters the web bundle.
//
// The probe reuses the same authenticated REST call shape every other screen
// already makes successfully (apikey header, normal CORS), instead of an
// unauthenticated no-cors HEAD request: that was found to resolve as
// net::ERR_ABORTED in Chrome right at a reconnect transition even though the
// server had already answered, which left the app stuck reporting "offline"
// with no further retry for up to RECHECK_MS.
import { env } from '../config/env';

export type ConnectivityListener = (online: boolean | null) => void;

const PROBE_TIMEOUT_MS = 8000;
/** Re-check interval once reachability is confirmed. */
const RECHECK_MS = 15000;
/** Faster re-checks while just-online but not yet confirmed reachable (handles a transient first-probe failure). */
const FAST_RECHECK_MS = 2000;
const FAST_RECHECK_ATTEMPTS = 5;

/** Supabase REST probe URL, or null when Supabase is not configured (then navigator.onLine alone decides). */
function probeUrl(): string | null {
  if (env.supabaseConfigError) return null;
  return `${env.supabaseUrl.replace(/\/+$/, '')}/rest/v1/connection_test?select=id&limit=1`;
}

/** True only if the server actually answers (any HTTP status). A network-level failure or timeout means unreachable. */
async function canReach(url: string): Promise<boolean> {
  const controller = typeof AbortController === 'undefined' ? null : new AbortController();
  const timer = setTimeout(() => controller?.abort(), PROBE_TIMEOUT_MS);
  try {
    await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller?.signal,
      headers: { apikey: env.supabaseAnonKey, Authorization: `Bearer ${env.supabaseAnonKey}` },
    });
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
  let fastRetriesLeft = 0;
  let fastTimer: ReturnType<typeof setTimeout> | null = null;

  const emit = (online: boolean) => {
    if (disposed || online === last) return;
    last = online;
    listener(online);
  };

  const clearFastTimer = () => {
    if (fastTimer !== null) {
      clearTimeout(fastTimer);
      fastTimer = null;
    }
  };

  const check = () => {
    if (!navigator.onLine) {
      probeSeq += 1; // drop any in-flight probe result
      clearFastTimer();
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
      if (seq !== probeSeq || disposed) return;
      emit(reachable && navigator.onLine);
      // A single failed/aborted probe shouldn't strand the app offline for a full
      // RECHECK_MS: retry quickly a few times (handles the reconnect transition).
      if (!reachable && navigator.onLine && fastRetriesLeft > 0) {
        fastRetriesLeft -= 1;
        clearFastTimer();
        fastTimer = setTimeout(check, FAST_RECHECK_MS);
      }
    });
  };

  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      fastRetriesLeft = FAST_RECHECK_ATTEMPTS;
      check();
    }
  };
  const interval = setInterval(() => {
    if (typeof document === 'undefined' || document.visibilityState === 'visible') check();
  }, RECHECK_MS);

  fastRetriesLeft = FAST_RECHECK_ATTEMPTS;
  check();
  const onNetworkEvent = () => {
    fastRetriesLeft = FAST_RECHECK_ATTEMPTS;
    check();
  };
  window.addEventListener('online', onNetworkEvent);
  window.addEventListener('offline', check);
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility);

  return () => {
    disposed = true;
    clearInterval(interval);
    clearFastTimer();
    window.removeEventListener('online', onNetworkEvent);
    window.removeEventListener('offline', check);
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility);
  };
}
