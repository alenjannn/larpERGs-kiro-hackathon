import { StyleSheet, View } from 'react-native';
import Text from '../../../shared/components/Text';
import Button from '../../../shared/components/Button';
import { StatusChipRow } from '../../../shared/components/StatusChip';
import { colors, radius, spacing, text } from '../../../shared/theme';
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
  item: { gap: spacing.xs, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  patient: { ...text.bodyStrong, fontWeight: '700' },
  title: text.small,
  due: text.muted,
  overdue: { color: colors.pending, fontWeight: '600' },
  next: { ...text.small, backgroundColor: colors.mutedBg, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, marginTop: 2 },
  nextLabel: { fontWeight: '700' },
  note: text.caption,
  action: { alignSelf: 'flex-start', marginTop: spacing.xs },
});
