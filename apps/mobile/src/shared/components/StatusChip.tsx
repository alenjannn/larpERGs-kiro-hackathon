import { StyleSheet, View } from 'react-native';
import Text from './Text';
import Icon from './Icon';
import { useLanguage } from '../context/DemoRoleContext';
import { getStatus, type Language, type StatusKey, type StatusTone } from '../status';
import { colors, spacing } from '../theme';

export const TONE_COLORS: Record<StatusTone, { fg: string; bg: string }> = {
  muted: { fg: colors.muted, bg: colors.mutedBg },
  pending: { fg: colors.pending, bg: colors.pendingBg },
  primary: { fg: colors.primary, bg: colors.primaryBg },
  success: { fg: colors.success, bg: colors.successBg },
  error: { fg: colors.error, bg: colors.errorBg },
};

interface Props {
  status: StatusKey;
  /** 'both' renders "EN · FIL". Omitted → the app language from the toggle. */
  lang?: Language | 'both';
  size?: 'sm' | 'md';
}

/** Status as icon + text on a tinted background. Colour is never the only signal. */
export default function StatusChip({ status, lang: langProp, size = 'md' }: Props) {
  const appLang = useLanguage();
  const lang = langProp ?? appLang;
  const entry = getStatus(status);
  const tone = TONE_COLORS[entry.tone];
  const label = lang === 'both' ? `${entry.en} · ${entry.fil}` : entry[lang];
  const fontSize = size === 'sm' ? 13 : 14;
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      style={[styles.chip, size === 'sm' && styles.small, { backgroundColor: tone.bg, borderColor: `${tone.fg}55` }]}
    >
      <Icon name={entry.icon} size={fontSize} color={tone.fg} />
      <Text style={[styles.label, { color: tone.fg, fontSize }]}>{label}</Text>
    </View>
  );
}

/** Several chips in sequence, e.g. "Saved on this device → Waiting to send". */
export function StatusChipRow({ statuses, lang, size = 'sm' }: { statuses: StatusKey[]; lang?: Props['lang']; size?: Props['size'] }) {
  return (
    <View style={styles.row}>
      {statuses.map((status, i) => (
        <View key={status} style={styles.rowItem}>
          {i > 0 ? (
            <Text style={styles.arrow} accessibilityElementsHidden importantForAccessibility="no">
              →
            </Text>
          ) : null}
          <StatusChip status={status} lang={lang} size={size} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
  },
  small: { paddingHorizontal: spacing.sm, paddingVertical: 2 },
  label: { fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  arrow: { color: colors.muted, fontSize: 14, lineHeight: 18 },
});
