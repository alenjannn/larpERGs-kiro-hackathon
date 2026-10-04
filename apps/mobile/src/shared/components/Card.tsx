import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing, text } from '../theme';

interface Props {
  title?: string;
  subtitle?: string;
  /** Right side of the header: a badge, chip or compact action. */
  right?: ReactNode;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** The standard content container: white surface, hairline border, optional header. */
export default function Card({ title, subtitle, right, children, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      {title || right ? (
        <View style={styles.header}>
          <View style={styles.titles}>
            {title ? (
              <Text style={styles.title} accessibilityRole="header">
                {title}
              </Text>
            ) : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 2,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg + 2,
    gap: spacing.md,
    ...shadow.card,
  },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: spacing.sm },
  titles: { flex: 1, minWidth: 180, gap: 2 },
  title: { ...text.title, fontSize: 17 },
  subtitle: text.muted,
});
