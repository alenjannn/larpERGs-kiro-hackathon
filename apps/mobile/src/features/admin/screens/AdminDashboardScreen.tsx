import Card from '../../../shared/components/Card';
import DemoBadge from '../../../shared/components/DemoBadge';
import LastUpdated from '../../../shared/components/LastUpdated';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Notice from '../../../shared/components/Notice';
import RecordListItem from '../../../shared/components/RecordListItem';
import Screen from '../../../shared/components/Screen';
import BHWList from '../components/BHWList';
import ConnectionTest from '../components/ConnectionTest';
import DemoClinicInbox from '../components/DemoClinicInbox';
import HealthMetricsGrid from '../components/HealthMetricsGrid';
import NeedsAttentionHelpRequests from '../components/NeedsAttentionHelpRequests';
import { useAdminData } from '../hooks/useAdminData';

export default function AdminDashboardScreen() {
  const { data, error, loading, reload } = useAdminData();
  const patientName = new Map((data?.patients ?? []).map((p) => [p.id, p.full_name]));
  const bhwName = new Map((data?.bhws ?? []).map((b) => [b.id, b.full_name]));

  return (
    <Screen
      title="Admin Dashboard"
      subtitle={data?.admin ? `${data.admin.full_name} · ${data.admin.office}` : 'Coordination overview'}
      refreshing={loading && !!data}
      onRefresh={reload}
    >
      {loading && !data ? <LoadingSpinner /> : null}
      {error ? <Notice tone="error" message={error} /> : null}
      {data && !data.admin ? <Notice tone="warning" message="Admin profile not found. Run supabase/seed.sql to create the demo personas." /> : null}
      {data?.fromCache ? <LastUpdated at={data.cachedAt} /> : null}
      {data?.fetchError ? (
        <Notice tone={data.fromCache ? 'info' : 'warning'} message={data.fromCache ? `Showing saved information. ${data.fetchError}` : data.fetchError} />
      ) : null}

      {data ? (
        <>
          <NeedsAttentionHelpRequests requests={data.helpRequests} />
          <DemoClinicInbox requests={data.helpRequests} />
          <HealthMetricsGrid metrics={data.metrics} />
          <Card title="BHW field activity" subtitle="Your health workers and what they've synced" right={<DemoBadge />}>
            <BHWList activity={data.activity} />
          </Card>
          <Card title="Latest field records" subtitle="Most recent records from all BHWs (offline-synced records included)">
            {data.records.slice(0, 8).map((r) => (
              <RecordListItem
                key={r.id}
                record={r}
                context={`${patientName.get(r.patient_id) ?? 'patient'} · by ${r.bhw_id ? bhwName.get(r.bhw_id) ?? 'BHW' : 'unknown BHW'}`}
              />
            ))}
            {data.records.length === 0 ? <Notice tone="info" message="No field records yet." /> : null}
          </Card>
        </>
      ) : null}

      <ConnectionTest />
    </Screen>
  );
}
