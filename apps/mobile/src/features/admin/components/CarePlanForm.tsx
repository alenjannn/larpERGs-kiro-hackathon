import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import ConfirmSheet from '../../../shared/components/ConfirmSheet';
import MeasurementCard from '../../../shared/components/MeasurementCard';
import Notice from '../../../shared/components/Notice';
import StatusChip, { StatusChipRow } from '../../../shared/components/StatusChip';
import TextField from '../../../shared/components/TextField';
import { clinicalStatusKey, type StatusKey } from '../../../shared/status';
import type { CarePlan, HealthRecord, Patient } from '../../../shared/types/db.types';
import { formatDateDMY, formatDateTimeDMY } from '../../../shared/utils/date';
import { formatBPValue } from '../../../shared/utils/format';
import { newId } from '../../../shared/utils/id';
import { colors, spacing, text } from '../../../shared/theme';
import type { CarePlanInput } from '../../../shared/services/apiAdmin';

const SUMMARY_MAX = 600;
const NEXT_STEPS_MAX = 1000;

interface Props {
  patient: Patient;
  records: HealthRecord[];
  plans: CarePlan[];
  clinicianId: string;
  busy: 'draft' | 'release' | null;
  error: string | null;
  disabledReason: string | null;
  onSaveDraft: (input: CarePlanInput) => Promise<CarePlan | null>;
  onRelease: (input: CarePlanInput) => Promise<CarePlan | null>;
}

const measured = (r: HealthRecord) => r.measured_at ?? r.created_at;

