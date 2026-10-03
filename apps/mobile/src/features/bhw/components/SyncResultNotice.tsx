import Notice from '../../../shared/components/Notice';
import type { SyncResult } from '../../../shared/services/sync';

// Copy only (C1): Sync Now sends BHW field records to the demo server.
// Full cloud sync is deferred. "Synced" is used per item, and only after the
// server row was read back (B-4.4).
export default function SyncResultNotice({ result, needsReview = 0 }: { result: SyncResult | null; needsReview?: number }) {
  if (!result) return null;
  if (result.total === 0) return <Notice tone="info" message="Nothing to send. Every record on this device is already synced." />;
  if (result.error) {
    return (
      <Notice
        tone="warning"
        message={`Synced ${result.synced} of ${result.total}. ${result.remaining} still saved on this device. ${result.error}`}
      />
    );
  }
  if (result.failed > 0) {
    const review = Math.min(needsReview, result.failed);
    const failed = result.failed - review;
    const parts = [
      failed > 0 ? `${failed} not sent yet (see the list; they are sent again on the next Sync Now)` : null,
      review > 0 ? `${review} need${review === 1 ? 's' : ''} review (nothing was overwritten)` : null,
    ].filter(Boolean);
    return <Notice tone="warning" message={`Synced ${result.synced}. ${parts.join('. ')}.`} />;
  }
  return <Notice tone="success" message={`Synced ${result.synced} record${result.synced === 1 ? '' : 's'}. The demo server confirmed each one.`} />;
}
