import { Pressable, StyleSheet, View, type PressableStateCallbackType } from 'react-native';
import Text from './Text';
import Icon from './Icon';
import { colors, radius, spacing, text, touch, typography } from '../theme';

interface Props<T extends string> {
  label?: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  /** Validation message shown under the chips. */
  error?: string | null;
}

/** Single-select chip row (a lightweight picker that works on native + web). Selection = check mark + fill. */
export default function ChipGroup<T extends string>({ label, options, value, onChange, error }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected, checked: selected }}
              accessibilityLabel={o.label}
              onPress={() => onChange(o.value)}
              style={(state: PressableStateCallbackType & { hovered?: boolean }) => [
                styles.chip,
                state.hovered && !selected && styles.hovered,
                selected && styles.selected,
              ]}
            >
              {selected ? <Icon name="check" size={14} color={colors.primary} /> : null}
              <Text style={[styles.text, selected && styles.selectedText]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs + 2 },
  label: text.label,
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.surface,
    // 44 px touch target (tech.md §6).
    minHeight: touch.min,
    maxWidth: '100%',
    justifyContent: 'center',
  },
  hovered: { backgroundColor: colors.surfaceAlt, borderColor: colors.primary },
  selected: { backgroundColor: colors.primaryBg, borderColor: colors.primary, boxShadow: `inset 0 0 0 1px ${colors.primary}` },
  // Long bilingual labels wrap inside the chip instead of overflowing the card.
  text: { fontSize: typography.small, lineHeight: 18, color: colors.text, flexShrink: 1 },
  selectedText: { color: colors.primaryStrong, fontWeight: '700' },
  error: { ...text.caption, color: colors.error, fontWeight: '600' },
});
