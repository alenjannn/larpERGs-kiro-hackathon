import Card from '../../../shared/components/Card';
import EmptyState from '../../../shared/components/EmptyState';
import HelpRequestItem from '../../../shared/components/HelpRequestItem';
import type { HelpRequestWithPatient } from '../../../shared/types/db.types';
import { timeAgo } from '../../../shared/utils/date';

/** Requests whose patient has no BHW: nobody owns them yet (Spec 02, OC-7.3). Assigning is Spec 05. */
export default function NeedsAttentionHelpRequests({ requests }: { requests: HelpRequestWithPatient[] }) {
  const unassigned = requests.filter((r) => r.coordination_status === 'unassigned');
  return (
    <Card title="Needs Attention · Unassigned help requests" subtitle="Patients without an assigned BHW">
      {unassigned.length === 0 ? <EmptyState title="No unassigned help requests." icon="check" /> : null}
      {unassigned.map((r) => (
        <HelpRequestItem
          key={r.id}
          patientName={r.patient?.full_name ?? 'Patient'}
          reason={r.reason}
          message={r.message}
          createdAt={r.created_on_device_at}
          createdLabel="Created on device"
          receivedAt={r.received_at}
          meta={`Waiting ${timeAgo(r.received_at)}`}
          statuses={['coordination.unassigned']}
        />
      ))}
    </Card>
  );
}
