import { StyleSheet, View } from 'react-native';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Notice from '../../../shared/components/Notice';
import Screen from '../../../shared/components/Screen';
import StatTile from '../../../shared/components/StatTile';
import { formatBP } from '../../../shared/utils/format';
import { spacing } from '../../../shared/theme';
import HealthRecordCard from '../components/HealthRecordCard';
import { useHealthRecords } from '../hooks/useHealthRecords';
import { usePatientData } from '../hooks/usePatientData';

export default function PatientHealthScreen() {
  const health = useHealthRecords();
  const profile = usePatientData();
  const bhwName = profile.data?.bhw?.full_name;
  const data = health.data;
  const latestWithBP = data?.visits.find((v) => formatBP(v));

  return (
    <Screen
      title="My Health"
      subtitle="Records created by your BHW during visits (DEMO DATA)"
      refreshing={health.loading && !!data}
      onRefresh={health.reload}
    >
      {health.loading && !data ? <LoadingSpinner /> : null}
      {health.error ? <Notice tone="error" message={health.error} /> : null}

      {data ? (
        <>
          <View style={styles.stats}>
            <StatTile label="Latest blood pressure" value={latestWithBP ? formatBP(latestWithBP)! : '—'} />
            <StatTile label="Home visits" value={data.visits.length} />
            <StatTile label="Upcoming appointments" value={data.upcomingAppointments.length} />
          </View>
          <HealthRecordCard title="🏠 Home visits & vitals" records={data.visits} bhwName={bhwName} emptyText="No visits recorded yet." />
          <HealthRecordCard title="📋 Health updates" records={data.updates} bhwName={bhwName} emptyText="No health updates yet." />
          <HealthRecordCard
            title="📅 Past appointments"
            records={data.pastAppointments}
            bhwName={bhwName}
            emptyText="No past appointments."
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
