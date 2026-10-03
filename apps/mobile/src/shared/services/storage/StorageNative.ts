// Web/default resolution of StorageNative.
// Metro picks StorageNative.native.ts on iOS/Android; this stub is what the web
// bundle sees, which keeps expo-sqlite out of `expo export --platform web`.
// createStorage() only constructs StorageNative when Platform.OS !== 'web'.

import type { LocalStorage } from '../storage';

function unavailable(): never {
  throw new Error('SQLite storage is only available on iOS/Android. Use StorageWeb on web.');
}

export default class StorageNative implements LocalStorage {
  initDB = async () => unavailable();
  saveRecord = async () => unavailable();
  getPendingRecords = async () => unavailable();
  getAllRecords = async () => unavailable();
  markSynced = async () => unavailable();
  markFailed = async () => unavailable();
  clearSynced = async () => unavailable();
  getCache = async <T,>(): Promise<T | null> => unavailable();
  setCache = async () => unavailable();
}
