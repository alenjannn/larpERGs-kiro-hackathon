import { StyleSheet, Text, View } from 'react-native';
import type { HealthRecord } from '../types/db.types';
import { formatDateTime, timeAgo } from '../utils/date';
import { formatBP, isElevatedBP, RECORD_TYPE_LABEL } from '../utils/format';
import { colors, spacing } from '../theme';

interface Props {
  record: HealthRecord;
  /** Extra context, e.g. "for Demo Patient Juana" or "by Demo BHW Maria". */
  context?: string;
  pendingSync?: boolean;
}

/** One visit / health update / appointment row, shared by all three roles. */
export default function RecordListItem({ record, context, pendingSync }: Props) {
  const bp = formatBP(record);
  const vitals = [
    bp,
    record.temperature_c != null ? `${record.temperature_c} °C` : null,
    record.weight_kg != null ? `${record.weight_kg} kg` : null,
  ].filter(Boolean);

  return (
    <View style={styles.row}>
      <View style={styles.main}>
        <Text style={styles.type}>
          {RECORD_TYPE_LABEL[record.record_type]}
          {pendingSync ? '  ⏳ pending sync' : record.source === 'offline_sync' ? '  📶 synced from field' : ''}
        </Text>
        <Text style={styles.title}>{record.title}</Text>
        {context ? <Text style={styles.meta}>{context}</Text> : null}
        {vitals.length ? (
          <Text style={[styles.vitals, bp && isElevatedBP(record) ? styles.alert : null]}>
            {vitals.join(' · ')}
            {bp && isElevatedBP(record) ? '  (elevated BP)' : ''}
          </Text>
        ) : null}
        {record.record_type === 'appointment' && record.scheduled_at ? (
          <Text style={styles.vitals}>
            📅 {formatDateTime(record.scheduled_at)} ({timeAgo(record.scheduled_at)}) · {record.status ?? 'scheduled'}
          </Text>
        ) : null}
        {record.notes ? <Text style={styles.notes}>{record.notes}</Text> : null}
      </View>
      <Text style={styles.time}>{timeAgo(record.created_at)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  main: { flex: 1, gap: 2 },
  type: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  title: { fontSize: 15, color: colors.text, fontWeight: '600' },
  meta: { fontSize: 12, color: colors.muted },
  vitals: { fontSize: 13, color: colors.text },
  alert: { color: colors.danger, fontWeight: '600' },
  notes: { fontSize: 13, color: colors.muted, fontStyle: 'italic' },
  time: { fontSize: 12, color: colors.muted },
});
