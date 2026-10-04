import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Text from './Text';
import { fontFamilyFor, useFontsReady } from '../fonts';
import { colors, radius, shadow, spacing, text, touch, typography } from '../theme';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Helper text under the field (format, limits). */
  hint?: string;
  /** Validation message; also marks the field invalid. */
  error?: string | null;
}

export default function TextField({ label, hint, error, onFocus, onBlur, ...input }: Props) {
  const [focused, setFocused] = useState(false);
  const fontsReady = useFontsReady();
  const typeface = fontsReady ? { fontFamily: fontFamilyFor({}) ?? undefined } : null;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.placeholder}
        // Most fields describe someone else (a patient, a BHW): never autofill the user's own details.
        // Sign-in fields pass their own autoComplete (email / password).
        autoComplete="off"
        importantForAutofill="no"
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        aria-invalid={!!error}
        {...input}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[styles.input, typeface, input.multiline && styles.multiline, focused && styles.focused, !!error && styles.invalid]}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Grows to share a row with other fields; never uses flexBasis (it would become a height in a column).
  field: { gap: spacing.xs + 2, flexGrow: 1, minWidth: 140 },
  label: text.label,
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    minHeight: touch.min,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  focused: { borderColor: colors.primary, ...shadow.focusRing },
  invalid: { borderColor: colors.error, ...shadow.errorRing },
  hint: text.caption,
  error: { ...text.caption, color: colors.error, fontWeight: '600' },
});
