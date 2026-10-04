import { StyleSheet, Text, View } from 'react-native';
import { formatCountOfTotal } from '../utils/format';
import { colors, radius, shadow, spacing, text } from '../theme';

interface Props {
  label: string;
  numerator: number;
  denominator: number;
  hint?: string;
}

/** Count with its denominator and percentage: "18 of 30 (60%)", or "No cases" when the denominator is 0. */
export default function MetricTile({ label, numerator, denominator, hint }: Props) {
  const value = formatCountOfTotal(numerator, denominator);
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${label}: ${value}${hint ? `. ${hint}` : ''}`}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: 180,
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 2,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  label: text.label,
  value: { ...text.heading, fontVariant: ['tabular-nums'] },
  hint: text.caption,
});
