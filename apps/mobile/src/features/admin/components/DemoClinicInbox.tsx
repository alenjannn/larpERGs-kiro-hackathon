import { StyleSheet, Text } from 'react-native';
import Card from '../../../shared/components/Card';
import EmptyState from '../../../shared/components/EmptyState';
import HelpRequestItem from '../../../shared/components/HelpRequestItem';
import { INBOX_CAPTION } from '../../../shared/helpRequests';
import type { StatusKey } from '../../../shared/status';
import type { HelpRequestWithPatient } from '../../../shared/types/db.types';
import { colors, typography } from '../../../shared/theme';

/** Read-only view of the demo clinic inbox, latest 20 (Spec 02, OC-7.4). One row per request id. */
export default function DemoClinicInbox({ requests }: { requests: HelpRequestWithPatient[] }) {
  const latest = requests.slice(0, 20);
  return (
    <Card title="Demo clinic inbox" subtitle="Help requests received from patients">
      <Text style={styles.caption}>{INBOX_CAPTION}</Text>
      {latest.length === 0 ? <EmptyState title="No help requests received yet." /> : null}
      {latest.map((r) => (
        <HelpRequestItem
          key={r.id}
          patientName={r.patient?.full_name ?? 'Patient'}
          reason={r.reason}
          message={r.message}
          createdAt={r.created_on_device_at}
          createdLabel="Created on device"
          receivedAt={r.received_at}
          statuses={[`coordination.${r.coordination_status}` as StatusKey]}
        />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  caption: { fontSize: typography.caption, color: colors.muted },
});
