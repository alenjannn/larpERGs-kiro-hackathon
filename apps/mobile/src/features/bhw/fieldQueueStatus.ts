// BHW field-record queue → status dictionary (Spec 04, B-4.1 / B-4.2).
// The stored queue values stay 'pending' | 'synced' | 'failed' (storage.ts).
// - A failed item whose error starts with "Needs review:" came from a Sync Now
//   read-back that found different content under the same id (design D2).
// - While a Sync Now run is active, pending items are being sent.

import type { LocalRecord, SyncStatus } from '../../shared/services/storage';
import type { StatusKey } from '../../shared/status';

// Same value as NEEDS_REVIEW_PREFIX in shared/services/apiBhw.ts. Duplicated so
// this module stays free of Supabase/React Native imports (pure, testable).
const NEEDS_REVIEW_PREFIX = 'Needs review:';

export type FieldQueueState = 'waiting' | 'sending' | 'synced' | 'failed' | 'needs_review';

export function fieldQueueState(item: Pick<LocalRecord, 'sync_status' | 'last_error'>, syncing: boolean): FieldQueueState {
  switch (item.sync_status) {
    case 'synced':
      return 'synced';
    case 'failed':
      return item.last_error?.startsWith(NEEDS_REVIEW_PREFIX) ? 'needs_review' : 'failed';
    case 'pending':
    default:
      return syncing ? 'sending' : 'waiting';
  }
}

export const FIELD_STATE_KEYS: Record<FieldQueueState, StatusKey[]> = {
  waiting: ['transport.saved_on_device', 'transport.waiting_to_send'],
  sending: ['transport.sending'],
  synced: ['transport.synced'],
  failed: ['transport.send_failed'],
  needs_review: ['transport.needs_review'],
};

export function fieldQueueStatusKeys(item: Pick<LocalRecord, 'sync_status' | 'last_error'>, syncing = false): StatusKey[] {
  return FIELD_STATE_KEYS[fieldQueueState(item, syncing)];
}

/** Chips for something listed from the queue where only the status is known. */
export function syncStatusKeys(status: SyncStatus | null, lastError: string | null = null): StatusKey[] | null {
  if (!status) return null;
  return fieldQueueStatusKeys({ sync_status: status, last_error: lastError });
}

export type FieldQueueCounts = Record<FieldQueueState, number>;

export function fieldQueueCounts(items: Pick<LocalRecord, 'sync_status' | 'last_error'>[], syncing: boolean): FieldQueueCounts {
  const counts: FieldQueueCounts = { waiting: 0, sending: 0, synced: 0, failed: 0, needs_review: 0 };
  for (const item of items) counts[fieldQueueState(item, syncing)] += 1;
  return counts;
}
