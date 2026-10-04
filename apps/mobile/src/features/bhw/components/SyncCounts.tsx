import { StyleSheet, Text, View } from 'react-native';
import StatusChip from '../../../shared/components/StatusChip';
import type { StatusKey } from '../../../shared/status';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import type { FieldQueueCounts, FieldQueueState } from '../fieldQueueStatus';

const ROWS: { state: FieldQueueState; status: StatusKey }[] = [
  { state: 'waiting', status: 'transport.waiting_to_send' },
  { state: 'sending', status: 'transport.sending' },
  { state: 'synced', status: 'transport.synced' },
  { state: 'failed', status: 'transport.send_failed' },
  { state: 'needs_review', status: 'transport.needs_review' },
];

/** B-4.1: one StatusChip + count per state (text + icon, never colour alone). */
export default function SyncCounts({ counts }: { counts: FieldQueueCounts }) {
  return (
    <View style={styles.grid}>
      {ROWS.map((row) => (
        <View key={row.state} style={styles.cell} accessible accessibilityLabel={`${counts[row.state]} ${row.status.split('.')[1].replace(/_/g, ' ')}`}>
          <Text style={styles.count}>{counts[row.state]}</Text>
          <StatusChip status={row.status} size="sm" />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: {
    flexGrow: 1,
    flexBasis: 150,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  count: { fontSize: typography.heading, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
});
