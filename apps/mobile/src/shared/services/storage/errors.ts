/** Thrown when device storage is unavailable or full, so the UI can show a visible error. */
export class LocalStorageUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocalStorageUnavailableError';
  }
}

/** Keys removed by Reset demo data on web (tuloy:v1:* plus the legacy queue and cache). */
export function isDemoDataKey(key: string): boolean {
  return key.startsWith('tuloy:v1:') || key.startsWith('tuloy_cache:') || key === 'tuloy_offline_records';
}
