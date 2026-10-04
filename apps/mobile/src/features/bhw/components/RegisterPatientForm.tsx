import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../../shared/components/Text';
import Button from '../../../shared/components/Button';
import ChipGroup from '../../../shared/components/ChipGroup';
import Notice from '../../../shared/components/Notice';
import TextField from '../../../shared/components/TextField';
import { MOCK_FACILITY } from '../../../shared/services/mapbox';
import type { NewLocalRecord } from '../../../shared/services/storage';
import { parseYMD } from '../../../shared/utils/date';
import { newId } from '../../../shared/utils/id';
import { spacing, text } from '../../../shared/theme';
import type { NewFieldPatient } from '../types/bhw.types';

interface Props {
  bhwId: string;
  barangay: string | null;
  onSave: (item: NewLocalRecord) => Promise<boolean>;
  /** Called after a successful local save with the patient's name. */
  onSaved: (fullName: string) => void;
  onCancel: () => void;
}

type Smartphone = 'yes' | 'no' | 'not_asked';

/**
 * Assisted/manual registration (B-2). Offline-first: the id is generated on the
 * device and the patient is saved locally before anything is confirmed.
 */
export default function RegisterPatientForm({ bhwId, barangay, onSave, onSaved, onCancel }: Props) {
  const [name, setName] = useState('');
  const [sex, setSex] = useState<'F' | 'M' | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [smartphone, setSmartphone] = useState<Smartphone>('not_asked');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    const fullName = name.trim();
    if (fullName.length < 2) return setError('Enter the patient name (use demo names only).');
    const birth = birthDate.trim() ? parseYMD(birthDate) : null;
    if (birthDate.trim() && (!birth || birth.getTime() > Date.now())) return setError('Birth date must be a past date as YYYY-MM-DD.');
    const phoneText = phone.trim();
    if (phoneText && !/^[0-9+\-\s()]{7,20}$/.test(phoneText)) return setError('Phone can only contain digits, spaces, +, - and brackets.');

    const id = newId();
    // Demo only: place the household near the facility so it appears on the map.
    const patient: NewFieldPatient = {
      id,
      bhw_id: bhwId,
      full_name: fullName,
      sex,
      birth_date: birthDate.trim() || null,
      barangay,
      address: address.trim() ? `${address.trim()} · approximate DEMO location` : 'Approximate DEMO location',
      latitude: MOCK_FACILITY.latitude + (Math.random() - 0.5) * 0.012,
      longitude: MOCK_FACILITY.longitude + (Math.random() - 0.5) * 0.012,
      phone: phoneText || null,
      has_smartphone: smartphone === 'yes' ? true : smartphone === 'no' ? false : null,
      created_on_device_at: new Date().toISOString(),
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
    if (ok) onSaved(fullName);
  }

  return (
    <View style={styles.form}>
      <TextField label="Full name (required)" value={name} onChangeText={setName} placeholder="Demo Patient …" maxLength={80} />
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
        <TextField label="Birth date (optional)" hint="YYYY-MM-DD" value={birthDate} onChangeText={setBirthDate} placeholder="1980-01-31" maxLength={10} />
        <TextField label="Address / Purok" value={address} onChangeText={setAddress} placeholder="Purok 5 (demo)" maxLength={120} />
      </View>
      <ChipGroup<Smartphone>
        label="Has a smartphone?"
        options={[
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No (assisted)' },
          { value: 'not_asked', label: 'Not asked' },
        ]}
        value={smartphone}
        onChange={setSmartphone}
      />
      {smartphone === 'no' ? (
        <Text style={styles.hint}>You will record visits for this patient. They do not need the app.</Text>
      ) : null}
      <TextField
        label="Phone (optional)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="0900-000-0000 (demo)"
        maxLength={20}
      />
      {error ? <Notice tone="error" message={error} /> : null}
      <View style={styles.row}>
        <Button title="Cancel" variant="secondary" onPress={onCancel} style={styles.flex} />
        <Button title="Save on this device" onPress={submit} loading={saving} style={styles.flex} accessibilityLabel="Save the new patient on this device" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  flex: { flexGrow: 1, flexBasis: 120 },
  hint: text.caption,
});
