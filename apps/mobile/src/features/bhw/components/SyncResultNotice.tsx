import Notice from '../../../shared/components/Notice';
import type { SyncResult } from '../../../shared/services/sync';

export default function SyncResultNotice({ result }: { result: SyncResult | null }) {
  if (!result) return null;
  if (result.total === 0) return <Notice tone="info" message="Nothing to sync — all records are already uploaded." />;
  if (result.error) {
    return (
      <Notice
        tone="warning"
        message={`Synced ${result.synced} of ${result.total}. ${result.remaining} still pending on this device. ${result.error}`}
      />
    );
  }
  if (result.failed > 0) {
    return <Notice tone="warning" message={`Synced ${result.synced}, ${result.failed} rejected by the server (see queue). They will retry next sync.`} />;
  }
  return <Notice tone="success" message={`Synced ${result.synced} record${result.synced === 1 ? '' : 's'} to Supabase.`} />;
}
