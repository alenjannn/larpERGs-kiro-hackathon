import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../../../shared/components/Card';
import { formatDateDMY } from '../../../shared/utils/date';
import { NO_READING } from '../../../shared/utils/format';
import { colors, spacing, text } from '../../../shared/theme';
import { PATIENT_COPY, PATIENT_COPY_FIL } from '../copy';
import { isOlderReading, LAB_KEYS, MEASURE_LABELS, readingsFor, VITAL_KEYS, type MeasureKey } from '../logic/measurements';
import type { PatientRecord } from '../types/patient.types';

const ORDER: MeasureKey[] = [...VITAL_KEYS, ...LAB_KEYS];

/** Every dated reading per measure, newest first, with value, unit and date. */
export default function MeasurementHistory({ records }: { records: PatientRecord[] }) {
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
  group: { gap: spacing.xs, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  heading: text.overline,
  row: { paddingVertical: spacing.xs + 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  value: text.bodyStrong,
  muted: { ...text.muted, fontWeight: '400' },
});
