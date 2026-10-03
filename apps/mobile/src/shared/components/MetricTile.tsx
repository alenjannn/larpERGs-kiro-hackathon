import { StyleSheet, Text, View } from 'react-native';
import { formatCountOfTotal } from '../utils/format';
import { colors, radius, spacing, typography } from '../theme';

interface Props {
  label: string;
  numerator: number;
  denominator: number;
  hint?: string;
}

/** Count with its denominator and percentage: "18 of 30 (60%)", or "No cases" when the denominator is 0. */
export default function MetricTile({ label, numerator, denominator, hint }: Props) {
  const text = formatCountOfTotal(numerator, denominator);
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${label}: ${text}${hint ? `. ${hint}` : ''}`}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{text}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: 180,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  label: { fontSize: typography.small, color: colors.muted, fontWeight: '600' },
  value: { fontSize: typography.title, color: colors.text, fontWeight: '700' },
  hint: { fontSize: typography.caption, color: colors.muted },
});
