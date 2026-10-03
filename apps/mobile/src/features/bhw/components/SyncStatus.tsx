import { StyleSheet, Text, View } from 'react-native';
import type { LocalRecord, SyncEntity, SyncStatus as Status } from '../../../shared/services/storage';
import { formatDateTime } from '../../../shared/utils/date';
import { colors, spacing } from '../../../shared/theme';

const ENTITY_LABEL: Record<SyncEntity, string> = {
  patient: '🧑 Patient',
  record: '📋 Record',
  connection_test: '🧪 Test',
};

const STATUS_STYLE: Record<Status, { label: string; color: string; bg: string }> = {
  pending: { label: 'PENDING', color: colors.warning, bg: colors.warningBg },
  failed: { label: 'FAILED', color: colors.danger, bg: colors.dangerBg },
  synced: { label: 'SYNCED', color: colors.success, bg: colors.successBg },
};

/** Lists every item in the offline queue with its sync status. */
export default function SyncStatus({ items }: { items: LocalRecord[] }) {
  if (items.length === 0) {
    return <Text style={styles.empty}>The offline queue is empty.</Text>;
  }
  return (
    <View>
      {items.map((item) => {
        const s = STATUS_STYLE[item.sync_status] ?? STATUS_STYLE.pending;
        return (
          <View key={item.local_id} style={styles.row}>
            <View style={styles.main}>
              <Text style={styles.message} numberOfLines={2}>
                {ENTITY_LABEL[item.entity] ?? item.entity} · {item.message}
              </Text>
              <Text style={styles.meta}>
                Saved {formatDateTime(item.created_at)}
                {item.synced_at ? ` · synced ${formatDateTime(item.synced_at)}` : ''}
              </Text>
              {item.last_error ? <Text style={styles.error}>{item.last_error}</Text> : null}
            </View>
            <Text style={[styles.badge, { color: s.color, backgroundColor: s.bg }]}>{s.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  main: { flex: 1, gap: 2 },
  message: { fontSize: 14, color: colors.text },
  meta: { fontSize: 12, color: colors.muted },
  error: { fontSize: 12, color: colors.danger },
  badge: { fontSize: 10, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, overflow: 'hidden' },
  empty: { fontSize: 13, color: colors.muted },
});
