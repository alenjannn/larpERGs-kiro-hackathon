import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import DemoBadge from '../../../shared/components/DemoBadge';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import NextStepCard from '../../../shared/components/NextStepCard';
import Notice from '../../../shared/components/Notice';
import Screen from '../../../shared/components/Screen';
import type { Appointment } from '../../../shared/types/db.types';
import { colors, typography } from '../../../shared/theme';
import AppointmentList from '../components/AppointmentList';
import CarePlanSummaryCard from '../components/CarePlanSummaryCard';
import CareTeamCard from '../components/CareTeamCard';
import ConnectionTest from '../components/ConnectionTest';
import HealthRecordCard from '../components/HealthRecordCard';
import HelpRequestSheet from '../components/HelpRequestSheet';
import MyRequestsCard from '../components/MyRequestsCard';
import SnapshotStatus from '../components/SnapshotStatus';
import YakapStepLine from '../components/YakapStepLine';
import { groupRecords } from '../hooks/useHealthRecords';
import { useHelpRequests } from '../hooks/useHelpRequests';
import { useCurrentPatientId, usePatientSnapshot } from '../hooks/usePatientSnapshot';

const NEXT_STEP_STATUSES: Appointment['encounter_status'][] = ['requested', 'confirmed', 'rescheduled'];

/** Earliest upcoming appointment that still needs the patient to go. */
function nextAppointment(appointments: Appointment[], now = Date.now()): Appointment | null {
  return (
    appointments
      .filter((a) => a.scheduled_at && Date.parse(a.scheduled_at) >= now && NEXT_STEP_STATUSES.includes(a.encounter_status))
      .sort((a, b) => (a.scheduled_at ?? '').localeCompare(b.scheduled_at ?? ''))[0] ?? null
  );
}

/**
 * Patient Home: next step first (brief §4). Reads the patient snapshot, so it
 * also renders offline (Spec 02, OC-1). "I need help" works without a snapshot.
 */
export default function PatientHomeScreen() {
  const patientId = useCurrentPatientId();
  const snap = usePatientSnapshot(patientId);
  const requests = useHelpRequests(patientId);
  const [helpOpen, setHelpOpen] = useState(false);
  const openHelp = () => setHelpOpen(true);

  const s = snap.snapshot;
  const health = useMemo(() => (s ? groupRecords(s.records) : null), [s]);
  const next = s ? nextAppointment(s.appointments) : null;
  const bhwName = s?.bhw?.full_name;

  return (
    <Screen
      title={`Welcome, ${s?.patient?.full_name ?? 'Patient'}`}
      subtitle={bhwName ? `Your health worker: ${bhwName}` : 'Your next care step and requests for help'}
      refreshing={snap.loading && !!s}
      onRefresh={() => void snap.reload()}
    >
      {snap.loading && !s ? <LoadingSpinner /> : null}
      <SnapshotStatus status={snap.status} lastUpdatedAt={s?.last_updated_at ?? null} staleReason={s ? snap.error : null} showOfflineNote />
      {!s && snap.error ? <Notice tone="error" message={snap.error} /> : null}
      {s && !s.patient ? (
        <Notice tone="warning" message="Patient profile not found. Run supabase/apply_foundation.sql to create the demo personas." />
      ) : null}

      {s ? (
        next ? (
          <NextStepCard
            action={next.purpose}
            responsible={s.clinic && s.clinic.id === next.clinic_id ? s.clinic.name : undefined}
            date={next.scheduled_at}
            status={`encounter.${next.encounter_status}`}
            onHelp={openHelp}
          />
        ) : (
          <Card title="No next step scheduled yet">
            <Text style={styles.body}>Ask your health worker for help arranging a checkup.</Text>
            <Button title="I need help" variant="secondary" onPress={openHelp} />
          </Card>
        )
      ) : null}

      {s ? <YakapStepLine stage={s.patient?.yakap_stage} /> : null}

      <Card title="Need help?" subtitle="Kailangan ng tulong?">
        <Text style={styles.body}>Ask your health worker for help with transport, dates, labs, documents or medicine.</Text>
        <Button title="I need help" onPress={openHelp} />
      </Card>

      <MyRequestsCard
        items={requests.items}
        loading={requests.loading}
        error={requests.error}
        offlineNotice={requests.offlineNotice}
        onRetry={(id) => void requests.retry(id)}
        onRetryAll={() => void requests.retryAll()}
      />

      {s ? (
        <>
          <CarePlanSummaryCard plan={s.care_plan} clinician={s.clinician} />
          <CareTeamCard profile={{ patient: s.patient, bhw: s.bhw, admin: s.admin }} />
          {s.clinic ? (
            <Card title="Your clinic" right={<DemoBadge />}>
              <Text style={styles.body}>{s.clinic.name}</Text>
              {s.clinic.address ? <Text style={styles.muted}>{s.clinic.address}</Text> : null}
              <Text style={styles.muted}>Contact: {s.clinic.contact ?? 'Unknown'}</Text>
            </Card>
          ) : null}
          {/* Legacy record appointments only when the appointments table has none (no duplicates). */}
          {health && s.appointments.length === 0 ? <AppointmentList appointments={health.upcomingAppointments} bhwName={bhwName} /> : null}
          {health ? (
            <HealthRecordCard
              title="Latest health updates"
              subtitle="Newest records from your BHW"
              records={health.all.filter((r) => r.record_type !== 'appointment').slice(0, 3)}
              bhwName={bhwName}
              emptyText="No health updates yet."
            />
          ) : null}
        </>
      ) : null}

      <ConnectionTest />

      <HelpRequestSheet visible={helpOpen} patientId={patientId} items={requests.items} onClose={() => setHelpOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: typography.body, color: colors.text, lineHeight: typography.lineHeight },
  muted: { fontSize: typography.small, color: colors.muted },
});
