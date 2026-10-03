import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import EmptyState from '../../../shared/components/EmptyState';
import LastUpdated from '../../../shared/components/LastUpdated';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Notice from '../../../shared/components/Notice';
import Screen from '../../../shared/components/Screen';
import { StatusChipRow } from '../../../shared/components/StatusChip';
import { useConnectivity } from '../../../shared/context/ConnectivityContext';
import { ageFromBirthDate } from '../../../shared/utils/format';
import { newId } from '../../../shared/utils/id';
import { colors, spacing, typography } from '../../../shared/theme';
import VisitForm from '../components/VisitForm';
import VisitSummary from '../components/VisitSummary';
import { useBHWData, useCurrentBHWId } from '../hooks/useBHWData';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { recordTime } from '../today';
import { buildVisitPayload, type VisitInput } from '../visitPayload';

/** Patient Visit (route /bhw/patients/visit?patientId=…): one save, works offline (B-3). */
export default function PatientVisitScreen() {
  const router = useRouter();
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const bhwId = useCurrentBHWId();
  const { data, error, loading, reload } = useBHWData();
  const sync = useOfflineSync();
  const { isOnline } = useConnectivity();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const patient = data?.patients.find((p) => p.id === patientId) ?? null;
  const visits = (data?.records ?? [])
    .filter((r) => r.patient_id === patientId && (r.record_type === 'visit' || r.record_type === 'vitals'))
    .sort((a, b) => recordTime(b) - recordTime(a))
    .slice(0, 5);
  const savedItem = savedId ? sync.items.find((i) => i.local_id === savedId) : null;

  function back() {
    if (router.canGoBack()) router.back();
    else router.replace('/bhw/patients');
  }

  async function submit(input: VisitInput) {
    if (!patient) return;
    const id = newId();
    const result = buildVisitPayload(input, { id, patientId: patient.id, bhwId: data?.bhw?.id ?? bhwId }, new Date().toISOString());
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setSaving(true);
    setFormError(null);
    // Persisted before the UI confirms "Saved on this device" (tech.md §5).
    const ok = await sync.saveOffline({
      id,
      entity: 'record',
      message: `Patient visit — ${patient.full_name}`,
      payload: result.payload as unknown as Record<string, unknown>,
    });
    setSaving(false);
    if (ok) {
      setSavedId(id);
      reload();
    } else {
      setFormError('Could not save on this device. Nothing was saved. Your entries are still in the form.');
    }
  }

  const age = patient ? ageFromBirthDate(patient.birth_date) : null;

  return (
    <Screen title="Patient visit" subtitle="Measurements, outcome, barrier and next action in one save">
      <Button title="← Back to My Patients" variant="secondary" onPress={back} style={styles.backBtn} accessibilityLabel="Back to My Patients" />
      {loading && !data ? <LoadingSpinner /> : null}
      {error ? <Notice tone="error" message={error} /> : null}
      {sync.actionError ? <Notice tone="error" message={sync.actionError} /> : null}
      {data?.fromCache ? <LastUpdated at={data.cachedAt} /> : null}
      {isOnline === false ? (
        <Notice tone="info" message="You're offline. The visit is saved on this device. Send it from the Sync tab when you're connected." />
      ) : null}

      {data && !patient ? (
        <EmptyState
          title="Patient not found on this device"
          message="Open My Patients while connected once, or register the patient first."
          icon="person"
          action={{ label: 'Back to My Patients', onPress: back }}
        />
      ) : null}

      {patient ? (
        <Card title={patient.full_name} subtitle={[patient.sex, age !== null ? `${age} yrs` : null, patient.barangay].filter(Boolean).join(' · ')}>
          {patient.has_smartphone === false ? <Text style={styles.assisted}>Assisted (no smartphone)</Text> : null}
          {patient.address ? <Text style={styles.meta}>{patient.address}</Text> : null}
        </Card>
      ) : null}

      {patient && savedId ? (
        <Card title="Visit saved">
          <StatusChipRow statuses={savedItem?.sync_status === 'synced' ? ['transport.synced'] : ['transport.saved_on_device', 'transport.waiting_to_send']} />
          <Text style={styles.meta}>One record was saved. Tap Sync Now on the Sync tab to send it to the demo server.</Text>
          <View style={styles.row}>
            <Button title="Back to My Patients" variant="secondary" onPress={back} style={styles.flex} />
            <Button
              title="Log another visit"
              onPress={() => {
                setSavedId(null);
                setFormKey((k) => k + 1);
              }}
              style={styles.flex}
              accessibilityLabel={`Log another visit for ${patient.full_name}`}
            />
          </View>
        </Card>
      ) : null}

      {patient && !savedId ? (
        <VisitForm key={formKey} patientName={patient.full_name} saving={saving} error={formError} onSubmit={submit} onCancel={back} />
      ) : null}

      {patient ? (
        <Card title="Recent visits" subtitle="Newest first">
          {visits.length === 0 ? <EmptyState title="No visits yet" icon="calendar" /> : null}
          {visits.map((r) => (
            <VisitSummary key={r.id} record={r} />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  backBtn: { alignSelf: 'flex-start' },
  assisted: { fontSize: typography.small, fontWeight: '700', color: colors.text },
  meta: { fontSize: typography.small, color: colors.muted },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  flex: { flexGrow: 1, flexBasis: 160 },
});
