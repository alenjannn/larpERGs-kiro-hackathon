import { StyleSheet, View } from 'react-native';
import Text from './Text';
import Button from './Button';
import Icon, { type IconName } from './Icon';
import { colors, spacing, text } from '../theme';

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
      <View style={styles.iconWrap}>
        <Icon name={icon} size={22} color={colors.muted} />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {action ? <Button variant="secondary" title={action.label} onPress={action.onPress} style={styles.action} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  iconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.mutedBg, borderWidth: 6, borderColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  title: { ...text.bodyStrong, textAlign: 'center' },
  message: { ...text.muted, textAlign: 'center', maxWidth: 440 },
  action: { marginTop: spacing.xs },
});
