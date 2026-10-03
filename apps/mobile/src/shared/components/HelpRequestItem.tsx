import { StyleSheet, Text, View } from 'react-native';
import Button from './Button';
import { StatusChipRow } from './StatusChip';
import { helpReasonLabel } from '../helpRequests';
import type { StatusKey } from '../status';
import { formatDateTimeDMY } from '../utils/date';
import { colors, spacing, typography } from '../theme';

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
  return (
    <View style={styles.item}>
      {patientName ? <Text style={styles.patient}>{patientName}</Text> : null}
      <Text style={styles.reason}>{helpReasonLabel(reason)}</Text>
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
  item: { gap: spacing.xs, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  patient: { fontSize: typography.body, fontWeight: '700', color: colors.text },
  reason: { fontSize: typography.body, fontWeight: '600', color: colors.text },
  message: { fontSize: typography.body, color: colors.text },
  time: { fontSize: typography.small, color: colors.muted },
  detail: { fontSize: typography.small, color: colors.muted },
  note: { fontSize: typography.small, color: colors.text, lineHeight: 20 },
  action: { alignSelf: 'flex-start' },
});
