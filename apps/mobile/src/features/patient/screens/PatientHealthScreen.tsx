import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Notice from '../../../shared/components/Notice';
import Screen from '../../../shared/components/Screen';
import { useConnectivity } from '../../../shared/context/ConnectivityContext';
import { text } from '../../../shared/theme';
import BPTrendChart from '../components/BPTrendChart';
import ClearbookEntryList from '../components/ClearbookEntryList';
import ClearbookEntrySheet from '../components/ClearbookEntrySheet';
import HealthRecordCard from '../components/HealthRecordCard';
import LabMeasurements from '../components/LabMeasurements';
import LatestMeasurements from '../components/LatestMeasurements';
import MeasurementHistory from '../components/MeasurementHistory';
import SnapshotStatus from '../components/SnapshotStatus';
import { PATIENT_COPY, PATIENT_COPY_FIL } from '../copy';
import { useClearbookEntries } from '../hooks/useClearbookEntries';
import { groupRecords } from '../hooks/useHealthRecords';
import { useCurrentPatientId, usePatientSnapshot } from '../hooks/usePatientSnapshot';
import { mergeRecords } from '../logic/clearbook';

/**
 * My Health (P-2, P-3): dated measurements with units, a BP trend of real
 * readings only, history, and lab values the patient entered from paper.
 * No interpretation and no score. The clearbook works without a snapshot.
 */
export default function PatientHealthScreen() {
  const patientId = useCurrentPatientId();
  const snap = usePatientSnapshot(patientId);
  const { isOnline } = useConnectivity();
  const s = snap.snapshot;
  const entries = useClearbookEntries(patientId, s?.patient?.bhw_id ?? null, () => void snap.reload());
  const [adding, setAdding] = useState(false);

  const records = useMemo(() => mergeRecords(s?.records ?? [], entries.entries), [s, entries.entries]);
  const updates = useMemo(() => (s ? groupRecords(s.records).updates : []), [s]);
  const bhwName = s?.bhw?.full_name;

  return (
    <Screen
      title={PATIENT_COPY.tabs.health}
      subtitle={`Your readings with their dates and units · ${PATIENT_COPY_FIL.tabs.health} (DEMO DATA)`}
      refreshing={snap.loading && !!s}
      onRefresh={() => void snap.reload()}
    >
      {snap.loading && !s ? <LoadingSpinner /> : null}
      <SnapshotStatus status={snap.status} lastUpdatedAt={s?.last_updated_at ?? null} staleReason={s ? snap.error : null} />
      {!s && snap.error ? <Notice tone="error" message={snap.error} /> : null}

      {s || entries.entries.length > 0 ? (
        <>
          <LatestMeasurements records={records} />
          <LabMeasurements records={records} />
          <BPTrendChart records={records} />
          <MeasurementHistory records={records} />
        </>
      ) : null}

      <Card title={PATIENT_COPY.labsYouEntered} subtitle={PATIENT_COPY_FIL.labsYouEntered}>
        <Text style={styles.muted}>{PATIENT_COPY.noInterpretation}</Text>
        <Button title={PATIENT_COPY.addLab} icon="plus" onPress={() => setAdding(true)} style={styles.start} />
        <ClearbookEntryList
          entries={entries.entries}
          serverRecords={s?.records ?? []}
          isOnline={isOnline}
          loading={entries.loading}
          error={entries.error}
          onShare={(id) => void entries.share(id)}
        />
      </Card>

      {s ? (
        <HealthRecordCard title="Health updates" records={updates} bhwName={bhwName} emptyText="No health updates yet." />
      ) : null}

      <ClearbookEntrySheet visible={adding} entries={entries.entries} save={entries.save} onClose={() => setAdding(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: text.muted,
  start: { alignSelf: 'flex-start' },
});
