import EmptyState from '../../../shared/components/EmptyState';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Notice from '../../../shared/components/Notice';
import Screen from '../../../shared/components/Screen';
import CarePlanCard from '../components/CarePlanCard';
import CareTeamContacts from '../components/CareTeamContacts';
import ReviewStatusCard from '../components/ReviewStatusCard';
import SnapshotStatus from '../components/SnapshotStatus';
import { PATIENT_COPY, PATIENT_COPY_FIL } from '../copy';
import { useCurrentPatientId, usePatientSnapshot } from '../hooks/usePatientSnapshot';
import { reviewState } from '../logic/nextStep';

/**
 * Care Plan (P-6): released plans only (Spec 05 releases them), the pending-review
 * state (K7), and the care team's contacts. Read-only for the patient.
 */
export default function PatientCarePlanScreen() {
  const patientId = useCurrentPatientId();
  const snap = usePatientSnapshot(patientId);
  const s = snap.snapshot;
  const plan = s?.care_plan && s.care_plan.status === 'released' ? s.care_plan : null;
  const state = s ? reviewState(s.records, plan, s.patient?.yakap_stage) : 'none';

  return (
    <Screen
      title={PATIENT_COPY.carePlanTitle}
      subtitle={PATIENT_COPY_FIL.carePlanTitle}
      refreshing={snap.loading && !!s}
      onRefresh={() => void snap.reload()}
    >
      {snap.loading && !s ? <LoadingSpinner /> : null}
      <SnapshotStatus status={snap.status} lastUpdatedAt={s?.last_updated_at ?? null} staleReason={s ? snap.error : null} />
      {!s && snap.error ? <Notice tone="error" message={snap.error} /> : null}

      {s ? (
        <>
          {state === 'pending' ? <ReviewStatusCard state="pending" /> : null}
          {plan ? (
            <CarePlanCard plan={plan} clinician={s.clinician} title={state === 'pending' ? PATIENT_COPY.lastReleasedPlan : 'Your care plan'} />
          ) : null}
          {state === 'none' ? <EmptyState icon="document" title={PATIENT_COPY.noPlanTitle} message={PATIENT_COPY.noPlanMessage} /> : null}
          <CareTeamContacts bhw={s.bhw} clinic={s.clinic} />
        </>
      ) : null}
    </Screen>
  );
}
