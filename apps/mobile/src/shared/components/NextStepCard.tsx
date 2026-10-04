import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from './Button';
import Icon from './Icon';
import StatusChip from './StatusChip';
import type { StatusKey } from '../status';
import { formatDateDMY, formatDateTimeDMY } from '../utils/date';
import { colors, radius, shadow, spacing, text } from '../theme';

interface Props {
  /** The action, in plain words: "Go to your follow-up BP check". */
  action: string;
  /** Clinic or person responsible. */
  responsible?: string;
  date?: string | null;
  /** Says what the date is. 'appointment' shows the time too. */
  dateKind?: 'appointment' | 'due';
  status: StatusKey;
  onHelp: () => void;
  helpLabel?: string;
  /** Extra actions (e.g. "I already attended"). */
  children?: ReactNode;
}

/** The patient's next care step: action first, then who, when, status and a help button. */
export default function NextStepCard({ action, responsible, date, dateKind = 'appointment', status, onHelp, helpLabel = 'I need help', children }: Props) {
  const dateText = date
    ? dateKind === 'appointment'
      ? `Appointment ${formatDateTimeDMY(date)}`
      : `Due ${formatDateDMY(date)}`
    : 'Date not set yet';
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>Next step</Text>
      <Text style={styles.action} accessibilityRole="header">
        {action}
      </Text>
      {responsible ? (
        <View style={styles.metaRow}>
          <Icon name="clinic" size={14} color={colors.muted} />
          <Text style={styles.meta}>{responsible}</Text>
        </View>
      ) : null}
      <View style={styles.metaRow}>
        <Icon name="calendar" size={14} color={colors.muted} />
        <Text style={styles.meta}>{dateText}</Text>
      </View>
      <StatusChip status={status} />
      <View style={styles.actions}>
        {children}
        <Button title={helpLabel} variant="secondary" onPress={onHelp} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 4,
    borderTopColor: colors.primary,
    padding: spacing.lg + 2,
    gap: spacing.sm + 2,
    ...shadow.raised,
  },
  kicker: { ...text.overline, color: colors.primary },
  action: { ...text.heading, fontSize: 22, lineHeight: 28 },
  // Full width on phones; a readable column on wide screens.
  actions: { gap: spacing.sm + 2, width: '100%', maxWidth: 420, marginTop: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  meta: { ...text.body, color: colors.muted, flexShrink: 1 },
});
