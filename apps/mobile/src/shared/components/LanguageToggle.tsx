import { Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import Icon from './Icon';
import { useDemoRole } from '../context/DemoRoleContext';
import { FIL_REVIEW_NOTICE, LANGUAGE_META, LANGUAGES } from '../status';
import { colors, spacing, typography } from '../theme';

/**
 * English/Filipino switch for the shared status dictionary labels.
 * Changes display only; stored values are never translated.
 * FIL labels: needs native-speaker review.
 */
/** "Filipino labels are drafts…" — shown while Filipino is selected. */
export function FilReviewNotice() {
  const { language } = useDemoRole();
  if (language !== 'fil') return null;
  return (
    <View style={styles.review} accessible accessibilityLabel={FIL_REVIEW_NOTICE.en}>
      <Icon name="info" size={14} color={colors.pending} />
      <Text style={styles.reviewText}>{FIL_REVIEW_NOTICE.en}</Text>
    </View>
  );
}

interface Props {
  /** Header use: short labels (EN / FIL), and the review notice is shown elsewhere. Accessible names stay full. */
  compact?: boolean;
}

export default function LanguageToggle({ compact = false }: Props) {
  const { language, setLanguage } = useDemoRole();

  return (
    <View style={styles.wrap}>
      <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel="Language / Wika">
        {LANGUAGES.map((lang) => {
          const meta = LANGUAGE_META[lang];
          const selected = lang === language;
          return (
            <Pressable
              key={lang}
              onPress={() => setLanguage(lang)}
              accessibilityRole="radio"
              accessibilityState={{ selected, checked: selected }}
              accessibilityLabel={meta.needsReview ? `${meta.label} (draft, needs native-speaker review)` : meta.label}
              style={[styles.option, compact && styles.optionCompact, selected && styles.optionSelected]}
            >
              {selected && !compact ? <Icon name="check" size={14} color={colors.surface} /> : null}
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{compact ? meta.short : meta.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {compact ? null : <FilReviewNotice />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  group: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 999,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  optionCompact: { paddingHorizontal: spacing.sm + 2, minWidth: 44 },
  optionSelected: { backgroundColor: colors.primary },
  optionText: { fontSize: typography.small, color: colors.primary, fontWeight: '600' },
  optionTextSelected: { color: colors.surface },
  review: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.pendingBg,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    flexShrink: 1,
    maxWidth: '100%',
  },
  // Wraps in narrow places such as the desktop sidebar.
  reviewText: { fontSize: typography.caption, color: colors.pending, fontWeight: '700', flexShrink: 1 },
});
