import { StyleSheet, Text } from 'react-native';
import Card from '../../../shared/components/Card';
import EmptyState from '../../../shared/components/EmptyState';
import StatusChip from '../../../shared/components/StatusChip';
import { helpReasonLabel, INBOX_CAPTION } from '../../../shared/helpRequests';
import type { StatusKey } from '../../../shared/status';
import type { BHW, HelpRequestWithPatient } from '../../../shared/types/db.types';
import { formatDateTimeDMY } from '../../../shared/utils/date';
import { colors, typography } from '../../../shared/theme';
import QueueTable from './QueueTable';

const COLUMNS = [
  { key: 'patient', label: 'Patient', flex: 1.4 },
  { key: 'reason', label: 'Reason', flex: 1 },
  { key: 'created', label: 'Created on device', flex: 1.3 },
  { key: 'received', label: 'Received', flex: 1.3 },
  { key: 'owner', label: 'Owner', flex: 1.2 },
  { key: 'status', label: 'Status', flex: 1.2 },
];

/** The demo clinic inbox, latest 20. One row per request id (A-5): the server PK and the hook both dedupe. */
export default function DemoClinicInbox({ requests, bhws }: { requests: HelpRequestWithPatient[]; bhws: BHW[] }) {
  const bhwName = new Map(bhws.map((b) => [b.id, b.full_name]));
  const rows = requests.slice(0, 20).map((r) => ({
    id: r.id,
    cells: {
      patient: r.patient?.full_name ?? 'Patient',
      reason: helpReasonLabel(r.reason),
      created: formatDateTimeDMY(r.created_on_device_at),
      received: formatDateTimeDMY(r.received_at),
      owner: r.assigned_bhw_id ? bhwName.get(r.assigned_bhw_id) ?? 'unknown BHW' : 'No owner',
      status: <StatusChip size="sm" status={`coordination.${r.coordination_status}` as StatusKey} />,
    },
  }));
  return (
    <Card title="Demo clinic inbox" subtitle={`Help requests received from patients · ${requests.length} total`}>
      <Text style={styles.caption}>{INBOX_CAPTION}</Text>
      <QueueTable
        accessibilityLabel="Demo clinic inbox"
        columns={COLUMNS}
        rows={rows}
        empty={<EmptyState title="No help requests received yet." />}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  caption: { fontSize: typography.caption, color: colors.muted },
});
