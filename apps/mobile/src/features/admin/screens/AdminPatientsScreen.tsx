import Card from '../../../shared/components/Card';
import DemoBadge from '../../../shared/components/DemoBadge';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Notice from '../../../shared/components/Notice';
import Screen from '../../../shared/components/Screen';
import PatientList from '../components/PatientList';
import { useAdminData } from '../hooks/useAdminData';
import { useBHWManagement } from '../hooks/useBHWManagement';

export default function AdminPatientsScreen() {
  const { data, error, loading, reload } = useAdminData();
  const manage = useBHWManagement(reload);

  return (
    <Screen
      title="Patient Management"
      subtitle="All patients across barangays · assign each one to a BHW"
      refreshing={loading && !!data}
      onRefresh={reload}
    >
      {loading && !data ? <LoadingSpinner /> : null}
      {error ? <Notice tone="error" message={error} /> : null}
      {manage.error ? <Notice tone="error" message={manage.error} /> : null}
      {data ? (
        <Card title={`Patients (${data.patients.length})`} subtitle="Includes patients BHWs registered offline in the field" right={<DemoBadge />}>
          <PatientList patients={data.patients} bhws={data.bhws} records={data.records} onAssign={manage.assignPatient} busyId={manage.busy} />
        </Card>
      ) : null}
    </Screen>
  );
}
