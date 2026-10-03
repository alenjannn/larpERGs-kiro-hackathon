import Notice from '../../../shared/components/Notice';
import type { SyncResult } from '../../../shared/services/sync';

// Copy only (C1): Sync Now sends BHW field records to the demo server.
// Full cloud sync is deferred, so it is never described as "synchronized".
export default function SyncResultNotice({ result }: { result: SyncResult | null }) {
  if (!result) return null;
  if (result.total === 0) return <Notice tone="info" message="Nothing to send. Every record has already been sent to the demo server." />;
  if (result.error) {
    return (
      <Notice
        tone="warning"
        message={`Sent ${result.synced} of ${result.total} to the demo server. ${result.remaining} still saved on this device. ${result.error}`}
      />
    );
  }
  if (result.failed > 0) {
    return (
      <Notice
        tone="warning"
        message={`Sent ${result.synced}, ${result.failed} rejected by the server (see queue). They will retry next time.`}
      />
    );
  }
  return <Notice tone="success" message={`Sent to demo server · ${result.synced} record${result.synced === 1 ? '' : 's'}.`} />;
}
