import { StyleSheet, Text } from 'react-native';
import Card from '../../../shared/components/Card';
import EmptyState from '../../../shared/components/EmptyState';
import HelpRequestItem from '../../../shared/components/HelpRequestItem';
import LastUpdated from '../../../shared/components/LastUpdated';
import Notice from '../../../shared/components/Notice';
import type { StatusKey } from '../../../shared/status';
import type { HelpRequestWithPatient } from '../../../shared/types/db.types';
import { formatDateTimeDMY } from '../../../shared/utils/date';
import { colors, spacing, text } from '../../../shared/theme';
import { ACK_OFFLINE_MESSAGE } from '../hooks/useAcknowledgeHelpRequest';
import { helpRequestNextAction } from '../today';

interface Props {
  requests: HelpRequestWithPatient[];
  /** Patient names from the BHW's list (fallback when the embed is missing). */
  patientNames: Map<string, string>;
  /** Set when the list comes from the offline copy. */
  cachedAt: string | null;
  onAcknowledge: (id: string) => void;
  pendingIds: ReadonlySet<string>;
  errors: Record<string, string>;
  offline: boolean;
}

/**
 * "Today · Help requests": received requests owned by this BHW (Spec 02 OC-7,
 * Spec 04 B-1.6 – B-1.9). Created-on-device and received times are separate
 * lines, so a request created offline hours earlier is not mistaken for a new
 * one. Acknowledge is online only and changes the chip after the server confirms.
 */
export default function TodayHelpRequests({ requests, patientNames, cachedAt, onAcknowledge, pendingIds, errors, offline }: Props) {
  const unique = [...new Map(requests.map((r) => [r.id, r])).values()];
  const hasAssigned = unique.some((r) => r.coordination_status === 'assigned');
  return (
    <Card title={`Help requests (${unique.length})`} subtitle="Received in the demo clinic inbox for your patients">
      {cachedAt ? <LastUpdated at={cachedAt} /> : null}
      {offline && hasAssigned ? <Notice tone="info" message={ACK_OFFLINE_MESSAGE} /> : null}
      {unique.length === 0 ? <EmptyState title="No help requests right now." icon="check" /> : null}
      {unique.map((r) => {
        const name = r.patient?.full_name ?? patientNames.get(r.patient_id) ?? 'Patient';
        const canAck = r.coordination_status === 'assigned';
        const sending = pendingIds.has(r.id);
        const error = errors[r.id] && errors[r.id] !== ACK_OFFLINE_MESSAGE ? errors[r.id] : null;
        return (
          <HelpRequestItem
            key={r.id}
            patientName={name}
            reason={r.reason}
            message={r.message}
            createdAt={r.created_on_device_at}
            createdLabel="Created on device"
            receivedAt={r.received_at}
            meta={r.acknowledged_at ? `Acknowledged ${formatDateTimeDMY(r.acknowledged_at)}` : null}
            statuses={['transport.received_in_inbox', `coordination.${r.coordination_status}` as StatusKey]}
            detail={error}
            note={`Next: ${helpRequestNextAction(r)}`}
            action={
              canAck && !offline
                ? {
                    label: sending ? 'Acknowledging…' : 'Acknowledge',
                    onPress: () => {
                      if (!sending) onAcknowledge(r.id);
                    },
                    accessibilityLabel: `Acknowledge help request from ${name}`,
                  }
                : undefined
            }
          />
        );
      })}
      {unique.length > 0 ? (
        <Text style={styles.footnote}>
          Help requests are not an emergency channel. Acknowledging tells the RHU you have seen it.
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  footnote: { ...text.caption, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
});
