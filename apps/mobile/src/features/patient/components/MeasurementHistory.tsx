import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../../../shared/components/Card';
import type { HealthRecord } from '../../../shared/types/db.types';
import { formatDateDMY } from '../../../shared/utils/date';
import { NO_READING } from '../../../shared/utils/format';
import { colors, spacing, typography } from '../../../shared/theme';
import { PATIENT_COPY, PATIENT_COPY_FIL } from '../copy';
import { isOlderReading, MEASURE_LABELS, readingsFor, type MeasureKey } from '../logic/measurements';

const ORDER: MeasureKey[] = ['bp', 'glucose', 'weight', 'height'];

/** Every dated reading per measure, newest first, with value, unit and date. */
export default function MeasurementHistory({ records }: { records: HealthRecord[] }) {
  const lists = useMemo(() => ORDER.map((key) => ({ key, readings: readingsFor(records, key) })), [records]);
  return (
    <Card title={PATIENT_COPY.history} subtitle={PATIENT_COPY_FIL.history}>
      {lists.map(({ key, readings }) => (
        <View key={key} style={styles.group}>
          <Text style={styles.heading} accessibilityRole="header">
            {MEASURE_LABELS[key]}
          </Text>
          {readings.length === 0 ? (
            <Text style={styles.muted}>{NO_READING}</Text>
          ) : (
            readings.map((r) => {
              const date = r.date ? `${r.dateKind === 'measured' ? 'Measured' : 'Recorded'} ${formatDateDMY(r.date)}` : 'Date not recorded';
              const older = isOlderReading(r.date);
              return (
                <View key={r.recordId} style={styles.row}>
                  <Text style={styles.value}>
                    {r.value} {r.unit}
                    {r.context ? <Text style={styles.muted}> · {r.context}</Text> : null}
                  </Text>
                  <Text style={styles.muted}>
                    {date}
                    {older ? ` · ${PATIENT_COPY.olderReading}` : ''}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs, paddingVertical: spacing.xs },
  heading: { fontSize: typography.body, fontWeight: '700', color: colors.text },
  row: { paddingVertical: 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  value: { fontSize: typography.body, color: colors.text, fontWeight: '600' },
  muted: { fontSize: typography.small, color: colors.muted, fontWeight: '400' },
});
