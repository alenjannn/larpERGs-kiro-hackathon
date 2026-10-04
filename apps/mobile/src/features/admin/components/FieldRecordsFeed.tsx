import { StyleSheet, View } from 'react-native';
import Text from '../../../shared/components/Text';
import Card from '../../../shared/components/Card';
import EmptyState from '../../../shared/components/EmptyState';
import Icon from '../../../shared/components/Icon';
import type { BHW, HealthRecord, Patient } from '../../../shared/types/db.types';
import { formatDateTimeDMY, timeAgo } from '../../../shared/utils/date';
import { recordTypeLabel } from '../../../shared/utils/format';
import { colors, radius, spacing, text, typography } from '../../../shared/theme';

interface Props {
  records: HealthRecord[];
  patients: Patient[];
  bhws: BHW[];
  limit?: number;
}

/**
 * Latest records BHWs sent from the field. Coordinator view: no measurement
 * values or clinical documents, only what was logged, for whom, by whom and when.
 */
export default function FieldRecordsFeed({ records, patients, bhws, limit = 8 }: Props) {
  const patientName = new Map(patients.map((p) => [p.id, p.full_name]));
  const bhwName = new Map(bhws.map((b) => [b.id, b.full_name]));
  const field = records.filter((r) => (r.origin ?? 'field') === 'field' && r.record_type !== 'lab_result').slice(0, limit);

  return (
    <Card title="Latest field records" subtitle="Most recent records sent by BHWs. Refreshes when you open or pull this page.">
      {field.length === 0 ? <EmptyState title="No field records yet." /> : null}
      {field.map((r) => (
        <View key={r.id} style={styles.row}>
          <View style={styles.main}>
            <Text style={styles.type}>{recordTypeLabel(r.record_type)}</Text>
            <Text style={styles.title}>{r.title}</Text>
            <Text style={styles.meta}>
              {patientName.get(r.patient_id) ?? 'Patient'} · by {r.bhw_id ? bhwName.get(r.bhw_id) ?? 'BHW' : 'unknown BHW'}
            </Text>
            <Text style={styles.meta}>
              Received {formatDateTimeDMY(r.created_at)} ({timeAgo(r.created_at)})
            </Text>
          </View>
          <View style={styles.tag} accessible accessibilityLabel="Synced from field">
            <Icon name="check" size={13} color={colors.success} />
            <Text style={styles.tagText}>Synced from field</Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  main: { flex: 1, minWidth: 200, gap: 2 },
  type: text.overline,
  title: text.bodyStrong,
  meta: text.caption,
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: colors.successBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: { fontSize: typography.caption, color: colors.success, fontWeight: '700' },
});
