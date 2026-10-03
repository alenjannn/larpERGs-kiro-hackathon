// Web: registers the offline app shell (dist/sw.js) and reports when a new
// version is waiting (Spec 02, OC-10.2, 10.6–10.8). Native: serviceWorker.native.ts.

export interface ShellUpdate {
  /** Activates the waiting version and reloads the page once. */
  apply(): void;
}

/**
 * Registers /sw.js only in a production web build, in a secure context
 * (localhost counts). Under `expo start` NODE_ENV is 'development', so nothing
 * registers. Returns a cleanup function. Errors are logged, never thrown.
 */
export function registerServiceWorker(onUpdate: (update: ShellUpdate) => void): () => void {
  if (process.env.NODE_ENV !== 'production') return () => {};
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return () => {};
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return () => {};

  let cancelled = false;
  let registration: ServiceWorkerRegistration | null = null;
  let reloading = false;

  const offer = (reg: ServiceWorkerRegistration) => {
    const waiting = reg.waiting;
    if (cancelled || !waiting || !navigator.serviceWorker.controller) return;
    onUpdate({
      apply() {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (reloading) return;
          reloading = true;
          window.location.reload();
        });
        waiting.postMessage({ type: 'SKIP_WAITING' });
      },
    });
  };

  const onVisible = () => {
    if (document.visibilityState === 'visible') registration?.update().catch(() => undefined);
  };

  const register = () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        if (cancelled) return;
        registration = reg;
        // A first install has no controller, so it shows no prompt.
        offer(reg);
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          installing?.addEventListener('statechange', () => {
            if (installing.state === 'installed') offer(reg);
          });
        });
        document.addEventListener('visibilitychange', onVisible);
      })
      .catch((error: unknown) => console.warn('Offline app shell (service worker) not registered:', error));
  };

  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener('load', register);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
