import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

export default function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: 140,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  value: { fontSize: 24, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  label: { fontSize: 13, color: colors.muted, marginTop: 2 },
  hint: { fontSize: 11, color: colors.muted, marginTop: 4 },
});
