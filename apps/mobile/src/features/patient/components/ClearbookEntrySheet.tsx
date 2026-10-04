import { useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Text from '../../../shared/components/Text';
import Button from '../../../shared/components/Button';
import ChipGroup from '../../../shared/components/ChipGroup';
import Notice from '../../../shared/components/Notice';
import Sheet, { SheetActions, sheetActionStyle } from '../../../shared/components/Sheet';
import TextField from '../../../shared/components/TextField';
import { useConnectivity } from '../../../shared/context/ConnectivityContext';
import type { GlucoseTestType } from '../../../shared/types/db.types';
import { formatDateDMY } from '../../../shared/utils/date';
import { newId } from '../../../shared/utils/id';
import { text } from '../../../shared/theme';
import { PATIENT_COPY, PATIENT_COPY_FIL } from '../copy';
import {
  EMPTY_DRAFT,
  GLUCOSE_TEST_TYPES,
  LAB_KINDS,
  LAB_LABELS,
  LAB_UNITS,
  labPlaceholder,
  validateEntry,
  type ClearbookEntry,
  type EntryDraft,
  type LabKind,
  type LabUnit,
} from '../logic/clearbook';
import { GLUCOSE_TEST_LABELS } from '../logic/measurements';
import { EntryRow } from './ClearbookEntryList';

/** Confirm-step line, e.g. "Fasting blood glucose · 110 mg/dL · Test date 27 Sep 2026". */
function draftSummary(d: EntryDraft): string {
  if (!d.lab || !d.unit) return '';
  const name = d.lab === 'glucose' && d.testType ? `${GLUCOSE_TEST_LABELS[d.testType]} blood glucose` : LAB_LABELS[d.lab];
  return `${name} · ${d.value.trim()} ${d.unit} · Test date ${formatDateDMY(d.testDate)}`;
}

interface Props {
  visible: boolean;
  /** Live entries, so the saved state follows the share status. */
  entries: ClearbookEntry[];
  save: (draft: EntryDraft, id: string) => Promise<ClearbookEntry>;
  onClose: () => void;
}

type Step = 'form' | 'confirm' | 'saved';
const EMPTY: EntryDraft = EMPTY_DRAFT;

/**
 * Manual clearbook entry (P-3): form → confirm against the paper → saved.
 * The id is created once per sheet session, so a double tap stores one entry.
 * No interpretation of the value is shown anywhere.
 */
export default function ClearbookEntrySheet({ visible, entries, save, onClose }: Props) {
  const { isOnline } = useConnectivity();
  const draftId = useRef(newId());
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

  const set = <K extends keyof EntryDraft>(key: K, value: EntryDraft[K]) => {
    setTouched(true);
    setDraft((d) => ({ ...d, [key]: value }));
  };

  // A different test clears unit and glucose test type, so a unit is never carried over by mistake.
  const setLab = (lab: LabKind) => {
    setTouched(true);
    setDraft((d) => (d.lab === lab ? d : { ...d, lab, unit: null, testType: null }));
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
  const summary = draftSummary(draft);

  // FIL: needs native-speaker review
  const heading =
    step === 'saved'
      ? { en: 'Saved on this device', fil: 'Naka-save sa device na ito' }
      : step === 'confirm'
        ? { en: PATIENT_COPY.checkAgainstPaper, fil: 'Suriin ito laban sa iyong papel' }
        : { en: PATIENT_COPY.addLab, fil: PATIENT_COPY_FIL.addLab };

  return (
    <Sheet visible={visible} onClose={close} label={heading.en} subtitle={heading.fil}>
      {step === 'saved' ? (
        <>
          {saved ? <EntryRow entry={saved} isOnline={isOnline} /> : null}
          <Text style={styles.muted}>{PATIENT_COPY.noInterpretation}</Text>
          <Button title="Done" onPress={close} />
        </>
      ) : step === 'confirm' ? (
        <>
          <Text style={styles.summary}>{summary}</Text>
          <Text style={styles.muted}>{PATIENT_COPY.noInterpretation}</Text>
          <SheetActions>
            <Button title="Go back" variant="secondary" onPress={() => setStep('form')} disabled={saving} style={sheetActionStyle} />
            <Button title="Save" onPress={() => void confirm()} loading={saving} style={sheetActionStyle} accessibilityLabel="Save this lab result" />
          </SheetActions>
        </>
      ) : (
        <>
          <Text style={styles.body}>{PATIENT_COPY.labEntryIntro}</Text>
          <ChipGroup<LabKind>
            label={PATIENT_COPY.labTestLabel}
            options={LAB_KINDS.map((value) => ({ value, label: LAB_LABELS[value] }))}
            value={draft.lab}
            onChange={setLab}
            error={errors.lab}
          />
          {draft.lab === 'glucose' ? (
            <ChipGroup<GlucoseTestType>
              label={PATIENT_COPY.glucoseTestTypeLabel}
              options={GLUCOSE_TEST_TYPES.map((value) => ({ value, label: GLUCOSE_TEST_LABELS[value] }))}
              value={draft.testType}
              onChange={(v) => set('testType', v)}
              error={errors.testType}
            />
          ) : null}
          <TextField
            label="Value (required)"
            value={draft.value}
            onChangeText={(v) => set('value', v)}
            keyboardType="decimal-pad"
            placeholder={labPlaceholder(draft.lab)}
            error={errors.value}
          />
          {draft.lab ? (
            <ChipGroup<LabUnit>
              label="Unit (required)"
              options={LAB_UNITS[draft.lab].map((value) => ({ value, label: value }))}
              value={draft.unit}
              onChange={(v) => set('unit', v)}
              error={errors.unit}
            />
          ) : (
            <Text style={styles.muted}>Unit (required): choose the test first.</Text>
          )}
          <TextField
            label="Test date (required)"
            hint="Format: YYYY-MM-DD, for example 2026-09-27"
            value={draft.testDate}
            onChangeText={(v) => set('testDate', v)}
            placeholder="2026-09-27"
            autoCapitalize="none"
            error={errors.testDate}
          />
          <Text style={styles.muted}>{PATIENT_COPY.noInterpretation}</Text>
          {error ? <Notice tone="error" message={error} /> : null}
          <SheetActions>
            <Button title="Cancel" variant="secondary" onPress={close} style={sheetActionStyle} />
            <Button
              title="Continue"
              onPress={() => {
                setTouched(true);
                if (check.ok) setStep('confirm');
              }}
              disabled={!check.ok}
              style={sheetActionStyle}
              accessibilityLabel={check.ok ? 'Continue, then check against your paper' : 'Continue (complete all fields first)'}
            />
          </SheetActions>
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: text.body,
  summary: text.bodyStrong,
  muted: text.muted,
});
