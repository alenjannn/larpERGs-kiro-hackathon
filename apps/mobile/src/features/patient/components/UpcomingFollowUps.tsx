import { StyleSheet, Text, View } from 'react-native';
import Card from '../../../shared/components/Card';
import StatusChip from '../../../shared/components/StatusChip';
import type { Appointment, Clinic } from '../../../shared/types/db.types';
import { formatDateTimeDMY } from '../../../shared/utils/date';
import { colors, spacing, typography } from '../../../shared/theme';
import { PATIENT_COPY, PATIENT_COPY_FIL } from '../copy';

/** Upcoming appointments after the next step. Renders nothing when there are none. */
export default function UpcomingFollowUps({ appointments, clinic }: { appointments: Appointment[]; clinic: Clinic | null }) {
  if (appointments.length === 0) return null;
  return (
    <Card title={PATIENT_COPY.upcomingFollowUp} subtitle={PATIENT_COPY_FIL.upcomingFollowUp}>
      {appointments.map((a) => (
        <View key={a.id} style={styles.row}>
          <Text style={styles.title}>{a.purpose}</Text>
          <Text style={styles.meta}>
            Appointment {formatDateTimeDMY(a.scheduled_at)}
            {clinic && clinic.id === a.clinic_id ? ` · ${clinic.name}` : ''}
          </Text>
          <StatusChip status={`encounter.${a.encounter_status}`} size="sm" />
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs, paddingVertical: spacing.xs },
  title: { fontSize: typography.body, color: colors.text, fontWeight: '600' },
  meta: { fontSize: typography.small, color: colors.muted },
});
