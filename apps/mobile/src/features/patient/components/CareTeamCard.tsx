import { StyleSheet, Text, View } from 'react-native';
import Card from '../../../shared/components/Card';
import DemoBadge from '../../../shared/components/DemoBadge';
import { colors, spacing } from '../../../shared/theme';
import type { PatientProfile } from '../types/patient.types';

/** Visualizes the chain of care: Admin (RHU) -> assigned BHW -> this patient. */
export default function CareTeamCard({ profile }: { profile: PatientProfile }) {
  const { patient, bhw, admin } = profile;
  const steps = [
    { icon: '⚙️', label: admin ? `${admin.full_name}` : 'No admin', sub: admin?.office ?? 'Rural Health Unit' },
    { icon: '🏥', label: bhw ? bhw.full_name : 'No BHW assigned yet', sub: bhw ? `${bhw.barangay}${bhw.phone ? ` · ${bhw.phone}` : ''}` : '' },
    { icon: '👤', label: patient?.full_name ?? 'You', sub: 'You' },
  ];
  return (
    <Card title="Your care team" subtitle="Who looks after your records" right={<DemoBadge />}>
      {steps.map((s, i) => (
        <View key={i}>
          <View style={styles.row}>
            <Text style={styles.icon}>{s.icon}</Text>
            <View>
              <Text style={styles.label}>{s.label}</Text>
              {s.sub ? <Text style={styles.sub}>{s.sub}</Text> : null}
            </View>
          </View>
          {i < steps.length - 1 ? <Text style={styles.arrow}>↓</Text> : null}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { fontSize: 22, width: 30, textAlign: 'center' },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  sub: { fontSize: 12, color: colors.muted },
  arrow: { fontSize: 16, color: colors.muted, marginLeft: 8 },
});
