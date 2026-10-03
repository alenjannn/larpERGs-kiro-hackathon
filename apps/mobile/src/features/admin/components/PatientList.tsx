import { StyleSheet, Text, View } from 'react-native';
import ChipGroup from '../../../shared/components/ChipGroup';
import type { BHW, HealthRecord, Patient } from '../../../shared/types/db.types';
import { timeAgo } from '../../../shared/utils/date';
import { ageFromBirthDate } from '../../../shared/utils/format';
import { colors, spacing } from '../../../shared/theme';

interface Props {
  patients: Patient[];
  bhws: BHW[];
  records: HealthRecord[];
  /** When provided, shows a BHW picker per patient to (re)assign them. */
  onAssign?: (patientId: string, bhwId: string) => void;
  busyId?: string | null;
}

export default function PatientList({ patients, bhws, records, onAssign, busyId }: Props) {
  if (patients.length === 0) return <Text style={styles.empty}>No patients registered yet.</Text>;
  const bhwName = new Map(bhws.map((b) => [b.id, b.full_name]));
  const activeBHWs = bhws.filter((b) => b.status === 'active');

  return (
    <View>
      {patients.map((p) => {
        const own = records.filter((r) => r.patient_id === p.id);
        const age = ageFromBirthDate(p.birth_date);
        // Offer active BHWs, plus the current one even if inactive so the selection stays visible.
        const options = bhws
          .filter((b) => b.status === 'active' || b.id === p.bhw_id)
          .map((b) => ({ value: b.id, label: b.full_name.replace(/^Demo BHW /, '') }));
        return (
          <View key={p.id} style={styles.row}>
            <Text style={styles.name}>👤 {p.full_name}</Text>
            <Text style={styles.meta}>
              {[p.sex, age !== null ? `${age} yrs` : null, p.barangay].filter(Boolean).join(' · ')}
              {p.local_id ? ' · registered offline by BHW' : ''}
            </Text>
            <Text style={styles.meta}>
              BHW: {p.bhw_id ? bhwName.get(p.bhw_id) ?? 'unknown' : 'unassigned'} · {own.length} records · last record {timeAgo(own[0]?.created_at)}
            </Text>
            {onAssign && activeBHWs.length > 0 ? (
              <View style={[styles.assign, busyId === p.id && styles.busy]}>
                <ChipGroup
                  label="Assign to BHW"
                  options={options}
                  value={p.bhw_id}
                  onChange={(bhwId) => bhwId !== p.bhw_id && onAssign(p.id, bhwId)}
                />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, gap: 2 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.muted },
  assign: { marginTop: spacing.xs },
  busy: { opacity: 0.5, pointerEvents: 'none' },
  empty: { fontSize: 13, color: colors.muted },
});
