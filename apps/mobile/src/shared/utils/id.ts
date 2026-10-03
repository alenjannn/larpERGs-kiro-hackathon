import { randomUUID } from 'expo-crypto';

/** RFC 4122 v4 UUID, usable as a Postgres uuid primary key (native + web). */
export function newId(): string {
  try {
    return randomUUID();
  } catch {
    // crypto.randomUUID is unavailable on insecure (http://) web origins.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}
