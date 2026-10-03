import { StyleSheet, Text, View } from 'react-native';
import Card from '../../../shared/components/Card';
import Notice from '../../../shared/components/Notice';
import type { HealthRecord } from '../../../shared/types/db.types';
import { formatDateTime, timeAgo } from '../../../shared/utils/date';
import { colors, spacing } from '../../../shared/theme';

/** Upcoming appointments scheduled by the patient's BHW. */
export default function AppointmentList({ appointments, bhwName }: { appointments: HealthRecord[]; bhwName?: string }) {
  return (
    <Card title="📅 Upcoming appointments" subtitle={bhwName ? `Scheduled by ${bhwName}` : undefined}>
      {appointments.length === 0 ? <Notice tone="info" message="No upcoming appointments." /> : null}
      {appointments.map((a) => (
        <View key={a.id} style={styles.row}>
          <View style={styles.date}>
            <Text style={styles.when}>{formatDateTime(a.scheduled_at)}</Text>
            <Text style={styles.rel}>{timeAgo(a.scheduled_at)}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.title}>{a.title}</Text>
            {a.notes ? <Text style={styles.notes}>{a.notes}</Text> : null}
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  date: { width: 120 },
  when: { fontSize: 13, fontWeight: '700', color: colors.info },
  rel: { fontSize: 12, color: colors.muted },
  flex: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text },
  notes: { fontSize: 13, color: colors.muted },
});
