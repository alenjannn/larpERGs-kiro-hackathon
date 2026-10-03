import { StyleSheet, Text, View } from 'react-native';
import { StatusChipRow } from '../../../shared/components/StatusChip';
import type { LocalRecord, SyncEntity } from '../../../shared/services/storage';
import { legacyQueueStatusKeys } from '../../../shared/status';
import { formatDateTime } from '../../../shared/utils/date';
import { colors, spacing } from '../../../shared/theme';

const ENTITY_LABEL: Record<SyncEntity, string> = {
  patient: '🧑 Patient',
  record: '📋 Record',
  connection_test: '🧪 Test',
};

/** Lists every item in the offline queue with its status (text + icon from status.ts). */
export default function SyncStatus({ items }: { items: LocalRecord[] }) {
  if (items.length === 0) {
    return <Text style={styles.empty}>The offline queue is empty.</Text>;
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
              Saved {formatDateTime(item.created_at)}
              {item.synced_at ? ` · sent ${formatDateTime(item.synced_at)}` : ''}
            </Text>
            {item.last_error ? <Text style={styles.error}>{item.last_error}</Text> : null}
            <StatusChipRow statuses={legacyQueueStatusKeys(item.sync_status)} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  main: { flex: 1, gap: spacing.xs },
  message: { fontSize: 14, color: colors.text },
  meta: { fontSize: 12, color: colors.muted },
  error: { fontSize: 12, color: colors.danger },
  empty: { fontSize: 13, color: colors.muted },
});
