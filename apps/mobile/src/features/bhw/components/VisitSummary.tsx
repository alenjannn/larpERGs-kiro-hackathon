import { StyleSheet, Text, View } from 'react-native';
import { StatusChipRow } from '../../../shared/components/StatusChip';
import { useLanguage } from '../../../shared/context/DemoRoleContext';
import { formatDateTimeDMY } from '../../../shared/utils/date';
import { formatBPValue, formatMeasurement } from '../../../shared/utils/format';
import { colors, spacing, typography } from '../../../shared/theme';
import { syncStatusKeys } from '../fieldQueueStatus';
import { recordTime } from '../today';
import type { BHWRecord } from '../types/bhw.types';
import { barrierLabel, contactOutcomeLabel, GLUCOSE_TEST_LABELS, type GlucoseTestOption } from '../visitOptions';

/** One past visit: date, measurements with units, outcome, barrier, next action and sync status. */
export default function VisitSummary({ record }: { record: BHWRecord }) {
  const lang = useLanguage();
  const bp = formatBPValue(record.systolic, record.diastolic);
  const measurements = [
    bp ? `BP ${bp} mmHg` : null,
    record.glucose_value != null
      ? `Glucose ${formatMeasurement(record.glucose_value, record.glucose_unit ?? undefined)}${
          record.glucose_test_type ? ` (${GLUCOSE_TEST_LABELS[record.glucose_test_type as GlucoseTestOption] ?? record.glucose_test_type})` : ''
        }`
      : null,
    record.weight_kg != null ? `Weight ${record.weight_kg} kg` : null,
    record.height_cm != null ? `Height ${record.height_cm} cm` : null,
    record.temperature_c != null ? `Temp ${record.temperature_c} °C` : null,
  ].filter(Boolean);
  const outcome = contactOutcomeLabel(record.contact_outcome, lang);
  const barrier = barrierLabel(record.barrier, lang);
  const chips = syncStatusKeys(record.syncStatus, record.syncError);
  return (
    <View style={styles.item}>
      <Text style={styles.date}>{formatDateTimeDMY(new Date(recordTime(record)).toISOString())} · {record.title}</Text>
      <Text style={styles.line}>{measurements.length ? measurements.join(' · ') : 'No readings'}</Text>
      {outcome ? <Text style={styles.line}>Outcome: {outcome}</Text> : null}
      {barrier ? <Text style={styles.line}>Barrier: {barrier}</Text> : null}
      {record.next_action ? <Text style={styles.line}>Next: {record.next_action}</Text> : null}
      {chips ? <StatusChipRow statuses={chips} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { gap: 2, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  date: { fontSize: typography.caption, color: colors.muted },
  line: { fontSize: typography.small, color: colors.text },
});
