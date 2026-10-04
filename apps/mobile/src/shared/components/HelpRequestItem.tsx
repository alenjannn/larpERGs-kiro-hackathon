import { StyleSheet, Text, View } from 'react-native';
import Button from './Button';
import { StatusChipRow } from './StatusChip';
import { useLanguage } from '../context/DemoRoleContext';
import { helpReasonLabel } from '../helpRequests';
import type { StatusKey } from '../status';
import { formatDateTimeDMY } from '../utils/date';
import { colors, radius, spacing, text } from '../theme';

interface Props {
  reason: string;
  message: string | null;
  /** Staff views show who asked. */
  patientName?: string | null;
  createdAt: string;
  /** "Created on this device" (patient) or "Created on device" (staff). */
  createdLabel: string;
  /** Server receipt time; shown as its own line. */
  receivedAt?: string | null;
  statuses: StatusKey[];
  /** Muted detail, e.g. the last send error. */
  detail?: string | null;
  /** Explanatory note, e.g. the conflict explanation. */
  note?: string | null;
  /** Extra line such as "Waiting 2 hours". */
  meta?: string | null;
  action?: { label: string; onPress: () => void; accessibilityLabel?: string };
}

/**
 * One help request, shared by Patient (My requests), BHW (Today) and Admin.
 * The created-on-device and received times are separate lines (brief §5),
 * and status is always icon + text chips.
 */
export default function HelpRequestItem({
  reason,
  message,
  patientName,
  createdAt,
  createdLabel,
  receivedAt,
  statuses,
  detail,
  note,
  meta,
  action,
}: Props) {
  const lang = useLanguage();
  return (
    <View style={styles.item}>
      {patientName ? <Text style={styles.patient}>{patientName}</Text> : null}
      <Text style={patientName ? styles.reason : styles.patient}>{helpReasonLabel(reason, lang)}</Text>
      {message ? <Text style={styles.message}>“{message}”</Text> : null}
      <Text style={styles.time}>
        {createdLabel} {formatDateTimeDMY(createdAt)}
      </Text>
      {receivedAt ? <Text style={styles.time}>Received {formatDateTimeDMY(receivedAt)}</Text> : null}
      {meta ? <Text style={styles.time}>{meta}</Text> : null}
      <StatusChipRow statuses={statuses} />
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      {note ? <Text style={styles.note}>{note}</Text> : null}
      {action ? (
        <Button title={action.label} variant="secondary" onPress={action.onPress} accessibilityLabel={action.accessibilityLabel} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { gap: spacing.xs, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  patient: { ...text.bodyStrong, fontWeight: '700' },
  reason: text.bodyStrong,
  message: {
    ...text.body,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
    paddingLeft: spacing.sm,
    marginVertical: 2,
  },
  time: text.caption,
  detail: { ...text.caption, color: colors.error },
  note: { ...text.small, backgroundColor: colors.mutedBg, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, marginTop: 2 },
  action: { alignSelf: 'flex-start', marginTop: spacing.xs },
});
