import Card from '../../../shared/components/Card';
import DemoBadge from '../../../shared/components/DemoBadge';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Notice from '../../../shared/components/Notice';
import Screen from '../../../shared/components/Screen';
import BHWList from '../components/BHWList';
import CreateBHWForm from '../components/CreateBHWForm';
import { useAdminData } from '../hooks/useAdminData';
import { useBHWManagement } from '../hooks/useBHWManagement';

export default function AdminBHWScreen() {
  const { data, error, loading, reload } = useAdminData();
  const manage = useBHWManagement(reload);

  return (
    <Screen title="BHWs" subtitle="Create, monitor and activate or deactivate Barangay Health Workers" refreshing={loading && !!data} onRefresh={reload}>
      {loading && !data ? <LoadingSpinner /> : null}
      {error ? <Notice tone="error" message={error} /> : null}
      {manage.error ? <Notice tone="error" message={manage.error} /> : null}

      <Card title="Create BHW account" subtitle="The new BHW reports to you" right={<DemoBadge />}>
        <CreateBHWForm onSubmit={manage.addBHW} loading={manage.busy === 'create'} />
        <Notice tone="info" message="Demo only: creates a BHW record. Real deployments would also invite them via Supabase Auth from a secure server." />
      </Card>

      {data ? (
        <Card title={`Your BHWs (${data.bhws.length})`} subtitle="Listed in the order they were added. Not a ranking.">
          <BHWList activity={data.activity} onToggleStatus={manage.toggleStatus} busyId={manage.busy} />
        </Card>
      ) : null}
    </Screen>
  );
}
