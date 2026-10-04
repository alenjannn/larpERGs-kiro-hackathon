import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from '../../../shared/components/Text';
import { useRouter } from 'expo-router';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Icon from '../../../shared/components/Icon';
import DemoBadge from '../../../shared/components/DemoBadge';
import EmptyState from '../../../shared/components/EmptyState';
import LastUpdated from '../../../shared/components/LastUpdated';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Notice from '../../../shared/components/Notice';
import RecordListItem from '../../../shared/components/RecordListItem';
import Screen from '../../../shared/components/Screen';
import SectionHeader from '../../../shared/components/SectionHeader';
import { StatusChipRow } from '../../../shared/components/StatusChip';
import { DEMO_BHW_ID } from '../../../shared/config/demo';
import { ageFromBirthDate } from '../../../shared/utils/format';
import { colors, radius, spacing, text } from '../../../shared/theme';
import PatientQrSheet from '../components/PatientQrSheet';
import RecordForm from '../components/RecordForm';
import RegisterPatientForm from '../components/RegisterPatientForm';
import { syncStatusKeys } from '../fieldQueueStatus';
import { useBHWData } from '../hooks/useBHWData';
import { useOfflineSync } from '../hooks/useOfflineSync';

export default function BHWPatientsScreen() {
  const router = useRouter();
  const { data, error, loading, reload } = useBHWData();
  const sync = useOfflineSync();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [qrPatientId, setQrPatientId] = useState<string | null>(null);

  const patients = data?.patients ?? [];
  const records = data?.records ?? [];
  const qrPatient = qrPatientId ? patients.find((p) => p.id === qrPatientId) ?? null : null;
  const closeQr = useCallback(() => setQrPatientId(null), []);

  function afterSave(message: string) {
    setSavedMessage(message);
    reload();
  }

  function openVisit(patientId: string) {
    router.push({ pathname: '/bhw/patients/visit', params: { patientId } });
  }

  return (
    <Screen
      title="My Patients"
      subtitle="Patients your Admin assigned to you. Log a visit, even offline."
      refreshing={loading && !!data}
      onRefresh={reload}
    >
      {loading && !data ? <LoadingSpinner /> : null}
      {error ? <Notice tone="error" message={error} /> : null}
      {data?.fetchError ? (
        <Notice tone="info" message={data.fromCache ? `Showing your saved copy. ${data.fetchError}` : data.fetchError} />
      ) : null}
      {data?.fromCache ? <LastUpdated at={data.cachedAt} /> : null}
      {sync.actionError ? <Notice tone="error" message={sync.actionError} /> : null}
      {savedMessage ? (
        <Card style={styles.savedCard}>
          <Text style={styles.saved}>{savedMessage}</Text>
          <StatusChipRow statuses={['transport.saved_on_device', 'transport.waiting_to_send']} />
          <Text style={styles.meta}>Tap Sync Now on the Sync tab to send it ({sync.pendingCount} waiting).</Text>
        </Card>
      ) : null}

      <Card title="Register a patient" subtitle="Assisted or manual · saved on this device first" right={<DemoBadge />}>
        {registering ? (
          <RegisterPatientForm
            bhwId={data?.bhw?.id ?? DEMO_BHW_ID}
            barangay={data?.bhw?.barangay ?? null}
            onSave={sync.saveOffline}
            onSaved={(name) => {
              setRegistering(false);
              afterSave(`Registered ${name}.`);
            }}
            onCancel={() => setRegistering(false)}
          />
        ) : (
          <Button title="Register a new patient" icon="plus" variant="secondary" onPress={() => setRegistering(true)} style={styles.start} />
        )}
      </Card>

      {data && patients.length > 0 ? <SectionHeader title={`Assigned patients (${patients.length})`} /> : null}
      {data && patients.length === 0 ? (
        <EmptyState title="No patients yet" message="Ask your Admin to assign patients, or register one above." icon="person" />
      ) : null}

      {patients.map((p) => {
        const open = selectedId === p.id;
        const age = ageFromBirthDate(p.birth_date);
        const patientRecords = records.filter((r) => r.patient_id === p.id);
        const chips = syncStatusKeys(p.syncStatus, p.syncError);
        return (
          <Card key={p.id}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              accessibilityLabel={`${p.full_name}, ${open ? 'hide' : 'show'} records`}
              onPress={() => {
                setSelectedId(open ? null : p.id);
                setSavedMessage(null);
              }}
              style={styles.header}
            >
              <View style={styles.flex}>
                <Text style={styles.name}>{p.full_name}</Text>
                <Text style={styles.meta}>
                  {[p.sex, age !== null ? `${age} yrs` : null, p.address, `${patientRecords.length} record(s)`].filter(Boolean).join(' · ')}
                </Text>
                {p.has_smartphone === false ? <Text style={styles.assisted}>Assisted (no smartphone)</Text> : null}
              </View>
              <Text style={styles.toggle}>{open ? 'Hide records' : 'Records'}</Text>
              <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
            </Pressable>
            {chips && p.syncStatus !== 'synced' ? <StatusChipRow statuses={chips} /> : null}
            <View style={styles.actions}>
              <Button title="Log visit" onPress={() => openVisit(p.id)} accessibilityLabel={`Log a visit for ${p.full_name}`} style={styles.visitBtn} />
              <Button
                title="Show QR"
                variant="secondary"
                onPress={() => setQrPatientId(p.id)}
                accessibilityLabel={`Show QR code reference for ${p.full_name}`}
                style={styles.visitBtn}
              />
            </View>
            {open ? (
              <View style={styles.expanded}>
                <RecordForm
                  patient={p}
                  bhwId={data?.bhw?.id ?? DEMO_BHW_ID}
                  types={['health_update', 'appointment']}
                  onSave={sync.saveOffline}
                  onDone={() => {
                    setSelectedId(null);
                    afterSave(`Saved a record for ${p.full_name}.`);
                  }}
                />
                {patientRecords.slice(0, 5).map((r) => (
                  <RecordListItem key={r.id} record={r} pendingSync={r.pendingSync} />
                ))}
              </View>
            ) : null}
          </Card>
        );
      })}

      <PatientQrSheet visible={!!qrPatient} patient={qrPatient} onClose={closeQr} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44, borderRadius: radius.md },
  flex: { flex: 1 },
  name: { ...text.title, fontSize: 17 },
  meta: { ...text.caption, marginTop: 2 },
  assisted: { ...text.caption, fontWeight: '700', color: colors.text, marginTop: 2 },
  savedCard: { borderColor: colors.success, backgroundColor: colors.successBg },
  saved: text.bodyStrong,
  toggle: { ...text.label, color: colors.primary },
  visitBtn: { alignSelf: 'flex-start' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  start: { alignSelf: 'flex-start' },
  expanded: { gap: spacing.sm },
});
