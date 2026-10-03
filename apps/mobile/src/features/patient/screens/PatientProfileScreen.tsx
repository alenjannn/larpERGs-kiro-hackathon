import { StyleSheet, Text, View } from 'react-native';
import Card from '../../../shared/components/Card';
import DemoBadge from '../../../shared/components/DemoBadge';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Notice from '../../../shared/components/Notice';
import Screen from '../../../shared/components/Screen';
import { formatDate } from '../../../shared/utils/date';
import { ageFromBirthDate } from '../../../shared/utils/format';
import { colors, spacing } from '../../../shared/theme';
import CareTeamCard from '../components/CareTeamCard';
import { usePatientData } from '../hooks/usePatientData';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function PatientProfileScreen() {
  const { data, error, loading, reload } = usePatientData();
  const p = data?.patient;
  const age = ageFromBirthDate(p?.birth_date);

  return (
    <Screen title="Profile" subtitle="Your registered information" refreshing={loading && !!data} onRefresh={reload}>
      {loading && !data ? <LoadingSpinner /> : null}
      {error ? <Notice tone="error" message={error} /> : null}
      {p ? (
        <Card title={p.full_name} right={<DemoBadge />}>
          <Field label="Sex" value={p.sex === 'F' ? 'Female' : p.sex === 'M' ? 'Male' : '—'} />
          <Field label="Birth date" value={p.birth_date ? `${formatDate(p.birth_date)}${age !== null ? ` (${age} yrs)` : ''}` : '—'} />
          <Field label="Barangay" value={p.barangay ?? '—'} />
          <Field label="Address" value={p.address ?? '—'} />
          <Field label="Registered" value={formatDate(p.created_at)} />
        </Card>
      ) : null}
      {data ? <CareTeamCard profile={data} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
  label: { fontSize: 14, color: colors.muted },
  value: { fontSize: 14, color: colors.text, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
});
