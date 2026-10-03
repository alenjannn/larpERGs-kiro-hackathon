import { StyleSheet, View } from 'react-native';
import Card from '../../../shared/components/Card';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Notice from '../../../shared/components/Notice';
import RecordListItem from '../../../shared/components/RecordListItem';
import Screen from '../../../shared/components/Screen';
import StatTile from '../../../shared/components/StatTile';
import { isWithinDays, timeAgo } from '../../../shared/utils/date';
import { spacing } from '../../../shared/theme';
import AssignmentCard from '../components/AssignmentCard';
import ConnectionTest from '../components/ConnectionTest';
import OfflineTest from '../components/OfflineTest';
import { useBHWData } from '../hooks/useBHWData';
import { useOfflineSync } from '../hooks/useOfflineSync';

export default function BHWDashboardScreen() {
  const { data, error, loading, reload } = useBHWData();
  const sync = useOfflineSync();

  const patients = data?.patients ?? [];
  const records = data?.records ?? [];
  const patientName = new Map(patients.map((p) => [p.id, p.full_name]));
  const visitsThisWeek = records.filter((r) => r.record_type === 'visit' && isWithinDays(r.created_at, 7)).length;
  const upcoming = records.filter(
    (r) => r.record_type === 'appointment' && r.scheduled_at && new Date(r.scheduled_at).getTime() > Date.now()
  ).length;

  return (
    <Screen
      title={`Hello, ${data?.bhw?.full_name ?? 'BHW'}`}
      subtitle="Field dashboard · collect offline, sync when connected"
      refreshing={loading && !!data}
      onRefresh={() => {
        reload();
        sync.reloadQueue();
      }}
    >
      {loading && !data ? <LoadingSpinner /> : null}
      {error ? <Notice tone="error" message={error} /> : null}
      {data?.fetchError ? (
        <Notice
          tone="warning"
          message={
            data.fromCache
              ? `Offline mode — showing data cached ${timeAgo(data.cachedAt)}. ${data.fetchError}`
              : data.fetchError
          }
        />
      ) : null}

      {data ? <AssignmentCard bhw={data.bhw} admin={data.admin} patientCount={patients.length} /> : null}

      <View style={styles.stats}>
        <StatTile label="Assigned patients" value={patients.length} />
        <StatTile label="Pending sync" value={sync.pendingCount} hint="saved on this device" />
        <StatTile label="Visits (7 days)" value={visitsThisWeek} />
        <StatTile label="Upcoming appointments" value={upcoming} />
      </View>

      <OfflineTest sync={sync} onSynced={reload} />

      <Card title="Recent field records" subtitle="Your latest visits, updates and appointments">
        {records.slice(0, 6).map((r) => (
          <RecordListItem key={r.id} record={r} pendingSync={r.pendingSync} context={`for ${patientName.get(r.patient_id) ?? 'patient'}`} />
        ))}
        {data && records.length === 0 ? <Notice tone="info" message="No records yet. Open My Patients to log a visit." /> : null}
      </Card>

      <ConnectionTest />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
