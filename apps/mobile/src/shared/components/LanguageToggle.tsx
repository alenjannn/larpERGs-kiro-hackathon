import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { useDemoRole } from '../context/DemoRoleContext';
import { FIL_REVIEW_NOTICE, LANGUAGE_META, LANGUAGES } from '../status';
import { colors, spacing, typography } from '../theme';

/**
 * English/Filipino switch for the shared status dictionary labels.
 * Changes display only; stored values are never translated.
 * FIL labels: needs native-speaker review.
 */
export default function LanguageToggle() {
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
              style={[styles.option, selected && styles.optionSelected]}
            >
              {selected ? <Icon name="check" size={14} color={colors.surface} /> : null}
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{meta.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {language === 'fil' ? (
        <View style={styles.review} accessible accessibilityLabel={FIL_REVIEW_NOTICE.en}>
          <Icon name="info" size={14} color={colors.pending} />
          <Text style={styles.reviewText}>{FIL_REVIEW_NOTICE.en}</Text>
        </View>
      ) : null}
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
  },
  reviewText: { fontSize: typography.caption, color: colors.pending, fontWeight: '700' },
});
