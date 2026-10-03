import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Button from '../../../shared/components/Button';
import Notice from '../../../shared/components/Notice';
import TextField from '../../../shared/components/TextField';
import { spacing } from '../../../shared/theme';
import type { NewBHWForm } from '../hooks/useBHWManagement';

const EMPTY: NewBHWForm = { full_name: '', barangay: '', email: '', phone: '' };

export default function CreateBHWForm({ onSubmit, loading }: { onSubmit: (form: NewBHWForm) => Promise<boolean>; loading: boolean }) {
  const [form, setForm] = useState<NewBHWForm>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof NewBHWForm) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function submit() {
    if (form.full_name.trim().length < 2) return setError('Enter the BHW name (demo names only).');
    if (form.barangay.trim().length < 2) return setError('Enter the assigned barangay.');
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('Email looks invalid.');
    setError(null);
    if (await onSubmit(form)) setForm(EMPTY);
  }

  return (
    <View style={styles.form}>
      <View style={styles.row}>
        <TextField label="Full name" value={form.full_name} onChangeText={set('full_name')} placeholder="Demo BHW …" maxLength={80} />
        <TextField label="Barangay" value={form.barangay} onChangeText={set('barangay')} placeholder="Brgy. Demo …" maxLength={80} />
      </View>
      <View style={styles.row}>
        <TextField
          label="Email (optional)"
          value={form.email}
          onChangeText={set('email')}
          placeholder="name@tuloy.test"
          keyboardType="email-address"
          autoCapitalize="none"
          maxLength={120}
        />
        <TextField label="Phone (optional)" value={form.phone} onChangeText={set('phone')} placeholder="0900-000-0000" keyboardType="phone-pad" maxLength={20} />
      </View>
      {error ? <Notice tone="error" message={error} /> : null}
      <Button title="Create BHW Account" onPress={submit} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
