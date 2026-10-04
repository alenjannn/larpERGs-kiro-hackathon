import { useMemo } from 'react';
import Card from '../../../shared/components/Card';
import EmptyState from '../../../shared/components/EmptyState';
import MeasurementCard from '../../../shared/components/MeasurementCard';
import TileGrid from '../../../shared/components/TileGrid';
import { PATIENT_COPY, PATIENT_COPY_FIL } from '../copy';
import { isOlderReading, latestMeasurements, MEASURE_LABELS, VITAL_KEYS, type MeasureKey, type Reading } from '../logic/measurements';
import type { PatientRecord } from '../types/patient.types';

const ORDER: MeasureKey[] = VITAL_KEYS;
const UNITS: Record<MeasureKey, string> = { bp: 'mmHg', glucose: '', weight: 'kg', height: 'cm', creatinine: '', cholesterol: '' };

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
export default function LatestMeasurements({ records }: { records: PatientRecord[] }) {
  const latest = useMemo(() => latestMeasurements(records), [records]);
  const none = ORDER.every((k) => latest[k] === null);
  return (
    <Card title={PATIENT_COPY.latestMeasurements} subtitle={PATIENT_COPY_FIL.latestMeasurements}>
      {none ? (
        <EmptyState icon="info" title={PATIENT_COPY.noReadings} message={PATIENT_COPY.noReadingsMessage} />
      ) : (
        <TileGrid minTileWidth={130} maxColumns={4}>
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
        </TileGrid>
      )}
    </Card>
  );
}

