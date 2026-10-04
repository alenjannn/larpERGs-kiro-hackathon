import { StyleSheet, View } from 'react-native';
import Text from '../../../shared/components/Text';
import Card from '../../../shared/components/Card';
import EmptyState from '../../../shared/components/EmptyState';
import StatusChip from '../../../shared/components/StatusChip';
import { colors, spacing, text } from '../../../shared/theme';
import type { Metric } from '../summaryMetrics';

/** Underlying cases of the selected metric, grouped by bucket (A-3.3). */
export default function MetricCaseList({ metric }: { metric: Metric }) {
  const groups = new Map<string, Metric['cases']>();
  for (const c of metric.cases) groups.set(c.bucket, [...(groups.get(c.bucket) ?? []), c]);

  return (
    <Card title={`Cases · ${metric.label}`} subtitle={`${metric.period} · ${metric.cohort}. Next: ${metric.action}`}>
      {metric.cases.length === 0 ? <EmptyState title="No cases" message="Nothing in this cohort for the selected period." /> : null}
      {[...groups.entries()].map(([bucket, cases]) => (
        <View key={bucket} style={styles.group}>
          <Text style={styles.bucket} accessibilityRole="header">
            {bucket} ({cases.length})
          </Text>
          {cases.map((c) => (
            <View key={c.id} style={styles.row}>
              <View style={styles.main}>
                <Text style={styles.title}>{c.title}</Text>
                <Text style={styles.detail}>{c.detail}</Text>
              </View>
              {c.status ? <StatusChip size="sm" status={c.status} /> : null}
            </View>
          ))}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs, marginTop: spacing.sm },
  bucket: text.overline,
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  main: { flex: 1, minWidth: 180 },
  title: text.bodyStrong,
  detail: text.caption,
});
