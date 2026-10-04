import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../../../shared/components/Card';
import DeveloperTools from '../../../shared/components/DeveloperTools';
import EmptyState from '../../../shared/components/EmptyState';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Notice from '../../../shared/components/Notice';
import RecordListItem from '../../../shared/components/RecordListItem';
import Screen from '../../../shared/components/Screen';
import SectionHeader from '../../../shared/components/SectionHeader';
import StatTile from '../../../shared/components/StatTile';
import { isWithinDays, timeAgo } from '../../../shared/utils/date';
import { spacing } from '../../../shared/theme';
import AssignmentCard from '../components/AssignmentCard';
import ConnectionTest from '../components/ConnectionTest';
import OfflineTest from '../components/OfflineTest';
import TodayHelpRequests from '../components/TodayHelpRequests';
import TodayQueue from '../components/TodayQueue';
import { useAcknowledgeHelpRequest } from '../hooks/useAcknowledgeHelpRequest';
import { useBHWData, useCurrentBHWId } from '../hooks/useBHWData';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { buildTodayItems } from '../today';

/** Today (route /bhw): who needs help today, help requests first (Spec 04, B-1). */
export default function BHWDashboardScreen() {
  const router = useRouter();
  const bhwId = useCurrentBHWId();
  const { data, error, loading, reload } = useBHWData();
  const sync = useOfflineSync();
  const reloadToday = useCallback(() => reload(), [reload]);
  const ack = useAcknowledgeHelpRequest(data?.bhw?.id ?? bhwId, reloadToday);

  const patients = data?.patients ?? [];
  const records = data?.records ?? [];
  const patientName = new Map(patients.map((p) => [p.id, p.full_name]));
  const todayItems = useMemo(
    () =>
      data
        ? buildTodayItems({ bhwId: data.bhw?.id ?? bhwId, patients: data.patients, appointments: data.appointments, records: data.records, now: Date.now() })
        : [],
    [data, bhwId]
  );
  const visitsThisWeek = records.filter((r) => r.record_type === 'visit' && isWithinDays(r.created_at, 7)).length;
  const cachedAt = data?.fromCache ? data.cachedAt : null;

  function openVisit(patientId: string) {
    router.push({ pathname: '/bhw/patients/visit', params: { patientId } });
  }

  return (
    <Screen
      title="Today"
      subtitle={`${data?.bhw?.full_name ?? 'BHW'} · who needs help today. Works offline from your last update.`}
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
          tone={data.fromCache ? 'info' : 'warning'}
          message={
            data.fromCache
              ? `Showing your saved copy from ${timeAgo(data.cachedAt)}. ${data.fetchError}`
              : `${data.fetchError} Connect once to load your Today list.`
          }
        />
      ) : null}
      {data?.cacheError ? <Notice tone="warning" message={data.cacheError} /> : null}
      {data ? (
        <TodayHelpRequests
          requests={data.helpRequests}
          patientNames={patientName}
          cachedAt={cachedAt}
          onAcknowledge={ack.acknowledge}
          pendingIds={ack.pendingIds}
          errors={ack.errors}
          offline={ack.offline}
        />
      ) : null}
      {data ? <TodayQueue items={todayItems} cachedAt={cachedAt} onLogVisit={openVisit} /> : null}
      <SectionHeader title="Overview" />
      {data ? <AssignmentCard bhw={data.bhw} admin={data.admin} patientCount={patients.length} /> : null}
      <View style={styles.stats}>
        <StatTile label="Assigned patients" value={patients.length} />
        <StatTile label="Waiting to send" value={sync.pendingCount} hint="saved on this device" />
        <StatTile label="Visits (7 days)" value={visitsThisWeek} />
        <StatTile label="Today items" value={todayItems.length + (data?.helpRequests.length ?? 0)} />
      </View>
      <Card title="Recent field records" subtitle="Your latest visits, updates and appointments">
        {records.slice(0, 6).map((r) => (
          <RecordListItem key={r.id} record={r} pendingSync={r.pendingSync} context={`for ${patientName.get(r.patient_id) ?? 'patient'}`} />
        ))}
        {data && records.length === 0 ? (
          <EmptyState icon="document" title="No records yet" message="Open My Patients to log a visit." />
        ) : null}
      </Card>
      <DeveloperTools>
        <OfflineTest sync={sync} onSynced={reload} />
        <ConnectionTest />
      </DeveloperTools>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
