import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius, spacing, text, touch, typography } from '../theme';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Helper text under the field (format, limits). */
  hint?: string;
  /** Validation message; also marks the field invalid. */
  error?: string | null;
}

export default function TextField({ label, hint, error, onFocus, onBlur, ...input }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.placeholder}
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
        style={[styles.input, input.multiline && styles.multiline, focused && styles.focused, !!error && styles.invalid]}
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
  focused: { borderColor: colors.primary, boxShadow: '0 0 0 3px rgba(15, 118, 110, 0.18)' },
  invalid: { borderColor: colors.error, boxShadow: '0 0 0 3px rgba(185, 28, 28, 0.12)' },
  hint: text.caption,
  error: { ...text.caption, color: colors.error, fontWeight: '600' },
});
