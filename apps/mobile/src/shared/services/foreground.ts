// Web: the page became visible again (tab switch, phone unlocked). Native: foreground.native.ts.
export function subscribeForeground(callback: () => void): () => void {
  if (typeof document === 'undefined') return () => {};
  const onChange = () => {
    if (document.visibilityState === 'visible') callback();
  };
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}
