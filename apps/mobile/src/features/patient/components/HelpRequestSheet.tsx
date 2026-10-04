import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../../shared/components/Text';
import Button from '../../../shared/components/Button';
import ChipGroup from '../../../shared/components/ChipGroup';
import Icon from '../../../shared/components/Icon';
import Notice from '../../../shared/components/Notice';
import Sheet, { SheetActions, sheetActionStyle } from '../../../shared/components/Sheet';
import { StatusChipRow } from '../../../shared/components/StatusChip';
import TextField from '../../../shared/components/TextField';
import { useConnectivity } from '../../../shared/context/ConnectivityContext';
import { useLanguage } from '../../../shared/context/DemoRoleContext';
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
import { colors, radius, spacing, text } from '../../../shared/theme';

interface Props {
  visible: boolean;
  patientId: string;
  /** Live outbox items, so the saved state follows the request's status. */
  items: OutboxItem[];
  onClose: () => void;
  /** Preselected reason, applied when the sheet opens with an empty form (Spec 03, "I need another date"). */
  initialReason?: HelpReason | null;
  /** Prefilled, editable message, applied with initialReason. */
  initialMessage?: string;
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
export default function HelpRequestSheet({ visible, patientId, items, onClose, initialReason, initialMessage }: Props) {
  const { isOnline } = useConnectivity();
  const lang = useLanguage();
  const draftId = useRef(newId());
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

  // Presets apply once per opening, only to an empty form.
  useEffect(() => {
    if (!visible) return;
    if (initialReason) setReason((r) => r ?? initialReason);
    if (initialMessage) setMessage((m) => (m ? m : initialMessage.slice(0, MESSAGE_MAX_LENGTH)));
  }, [visible]); // presets are read at open time only

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
    <Sheet
      visible={visible}
      onClose={close}
      label={live ? 'Saved on this device' : 'Ask for help'}
      // FIL: needs native-speaker review
      subtitle={live ? 'Naka-save sa device na ito' : 'Humingi ng tulong'}
    >
      {live ? (
        <>
          <StatusChipRow statuses={outboxStatusKeys(live._sync_status, 'help_request')} size="md" />
          <Text style={styles.reason}>{helpReasonLabel(live.reason, lang)}</Text>
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
          <ChipGroup
            label="What do you need help with? (required)"
            options={HELP_REASON_ORDER.map((value) => ({
              value,
              label: `${HELP_REASON_LABELS[value].en} / ${HELP_REASON_LABELS[value].fil}`,
            }))}
            value={reason}
            onChange={setReason}
          />
          <View>
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
          </View>
          <UrgentCareBox />
          {error ? <Notice tone="error" message={error} /> : null}
          <SheetActions>
            <Button title="Cancel" variant="secondary" onPress={close} disabled={saving} style={sheetActionStyle} />
            <Button
              title="Send request"
              onPress={submit}
              disabled={!reason}
              loading={saving}
              style={sheetActionStyle}
              accessibilityLabel={reason ? 'Submit help request' : 'Submit help request (choose a reason first)'}
            />
          </SheetActions>
          {!reason ? <Text style={styles.hint}>Choose what you need help with to send the request.</Text> : null}
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  reason: text.bodyStrong,
  body: text.body,
  muted: text.muted,
  hint: { ...text.caption, textAlign: 'center' },
  counter: { ...text.caption, alignSelf: 'flex-end', marginTop: spacing.xs },
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
  urgentEn: { ...text.body, fontWeight: '600' },
  urgentFil: text.body,
});
