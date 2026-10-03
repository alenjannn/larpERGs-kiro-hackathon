import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import DemoBadge from '../../../shared/components/DemoBadge';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Notice from '../../../shared/components/Notice';
import Screen from '../../../shared/components/Screen';
import type { HelpReason } from '../../../shared/types/db.types';
import { colors, typography } from '../../../shared/theme';
import AppointmentList from '../components/AppointmentList';
import CarePlanSummaryCard from '../components/CarePlanSummaryCard';
import CareTeamCard from '../components/CareTeamCard';
import ConnectionTest from '../components/ConnectionTest';
import HelpRequestSheet from '../components/HelpRequestSheet';
import LatestMeasurements from '../components/LatestMeasurements';
import MyRequestsCard from '../components/MyRequestsCard';
import NextStepSection from '../components/NextStepSection';
import ReviewStatusCard from '../components/ReviewStatusCard';
import SnapshotStatus from '../components/SnapshotStatus';
import UpcomingFollowUps from '../components/UpcomingFollowUps';
import YakapStepLine from '../components/YakapStepLine';
import { PATIENT_COPY } from '../copy';
import { useClearbookEntries } from '../hooks/useClearbookEntries';
import { groupRecords } from '../hooks/useHealthRecords';
import { useHelpRequests } from '../hooks/useHelpRequests';
import { useCurrentPatientId, usePatientSnapshot } from '../hooks/usePatientSnapshot';
import { mergeRecords } from '../logic/clearbook';
import { nextAppointment, reviewState, upcomingFollowUps } from '../logic/nextStep';

interface HelpPreset {
  reason: HelpReason | null;
  message?: string;
}

/**
 * Patient Home, next step first (P-1): next step, upcoming follow-up, latest
 * measurements, review status; then help, requests and care information.
 * Reads the snapshot, so it renders offline (Spec 02).
 */
export default function PatientHomeScreen() {
  const router = useRouter();
  const patientId = useCurrentPatientId();
  const snap = usePatientSnapshot(patientId);
  const requests = useHelpRequests(patientId);
  const s = snap.snapshot;
  const entries = useClearbookEntries(patientId, s?.patient?.bhw_id ?? null, () => void snap.reload());
  const [help, setHelp] = useState<HelpPreset | null>(null);
  const openHelp = () => setHelp({ reason: null });

  const records = useMemo(() => (s ? mergeRecords(s.records, entries.entries) : []), [s, entries.entries]);
  const legacy = useMemo(() => (s ? groupRecords(s.records) : null), [s]);
  const next = s ? nextAppointment(s.appointments) : null;
  const followUps = s ? upcomingFollowUps(s.appointments, next?.id ?? null) : [];
  const review = s ? reviewState(s.records, s.care_plan, s.patient?.yakap_stage) : 'none';
  const bhwName = s?.bhw?.full_name;
  const clinicFor = (clinicId: string | null) => (s?.clinic && s.clinic.id === clinicId ? s.clinic.name : undefined);

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

      {/* 1. Next step */}
      {s ? (
        next ? (
          <NextStepSection
            appointment={next}
            clinicName={clinicFor(next.clinic_id)}
            patientId={patientId}
            requests={requests.items}
            reload={snap.reload}
            onHelp={openHelp}
            onAnotherDate={(message) => setHelp({ reason: 'another_date', message })}
          />
        ) : (
          <Card title="No next step scheduled yet">
            <Text style={styles.body}>Ask your health worker for help arranging a checkup.</Text>
            <Button title="I need help" variant="secondary" onPress={openHelp} />
          </Card>
        )
      ) : null}

      {/* 2. Upcoming follow-up (legacy record appointments only when the appointments table has none) */}
      {s ? <UpcomingFollowUps appointments={followUps} clinic={s.clinic} /> : null}
      {legacy && s && s.appointments.length === 0 ? <AppointmentList appointments={legacy.upcomingAppointments} bhwName={bhwName} /> : null}

      {/* 3. Latest measurements */}
      {s ? (
        <>
          <LatestMeasurements records={records} />
          <Button title={PATIENT_COPY.seeMyHealth} variant="secondary" onPress={() => router.navigate('/patient/health')} />
        </>
      ) : null}

      {/* 4. Review status */}
      {s ? <ReviewStatusCard state={review} /> : null}

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
        </>
      ) : null}

      <ConnectionTest />

      <HelpRequestSheet
        visible={help !== null}
        patientId={patientId}
        items={requests.items}
        initialReason={help?.reason ?? null}
        initialMessage={help?.message}
        onClose={() => setHelp(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: typography.body, color: colors.text, lineHeight: typography.lineHeight },
  muted: { fontSize: typography.small, color: colors.muted },
});
