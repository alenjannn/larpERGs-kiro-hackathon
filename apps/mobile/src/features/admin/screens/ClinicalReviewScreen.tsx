import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import ChipGroup from '../../../shared/components/ChipGroup';
import EmptyState from '../../../shared/components/EmptyState';
import Notice from '../../../shared/components/Notice';
import Screen from '../../../shared/components/Screen';
import { StatusChipRow } from '../../../shared/components/StatusChip';
import { DEMO_PERSONAS } from '../../../shared/config/demo';
import { useDemoRole } from '../../../shared/context/DemoRoleContext';
import { clinicalStatusKey, type StatusKey } from '../../../shared/status';
import { text } from '../../../shared/theme';
import AdminDataStates from '../components/AdminDataStates';
import CarePlanForm from '../components/CarePlanForm';
import QueueTable from '../components/QueueTable';
import { OFFLINE_RELEASE_NOTICE, useClinicalReview } from '../hooks/useClinicalReview';
import { formatAge } from '../needsAttention';

const SIMULATED = 'Simulated role — no real authentication';

/** Restricted clinician queue: review results and release care plans (A-4). */
export default function ClinicalReviewScreen() {
  const { clinicianMode, setClinicianMode } = useDemoRole();
  const review = useClinicalReview(clinicianMode);
  const [patientId, setPatientId] = useState<string | null>(null);
  const data = review.data;

  const queue = useMemo(
    () =>
      (data?.records ?? [])
        .filter((r) => r.review_status === 'awaiting_clinical_review')
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [data]
  );

  if (!clinicianMode) {
    return (
      <Screen title="Clinical Review" subtitle="Restricted clinician view">
        <EmptyState
          icon="blocked"
          title="This is a restricted clinician view"
          message="Clinical results and the release action are only shown in Clinician mode. Coordinators see review status on Needs Attention, not the results themselves."
          action={{ label: 'Turn on Clinician mode', onPress: () => setClinicianMode(true) }}
        />
        <Text style={styles.meta}>{SIMULATED}. In this demo anyone can switch modes; a real deployment would require clinician sign-in.</Text>
      </Screen>
    );
  }

  const name = new Map((data?.patients ?? []).map((p) => [p.id, p.full_name]));
  const selected = data?.patients.find((p) => p.id === patientId) ?? null;

  return (
    <Screen
      title="Clinical Review"
      subtitle={`${DEMO_PERSONAS.clinician.name} · clinician`}
      refreshing={review.loading && !!data}
      onRefresh={review.reload}
    >
      <Notice tone="warning" message={`${SIMULATED}. Do not use real patient data.`} />
      <AdminDataStates
        loading={review.loading}
        hasData={!!data}
        error={review.error}
        fromCache={data?.fromCache}
        cachedAt={data?.cachedAt}
        fetchError={data?.fetchError}
        onRetry={review.reload}
      />
      {review.offline && data ? <Notice tone="info" message={OFFLINE_RELEASE_NOTICE} /> : null}

      {data ? (
        <>
          <Card title={`Review queue (${queue.length})`} subtitle="Results awaiting clinical review, oldest first">
            <QueueTable
              accessibilityLabel="Results awaiting clinical review"
              columns={[
                { key: 'patient', label: 'Patient', flex: 1.3 },
                { key: 'result', label: 'Result', flex: 1.4 },
                { key: 'status', label: 'Status', flex: 1.4 },
                { key: 'age', label: 'Waiting', flex: 0.8 },
                { key: 'action', label: 'Action', flex: 0.9 },
              ]}
              rows={queue.map((r) => ({
                id: r.id,
                cells: {
                  patient: name.get(r.patient_id) ?? 'Patient',
                  result: r.title,
                  status: <StatusChipRow statuses={[clinicalStatusKey(r)].filter((k): k is StatusKey => k !== null)} />,
                  age: formatAge(Date.now() - new Date(r.created_at).getTime()),
                  action: (
                    <Button
                      title="Review"
                      variant="secondary"
                      onPress={() => setPatientId(r.patient_id)}
                      accessibilityLabel={`Review ${r.title} for ${name.get(r.patient_id) ?? 'patient'}`}
                    />
                  ),
                },
              }))}
              empty={<EmptyState icon="check" title="No results awaiting review." />}
            />
          </Card>

          <Card title="Write a care plan" subtitle="Pick a patient. A plan can be written without a pending result.">
            {data.patients.length === 0 ? (
              <EmptyState title="No patients yet." />
            ) : (
              <ChipGroup
                label="Patient"
                options={data.patients.map((p) => ({ value: p.id, label: p.full_name }))}
                value={patientId}
                onChange={setPatientId}
              />
            )}
          </Card>

          {selected ? (
            <CarePlanForm
              patient={selected}
              records={data.records.filter((r) => r.patient_id === selected.id)}
              plans={data.carePlans.filter((p) => p.patient_id === selected.id)}
              clinicianId={review.clinicianId}
              busy={review.busy}
              error={review.actionError}
              disabledReason={review.offline ? OFFLINE_RELEASE_NOTICE : null}
              onSaveDraft={review.saveDraft}
              onRelease={review.release}
            />
          ) : (
            <EmptyState icon="document" title="Choose a patient to review" message="Their latest readings, pending results and care plans appear here." />
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: { ...text.caption, textAlign: 'center' },
});
