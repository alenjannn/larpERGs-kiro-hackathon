import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import EmptyState from '../../../shared/components/EmptyState';
import LastUpdated from '../../../shared/components/LastUpdated';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Notice from '../../../shared/components/Notice';
import Screen from '../../../shared/components/Screen';
import { useConnectivity } from '../../../shared/context/ConnectivityContext';
import { colors, spacing, typography } from '../../../shared/theme';
import ClinicCard, { PhilHealthLink } from '../components/ClinicCard';
import HelpRequestSheet from '../components/HelpRequestSheet';
import SnapshotStatus from '../components/SnapshotStatus';
import YakapTracker from '../components/YakapTracker';
import { PATIENT_COPY, PATIENT_COPY_FIL } from '../copy';
import { useClinics } from '../hooks/useClinics';
import { useHelpRequests } from '../hooks/useHelpRequests';
import { useCurrentPatientId, usePatientSnapshot } from '../hooks/usePatientSnapshot';
import { isClinicConfirmed } from '../logic/yakap';

/** YAKAP & Clinics (P-4, P-5): the checkup tracker and a clinic finder that never books or enrolls. */
export default function PatientYakapScreen() {
  const patientId = useCurrentPatientId();
  const snap = usePatientSnapshot(patientId);
  const clinics = useClinics();
  const requests = useHelpRequests(patientId);
  const { isOnline } = useConnectivity();
  const [helpOpen, setHelpOpen] = useState(false);

  const s = snap.snapshot;
  const myClinicId = s?.patient?.clinic_id ?? null;
  const confirmed = s ? isClinicConfirmed(s.appointments, myClinicId) : false;
  const sorted = useMemo(
    () => [...clinics.clinics].sort((a, b) => Number(b.id === myClinicId) - Number(a.id === myClinicId) || a.name.localeCompare(b.name)),
    [clinics.clinics, myClinicId]
  );

  return (
    <Screen
      title={PATIENT_COPY.yakapTitle}
      subtitle={PATIENT_COPY_FIL.yakapTitle}
      refreshing={(snap.loading && !!s) || (clinics.loading && clinics.status === 'ready')}
      onRefresh={() => {
        void snap.reload();
        void clinics.reload();
      }}
    >
      <Text style={styles.tagline}>{PATIENT_COPY.yakapTagline}</Text>
      {snap.loading && !s ? <LoadingSpinner /> : null}
      <SnapshotStatus status={snap.status} lastUpdatedAt={s?.last_updated_at ?? null} staleReason={s ? snap.error : null} />
      {!s && snap.error ? <Notice tone="error" message={snap.error} /> : null}

      {s ? (
        <Card title={PATIENT_COPY.yourSteps} subtitle={PATIENT_COPY_FIL.yourSteps}>
          <YakapTracker stage={s.patient?.yakap_stage} clinicConfirmed={confirmed} />
        </Card>
      ) : null}

      <Card>
        <Text style={styles.body}>{PATIENT_COPY.notEnrollment}</Text>
        <Button title={PATIENT_COPY.askGettingStarted} onPress={() => setHelpOpen(true)} />
        <PhilHealthLink isOnline={isOnline} />
      </Card>

      <Text style={styles.heading} accessibilityRole="header">
        {PATIENT_COPY.clinics}
      </Text>
      <Text style={styles.fil}>{PATIENT_COPY_FIL.clinics}</Text>
      {clinics.status === 'ready' ? <LastUpdated at={clinics.lastUpdatedAt} /> : null}

      {clinics.loading && clinics.status === 'loading' ? <LoadingSpinner /> : null}
      {clinics.status === 'none' && !clinics.loading ? (
        clinics.error ? (
          <View style={styles.errorBox}>
            <Notice tone="error" message={clinics.error} />
            <Button title="Try again" variant="secondary" onPress={() => void clinics.reload()} />
          </View>
        ) : (
          <EmptyState icon="device" title={PATIENT_COPY.clinicsConnectOnce} />
        )
      ) : null}
      {clinics.status === 'ready' && clinics.error ? <Notice tone="info" message={`Showing saved information. ${clinics.error}`} /> : null}
      {clinics.status === 'ready' && !clinics.loading && sorted.length === 0 ? <EmptyState title={PATIENT_COPY.noClinics} /> : null}
      {sorted.map((c) => (
        <ClinicCard key={c.id} clinic={c} mine={c.id === myClinicId ? { confirmed } : null} isOnline={isOnline} />
      ))}

      <HelpRequestSheet visible={helpOpen} patientId={patientId} items={requests.items} onClose={() => setHelpOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tagline: { fontSize: typography.body, color: colors.text, lineHeight: typography.lineHeight, fontWeight: '600' },
  body: { fontSize: typography.body, color: colors.text, lineHeight: typography.lineHeight },
  heading: { fontSize: typography.title, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  fil: { fontSize: typography.small, color: colors.muted, marginTop: -spacing.sm },
  errorBox: { gap: spacing.sm },
});