/** Review one patient's results and write, save or release their care plan (A-4). */
export default function CarePlanForm({ patient, records, plans, clinicianId, busy, error, disabledReason, onSaveDraft, onRelease }: Props) {
  const draft = plans.find((p) => p.status === 'draft') ?? null;
  const released = plans.filter((p) => p.status === 'released');
  // One client id per plan so a retried save/release never creates a duplicate.
  const [planId, setPlanId] = useState<string>(() => draft?.id ?? newId());
  const [summary, setSummary] = useState(draft?.summary ?? '');
  const [nextSteps, setNextSteps] = useState(draft?.next_steps ?? '');
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  // Switching patient loads that patient's draft (or a blank form).
  useEffect(() => {
    setPlanId(draft?.id ?? newId());
    setSummary(draft?.summary ?? '');
    setNextSteps(draft?.next_steps ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient.id, draft?.id]);

  useEffect(() => {
    setDone(null);
  }, [patient.id]);

  const own = [...records].sort((a, b) => measured(b).localeCompare(measured(a)));
  const latestBP = own.find((r) => formatBPValue(r.systolic, r.diastolic) !== null);
  const latestGlucose = own.find((r) => r.glucose_value != null);
  const latestWeight = own.find((r) => r.weight_kg != null);
  const pending = own.filter((r) => r.review_status === 'awaiting_clinical_review');

  const input: CarePlanInput = {
    id: planId,
    patient_id: patient.id,
    clinician_admin_id: clinicianId,
    summary: summary.trim(),
    next_steps: nextSteps.trim() || null,
  };
  const canSubmit = input.summary.length > 0 && summary.length <= SUMMARY_MAX && nextSteps.length <= NEXT_STEPS_MAX && !disabledReason;

  const release = async () => {
    const plan = await onRelease(input);
    setConfirming(false);
    if (plan) {
      setDone(`Plan released ${formatDateTimeDMY(plan.released_at)}. ${patient.full_name} sees it on Care Plan after their next online load.`);
      setPlanId(newId());
      setSummary('');
      setNextSteps('');
    }
  };

  const saveDraft = async () => {
    const plan = await onSaveDraft(input);
    if (plan) setDone('Draft saved. Patients never see drafts.');
  };

  return (
    <>
      <Card title={patient.full_name} subtitle={[patient.barangay, patient.yakap_stage ? `YAKAP stage: ${patient.yakap_stage.replace(/_/g, ' ')}` : null].filter(Boolean).join(' · ')}>
        <Text style={styles.section} accessibilityRole="header">
          Latest readings
        </Text>
        <View style={styles.grid}>
          <MeasurementCard
            label="Blood pressure"
            value={latestBP ? formatBPValue(latestBP.systolic, latestBP.diastolic) : null}
            unit="mmHg"
            measuredAt={latestBP ? measured(latestBP) : null}
          />
          <MeasurementCard
            label="Blood glucose"
            value={latestGlucose?.glucose_value ?? null}
            unit={latestGlucose?.glucose_unit ?? undefined}
            measuredAt={latestGlucose ? measured(latestGlucose) : null}
            context={latestGlucose?.glucose_test_type ? latestGlucose.glucose_test_type.replace('_', ' ') : undefined}
          />
          <MeasurementCard label="Weight" value={latestWeight?.weight_kg ?? null} unit="kg" measuredAt={latestWeight ? measured(latestWeight) : null} />
        </View>

        <Text style={styles.section} accessibilityRole="header">
          Results awaiting review ({pending.length})
        </Text>
        {pending.length === 0 ? <Text style={styles.meta}>No results awaiting review for this patient.</Text> : null}
        {pending.map((r) => {
          const keys = [clinicalStatusKey(r)].filter((k): k is StatusKey => k !== null);
          return (
            <View key={r.id} style={styles.result}>
              <Text style={styles.resultTitle}>{r.title}</Text>
              <Text style={styles.meta}>
                Received {formatDateDMY(r.created_at)}
                {r.measured_at ? ` · measured ${formatDateDMY(r.measured_at)}` : ''}
              </Text>
              {r.glucose_value != null ? (
                <MeasurementCard
                  label="Glucose"
                  value={r.glucose_value}
                  unit={r.glucose_unit ?? undefined}
                  measuredAt={measured(r)}
                  context={r.glucose_test_type?.replace('_', ' ')}
                />
              ) : null}
              {keys.length ? <StatusChipRow statuses={keys} /> : null}
              {r.notes ? <Text style={styles.meta}>{r.notes}</Text> : null}
            </View>
          );
        })}

        <Text style={styles.section} accessibilityRole="header">
          Care plans
        </Text>
        {plans.length === 0 ? <Text style={styles.meta}>No care plans yet.</Text> : null}
        {released.slice(0, 3).map((p) => (
          <View key={p.id} style={styles.result}>
            <StatusChip size="sm" status="clinical.plan_released" />
            <Text style={styles.meta}>Released {formatDateTimeDMY(p.released_at)}</Text>
            <Text style={styles.body}>{p.summary}</Text>
          </View>
        ))}
        {draft ? <Text style={styles.meta}>A draft is open below (saved {formatDateTimeDMY(draft.updated_at)}). Patients don't see it.</Text> : null}
      </Card>

      <Card title={draft ? 'Edit draft care plan' : 'New care plan'} subtitle="Write plain-language next steps for the patient">
        <Notice
          tone="info"
          message="Do not enter a diagnosis label or a risk score. Describe what was reviewed and what the patient should do next."
        />
        <TextField
          label="Summary (required)"
          hint={`${summary.length} / ${SUMMARY_MAX} characters`}
          value={summary}
          onChangeText={setSummary}
          multiline
          maxLength={SUMMARY_MAX}
          placeholder="e.g. Your recent results were reviewed by your clinician."
        />
        <TextField
          label="Next steps (optional)"
          hint={`${nextSteps.length} / ${NEXT_STEPS_MAX} characters`}
          value={nextSteps}
          onChangeText={setNextSteps}
          multiline
          maxLength={NEXT_STEPS_MAX}
          placeholder="e.g. Attend your follow-up at the RHU. Ask your BHW if you need help getting there."
        />
        {disabledReason ? <Notice tone="info" message={disabledReason} /> : null}
        {error ? <Notice tone="error" message={error} /> : null}
        {done ? <Notice tone="success" message={done} /> : null}
        <View style={styles.actions}>
          <Button title="Save draft" variant="secondary" onPress={saveDraft} disabled={!canSubmit || busy === 'release'} loading={busy === 'draft'} style={styles.action} />
          <Button title="Release plan" onPress={() => setConfirming(true)} disabled={!canSubmit || busy === 'draft'} style={styles.action} />
        </View>
        {!input.summary ? <Text style={styles.meta}>Add a summary to save or release.</Text> : null}
      </Card>

      <ConfirmSheet
        visible={confirming}
        title="Release this care plan?"
        message={`${patient.full_name} will see this plan on their Care Plan tab after their next online load. Results awaiting review for this patient will be marked "Plan released". A released plan can't be edited.`}
        confirmLabel="Release plan"
        busy={busy === 'release'}
        onConfirm={release}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  section: { ...text.overline, marginTop: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  result: { gap: spacing.xs, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  resultTitle: text.bodyStrong,
  body: text.body,
  meta: text.caption,
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  action: { flexGrow: 1, flexBasis: 160 },
});
