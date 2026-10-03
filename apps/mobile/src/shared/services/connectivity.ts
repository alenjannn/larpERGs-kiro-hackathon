// Web connectivity: navigator.onLine + online/offline events.
// Native resolves connectivity.native.ts (NetInfo) instead, so NetInfo never
// enters the web bundle.

export type ConnectivityListener = (online: boolean | null) => void;

export function subscribeConnectivity(listener: ConnectivityListener): () => void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    listener(null);
    return () => {};
  }
  const update = () => listener(navigator.onLine);
  update();
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  return () => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
  };
}
