import type { ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Text from '../../../shared/components/Text';
import { colors, layout, radius, spacing, text, typography } from '../../../shared/theme';

export const TABLE_BREAKPOINT = layout.table;

export interface QueueColumn {
  key: string;
  label: string;
  /** Relative column width in the table layout. Default 1. */
  flex?: number;
}

export interface QueueRow {
  id: string;
  cells: Record<string, ReactNode>;
}

interface Props {
  columns: QueueColumn[];
  rows: QueueRow[];
  /** Rendered instead of the table when there are no rows. */
  empty: ReactNode;
  accessibilityLabel: string;
}

function Cell({ value }: { value: ReactNode }) {
  if (value === null || value === undefined || value === false) return <Text style={styles.cellText}>—</Text>;
  return typeof value === 'string' || typeof value === 'number' ? <Text style={styles.cellText}>{value}</Text> : <>{value}</>;
}

/** Table on wide screens (≥ 768 px); stacked "Label: value" cards on narrow screens. */
export default function QueueTable({ columns, rows, empty, accessibilityLabel }: Props) {
  const { width } = useWindowDimensions();
  if (rows.length === 0) return <>{empty}</>;

  if (width >= TABLE_BREAKPOINT) {
    return (
      <View accessibilityLabel={accessibilityLabel} role="table">
        <View style={[styles.row, styles.headerRow]} role="row">
          {columns.map((c) => (
            <Text key={c.key} role="columnheader" style={[styles.header, { flex: c.flex ?? 1 }]}>
              {c.label}
            </Text>
          ))}
        </View>
        {rows.map((r) => (
          <View key={r.id} style={styles.row} role="row">
            {columns.map((c) => (
              <View key={c.key} role="cell" style={[styles.cell, { flex: c.flex ?? 1 }]}>
                <Cell value={r.cells[c.key]} />
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View accessibilityLabel={accessibilityLabel}>
      {rows.map((r) => (
        <View key={r.id} style={styles.card}>
          {columns.map((c) => (
            <View key={c.key} style={styles.cardLine}>
              <Text style={styles.cardLabel}>{c.label}</Text>
              <View style={styles.cardValue}>
                <Cell value={r.cells[c.key]} />
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  headerRow: { borderTopWidth: 0, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  header: { ...text.overline },
  cell: { justifyContent: 'center' },
  cellText: { fontSize: typography.small, lineHeight: 20, color: colors.text },
  card: { paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  cardLine: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  cardLabel: { width: 110, ...text.caption, fontWeight: '600' },
  cardValue: { flex: 1, alignItems: 'flex-start' },
});
