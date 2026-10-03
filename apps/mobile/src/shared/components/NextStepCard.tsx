import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from './Button';
import StatusChip from './StatusChip';
import type { StatusKey } from '../status';
import { formatDateDMY, formatDateTimeDMY } from '../utils/date';
import { colors, radius, spacing, typography } from '../theme';

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
      {responsible ? <Text style={styles.meta}>{responsible}</Text> : null}
      <Text style={styles.meta}>{dateText}</Text>
      <StatusChip status={status} />
      {children}
      <Button title={helpLabel} variant="secondary" onPress={onHelp} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 6,
    borderLeftColor: colors.primary,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  kicker: { fontSize: typography.caption, color: colors.primary, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  action: { fontSize: typography.title, color: colors.text, fontWeight: '700' },
  meta: { fontSize: typography.body, color: colors.muted },
});
