import { StyleSheet, View } from 'react-native';
import StatTile from '../../../shared/components/StatTile';
import { spacing } from '../../../shared/theme';
import type { HealthMetrics } from '../types/admin.types';

export default function HealthMetricsGrid({ metrics }: { metrics: HealthMetrics }) {
  return (
    <View style={styles.grid}>
      <StatTile label="Active BHWs" value={`${metrics.activeBHWs}/${metrics.totalBHWs}`} />
      <StatTile label="Patients" value={metrics.totalPatients} hint={metrics.unassignedPatients ? `${metrics.unassignedPatients} unassigned` : 'all assigned'} />
      <StatTile label="Home visits (7 days)" value={metrics.visitsLast7Days} />
      <StatTile label="Upcoming appointments" value={metrics.upcomingAppointments} />
      <StatTile label="Elevated BP patients" value={metrics.elevatedBPPatients} hint="latest reading ≥ 140/90" />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
