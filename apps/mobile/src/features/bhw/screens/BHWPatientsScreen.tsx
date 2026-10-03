import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import DemoBadge from '../../../shared/components/DemoBadge';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Notice from '../../../shared/components/Notice';
import RecordListItem from '../../../shared/components/RecordListItem';
import Screen from '../../../shared/components/Screen';
import { DEMO_BHW_ID } from '../../../shared/config/demo';
import { ageFromBirthDate } from '../../../shared/utils/format';
import { colors, spacing } from '../../../shared/theme';
import RecordForm from '../components/RecordForm';
import RegisterPatientForm from '../components/RegisterPatientForm';
import { useBHWData } from '../hooks/useBHWData';
import { useOfflineSync } from '../hooks/useOfflineSync';

export default function BHWPatientsScreen() {
  const { data, error, loading, reload } = useBHWData();
  const sync = useOfflineSync();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const patients = data?.patients ?? [];
  const records = data?.records ?? [];

  function afterSave(message: string) {
    setSavedMessage(message);
    reload();
  }

  return (
    <Screen
      title="My Patients"
      subtitle="Patients your Admin assigned to you · tap one to log a record"
      refreshing={loading && !!data}
      onRefresh={reload}
    >
      {loading && !data ? <LoadingSpinner /> : null}
      {error ? <Notice tone="error" message={error} /> : null}
      {data?.fetchError ? <Notice tone="warning" message={`Offline mode — ${data.fetchError}`} /> : null}
      {sync.actionError ? <Notice tone="error" message={sync.actionError} /> : null}
      {savedMessage ? <Notice tone="success" message={`${savedMessage} Go to Sync to upload (${sync.pendingCount} pending).`} /> : null}

      <Card title="Register a patient" subtitle="Saved on this device; uploaded on Sync Now" right={<DemoBadge />}>
        {registering ? (
          <RegisterPatientForm
            bhwId={data?.bhw?.id ?? DEMO_BHW_ID}
            barangay={data?.bhw?.barangay ?? null}
            onSave={sync.saveOffline}
            onDone={() => {
              setRegistering(false);
              reload();
            }}
          />
        ) : (
          <Button title="+ Register New Patient" variant="secondary" onPress={() => setRegistering(true)} />
        )}
      </Card>

      {data && patients.length === 0 ? <Notice tone="info" message="No patients assigned yet. Ask your Admin to assign patients." /> : null}

      {patients.map((p) => {
        const open = selectedId === p.id;
        const age = ageFromBirthDate(p.birth_date);
        const patientRecords = records.filter((r) => r.patient_id === p.id);
        return (
          <Card key={p.id}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              onPress={() => {
                setSelectedId(open ? null : p.id);
                setSavedMessage(null);
              }}
              style={styles.header}
            >
              <View style={styles.flex}>
                <Text style={styles.name}>
                  {p.full_name} {p.pendingSync ? <Text style={styles.pending}> ⏳ not yet synced</Text> : null}
                </Text>
                <Text style={styles.meta}>
                  {[p.sex, age !== null ? `${age} yrs` : null, p.address, `${patientRecords.length} record(s)`].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
            </Pressable>
            {open ? (
              <>
                <RecordForm
                  patient={p}
                  bhwId={data?.bhw?.id ?? DEMO_BHW_ID}
                  onSave={sync.saveOffline}
                  onDone={() => {
                    setSelectedId(null);
                    afterSave(`Saved record for ${p.full_name} offline.`);
                  }}
                />
                {patientRecords.slice(0, 5).map((r) => (
                  <RecordListItem key={r.id} record={r} pendingSync={r.pendingSync} />
                ))}
              </>
            ) : null}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  pending: { fontSize: 12, fontWeight: '600', color: colors.warning },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  chevron: { fontSize: 12, color: colors.muted },
});
