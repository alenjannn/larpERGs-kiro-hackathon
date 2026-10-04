import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Text from './Text';
import { colors, spacing, text } from '../theme';

export default function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={label} aria-busy accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg },
  label: text.muted,
});
