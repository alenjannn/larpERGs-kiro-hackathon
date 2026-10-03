import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../../shared/components/Button';
import ChipGroup from '../../../shared/components/ChipGroup';
import Icon from '../../../shared/components/Icon';
import Notice from '../../../shared/components/Notice';
import { StatusChipRow } from '../../../shared/components/StatusChip';
import TextField from '../../../shared/components/TextField';
import { useConnectivity } from '../../../shared/context/ConnectivityContext';
import {
  DEFERRED_BACKGROUND,
  HELP_REASON_LABELS,
  HELP_REASON_ORDER,
  helpReasonLabel,
  URGENT_CARE_EN,
  URGENT_CARE_FIL,
} from '../../../shared/helpRequests';
import { MESSAGE_MAX_LENGTH } from '../../../shared/services/outboxCore';
import { outbox, type OutboxItem } from '../../../shared/services/outbox';
import { outboxStatusKeys } from '../../../shared/status';
import type { HelpReason } from '../../../shared/types/db.types';
import { newId } from '../../../shared/utils/id';
import { colors, radius, spacing, typography } from '../../../shared/theme';

interface Props {
  visible: boolean;
  patientId: string;
  /** Live outbox items, so the saved state follows the request's status. */
  items: OutboxItem[];
  onClose: () => void;
}

/** Urgent-care guidance: guidance, not an error, so navy on a surface, never red (OC-9). */
export function UrgentCareBox() {
  return (
    <View style={styles.urgent} accessibilityRole="summary">
      <Icon name="info" size={18} color={colors.text} />
      <View style={styles.urgentText}>
        <Text style={styles.urgentEn}>{URGENT_CARE_EN}</Text>
        {/* FIL: needs native-speaker review */}
        <Text style={styles.urgentFil}>{URGENT_CARE_FIL}</Text>
      </View>
    </View>
  );
}

/**
 * "I need help" form. The request id is created once per form session, so a
 * double tap on Submit stores one request (OC-2.4). Confirmation appears only
 * after the request is persisted and read back (OC-2.1).
 */
export default function HelpRequestSheet({ visible, patientId, items, onClose }: Props) {
  const { isOnline } = useConnectivity();
  const draftId = useRef(newId());
  const sheetRef = useRef<View>(null);
  const [reason, setReason] = useState<HelpReason | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<OutboxItem | null>(null);

  const close = () => {
    if (saving) return;
    // Next session gets a new id; the form starts empty.
    draftId.current = newId();
    setReason(null);
    setMessage('');
    setError(null);
    setSaved(null);
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

  const submit = async () => {
    if (!reason || saving) return;
    setSaving(true);
    setError(null);
    try {
      const item = await outbox.enqueue({ id: draftId.current, patient_id: patientId, reason, message: message || null });
      setSaved(item);
    } catch (e) {
      console.error('Could not save the help request:', e);
      setError(`Could not save on this device: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const live = saved ? items.find((i) => i.id === saved.id) ?? saved : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityRole="button" accessibilityLabel="Close" />
        <View ref={sheetRef} focusable style={styles.sheet} accessibilityViewIsModal aria-modal role="dialog" aria-label="Ask for help">
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {live ? (
              <>
                <Text style={styles.title} accessibilityRole="header">
                  Saved on this device
                </Text>
                {/* FIL: needs native-speaker review */}
                <Text style={styles.fil}>Naka-save sa device na ito</Text>
                <StatusChipRow statuses={outboxStatusKeys(live._sync_status, 'help_request')} size="md" />
                <Text style={styles.body}>{helpReasonLabel(live.reason)}</Text>
                {live.message ? <Text style={styles.body}>“{live.message}”</Text> : null}
                {isOnline === false ? (
                  <>
                    <Text style={styles.body}>It will send when you reconnect.</Text>
                    <Text style={styles.muted}>{DEFERRED_BACKGROUND}</Text>
                  </>
                ) : null}
                <Button title="Done" onPress={close} />
              </>
            ) : (
              <>
                <Text style={styles.title} accessibilityRole="header">
                  Ask for help
                </Text>
                {/* FIL: needs native-speaker review */}
                <Text style={styles.fil}>Humingi ng tulong</Text>
                <ChipGroup
                  label="What do you need help with? (required)"
                  options={HELP_REASON_ORDER.map((value) => ({
                    value,
                    label: `${HELP_REASON_LABELS[value].en} / ${HELP_REASON_LABELS[value].fil}`,
                  }))}
                  value={reason}
                  onChange={setReason}
                />
                <TextField
                  label="Message (optional)"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={MESSAGE_MAX_LENGTH}
                  placeholder="For example: I need a ride to the RHU"
                />
                <Text style={styles.counter} accessibilityLabel={`${message.length} of ${MESSAGE_MAX_LENGTH} characters`}>
                  {message.length} / {MESSAGE_MAX_LENGTH}
                </Text>
                <UrgentCareBox />
                {error ? <Notice tone="error" message={error} /> : null}
                <View style={styles.actions}>
                  <Button title="Cancel" variant="secondary" onPress={close} disabled={saving} style={styles.action} />
                  <Button
                    title="Submit"
                    onPress={submit}
                    disabled={!reason}
                    loading={saving}
                    style={styles.action}
                    accessibilityLabel={reason ? 'Submit help request' : 'Submit help request (choose a reason first)'}
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
  muted: { fontSize: typography.small, color: colors.muted, lineHeight: 20 },
  counter: { fontSize: typography.caption, color: colors.muted, alignSelf: 'flex-end', marginTop: -spacing.xs },
  urgent: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.mutedBg,
  },
  urgentText: { flex: 1, gap: spacing.xs },
  urgentEn: { fontSize: typography.small, color: colors.text, lineHeight: 20, fontWeight: '600' },
  urgentFil: { fontSize: typography.small, color: colors.text, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  action: { flexGrow: 1, flexBasis: 140 },
});
