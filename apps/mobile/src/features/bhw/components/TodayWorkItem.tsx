import { StyleSheet, Text, View } from 'react-native';
import Button from '../../../shared/components/Button';
import { StatusChipRow } from '../../../shared/components/StatusChip';
import { colors, spacing, typography } from '../../../shared/theme';
import type { TodayItem } from '../today';

/** One Today work item: patient, what it is, one next action, due date when one applies. */
export default function TodayWorkItem({ item, onLogVisit }: { item: TodayItem; onLogVisit: (patientId: string) => void }) {
  return (
    <View style={styles.item}>
      <Text style={styles.patient}>{item.patientName}</Text>
      <Text style={styles.title}>{item.title}</Text>
      {item.dueLabel ? <Text style={[styles.due, item.overdue && styles.overdue]}>{item.dueLabel}</Text> : null}
      {item.statuses.length ? <StatusChipRow statuses={item.statuses} /> : null}
      <Text style={styles.next}>
        <Text style={styles.nextLabel}>Next: </Text>
        {item.nextAction}
      </Text>
      {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
      <Button
        title="Log visit"
        variant="secondary"
        onPress={() => onLogVisit(item.patientId)}
        accessibilityLabel={`Log a visit for ${item.patientName}`}
        style={styles.action}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  item: { gap: spacing.xs, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  patient: { fontSize: typography.body, fontWeight: '700', color: colors.text },
  title: { fontSize: typography.small, color: colors.text },
  due: { fontSize: typography.small, color: colors.muted },
  overdue: { color: colors.pending, fontWeight: '600' },
  next: { fontSize: typography.body, color: colors.text },
  nextLabel: { fontWeight: '700' },
  note: { fontSize: typography.caption, color: colors.muted, lineHeight: 18 },
  action: { alignSelf: 'flex-start' },
});
