import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Notice from '../../../shared/components/Notice';
import Screen from '../../../shared/components/Screen';
import AppointmentList from '../components/AppointmentList';
import ConnectionTest from '../components/ConnectionTest';
import HealthRecordCard from '../components/HealthRecordCard';
import { useHealthRecords } from '../hooks/useHealthRecords';
import { usePatientData } from '../hooks/usePatientData';

export default function PatientHomeScreen() {
  const profile = usePatientData();
  const health = useHealthRecords();
  const bhwName = profile.data?.bhw?.full_name;
  const loading = profile.loading || health.loading;

  return (
    <Screen
      title={`Welcome, ${profile.data?.patient?.full_name ?? 'Patient'}`}
      subtitle={bhwName ? `Your health worker: ${bhwName}` : 'Your health updates from your Barangay Health Worker'}
      refreshing={loading && !!health.data}
      onRefresh={() => {
        profile.reload();
        health.reload();
      }}
    >
      {loading && !health.data ? <LoadingSpinner /> : null}
      {profile.error ? <Notice tone="error" message={profile.error} /> : null}
      {profile.data && !profile.data.patient ? (
        <Notice tone="warning" message="Patient profile not found. Run supabase/seed.sql to create the demo personas." />
      ) : null}
      {health.error && health.error !== profile.error ? <Notice tone="error" message={health.error} /> : null}

      {health.data ? (
        <>
          <AppointmentList appointments={health.data.upcomingAppointments} bhwName={bhwName} />
          <HealthRecordCard
            title="🆕 Latest health updates"
            subtitle="Newest records from your BHW"
            records={health.data.all.filter((r) => r.record_type !== 'appointment').slice(0, 3)}
            bhwName={bhwName}
            emptyText="No health updates yet."
          />
        </>
      ) : null}

      <ConnectionTest />
    </Screen>
  );
}
