import { StyleSheet, View } from 'react-native';
import Text from './Text';
import Icon, { type IconName } from './Icon';
import { colors, radius, spacing, text } from '../theme';

type Tone = 'error' | 'warning' | 'success' | 'info';

const TONES: Record<Tone, { bg: string; fg: string; icon: IconName }> = {
  error: { bg: colors.dangerBg, fg: colors.danger, icon: 'alert' },
  warning: { bg: colors.warningBg, fg: colors.warning, icon: 'alert' },
  success: { bg: colors.successBg, fg: colors.success, icon: 'check' },
  info: { bg: colors.infoBg, fg: colors.info, icon: 'info' },
};

interface Props {
  tone?: Tone;
  message: string;
  /** Optional bold first line. */
  title?: string;
}

/** Inline feedback: icon + text on a tint with an accent edge (never colour alone). */
export default function Notice({ tone = 'info', message, title }: Props) {
  const t = TONES[tone];
  return (
    <View
      style={[styles.box, { backgroundColor: t.bg, borderLeftColor: t.fg }]}
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion={tone === 'error' ? 'assertive' : 'polite'}
    >
      <Icon name={t.icon} size={16} color={t.fg} style={styles.icon} />
      <View style={styles.texts}>
        {title ? <Text style={[styles.title, { color: t.fg }]}>{title}</Text> : null}
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  icon: { marginTop: 1 },
  texts: { flex: 1, gap: 2 },
  title: { ...text.label },
  text: { ...text.small },
});
