import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

type Tone = 'error' | 'warning' | 'success' | 'info';

const TONES: Record<Tone, { bg: string; fg: string; icon: string }> = {
  error: { bg: colors.dangerBg, fg: colors.danger, icon: '⚠️' },
  warning: { bg: colors.warningBg, fg: colors.warning, icon: '⚠️' },
  success: { bg: colors.successBg, fg: colors.success, icon: '✅' },
  info: { bg: colors.infoBg, fg: colors.info, icon: 'ℹ️' },
};

export default function Notice({ tone = 'info', message }: { tone?: Tone; message: string }) {
  const t = TONES[tone];
  return (
    <View style={[styles.box, { backgroundColor: t.bg }]} accessibilityRole={tone === 'error' ? 'alert' : undefined}>
      <Text style={[styles.text, { color: t.fg }]}>
        {t.icon} {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.sm, padding: spacing.md },
  text: { fontSize: 13, lineHeight: 18 },
});
