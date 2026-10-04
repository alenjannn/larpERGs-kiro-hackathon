import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, text } from '../theme';

/** Heading that groups the cards below it on a long screen. */
export default function SectionHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.titles}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
  titles: { flex: 1, minWidth: 200, gap: 2 },
  title: text.title,
  subtitle: text.muted,
});
