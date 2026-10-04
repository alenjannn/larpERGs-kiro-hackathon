import { StyleSheet, View } from 'react-native';
import Text from './Text';
import { colors, radius, shadow, spacing, text } from '../theme';

/** A single count with its label, e.g. "12 · Assigned patients". */
export default function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${label}: ${value}${hint ? `, ${hint}` : ''}`}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 2,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
    padding: spacing.lg,
    gap: 2,
  },
  label: { ...text.caption, fontWeight: '600' },
  value: { ...text.heading, fontVariant: ['tabular-nums'] },
  hint: text.caption,
});
