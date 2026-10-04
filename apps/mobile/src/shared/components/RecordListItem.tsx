import { StyleSheet, View } from 'react-native';
import Text from './Text';
import Icon, { type IconName } from './Icon';
import type { HealthRecord } from '../types/db.types';
import { formatDateTime, timeAgo } from '../utils/date';
import { formatBP, isElevatedBP, recordTypeLabel } from '../utils/format';
import { colors, spacing, text } from '../theme';

interface Props {
  record: HealthRecord;
  /** Extra context, e.g. "for Demo Patient Juana" or "by Demo BHW Maria". */
  context?: string;
  pendingSync?: boolean;
}

function Tag({ icon, label, color }: { icon: IconName; label: string; color: string }) {
  return (
    <View style={styles.tag}>
      <Icon name={icon} size={12} color={color} />
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

/** One visit / health update / appointment row, shared by all three roles. */
export default function RecordListItem({ record, context, pendingSync }: Props) {
  const bp = formatBP(record);
  const elevated = !!bp && isElevatedBP(record);
  const vitals = [
    bp,
    record.temperature_c != null ? `${record.temperature_c} °C` : null,
    record.weight_kg != null ? `${record.weight_kg} kg` : null,
  ].filter(Boolean);

  return (
    <View style={styles.row}>
      <View style={styles.main}>
        <View style={styles.typeRow}>
          <Text style={styles.type}>{recordTypeLabel(record.record_type)}</Text>
          {pendingSync ? (
            <Tag icon="clock" label="Pending sync" color={colors.pending} />
          ) : record.source === 'offline_sync' ? (
            <Tag icon="check" label="Synced from field" color={colors.success} />
          ) : null}
        </View>
        <Text style={styles.title}>{record.title}</Text>
        {context ? <Text style={styles.meta}>{context}</Text> : null}
        {vitals.length ? (
          <Text style={[styles.vitals, elevated ? styles.alert : null]}>
            {vitals.join(' · ')}
            {elevated ? '  (elevated BP)' : ''}
          </Text>
        ) : null}
        {record.record_type === 'appointment' && record.scheduled_at ? (
          <View style={styles.appt}>
            <Icon name="calendar" size={13} color={colors.text} />
            <Text style={styles.vitals}>
              {formatDateTime(record.scheduled_at)} ({timeAgo(record.scheduled_at)}) · {record.status ?? 'scheduled'}
            </Text>
          </View>
        ) : null}
        {record.notes ? <Text style={styles.notes}>{record.notes}</Text> : null}
      </View>
      <Text style={styles.time}>{timeAgo(record.created_at)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  main: { flex: 1, gap: 2 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  type: { ...text.overline },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  tagText: { fontSize: 12, fontWeight: '700' },
  title: text.bodyStrong,
  meta: text.caption,
  vitals: text.small,
  alert: { color: colors.danger, fontWeight: '600' },
  appt: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  notes: { ...text.muted, fontStyle: 'italic' },
  time: text.caption,
});
