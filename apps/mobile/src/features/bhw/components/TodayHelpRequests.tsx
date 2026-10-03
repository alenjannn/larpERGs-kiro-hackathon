import Card from '../../../shared/components/Card';
import EmptyState from '../../../shared/components/EmptyState';
import HelpRequestItem from '../../../shared/components/HelpRequestItem';
import LastUpdated from '../../../shared/components/LastUpdated';
import type { StatusKey } from '../../../shared/status';
import type { HelpRequestWithPatient } from '../../../shared/types/db.types';

interface Props {
  requests: HelpRequestWithPatient[];
  /** Patient names from the BHW's list (fallback when the embed is missing). */
  patientNames: Map<string, string>;
  /** Set when the list comes from the offline copy. */
  cachedAt: string | null;
}

/**
 * "Today · Help requests": received requests owned by this BHW (Spec 02, OC-7).
 * Created-on-device and received times are separate, so a request created
 * offline hours earlier is not mistaken for a new one. Acknowledge is Spec 04.
 */
export default function TodayHelpRequests({ requests, patientNames, cachedAt }: Props) {
  const unique = [...new Map(requests.map((r) => [r.id, r])).values()];
  return (
    <Card title="Today · Help requests" subtitle="Received in the demo clinic inbox for your patients">
      {cachedAt ? <LastUpdated at={cachedAt} /> : null}
      {unique.length === 0 ? <EmptyState title="No help requests right now." icon="check" /> : null}
      {unique.map((r) => (
        <HelpRequestItem
          key={r.id}
          patientName={r.patient?.full_name ?? patientNames.get(r.patient_id) ?? 'Patient'}
          reason={r.reason}
          message={r.message}
          createdAt={r.created_on_device_at}
          createdLabel="Created on device"
          receivedAt={r.received_at}
          statuses={['transport.received_in_inbox', `coordination.${r.coordination_status}` as StatusKey]}
        />
      ))}
    </Card>
  );
}
