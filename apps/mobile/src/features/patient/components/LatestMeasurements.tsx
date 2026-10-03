import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Card from '../../../shared/components/Card';
import EmptyState from '../../../shared/components/EmptyState';
import MeasurementCard from '../../../shared/components/MeasurementCard';
import type { HealthRecord } from '../../../shared/types/db.types';
import { spacing } from '../../../shared/theme';
import { PATIENT_COPY, PATIENT_COPY_FIL } from '../copy';
import { isOlderReading, latestMeasurements, MEASURE_LABELS, type MeasureKey, type Reading } from '../logic/measurements';

const ORDER: MeasureKey[] = ['bp', 'glucose', 'weight', 'height'];
const UNITS: Record<MeasureKey, string> = { bp: 'mmHg', glucose: '', weight: 'kg', height: 'cm' };

/** Context line under a value: test type, "Older reading", and a note when the date is the record date. */
export function readingContext(reading: Reading, now = Date.now()): string | undefined {
  const parts = [
    reading.context,
    isOlderReading(reading.date, now) ? PATIENT_COPY.olderReading : undefined,
    reading.dateKind === 'recorded' ? 'Date is when it was recorded' : undefined,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : undefined;
}

/** Latest BP, glucose, weight and height, each dated. Missing → "No reading" (never 0). */
export default function LatestMeasurements({ records }: { records: HealthRecord[] }) {
  const latest = useMemo(() => latestMeasurements(records), [records]);
  const none = ORDER.every((k) => latest[k] === null);
  return (
    <Card title={PATIENT_COPY.latestMeasurements} subtitle={PATIENT_COPY_FIL.latestMeasurements}>
      {none ? (
        <EmptyState icon="info" title={PATIENT_COPY.noReadings} message={PATIENT_COPY.noReadingsMessage} />
      ) : (
        <View style={styles.grid}>
          {ORDER.map((key) => {
            const r = latest[key];
            return (
              <MeasurementCard
                key={key}
                label={MEASURE_LABELS[key]}
                value={r?.value ?? null}
                unit={r?.unit ?? UNITS[key]}
                measuredAt={r?.date ?? null}
                context={r ? readingContext(r) : undefined}
              />
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
