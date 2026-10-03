// Native apps have no service worker; the offline shell is the installed app itself.
export interface ShellUpdate {
  apply(): void;
}

export function registerServiceWorker(_onUpdate: (update: ShellUpdate) => void): () => void {
  return () => {};
}
