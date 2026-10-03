import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

export default function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.container} accessibilityRole="progressbar">
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  label: { color: colors.muted, fontSize: 14 },
});
