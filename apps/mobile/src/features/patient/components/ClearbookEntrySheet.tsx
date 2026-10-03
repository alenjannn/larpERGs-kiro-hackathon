import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../../shared/components/Button';
import ChipGroup from '../../../shared/components/ChipGroup';
import Notice from '../../../shared/components/Notice';
import TextField from '../../../shared/components/TextField';
import { useConnectivity } from '../../../shared/context/ConnectivityContext';
import type { GlucoseTestType, GlucoseUnit } from '../../../shared/types/db.types';
import { formatDateDMY } from '../../../shared/utils/date';
import { newId } from '../../../shared/utils/id';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { PATIENT_COPY, PATIENT_COPY_FIL } from '../copy';
import { GLUCOSE_TEST_TYPES, GLUCOSE_UNITS, validateEntry, type ClearbookEntry, type EntryDraft } from '../logic/clearbook';
import { GLUCOSE_TEST_LABELS } from '../logic/measurements';
import { EntryRow } from './ClearbookEntryList';

interface Props {
  visible: boolean;
  /** Live entries, so the saved state follows the share status. */
  entries: ClearbookEntry[];
  save: (draft: EntryDraft, id: string) => Promise<ClearbookEntry>;
  onClose: () => void;
}

type Step = 'form' | 'confirm' | 'saved';
const EMPTY: EntryDraft = { testType: null, value: '', unit: null, testDate: '' };

/**
 * Manual clearbook entry (P-3): form → confirm against the paper → saved.
 * The id is created once per sheet session, so a double tap stores one entry.
 * No interpretation of the value is shown anywhere.
 */
export default function ClearbookEntrySheet({ visible, entries, save, onClose }: Props) {
  const { isOnline } = useConnectivity();
  const draftId = useRef(newId());
  const sheetRef = useRef<View>(null);
  const [draft, setDraft] = useState<EntryDraft>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const check = validateEntry(draft);
  const errors = !check.ok && touched ? check.errors : {};

  const close = () => {
    if (saving) return;
    draftId.current = newId();
    setDraft(EMPTY);
    setTouched(false);
    setStep('form');
    setError(null);
    setSavedId(null);
    onClose();
  };
  const closeRef = useRef(close);
  closeRef.current = close;

  // Web: Escape closes; focus moves into the sheet once when it opens.
  useEffect(() => {
    if (!visible || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    const timer = setTimeout(() => (sheetRef.current as unknown as { focus?: () => void } | null)?.focus?.(), 50);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(timer);
    };
  }, [visible]);

  const set = <K extends keyof EntryDraft>(key: K, value: EntryDraft[K]) => {
    setTouched(true);
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const confirm = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const entry = await save(draft, draftId.current);
      setSavedId(entry.id);
      setStep('saved');
    } catch (e) {
      console.error('Could not save the lab entry:', e);
      setError(e instanceof Error ? e.message : `Could not save on this device: ${String(e)}`);
      setStep('form');
    } finally {
      setSaving(false);
    }
  };

  const saved = savedId ? entries.find((e) => e.id === savedId) ?? null : null;
  const summary =
    draft.testType && draft.unit
      ? `${GLUCOSE_TEST_LABELS[draft.testType]} blood glucose · ${draft.value.trim()} ${draft.unit} · Test date ${formatDateDMY(draft.testDate)}`
      : '';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityRole="button" accessibilityLabel="Close" />
        <View ref={sheetRef} focusable style={styles.sheet} accessibilityViewIsModal aria-modal role="dialog" aria-label={PATIENT_COPY.addLab}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {step === 'saved' ? (
              <>
                <Text style={styles.title} accessibilityRole="header">
                  Saved on this device
                </Text>
                {/* FIL: needs native-speaker review */}
                <Text style={styles.fil}>Naka-save sa device na ito</Text>
                {saved ? <EntryRow entry={saved} isOnline={isOnline} /> : null}
                <Text style={styles.muted}>{PATIENT_COPY.noInterpretation}</Text>
                <Button title="Done" onPress={close} />
              </>
            ) : step === 'confirm' ? (
              <>
                <Text style={styles.title} accessibilityRole="header">
                  {PATIENT_COPY.checkAgainstPaper}
                </Text>
                {/* FIL: needs native-speaker review */}
                <Text style={styles.fil}>Suriin ito laban sa iyong papel</Text>
                <Text style={styles.summary}>{summary}</Text>
                <Text style={styles.muted}>{PATIENT_COPY.noInterpretation}</Text>
                <View style={styles.actions}>
                  <Button title="Go back" variant="secondary" onPress={() => setStep('form')} disabled={saving} style={styles.action} />
                  <Button title="Save" onPress={() => void confirm()} loading={saving} style={styles.action} accessibilityLabel="Save this lab result" />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.title} accessibilityRole="header">
                  {PATIENT_COPY.addLab}
                </Text>
                <Text style={styles.fil}>{PATIENT_COPY_FIL.addLab}</Text>
                <Text style={styles.body}>Blood glucose, from your paper report. All fields are required.</Text>
                <ChipGroup<GlucoseTestType>
                  label="Test type (required)"
                  options={GLUCOSE_TEST_TYPES.map((value) => ({ value, label: GLUCOSE_TEST_LABELS[value] }))}
                  value={draft.testType}
                  onChange={(v) => set('testType', v)}
                />
                {errors.testType ? <Text style={styles.fieldError}>{errors.testType}</Text> : null}
                <TextField
                  label="Value (required)"
                  value={draft.value}
                  onChangeText={(v) => set('value', v)}
                  keyboardType="decimal-pad"
                  placeholder="For example 110"
                />
                {errors.value ? <Text style={styles.fieldError}>{errors.value}</Text> : null}
                <ChipGroup<GlucoseUnit>
                  label="Unit (required)"
                  options={GLUCOSE_UNITS.map((value) => ({ value, label: value }))}
                  value={draft.unit}
                  onChange={(v) => set('unit', v)}
                />
                {errors.unit ? <Text style={styles.fieldError}>{errors.unit}</Text> : null}
                <TextField
                  label="Test date (required, YYYY-MM-DD)"
                  value={draft.testDate}
                  onChangeText={(v) => set('testDate', v)}
                  placeholder="2026-09-27"
                  autoCapitalize="none"
                />
                {errors.testDate ? <Text style={styles.fieldError}>{errors.testDate}</Text> : null}
                <Text style={styles.muted}>{PATIENT_COPY.noInterpretation}</Text>
                {error ? <Notice tone="error" message={error} /> : null}
                <View style={styles.actions}>
                  <Button title="Cancel" variant="secondary" onPress={close} style={styles.action} />
                  <Button
                    title="Save"
                    onPress={() => {
                      setTouched(true);
                      if (check.ok) setStep('confirm');
                    }}
                    disabled={!check.ok}
                    style={styles.action}
                    accessibilityLabel={check.ok ? 'Save, then check against your paper' : 'Save (complete all fields first)'}
                  />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(22, 50, 79, 0.45)' },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '92%',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  content: { padding: spacing.xl, gap: spacing.md },
  title: { fontSize: typography.title, fontWeight: '700', color: colors.text },
  fil: { fontSize: typography.small, color: colors.muted, marginTop: -spacing.sm },
  body: { fontSize: typography.body, color: colors.text },
  summary: { fontSize: typography.body, color: colors.text, fontWeight: '700', lineHeight: typography.lineHeight },
  muted: { fontSize: typography.small, color: colors.muted, lineHeight: 20 },
  fieldError: { fontSize: typography.small, color: colors.error, marginTop: -spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  action: { flexGrow: 1, flexBasis: 140 },
});
