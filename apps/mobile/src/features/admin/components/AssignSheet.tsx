import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../../../shared/components/Button';
import ChipGroup from '../../../shared/components/ChipGroup';
import Notice from '../../../shared/components/Notice';
import type { BHW } from '../../../shared/types/db.types';
import { colors, radius, spacing, typography } from '../../../shared/theme';

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
  const sheetRef = useRef<View>(null);
  const visible = target !== null;

  useEffect(() => {
    setSelected(null);
  }, [target?.id]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    const timer = setTimeout(() => (sheetRef.current as unknown as { focus?: () => void } | null)?.focus?.(), 50);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(timer);
    };
  }, [visible, busy, onClose]);

  if (!target) return null;
  const current = target.currentOwnerId ? allBhws.find((b) => b.id === target.currentOwnerId) : null;
  const options = bhws.filter((b) => b.id !== target.currentOwnerId).map((b) => ({ value: b.id, label: `${b.full_name} · ${b.barangay}` }));
  const chosen = bhws.find((b) => b.id === selected) ?? null;
  const title = `${current ? 'Reassign' : 'Assign'} ${target.kind === 'patient' ? 'patient' : 'help request'}`;
  const close = () => {
    if (!busy) onClose();
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={close}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityRole="button" accessibilityLabel="Cancel" />
        <View ref={sheetRef} focusable style={styles.sheet} accessibilityViewIsModal aria-modal role="dialog" aria-label={title}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
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
          <View style={styles.actions}>
            <Button title="Cancel" variant="secondary" onPress={close} disabled={busy} style={styles.action} />
            <Button
              title={chosen ? `Assign to ${chosen.full_name}` : 'Choose a BHW'}
              onPress={() => chosen && onAssign(target, chosen)}
              disabled={!chosen || !!disabledReason}
              loading={busy}
              style={styles.action}
            />
          </View>
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
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: { fontSize: typography.title, fontWeight: '700', color: colors.text },
  body: { fontSize: typography.body, color: colors.text, fontWeight: '600' },
  meta: { fontSize: typography.small, color: colors.muted, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  action: { flexGrow: 1, flexBasis: 140 },
});
