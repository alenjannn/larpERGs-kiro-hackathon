import { ActivityIndicator, Pressable, StyleSheet, View, type PressableStateCallbackType, type StyleProp, type ViewStyle } from 'react-native';
import Text from './Text';
import Icon, { type IconName } from './Icon';
import { colors, radius, shadow, spacing, touch, typography } from '../theme';

/**
 * primary: the one main action in a section. secondary: other actions.
 * danger: destructive actions (always behind a confirmation). ghost: low-emphasis links.
 */
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  /** Smaller text and padding. The touch target stays 44 px. */
  compact?: boolean;
  /** Decorative leading icon; the title carries the meaning. */
  icon?: IconName;
  /** Decorative trailing icon, e.g. a chevron on a link-style button. */
  trailingIcon?: IconName;
  style?: StyleProp<ViewStyle>;
  /** Defaults to the title. */
  accessibilityLabel?: string;
}

const FG: Record<Variant, string> = {
  primary: colors.primaryText,
  secondary: colors.primary,
  danger: colors.primaryText,
  ghost: colors.primary,
};

export default function Button({ title, onPress, variant = 'primary', disabled, loading, compact, icon, trailingIcon, style, accessibilityLabel }: Props) {
  const inactive = disabled || loading;
  const fg = FG[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      style={(state: PressableStateCallbackType & { hovered?: boolean }) => [
        styles.base,
        compact && styles.compact,
        styles[variant],
        state.hovered && !inactive && HOVER[variant],
        state.pressed && !inactive && styles.pressed,
        inactive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={compact ? 14 : 16} color={fg} /> : null}
          <Text style={[styles.text, compact && styles.compactText, { color: fg }]}>{title}</Text>
          {trailingIcon ? <Icon name={trailingIcon} size={compact ? 16 : 18} color={fg} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touch.min,
  },
  compact: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary, ...shadow.button },
  secondary: { backgroundColor: colors.surface, borderColor: colors.primary, ...shadow.button },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger, ...shadow.button },
  ghost: { backgroundColor: 'transparent', paddingHorizontal: spacing.sm },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
  text: { fontWeight: '600', fontSize: typography.body - 1, letterSpacing: 0.1, textAlign: 'center' },
  compactText: { fontSize: typography.small },
});

const HOVER = StyleSheet.create({
  primary: { backgroundColor: colors.primaryStrong, borderColor: colors.primaryStrong },
  secondary: { backgroundColor: colors.primaryBg },
  danger: { backgroundColor: colors.errorStrong, borderColor: colors.errorStrong },
  ghost: { backgroundColor: colors.primaryBg },
});
