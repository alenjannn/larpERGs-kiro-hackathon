import { StyleSheet, Text, View } from 'react-native';
import Button from './Button';
import Icon, { type IconName } from './Icon';
import { colors, spacing, typography } from '../theme';

interface Props {
  title: string;
  message?: string;
  icon?: IconName;
  action?: { label: string; onPress: () => void };
}

/** Calm placeholder for "nothing here yet", e.g. "No readings yet". */
export default function EmptyState({ title, message, icon = 'info', action }: Props) {
  return (
    <View style={styles.box}>
      <Icon name={icon} size={28} color={colors.muted} />
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {action ? <Button variant="secondary" title={action.label} onPress={action.onPress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  title: { fontSize: typography.body, fontWeight: '700', color: colors.text, textAlign: 'center' },
  message: { fontSize: typography.small, color: colors.muted, textAlign: 'center', lineHeight: 20 },
});
