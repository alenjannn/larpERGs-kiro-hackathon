import { StyleSheet, Text, View } from 'react-native';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import EmptyState from '../../../shared/components/EmptyState';
import HelpRequestItem from '../../../shared/components/HelpRequestItem';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Notice from '../../../shared/components/Notice';
import { CONFLICT_EXPLANATION, DEFERRED_BACKGROUND, DEFERRED_BACKUP, helpReasonLabel } from '../../../shared/helpRequests';
import type { OutboxItem } from '../../../shared/services/outbox';
import { outboxStatusKeys } from '../../../shared/status';
import { colors, spacing, typography } from '../../../shared/theme';

interface Props {
  items: OutboxItem[];
  loading: boolean;
  error: string | null;
  offlineNotice: string | null;
  onRetry: (id: string) => void;
  onRetryAll: () => void;
}

/** "My requests": every help request saved on this device, newest first (OC-12.6). */
export default function MyRequestsCard({ items, loading, error, offlineNotice, onRetry, onRetryAll }: Props) {
  const anyUnsent = items.some((i) => i._sync_status === 'pending' || i._sync_status === 'failed');
  return (
    <Card title="My requests" subtitle="Mga kahilingan ko">
      {loading && items.length === 0 ? <LoadingSpinner /> : null}
      {error ? <Notice tone="error" message={error} /> : null}
      {offlineNotice ? <Notice tone="info" message={offlineNotice} /> : null}
      {!loading && items.length === 0 ? <EmptyState title="No requests yet" icon="help" /> : null}
      {items.map((item) => (
        <HelpRequestItem
          key={item.id}
          reason={item.reason}
          message={item.message}
          createdAt={item.created_on_device_at}
          createdLabel="Created on this device"
          receivedAt={item._sync_status === 'synced' ? item.received_at : null}
          statuses={outboxStatusKeys(item._sync_status, 'help_request')}
          detail={item._sync_status === 'failed' ? item._last_error : null}
          note={item._sync_status === 'conflict' ? CONFLICT_EXPLANATION : null}
          action={
            item._sync_status === 'failed'
              ? {
                  label: 'Try again',
                  onPress: () => onRetry(item.id),
                  accessibilityLabel: `Try again sending ${helpReasonLabel(item.reason)} request`,
                }
              : undefined
          }
        />
      ))}
      {anyUnsent ? <Button title="Try again" variant="secondary" onPress={onRetryAll} accessibilityLabel="Try again sending all requests not sent yet" /> : null}
      <View style={styles.notes}>
        <Text style={styles.note}>{DEFERRED_BACKGROUND}</Text>
        <Text style={styles.note}>{DEFERRED_BACKUP}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  notes: { gap: spacing.xs, marginTop: spacing.xs },
  note: { fontSize: typography.caption, color: colors.muted, lineHeight: 18 },
});
