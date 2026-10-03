import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Button from '../../../shared/components/Button';
import ChipGroup from '../../../shared/components/ChipGroup';
import Notice from '../../../shared/components/Notice';
import TextField from '../../../shared/components/TextField';
import { MOCK_FACILITY } from '../../../shared/services/mapbox';
import type { NewLocalRecord } from '../../../shared/services/storage';
import type { NewPatient } from '../../../shared/types/db.types';
import { parseYMD } from '../../../shared/utils/date';
import { newId } from '../../../shared/utils/id';
import { spacing } from '../../../shared/theme';

interface Props {
  bhwId: string;
  barangay: string | null;
  onSave: (item: NewLocalRecord) => Promise<boolean>;
  onDone: () => void;
}

/** Register a patient in the field (offline-first). The id is generated on-device. */
export default function RegisterPatientForm({ bhwId, barangay, onSave, onDone }: Props) {
  const [name, setName] = useState('');
  const [sex, setSex] = useState<'F' | 'M' | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    const fullName = name.trim();
    if (fullName.length < 2) return setError('Enter the patient name (use demo names only).');
    const birth = birthDate.trim() ? parseYMD(birthDate) : null;
    if (birthDate.trim() && (!birth || birth.getTime() > Date.now())) return setError('Birth date must be a past date as YYYY-MM-DD.');

    const id = newId();
    // Demo only: place the household near the facility so it appears on the map.
    const patient: NewPatient = {
      id,
      bhw_id: bhwId,
      full_name: fullName,
      sex,
      birth_date: birthDate.trim() || null,
      barangay,
      address: address.trim() || null,
      latitude: MOCK_FACILITY.latitude + (Math.random() - 0.5) * 0.012,
      longitude: MOCK_FACILITY.longitude + (Math.random() - 0.5) * 0.012,
    };

    setSaving(true);
    setError(null);
    const ok = await onSave({
      id,
      entity: 'patient',
      message: `Registered ${fullName}`,
      payload: patient as unknown as Record<string, unknown>,
    });
    setSaving(false);
    if (ok) onDone();
  }

  return (
    <View style={styles.form}>
      <TextField label="Full name" value={name} onChangeText={setName} placeholder="Demo Patient …" maxLength={80} />
      <ChipGroup
        label="Sex"
        options={[
          { value: 'F', label: 'Female' },
          { value: 'M', label: 'Male' },
        ]}
        value={sex}
        onChange={setSex}
      />
      <View style={styles.row}>
        <TextField label="Birth date (YYYY-MM-DD)" value={birthDate} onChangeText={setBirthDate} placeholder="1980-01-31" maxLength={10} />
        <TextField label="Address / Purok" value={address} onChangeText={setAddress} placeholder="Purok 5 (demo)" maxLength={120} />
      </View>
      {error ? <Notice tone="error" message={error} /> : null}
      <View style={styles.row}>
        <Button title="Cancel" variant="secondary" onPress={onDone} style={styles.flex} />
        <Button title="Register Offline" onPress={submit} loading={saving} style={styles.flex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  flex: { flexGrow: 1, flexBasis: 120 },
});
