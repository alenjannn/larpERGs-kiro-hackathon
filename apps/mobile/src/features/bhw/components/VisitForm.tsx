import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../../shared/components/Text';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import ChipGroup from '../../../shared/components/ChipGroup';
import Notice from '../../../shared/components/Notice';
import TextField from '../../../shared/components/TextField';
import { spacing, text } from '../../../shared/theme';
import {
  BARRIER_LABELS,
  BARRIER_ORDER,
  bilingual,
  CONTACT_OUTCOME_LABELS,
  CONTACT_OUTCOME_ORDER,
  GLUCOSE_TEST_LABELS,
  type Barrier,
  type GlucoseTestOption,
  type GlucoseUnitOption,
} from '../visitOptions';
import { EMPTY_VISIT, type VisitInput } from '../visitPayload';

interface Props {
  patientName: string;
  saving: boolean;
  error: string | null;
  onSubmit: (input: VisitInput) => void;
  onCancel: () => void;
}

/**
 * Patient Visit (B-3): measurements, contact outcome, barrier and next action in
 * one save. Every field is optional; blank stays blank (null), never 0.
 */
export default function VisitForm({ patientName, saving, error, onSubmit, onCancel }: Props) {
  const [v, setV] = useState<VisitInput>(EMPTY_VISIT);
  const set = <K extends keyof VisitInput>(key: K) => (value: VisitInput[K]) => setV((s) => ({ ...s, [key]: value }));

  return (
    <View style={styles.form}>
      <Card title="Measurements" subtitle="Leave blank if not measured. Blank is saved as “No reading”, not 0.">
        <View style={styles.row}>
          <TextField label="Systolic (mmHg)" value={v.systolic} onChangeText={set('systolic')} keyboardType="number-pad" placeholder="120" maxLength={3} />
          <TextField label="Diastolic (mmHg)" value={v.diastolic} onChangeText={set('diastolic')} keyboardType="number-pad" placeholder="80" maxLength={3} />
        </View>
        <View style={styles.row}>
          <TextField label="Glucose" value={v.glucose} onChangeText={set('glucose')} keyboardType="decimal-pad" placeholder="100" maxLength={5} />
        </View>
        <ChipGroup<GlucoseUnitOption>
          label="Glucose unit"
          options={[
            { value: 'mg/dL', label: 'mg/dL' },
            { value: 'mmol/L', label: 'mmol/L' },
          ]}
          value={v.glucoseUnit}
          onChange={set('glucoseUnit')}
        />
        <ChipGroup<GlucoseTestOption>
          label="Glucose test type"
          options={(Object.keys(GLUCOSE_TEST_LABELS) as GlucoseTestOption[]).map((k) => ({ value: k, label: GLUCOSE_TEST_LABELS[k] }))}
          value={v.glucoseTest}
          onChange={set('glucoseTest')}
        />
        <View style={styles.row}>
          <TextField label="Weight (kg)" value={v.weight} onChangeText={set('weight')} keyboardType="decimal-pad" placeholder="60" maxLength={5} />
          <TextField label="Height (cm)" value={v.height} onChangeText={set('height')} keyboardType="decimal-pad" placeholder="155" maxLength={5} />
          <TextField label="Temperature (°C)" value={v.temperature} onChangeText={set('temperature')} keyboardType="decimal-pad" placeholder="36.5" maxLength={4} />
        </View>
        <Text style={styles.hint}>Measurements are recorded for the care team. They are not a diagnosis.</Text>
      </Card>

      <Card title="Contact outcome" subtitle="What happened on this visit">
        <ChipGroup
          options={CONTACT_OUTCOME_ORDER.map((k) => ({ value: k, label: bilingual(CONTACT_OUTCOME_LABELS[k]) }))}
          value={v.outcome}
          onChange={set('outcome')}
        />
        <Text style={styles.hint}>“Could not reach” only means no contact this time. It says nothing about the patient’s care.</Text>
      </Card>

      <Card title="Barrier" subtitle="Anything stopping the next care step">
        <ChipGroup<Barrier | 'none'>
          options={[
            { value: 'none', label: 'No barrier' },
            ...BARRIER_ORDER.map((k) => ({ value: k, label: bilingual(BARRIER_LABELS[k]) })),
          ]}
          value={v.barrier}
          onChange={set('barrier')}
        />
      </Card>

      <Card title="Next action">
        <TextField
          label="Next action"
          value={v.nextAction}
          onChangeText={set('nextAction')}
          placeholder="e.g. Arrange transport to the RHU"
          maxLength={160}
        />
        <TextField
          label="Notes"
          value={v.notes}
          onChangeText={set('notes')}
          multiline
          placeholder="Demo notes only. No real patient data."
          maxLength={500}
        />
      </Card>

      {error ? <Notice tone="error" message={error} /> : null}
      <View style={styles.row}>
        <Button title="Cancel" variant="secondary" onPress={onCancel} style={styles.flex} accessibilityLabel="Cancel this visit" />
        <Button
          title="Save visit on this device"
          onPress={() => onSubmit(v)}
          loading={saving}
          style={styles.flex}
          accessibilityLabel={`Save visit for ${patientName} on this device`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  flex: { flexGrow: 1, flexBasis: 160 },
  hint: text.caption,
});
