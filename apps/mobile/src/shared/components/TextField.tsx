import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
}

export default function TextField({ label, ...input }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#94A39D"
        accessibilityLabel={label}
        {...input}
        style={[styles.input, input.multiline && styles.multiline]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs, flexGrow: 1, flexBasis: 140 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
    minHeight: 42,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
});
