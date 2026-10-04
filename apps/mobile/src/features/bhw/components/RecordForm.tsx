import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../../shared/components/Text';
import Button from '../../../shared/components/Button';
import ChipGroup from '../../../shared/components/ChipGroup';
import Notice from '../../../shared/components/Notice';
import TextField from '../../../shared/components/TextField';
import type { NewLocalRecord } from '../../../shared/services/storage';
import type { NewHealthRecord, RecordType } from '../../../shared/types/db.types';
import { parseYMD } from '../../../shared/utils/date';
import { parseOptionalNumber, RECORD_TYPE_LABEL } from '../../../shared/utils/format';
import { newId } from '../../../shared/utils/id';
import { colors, radius, spacing, text } from '../../../shared/theme';
import type { BHWPatient } from '../types/bhw.types';

const DEFAULT_TITLE: Record<RecordType, string> = {
  visit: 'Home visit',
  health_update: 'Health update',
  appointment: 'Follow-up check-up',
};

interface Props {
  patient: BHWPatient;
  bhwId: string;
  onSave: (item: NewLocalRecord) => Promise<boolean>;
  onDone: () => void;
  /** Record types to offer. Visits use the Patient Visit screen (Spec 04), so My Patients passes the others. */
  types?: RecordType[];
}

function inRange(value: number | null, min: number, max: number): boolean {
  return value === null || (!Number.isNaN(value) && value >= min && value <= max);
}

/** Log a visit / health update / appointment. Always saved offline first. */
export default function RecordForm({ patient, bhwId, onSave, onDone, types = Object.keys(RECORD_TYPE_LABEL) as RecordType[] }: Props) {
  const [type, setType] = useState<RecordType>(types[0] ?? 'visit');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [temp, setTemp] = useState('');
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    const sys = parseOptionalNumber(systolic);
    const dia = parseOptionalNumber(diastolic);
    const t = parseOptionalNumber(temp);
    const w = parseOptionalNumber(weight);

    if (type === 'visit') {
      if ((sys === null) !== (dia === null)) return setError('Enter both systolic and diastolic blood pressure, or neither.');
      if (!inRange(sys, 50, 260) || !inRange(dia, 30, 180)) return setError('Blood pressure looks out of range (e.g. 120 / 80).');
      if (!inRange(t, 30, 45)) return setError('Temperature must be between 30 and 45 °C.');
      if (!inRange(w, 1, 400)) return setError('Weight must be between 1 and 400 kg.');
    }

    let scheduledAt: string | null = null;
    if (type === 'appointment') {
      const day = parseYMD(date);
      if (!day) return setError('Enter a valid appointment date as YYYY-MM-DD.');
      day.setHours(9, 0, 0, 0);
      scheduledAt = day.toISOString();
    }

    const id = newId();
    const record: NewHealthRecord = {
      id,
      patient_id: patient.id,
      bhw_id: bhwId,
      record_type: type,
      title: title.trim() || DEFAULT_TITLE[type],
      notes: notes.trim() || null,
      ...(type === 'visit' ? { systolic: sys, diastolic: dia, temperature_c: t, weight_kg: w } : {}),
      ...(type === 'appointment' ? { scheduled_at: scheduledAt, status: 'scheduled' as const } : {}),
    };

    setSaving(true);
    setError(null);
    const ok = await onSave({
      id,
      entity: 'record',
      message: `${record.title} — ${patient.full_name}`,
      payload: record as unknown as Record<string, unknown>,
    });
    setSaving(false);
    if (ok) onDone();
  }

  return (
    <View style={styles.form}>
      <Text style={styles.heading}>New record for {patient.full_name}</Text>
      <ChipGroup
        options={types.map((v) => ({ value: v, label: RECORD_TYPE_LABEL[v] }))}
        value={type}
        onChange={(v) => {
          setType(v);
          setError(null);
        }}
      />
      <TextField label="Title" value={title} onChangeText={setTitle} placeholder={DEFAULT_TITLE[type]} maxLength={120} />
      {type === 'visit' ? (
        <View style={styles.row}>
          <TextField label="Systolic" value={systolic} onChangeText={setSystolic} keyboardType="number-pad" placeholder="120" maxLength={3} />
          <TextField label="Diastolic" value={diastolic} onChangeText={setDiastolic} keyboardType="number-pad" placeholder="80" maxLength={3} />
          <TextField label="Temp °C" value={temp} onChangeText={setTemp} keyboardType="decimal-pad" placeholder="36.5" maxLength={4} />
          <TextField label="Weight kg" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="60" maxLength={5} />
        </View>
      ) : null}
      {type === 'appointment' ? (
        <TextField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-10-15" maxLength={10} />
      ) : null}
      <TextField label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Demo notes only — no real patient data" maxLength={500} />
      {error ? <Notice tone="error" message={error} /> : null}
      <View style={styles.row}>
        <Button title="Cancel" variant="secondary" onPress={onDone} style={styles.flex} />
        <Button title="Save on this device" onPress={submit} loading={saving} style={styles.flex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.mutedBg },
  heading: text.label,
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  flex: { flexGrow: 1, flexBasis: 120 },
});
