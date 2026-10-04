import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Button from '../../../shared/components/Button';
import ChipGroup from '../../../shared/components/ChipGroup';
import Notice from '../../../shared/components/Notice';
import Sheet, { SheetActions, sheetActionStyle } from '../../../shared/components/Sheet';
import type { BHW } from '../../../shared/types/db.types';
import { text } from '../../../shared/theme';

export interface AssignTarget {
  kind: 'patient' | 'help_request';
  id: string;
  /** e.g. "Ernesto Villar (DEMO)" or "Document help · Ernesto Villar (DEMO)". */
  label: string;
  currentOwnerId: string | null;
  /** Extra consequence shown before confirming, e.g. the open tasks that move too. */
  note?: string;
}

interface Props {
  target: AssignTarget | null;
  /** Owners that can take new work (active, not inactive > 3 days). */
  bhws: BHW[];
  allBhws: BHW[];
  busy: boolean;
  error: string | null;
  disabledReason?: string | null;
  onAssign: (target: AssignTarget, bhw: BHW) => void;
  onClose: () => void;
}

/** Bottom sheet to pick the owner of a patient or help request. */
export default function AssignSheet({ target, bhws, allBhws, busy, error, disabledReason, onAssign, onClose }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setSelected(null);
  }, [target?.id]);

  if (!target) return null;
  const current = target.currentOwnerId ? allBhws.find((b) => b.id === target.currentOwnerId) : null;
  const options = bhws.filter((b) => b.id !== target.currentOwnerId).map((b) => ({ value: b.id, label: `${b.full_name} · ${b.barangay}` }));
  const chosen = bhws.find((b) => b.id === selected) ?? null;
  const title = `${current ? 'Reassign' : 'Assign'} ${target.kind === 'patient' ? 'patient' : 'help request'}`;
  const close = () => {
    if (!busy) onClose();
  };

  return (
    <Sheet visible onClose={close} label={title}>
      <Text style={styles.body}>{target.label}</Text>
      <Text style={styles.meta}>Current owner: {current ? current.full_name : target.currentOwnerId ? 'unknown BHW' : 'none (unassigned)'}</Text>
      {options.length ? (
        <ChipGroup label="New owner" options={options} value={selected} onChange={setSelected} />
      ) : (
        <Notice tone="warning" message="No other active BHW is available. Create or activate a BHW on the BHWs tab." />
      )}
      {target.note ? <Text style={styles.meta}>{target.note}</Text> : null}
      {target.kind === 'help_request' ? (
        <Text style={styles.meta}>The new owner sees it as Assigned and acknowledges it on their Today list.</Text>
      ) : null}
      {disabledReason ? <Notice tone="info" message={disabledReason} /> : null}
      {error ? <Notice tone="error" message={error} /> : null}
      <SheetActions>
        <Button title="Cancel" variant="secondary" onPress={close} disabled={busy} style={sheetActionStyle} />
        <Button
          title={chosen ? `Assign to ${chosen.full_name}` : 'Choose a BHW'}
          onPress={() => chosen && onAssign(target, chosen)}
          disabled={!chosen || !!disabledReason}
          loading={busy}
          style={sheetActionStyle}
        />
      </SheetActions>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: text.bodyStrong,
  meta: text.muted,
});
