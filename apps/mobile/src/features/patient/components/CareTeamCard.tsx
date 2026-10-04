import { StyleSheet, Text, View } from 'react-native';
import Card from '../../../shared/components/Card';
import DemoBadge from '../../../shared/components/DemoBadge';
import Icon, { type IconName } from '../../../shared/components/Icon';
import { ROLE_META } from '../../../shared/config/demo';
import { colors, spacing, text } from '../../../shared/theme';
import type { PatientProfile } from '../types/patient.types';

/** Visualizes the chain of care: Admin (RHU) -> assigned BHW -> this patient. */
export default function CareTeamCard({ profile }: { profile: PatientProfile }) {
  const { patient, bhw, admin } = profile;
  const steps: { role: keyof typeof ROLE_META; label: string; sub: string }[] = [
    { role: 'admin', label: admin ? `${admin.full_name}` : 'No admin', sub: admin?.office ?? 'Rural Health Unit' },
    { role: 'bhw', label: bhw ? bhw.full_name : 'No BHW assigned yet', sub: bhw ? `${bhw.barangay}${bhw.phone ? ` · ${bhw.phone}` : ''}` : '' },
    { role: 'patient', label: patient?.full_name ?? 'You', sub: 'You' },
  ];
  return (
    <Card title="Your care team" subtitle="Who looks after your records" right={<DemoBadge />}>
      {steps.map((s, i) => (
        <View key={i}>
          <View style={styles.row}>
            <View style={[styles.icon, { backgroundColor: ROLE_META[s.role].tint }]}>
              <Icon name={ROLE_META[s.role].icon as IconName} size={16} color={ROLE_META[s.role].color} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.label}>{s.label}</Text>
              {s.sub ? <Text style={styles.sub}>{s.sub}</Text> : null}
            </View>
          </View>
          {i < steps.length - 1 ? <View style={styles.connector} /> : null}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  label: text.bodyStrong,
  sub: text.caption,
  connector: { width: 2, height: 14, backgroundColor: colors.border, marginLeft: 17, marginVertical: 2 },
});
