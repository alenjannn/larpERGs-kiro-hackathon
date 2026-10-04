import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../../../shared/components/Card';
import MeasurementCard from '../../../shared/components/MeasurementCard';
import { colors, spacing, typography } from '../../../shared/theme';
import { PATIENT_COPY, PATIENT_COPY_FIL } from '../copy';
import { LAB_KEYS, latestMeasurements, MEASURE_LABELS } from '../logic/measurements';
import type { PatientRecord } from '../types/patient.types';
import { readingContext } from './LatestMeasurements';

/**
 * Latest serum creatinine and total cholesterol (Spec 06), each with its unit
 * and measured date. Missing → "No reading" (never 0); > 90 days → "Older reading".
 * No interpretation, no calculated values (no eGFR), no normal/high/low labels.
 */
export default function LabMeasurements({ records }: { records: PatientRecord[] }) {
  const latest = useMemo(() => latestMeasurements(records), [records]);
  return (
    <Card title={PATIENT_COPY.otherLabs} subtitle={PATIENT_COPY_FIL.otherLabs}>
      <View style={styles.grid}>
        {LAB_KEYS.map((key) => {
          const r = latest[key];
          return (
            <MeasurementCard
              key={key}
              label={MEASURE_LABELS[key]}
              value={r?.value ?? null}
              unit={r?.unit}
              measuredAt={r?.date ?? null}
              context={r ? readingContext(r) : undefined}
            />
          );
        })}
      </View>
      <Text style={styles.muted}>{PATIENT_COPY.otherLabsNote}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  muted: { fontSize: typography.small, color: colors.muted, lineHeight: 20 },
});
