import { StyleSheet, Text, View } from 'react-native';
import EmptyState from '../../../shared/components/EmptyState';
import { StatusChipRow } from '../../../shared/components/StatusChip';
import type { LocalRecord, SyncEntity } from '../../../shared/services/storage';
import { formatDateTimeDMY } from '../../../shared/utils/date';
import { colors, spacing, text } from '../../../shared/theme';
import { fieldQueueStatusKeys } from '../fieldQueueStatus';

const ENTITY_LABEL: Record<SyncEntity, string> = {
  patient: 'Patient',
  record: 'Record',
  connection_test: 'Test',
};

/** Every item in the offline queue with its status chips from status.ts (B-4.2). */
export default function SyncStatus({ items, syncing }: { items: LocalRecord[]; syncing: boolean }) {
  if (items.length === 0) {
    return <EmptyState title="Nothing saved on this device yet" message="Patients and visits you save offline appear here." icon="device" />;
  }
  return (
    <View>
      {items.map((item) => (
        <View key={item.local_id} style={styles.row}>
          <View style={styles.main}>
            <Text style={styles.message} numberOfLines={2}>
              {ENTITY_LABEL[item.entity] ?? item.entity} · {item.message}
            </Text>
            <Text style={styles.meta}>
              Saved on this device {formatDateTimeDMY(item.created_at)}
              {item.synced_at ? ` · synced ${formatDateTimeDMY(item.synced_at)}` : ''}
            </Text>
            {item.last_error ? <Text style={styles.error}>{item.last_error}</Text> : null}
            <StatusChipRow statuses={fieldQueueStatusKeys(item, syncing)} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  main: { flex: 1, gap: spacing.xs },
  message: text.bodyStrong,
  meta: text.caption,
  error: { ...text.caption, color: colors.danger },
});
