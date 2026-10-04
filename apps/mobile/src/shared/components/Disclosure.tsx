import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type PressableStateCallbackType } from 'react-native';
import Text from './Text';
import Icon, { type IconName } from './Icon';
import { colors, radius, shadow, spacing, text, touch } from '../theme';

interface Props {
  title: string;
  subtitle?: string;
  icon?: IconName;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** A collapsible card section. Used for secondary tools that should not crowd the main task. */
export default function Disclosure({ title, subtitle, icon, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.box}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}. ${open ? 'Hide' : 'Show'}`}
        style={(state: PressableStateCallbackType & { hovered?: boolean }) => [styles.header, state.hovered && styles.hovered]}
      >
        {icon ? <Icon name={icon} size={16} color={colors.muted} /> : null}
        <View style={styles.titles}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.lg + 2, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden', ...shadow.card },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: touch.min },
  hovered: { backgroundColor: colors.mutedBg },
  titles: { flex: 1, gap: 2 },
  title: text.label,
  subtitle: text.caption,
  body: { padding: spacing.md, gap: spacing.md, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
});
